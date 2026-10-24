"use client";

import { X, Clock, Timer, Lightbulb } from "lucide-react";
import { FaInstagram } from "react-icons/fa";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { CalendarSlot } from "@/lib/api";

const ANGLE_STYLES: Record<string, string> = {
  educational: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  story: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  opinion: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  social_proof: "bg-green-500/20 text-green-300 border-green-500/30",
  listicle: "bg-teal-500/20 text-teal-300 border-teal-500/30",
};

interface SlotDetailPanelProps {
  slot: CalendarSlot;
  onClose: () => void;
}

export function SlotDetailPanel({ slot, onClose }: SlotDetailPanelProps) {
  const formattedDate = new Date(slot.date + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="flex flex-col h-full border-l border-border bg-card/60 backdrop-blur-sm animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4 pb-3">
        <div className="flex items-center gap-2">
          <FaInstagram className="size-4 text-muted-foreground" />
          <span className="text-sm font-medium">{formattedDate}</span>
        </div>
        <Button variant="ghost" size="icon" className="size-7" onClick={onClose}>
          <X className="size-4" />
        </Button>
      </div>

      <Separator />

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Angle + post type badges */}
        <div className="flex flex-wrap gap-2">
          <Badge
            variant="outline"
            className={cn(
              "border",
              ANGLE_STYLES[slot.content_angle] ?? "bg-muted/20 text-muted-foreground"
            )}
          >
            {slot.content_angle.replace("_", " ")}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            {slot.post_type}
          </Badge>
        </div>

        {/* Topic */}
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
            Topic
          </p>
          <p className="text-sm leading-relaxed">{slot.topic}</p>
        </div>

        <Separator />

        {/* Meta */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Clock className="size-3.5 text-muted-foreground shrink-0" />
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Post time</p>
              <p className="text-sm font-medium">{slot.suggested_time}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Timer className="size-3.5 text-muted-foreground shrink-0" />
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Duration</p>
              <p className="text-sm font-medium">{slot.target_duration_seconds}s</p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Rationale */}
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <Lightbulb className="size-3.5 text-muted-foreground" />
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Why this post
            </p>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{slot.rationale}</p>
        </div>
      </div>
    </div>
  );
}
