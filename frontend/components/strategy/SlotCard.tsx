"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { RefreshCw, Trash2, GripVertical } from "lucide-react";
import { FaInstagram } from "react-icons/fa";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { CalendarSlot } from "@/lib/api";

const ANGLE_STYLES: Record<string, string> = {
  educational: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  story: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  opinion: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  social_proof: "bg-green-500/20 text-green-300 border-green-500/30",
  listicle: "bg-teal-500/20 text-teal-300 border-teal-500/30",
};

interface SlotCardProps {
  slot: CalendarSlot;
  isSelected: boolean;
  isRegenerating: boolean;
  onSelect: () => void;
  onRegenerate: () => void;
  onDelete: () => void;
}

export function SlotCard({
  slot,
  isSelected,
  isRegenerating,
  onSelect,
  onRegenerate,
  onDelete,
}: SlotCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: slot._clientId,
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.4 : 1,
        zIndex: isDragging ? 50 : undefined,
      }}
      onClick={onSelect}
      className={cn(
        "group relative rounded-lg border bg-card p-3 cursor-pointer select-none transition-colors animate-in fade-in duration-300",
        isSelected
          ? "border-primary/60 bg-primary/10"
          : "border-border hover:border-border/60 hover:bg-card/80",
        isRegenerating && "opacity-60 pointer-events-none"
      )}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute left-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-40 cursor-grab active:cursor-grabbing p-1 touch-none"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="size-3" />
      </div>

      {/* Platform icon + angle badge */}
      <div className="flex items-center justify-between mb-2 pl-3">
        <FaInstagram className="size-3 text-muted-foreground" />
        <Badge
          variant="outline"
          className={cn(
            "text-[10px] px-1.5 py-0 border",
            ANGLE_STYLES[slot.content_angle] ?? "bg-muted/20 text-muted-foreground"
          )}
        >
          {slot.content_angle.replace("_", " ")}
        </Badge>
      </div>

      {/* Topic */}
      <p className="text-xs font-medium leading-tight line-clamp-2 pl-3 mb-2">{slot.topic}</p>

      {/* Time + duration */}
      <p className="text-[10px] text-muted-foreground pl-3">
        {slot.suggested_time} · {slot.target_duration_seconds}s
      </p>

      {/* Hover actions */}
      <div
        className="absolute top-1.5 right-1.5 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => e.stopPropagation()}
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-6"
              onClick={onRegenerate}
              disabled={isRegenerating}
            >
              <RefreshCw className={cn("size-3", isRegenerating && "animate-spin")} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">Regenerate</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-6 hover:text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="size-3" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">Delete</TooltipContent>
        </Tooltip>
      </div>

      {/* Regenerating overlay */}
      {isRegenerating && (
        <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-background/60">
          <RefreshCw className="size-4 animate-spin text-primary" />
        </div>
      )}
    </div>
  );
}
