"use client";

import { useDroppable } from "@dnd-kit/core";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SlotCard } from "./SlotCard";
import { cn } from "@/lib/utils";
import type { CalendarSlot } from "@/lib/api";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const DAY_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface WeekGridProps {
  slots: CalendarSlot[];
  selectedSlot: CalendarSlot | null;
  regeneratingId: string | null;
  onSelectSlot: (slot: CalendarSlot) => void;
  onRegenerateSlot: (slot: CalendarSlot) => void;
  onDeleteSlot: (slot: CalendarSlot) => void;
  onAddSlot: (day: string) => void;
}

function DayColumn({
  day,
  short,
  date,
  slots,
  selectedSlot,
  regeneratingId,
  onSelectSlot,
  onRegenerateSlot,
  onDeleteSlot,
  onAddSlot,
}: {
  day: string;
  short: string;
  date: string | null;
  slots: CalendarSlot[];
  selectedSlot: CalendarSlot | null;
  regeneratingId: string | null;
  onSelectSlot: (s: CalendarSlot) => void;
  onRegenerateSlot: (s: CalendarSlot) => void;
  onDeleteSlot: (s: CalendarSlot) => void;
  onAddSlot: (day: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: day });

  const formattedDate = date
    ? new Date(date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : "";

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col gap-2 p-2 rounded-xl min-h-[180px] transition-colors",
        isOver ? "bg-primary/10 ring-1 ring-primary/40" : "bg-muted/10"
      )}
    >
      {/* Day header */}
      <div className="text-center py-1">
        <p className="text-xs font-semibold">{short}</p>
        {formattedDate && (
          <p className="text-[10px] text-muted-foreground">{formattedDate}</p>
        )}
      </div>

      {/* Slots */}
      {slots.map((slot) => (
        <SlotCard
          key={slot._clientId}
          slot={slot}
          isSelected={selectedSlot?._clientId === slot._clientId}
          isRegenerating={regeneratingId === slot._clientId}
          onSelect={() => onSelectSlot(slot)}
          onRegenerate={() => onRegenerateSlot(slot)}
          onDelete={() => onDeleteSlot(slot)}
        />
      ))}

      {/* Empty day — add button */}
      {slots.length === 0 && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full h-8 mt-1 border border-dashed border-border/30 text-muted-foreground hover:border-primary/40 hover:text-primary text-xs"
          onClick={() => onAddSlot(day)}
        >
          <Plus className="size-3 mr-1" />
          Add
        </Button>
      )}
    </div>
  );
}

export function WeekGrid(props: WeekGridProps) {
  const { slots } = props;

  const slotsByDay = DAYS.reduce<Record<string, CalendarSlot[]>>((acc, day) => {
    acc[day] = slots.filter((s) => s.day === day);
    return acc;
  }, {});

  const dateByDay = DAYS.reduce<Record<string, string | null>>((acc, day) => {
    acc[day] = slotsByDay[day][0]?.date ?? null;
    return acc;
  }, {});

  return (
    <div className="grid grid-cols-7 gap-2 h-full">
      {DAYS.map((day, i) => (
        <DayColumn
          key={day}
          day={day}
          short={DAY_SHORT[i]}
          date={dateByDay[day]}
          slots={slotsByDay[day]}
          selectedSlot={props.selectedSlot}
          regeneratingId={props.regeneratingId}
          onSelectSlot={props.onSelectSlot}
          onRegenerateSlot={props.onRegenerateSlot}
          onDeleteSlot={props.onDeleteSlot}
          onAddSlot={props.onAddSlot}
        />
      ))}
    </div>
  );
}
