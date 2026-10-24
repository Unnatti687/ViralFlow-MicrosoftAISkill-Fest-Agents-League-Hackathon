"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { DndContext, DragEndEvent } from "@dnd-kit/core";
import { ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { WeekGrid } from "./WeekGrid";
import { ListView } from "./ListView";
import { FilterBar } from "./FilterBar";
import { SlotDetailPanel } from "./SlotDetailPanel";
import { AddSlotDialog } from "./AddSlotDialog";
import {
  generateStrategy,
  regenerateSlot as apiRegenerateSlot,
  getMyBrandCard,
  getStrategySlots,
  saveStrategySlots,
} from "@/lib/api";
import type { CalendarSlot } from "@/lib/api";

type Status = "idle" | "generating" | "revealing" | "ready" | "error";

const REVEAL_INTERVAL_MS = 160;

function makeClientId(): string {
  return typeof crypto !== "undefined" ? crypto.randomUUID() : Math.random().toString(36).slice(2);
}

function stamp(slots: Omit<CalendarSlot, "_clientId">[]): CalendarSlot[] {
  return slots.map((s) => ({ ...s, _clientId: makeClientId() }));
}

interface StrategyViewProps {
  brandCardId: string | null;
}

export function StrategyView({ brandCardId: propBrandCardId }: StrategyViewProps) {
  const router = useRouter();

  // Resolve brandCardId: URL param if present, else fetch the user's saved brand card
  const [brandCardId, setBrandCardId] = useState<string | null>(propBrandCardId);
  const [resolving, setResolving] = useState(propBrandCardId === null);

  useEffect(() => {
    if (propBrandCardId) {
      setBrandCardId(propBrandCardId);
      setResolving(false);
      return;
    }
    let cancelled = false;
    getMyBrandCard()
      .then((card) => {
        if (!cancelled) setBrandCardId(card?.id ?? null);
      })
      .catch(() => {
        if (!cancelled) setBrandCardId(null);
      })
      .finally(() => {
        if (!cancelled) setResolving(false);
      });
    return () => {
      cancelled = true;
    };
  }, [propBrandCardId]);

  const [slots, setSlots] = useState<CalendarSlot[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"A" | "B" | null>(null);

  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [filterPlatform, setFilterPlatform] = useState("all");
  const [filterAngle, setFilterAngle] = useState("all");

  const [selectedSlot, setSelectedSlot] = useState<CalendarSlot | null>(null);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);

  const [revealCount, setRevealCount] = useState(0);
  const revealRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addDialogDay, setAddDialogDay] = useState<string | undefined>(undefined);

  // Derived: week dates map for AddSlotDialog
  const weekDates = slots.reduce<Record<string, string>>((acc, s) => {
    acc[s.day] = s.date;
    return acc;
  }, {});

  // Reveal animation: increment revealCount until all slots visible
  useEffect(() => {
    if (status !== "revealing") return;
    revealRef.current = setInterval(() => {
      setRevealCount((c) => {
        if (c >= slots.length) {
          clearInterval(revealRef.current!);
          setStatus("ready");
          return c;
        }
        return c + 1;
      });
    }, REVEAL_INTERVAL_MS);
    return () => clearInterval(revealRef.current!);
  }, [status, slots.length]);

  const runGenerate = useCallback(async () => {
    if (!brandCardId) return;
    setStatus("generating");
    setError(null);
    setSlots([]);
    setRevealCount(0);
    setSelectedSlot(null);
    try {
      const result = await generateStrategy(brandCardId);
      const stamped = stamp(result.slots);
      setSlots(stamped);
      setMode(result.mode);
      setRevealCount(0);
      setStatus("revealing");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed. Try again.");
      setStatus("error");
    }
  }, [brandCardId]);

  // On mount: load saved strategy if one exists, otherwise generate fresh
  useEffect(() => {
    if (!brandCardId || status !== "idle") return;
    let cancelled = false;
    getStrategySlots(brandCardId)
      .then((result) => {
        if (cancelled) return;
        if (result.slots.length > 0) {
          setSlots(stamp(result.slots));
          setMode(result.mode);
          setRevealCount(result.slots.length);
          setStatus("ready");
        } else {
          runGenerate();
        }
      })
      .catch(() => {
        if (!cancelled) runGenerate();
      });
    return () => {
      cancelled = true;
    };
  }, [brandCardId, status, runGenerate]);

  const persistSlots = useCallback(
    (next: CalendarSlot[]) => {
      if (!brandCardId) return;
      saveStrategySlots(brandCardId, next, mode).catch((err) =>
        console.error("Saving strategy failed:", err)
      );
    },
    [brandCardId, mode]
  );

  const handleRegenerateSlot = useCallback(
    async (slot: CalendarSlot) => {
      if (!brandCardId || regeneratingId) return;
      setRegeneratingId(slot._clientId);
      try {
        const newSlot = await apiRegenerateSlot(brandCardId, slot);
        setSlots((prev) => {
          const next = prev.map((s) =>
            s._clientId === slot._clientId
              ? { ...newSlot, _clientId: slot._clientId }
              : s
          );
          persistSlots(next);
          return next;
        });
        // Update selected slot if it was the regenerated one
        setSelectedSlot((sel) =>
          sel?._clientId === slot._clientId ? { ...newSlot, _clientId: slot._clientId } : sel
        );
      } catch (err) {
        console.error("Slot regeneration failed:", err);
      } finally {
        setRegeneratingId(null);
      }
    },
    [brandCardId, regeneratingId, persistSlots]
  );

  const handleDeleteSlot = useCallback((slot: CalendarSlot) => {
    setSlots((prev) => {
      const next = prev.filter((s) => s._clientId !== slot._clientId);
      persistSlots(next);
      return next;
    });
    setSelectedSlot((sel) => (sel?._clientId === slot._clientId ? null : sel));
  }, [persistSlots]);

  const handleAddSlot = (day?: string) => {
    setAddDialogDay(day);
    setAddDialogOpen(true);
  };

  const handleAddSlotConfirm = (slotData: Omit<CalendarSlot, "_clientId">) => {
    setSlots((prev) => {
      const next = [...prev, { ...slotData, _clientId: makeClientId() }];
      persistSlots(next);
      return next;
    });
  };

  // Drag end: swap day+date between dragged slot and target day's slot
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const draggedId = String(active.id);
    const targetDay = String(over.id);

    setSlots((prev) => {
      const dragged = prev.find((s) => s._clientId === draggedId);
      if (!dragged) return prev;

      const targetSlot = prev.find((s) => s.day === targetDay);

      let next: CalendarSlot[];
      if (targetSlot) {
        // Swap day + date between the two
        next = prev.map((s) => {
          if (s._clientId === draggedId) return { ...s, day: targetSlot.day, date: targetSlot.date };
          if (s._clientId === targetSlot._clientId) return { ...s, day: dragged.day, date: dragged.date };
          return s;
        });
      } else {
        // Move to empty day; reuse any known date for that day or keep original
        const dateForDay = prev.reduce<Record<string, string>>((acc, s) => {
          acc[s.day] = s.date;
          return acc;
        }, {})[targetDay];
        next = prev.map((s) =>
          s._clientId === draggedId
            ? { ...s, day: targetDay, date: dateForDay ?? s.date }
            : s
        );
      }
      persistSlots(next);
      return next;
    });
  };

  const handleGenerateContent = () => {
    localStorage.setItem("viralflow:strategy:slots", JSON.stringify(visibleSlots));
    router.push("/videos");
  };

  // Slots visible in current reveal window, filtered
  const revealedSlots = status === "ready" ? slots : slots.slice(0, revealCount);
  const visibleSlots = revealedSlots.filter((s) => {
    if (filterPlatform !== "all" && s.platform !== filterPlatform) return false;
    if (filterAngle !== "all" && s.content_angle !== filterAngle) return false;
    return true;
  });

  // Week header: date range from slots
  const weekHeader = (() => {
    if (slots.length === 0) return null;
    const dates = slots.map((s) => s.date).sort();
    const fmt = (d: string) =>
      new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
    return `${fmt(dates[0])} – ${fmt(dates[dates.length - 1])}`;
  })();

  if (resolving) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!brandCardId) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <p className="text-muted-foreground text-sm">No brand card selected.</p>
        <Button onClick={() => router.push("/onboarding")}>Start onboarding</Button>
      </div>
    );
  }

  if (status === "generating") {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Building your 7-day strategy…</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <AlertCircle className="size-8 text-destructive" />
        <p className="text-sm text-destructive">{error}</p>
        <Button onClick={runGenerate}>Try again</Button>
      </div>
    );
  }

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="flex h-full">
        {/* Main content */}
        <div className="flex flex-col flex-1 min-w-0 px-16 py-5 gap-4">
          {/* Header row */}
          <div className="flex items-center gap-3 flex-wrap pb-2 border-b border-white/5">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">Content Strategy</h1>
              {weekHeader && (
                <span className="text-sm text-white/40 font-mono">{weekHeader}</span>
              )}
            </div>
            {mode && (
              <Badge className="text-[11px] px-2 py-0.5 bg-white/5 text-white/50 border border-white/10 font-mono">
                Mode {mode}
              </Badge>
            )}
            <div className="flex-1" />
            <Button variant="ghost" size="sm" className="text-white/40 hover:text-white/70 hover:bg-white/5" onClick={runGenerate} disabled={status === "revealing"}>
              Regenerate all
            </Button>
          </div>

          {/* Filter bar */}
          {(status === "ready" || status === "revealing") && (
            <FilterBar
              slots={slots}
              viewMode={viewMode}
              filterPlatform={filterPlatform}
              filterAngle={filterAngle}
              onViewModeChange={setViewMode}
              onFilterPlatformChange={setFilterPlatform}
              onFilterAngleChange={setFilterAngle}
              onAddSlot={() => handleAddSlot()}
            />
          )}

          {/* Calendar content */}
          <div className="flex-1 min-h-0">
            <ScrollArea className="h-full">
              {viewMode === "grid" ? (
                <WeekGrid
                  slots={visibleSlots}
                  selectedSlot={selectedSlot}
                  regeneratingId={regeneratingId}
                  onSelectSlot={(s) =>
                    setSelectedSlot((prev) => (prev?._clientId === s._clientId ? null : s))
                  }
                  onRegenerateSlot={handleRegenerateSlot}
                  onDeleteSlot={handleDeleteSlot}
                  onAddSlot={handleAddSlot}
                />
              ) : (
                <ListView
                  slots={visibleSlots}
                  selectedSlot={selectedSlot}
                  regeneratingId={regeneratingId}
                  onSelectSlot={(s) =>
                    setSelectedSlot((prev) => (prev?._clientId === s._clientId ? null : s))
                  }
                  onRegenerateSlot={handleRegenerateSlot}
                  onDeleteSlot={handleDeleteSlot}
                />
              )}
            </ScrollArea>
          </div>

          {/* Bottom bar */}
          {slots.length > 0 && (
            <div className="flex items-center justify-between border-t border-border pt-4">
              <p className="text-sm text-muted-foreground">
                {slots.length} slot{slots.length !== 1 ? "s" : ""}
                {status === "revealing" && (
                  <span className="ml-2 text-primary">· loading…</span>
                )}
              </p>
              <Button
                size="lg"
                className="gap-2 bg-[#FF1493] hover:bg-[#e0127f] text-white border-0 shadow-lg shadow-pink-900/30 transition-colors"
                disabled={slots.length === 0 || status === "revealing"}
                onClick={handleGenerateContent}
              >
                Generate Content
                <ArrowRight className="size-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Side panel */}
        {selectedSlot && (
          <div className="w-80 shrink-0">
            <SlotDetailPanel
              slot={selectedSlot}
              onClose={() => setSelectedSlot(null)}
            />
          </div>
        )}
      </div>

      {/* Add slot dialog */}
      <AddSlotDialog
        open={addDialogOpen}
        defaultDay={addDialogDay}
        weekDates={weekDates}
        onClose={() => setAddDialogOpen(false)}
        onAdd={handleAddSlotConfirm}
      />
    </DndContext>
  );
}
