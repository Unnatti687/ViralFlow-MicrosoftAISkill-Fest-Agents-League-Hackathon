"use client";

import { LayoutGrid, List, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CalendarSlot } from "@/lib/api";

const CONTENT_ANGLES = ["educational", "story", "opinion", "social_proof", "listicle"];

interface FilterBarProps {
  slots: CalendarSlot[];
  viewMode: "grid" | "list";
  filterPlatform: string;
  filterAngle: string;
  onViewModeChange: (mode: "grid" | "list") => void;
  onFilterPlatformChange: (val: string) => void;
  onFilterAngleChange: (val: string) => void;
  onAddSlot: () => void;
}

export function FilterBar({
  slots,
  viewMode,
  filterPlatform,
  filterAngle,
  onViewModeChange,
  onFilterPlatformChange,
  onFilterAngleChange,
  onAddSlot,
}: FilterBarProps) {
  const platforms = Array.from(new Set(slots.map((s) => s.platform))).filter(Boolean);

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* View toggle */}
      <div className="flex rounded-lg border border-white/10 overflow-hidden bg-white/[0.03]">
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "rounded-none h-8 px-3 transition-colors",
            viewMode === "grid" ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70 hover:bg-white/5"
          )}
          onClick={() => onViewModeChange("grid")}
        >
          <LayoutGrid className="size-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "rounded-none h-8 px-3 transition-colors",
            viewMode === "list" ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70 hover:bg-white/5"
          )}
          onClick={() => onViewModeChange("list")}
        >
          <List className="size-3.5" />
        </Button>
      </div>

      {/* Platform filter */}
      {platforms.length > 1 && (
        <Select value={filterPlatform} onValueChange={onFilterPlatformChange}>
          <SelectTrigger className="h-8 w-36 text-xs">
            <SelectValue placeholder="All platforms" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All platforms</SelectItem>
            {platforms.map((p) => (
              <SelectItem key={p} value={p}>
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Angle filter */}
      <Select value={filterAngle} onValueChange={onFilterAngleChange}>
        <SelectTrigger className="h-8 w-40 text-xs">
          <SelectValue placeholder="All angles" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All angles</SelectItem>
          {CONTENT_ANGLES.map((a) => (
            <SelectItem key={a} value={a}>
              {a.replace("_", " ")}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex-1" />

      {/* Add slot */}
      <Button variant="outline" size="sm" className="h-8 gap-1.5 border-white/10 bg-white/[0.03] text-white/60 hover:bg-white/[0.07] hover:text-white/90 hover:border-white/20" onClick={onAddSlot}>
        <Plus className="size-3.5" />
        Add slot
      </Button>
    </div>
  );
}
