"use client";

import { GenerationCard } from "./GenerationCard";
import type { CalendarSlot, GeneratedVideo } from "@/lib/api";

type VideoMap = Record<string, GeneratedVideo>;

interface GenerationQueueProps {
  slots: CalendarSlot[];
  videoMap: VideoMap;
  onRetry: (slot: CalendarSlot) => void;
}

export function GenerationQueue({ slots, videoMap, onRetry }: GenerationQueueProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
      {slots.map((slot) => (
        <GenerationCard
          key={slot._clientId}
          slot={slot}
          video={videoMap[slot._clientId]}
          onRetry={onRetry}
        />
      ))}
    </div>
  );
}
