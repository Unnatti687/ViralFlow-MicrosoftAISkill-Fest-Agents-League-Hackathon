"use client";

import { RefreshCw, CheckCircle2, XCircle, Clock } from "lucide-react";
import { FaInstagram } from "react-icons/fa";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CalendarSlot, GeneratedVideo } from "@/lib/api";

const ANGLE_STYLES: Record<string, string> = {
  educational: "bg-blue-500/15 text-blue-300 border-blue-500/25",
  story: "bg-purple-500/15 text-purple-300 border-purple-500/25",
  opinion: "bg-orange-500/15 text-orange-300 border-orange-500/25",
  social_proof: "bg-green-500/15 text-green-300 border-green-500/25",
  listicle: "bg-teal-500/15 text-teal-300 border-teal-500/25",
};

interface StatusMeta {
  label: string;
  icon: React.ReactNode;
  bar: "pulse" | "done" | "none";
  barColor: string;
}

function getStatusMeta(video: GeneratedVideo | undefined): StatusMeta {
  if (!video) {
    return {
      label: "Starting…",
      icon: <Clock className="size-3 text-white/30" />,
      bar: "none",
      barColor: "",
    };
  }
  switch (video.status) {
    case "script_ready":
      return {
        label: "Rendering video…",
        icon: <RefreshCw className="size-3 text-fuchsia-400 animate-spin" />,
        bar: "pulse",
        barColor: "bg-fuchsia-500",
      };
    case "rendering":
      return {
        label: "Rendering video…",
        icon: <RefreshCw className="size-3 text-fuchsia-400 animate-spin" />,
        bar: "pulse",
        barColor: "bg-fuchsia-500",
      };
    case "render_complete":
      return {
        label: "Finalizing…",
        icon: <RefreshCw className="size-3 text-fuchsia-300 animate-spin" />,
        bar: "pulse",
        barColor: "bg-fuchsia-400",
      };
    case "under_review":
    case "approved":
      return {
        label: "Ready for review",
        icon: <CheckCircle2 className="size-3 text-fuchsia-400" />,
        bar: "done",
        barColor: "bg-fuchsia-500",
      };
    case "rejected":
      return {
        label: "Rejected",
        icon: <XCircle className="size-3 text-white/30" />,
        bar: "done",
        barColor: "bg-white/20",
      };
    case "failed":
      return {
        label: video.review_note ?? "Generation failed",
        icon: <XCircle className="size-3 text-red-400" />,
        bar: "none",
        barColor: "",
      };
    default:
      return {
        label: "Processing…",
        icon: <RefreshCw className="size-3 text-fuchsia-400 animate-spin" />,
        bar: "pulse",
        barColor: "bg-fuchsia-500",
      };
  }
}

interface GenerationCardProps {
  slot: CalendarSlot;
  video: GeneratedVideo | undefined;
  onRetry: (slot: CalendarSlot) => void;
}

export function GenerationCard({ slot, video, onRetry }: GenerationCardProps) {
  const meta = getStatusMeta(video);
  const isFailed = video?.status === "failed";
  const isDone = video?.status === "under_review" || video?.status === "approved";
  const hasScript = video?.script?.narration_script;

  const date = new Date(slot.date + "T00:00:00");
  const dateStr = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return (
    <div
      className={cn(
        "relative flex flex-col rounded-xl border p-4 gap-3 overflow-hidden transition-colors duration-300",
        isDone
          ? "border-fuchsia-500/25 bg-fuchsia-500/[0.04]"
          : isFailed
          ? "border-red-500/25 bg-red-500/[0.04]"
          : "border-white/[0.07] bg-white/[0.02]"
      )}
    >
      {/* Top row: platform + date + angle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FaInstagram className="size-3 text-white/30" />
          <span className="text-[11px] text-white/40 font-mono">{slot.day.slice(0, 3)}, {dateStr}</span>
        </div>
        <Badge
          variant="outline"
          className={cn(
            "text-[10px] px-1.5 py-0 border",
            ANGLE_STYLES[slot.content_angle] ?? "bg-white/5 text-white/40 border-white/10"
          )}
        >
          {slot.content_angle.replace("_", " ")}
        </Badge>
      </div>

      {/* Topic */}
      <p className="text-sm font-medium text-white/85 leading-snug line-clamp-2">
        {slot.topic}
      </p>

      {/* Script preview — visible only when script available and not yet done */}
      {hasScript && !isDone && (
        <div className="rounded-lg bg-white/[0.03] border border-white/[0.05] px-3 py-2.5">
          <p className="text-[10px] text-white/28 italic leading-relaxed line-clamp-3">
            &ldquo;{video!.script!.narration_script}&rdquo;
          </p>
          <p className="text-[9px] text-white/18 font-mono text-right mt-1 select-none">
            · narration
          </p>
        </div>
      )}

      {/* Progress bar */}
      {meta.bar !== "none" && (
        <div className="h-[2px] w-full rounded-full bg-white/[0.06] overflow-hidden">
          {meta.bar === "pulse" ? (
            <div
              className={cn("h-full w-1/3 rounded-full", meta.barColor)}
              style={{ animation: "slideIndeterminate 1.8s linear infinite" }}
            />
          ) : (
            <div className={cn("h-full w-full rounded-full", meta.barColor)} />
          )}
        </div>
      )}

      {/* Status row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {meta.icon}
          <span className={cn(
            "text-[11px] font-mono",
            isFailed ? "text-red-400/80" : isDone ? "text-fuchsia-400/80" : "text-white/30"
          )}>
            {meta.label}
          </span>
        </div>
        {isFailed && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-[11px] text-white/40 hover:text-white/70 hover:bg-white/5"
            onClick={() => onRetry(slot)}
          >
            Retry
          </Button>
        )}
      </div>
    </div>
  );
}
