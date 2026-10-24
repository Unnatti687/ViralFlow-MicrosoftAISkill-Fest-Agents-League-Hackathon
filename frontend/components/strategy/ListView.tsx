"use client";

import { RefreshCw, Trash2 } from "lucide-react";
import { FaInstagram } from "react-icons/fa";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { CalendarSlot } from "@/lib/api";

const ANGLE_STYLES: Record<string, string> = {
  educational: "bg-blue-500/15 text-blue-300 border-blue-500/25",
  story: "bg-purple-500/15 text-purple-300 border-purple-500/25",
  opinion: "bg-orange-500/15 text-orange-300 border-orange-500/25",
  social_proof: "bg-green-500/15 text-green-300 border-green-500/25",
  listicle: "bg-teal-500/15 text-teal-300 border-teal-500/25",
};

const ANGLE_BAR: Record<string, string> = {
  educational: "#60a5fa",
  story: "#c084fc",
  opinion: "#fb923c",
  social_proof: "#4ade80",
  listicle: "#2dd4bf",
};

const DAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

interface ListViewProps {
  slots: CalendarSlot[];
  selectedSlot: CalendarSlot | null;
  regeneratingId: string | null;
  onSelectSlot: (slot: CalendarSlot) => void;
  onRegenerateSlot: (slot: CalendarSlot) => void;
  onDeleteSlot: (slot: CalendarSlot) => void;
}

export function ListView({
  slots,
  selectedSlot,
  regeneratingId,
  onSelectSlot,
  onRegenerateSlot,
  onDeleteSlot,
}: ListViewProps) {
  const sorted = [...slots].sort(
    (a, b) => DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day)
  );

  if (sorted.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-sm text-white/30">
        No slots match the current filter.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {sorted.map((slot, idx) => {
        const date = new Date(slot.date + "T00:00:00");
        const dayShort = slot.day.slice(0, 3);
        const dateStr = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        const barColor = ANGLE_BAR[slot.content_angle] ?? "#555";
        const isSelected = selectedSlot?._clientId === slot._clientId;
        const isRegenerating = regeneratingId === slot._clientId;

        return (
          <div
            key={slot._clientId}
            onClick={() => onSelectSlot(slot)}
            className={cn(
              "group relative flex items-center gap-5 pl-6 pr-4 py-4 rounded-xl border cursor-pointer transition-all duration-200 overflow-hidden",
              isSelected
                ? "border-white/20 bg-white/[0.06]"
                : "border-white/[0.05] bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.04]",
              isRegenerating && "opacity-50 pointer-events-none"
            )}
          >
            {/* Left accent bar */}
            <div
              className="absolute left-0 top-0 bottom-0 w-[3px] rounded-r-full opacity-60"
              style={{ background: barColor }}
            />

            {/* Row number */}
            <span className="text-[11px] text-white/20 font-mono w-4 shrink-0 select-none">
              {String(idx + 1).padStart(2, "0")}
            </span>

            {/* Day */}
            <div className="w-16 shrink-0">
              <p className="text-sm font-semibold text-white/90 leading-none">{dayShort}</p>
              <p className="text-[11px] text-white/35 mt-0.5">{dateStr}</p>
            </div>

            {/* Platform */}
            <FaInstagram className="size-3.5 text-white/30 shrink-0" />

            {/* Angle badge */}
            <Badge
              variant="outline"
              className={cn(
                "text-[10px] px-2 py-0 border shrink-0 font-normal",
                ANGLE_STYLES[slot.content_angle] ?? "bg-white/5 text-white/40 border-white/10"
              )}
            >
              {slot.content_angle.replace("_", " ")}
            </Badge>

            {/* Topic */}
            <p className="flex-1 text-sm text-white/85 truncate leading-snug">
              {slot.topic}
            </p>

            {/* Time + Duration */}
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-xs text-white/35 font-mono">{slot.suggested_time}</span>
              <span
                className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-white/30 border border-white/5"
              >
                {slot.target_duration_seconds}s
              </span>
            </div>

            {/* Actions */}
            <div
              className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ml-1"
              onClick={(e) => e.stopPropagation()}
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 text-white/30 hover:text-white/70 hover:bg-white/5"
                    onClick={() => onRegenerateSlot(slot)}
                    disabled={isRegenerating}
                  >
                    <RefreshCw className={cn("size-3.5", isRegenerating && "animate-spin")} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Regenerate</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 text-white/30 hover:text-red-400 hover:bg-red-400/10"
                    onClick={() => onDeleteSlot(slot)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Delete</TooltipContent>
              </Tooltip>
            </div>
          </div>
        );
      })}
    </div>
  );
}
