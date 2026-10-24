"use client";

import { CheckCircle2, XCircle, RefreshCw, Edit3, Play, Zap } from "lucide-react";
import { FaInstagram } from "react-icons/fa";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn, formatScheduledTime } from "@/lib/utils";
import type { GeneratedVideo } from "@/lib/api";

const ANGLE_STYLES: Record<string, string> = {
  educational: "bg-blue-500/15 text-blue-300 border-blue-500/25",
  story: "bg-purple-500/15 text-purple-300 border-purple-500/25",
  opinion: "bg-orange-500/15 text-orange-300 border-orange-500/25",
  social_proof: "bg-green-500/15 text-green-300 border-green-500/25",
  listicle: "bg-teal-500/15 text-teal-300 border-teal-500/25",
};

interface VideoCardProps {
  video: GeneratedVideo;
  isSelected: boolean;
  onSelect: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onRegenerate: (id: string) => void;
  onEdit: () => void;
  onPublishDemo: (id: string) => void;
  scheduledTime?: string;
  isPosted?: boolean;
  isPublishingDemo?: boolean;
}

export function VideoCard({
  video,
  isSelected,
  onSelect,
  onApprove,
  onReject,
  onRegenerate,
  onEdit,
  onPublishDemo,
  scheduledTime,
  isPosted,
  isPublishingDemo,
}: VideoCardProps) {
  const slot = video.slot_data;
  const date = new Date(slot.date + "T00:00:00");
  const dateStr = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  const isApproved = video.status === "approved";
  const isRejected = video.status === "rejected";
  const isFailed = video.status === "failed";

  const captionPreview = video.caption
    ? video.caption.split("\n")[0].slice(0, 72) + (video.caption.length > 72 ? "…" : "")
    : null;

  const hashtagPreview = video.hashtags?.slice(0, 4).join(" ") ?? null;

  return (
    <div
      onClick={onSelect}
      className={cn(
        "group relative flex flex-col rounded-xl border cursor-pointer overflow-hidden transition-all duration-200",
        isSelected
          ? "border-fuchsia-500/40 bg-fuchsia-500/[0.05]"
          : isApproved
          ? "border-fuchsia-500/20 bg-fuchsia-500/[0.03] hover:border-fuchsia-500/35"
          : isRejected
          ? "border-white/[0.05] bg-white/[0.01] opacity-60 hover:opacity-80"
          : isFailed
          ? "border-red-500/20 bg-red-500/[0.03]"
          : "border-white/[0.07] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.04]"
      )}
    >
      {/* Video thumbnail */}
      <div className="relative aspect-video bg-black overflow-hidden">
        {video.video_url ? (
          <video
            src={video.video_url}
            className="w-full h-full object-contain"
            preload="metadata"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <Play className="size-8 text-white/10" />
          </div>
        )}

        {/* Status overlay badge */}
        <div className="absolute top-2 left-2">
          {isApproved && isPosted && (
            <span className="flex items-center gap-1 text-[10px] font-mono bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded px-1.5 py-0.5 backdrop-blur-sm">
              <Zap className="size-3" /> posted (demo)
            </span>
          )}
          {isApproved && !isPosted && (
            <span className="flex items-center gap-1 text-[10px] font-mono bg-fuchsia-500/30 text-fuchsia-300 border border-fuchsia-500/30 rounded px-1.5 py-0.5 backdrop-blur-sm">
              <CheckCircle2 className="size-3" /> approved
            </span>
          )}
          {isRejected && (
            <span className="flex items-center gap-1 text-[10px] font-mono bg-black/60 text-white/35 border border-white/10 rounded px-1.5 py-0.5 backdrop-blur-sm">
              <XCircle className="size-3" /> rejected
            </span>
          )}
          {isFailed && (
            <span className="flex items-center gap-1 text-[10px] font-mono bg-red-500/30 text-red-300 border border-red-500/30 rounded px-1.5 py-0.5 backdrop-blur-sm">
              <XCircle className="size-3" /> failed
            </span>
          )}
        </div>

        {/* Version badge */}
        {video.version > 1 && (
          <div className="absolute top-2 right-2">
            <span className="text-[10px] font-mono bg-black/60 text-fuchsia-400/70 border border-fuchsia-500/20 rounded px-1.5 py-0.5 backdrop-blur-sm">
              v{video.version}
            </span>
          </div>
        )}
      </div>

      {/* Card body */}
      <div className="flex flex-col gap-2.5 p-3">
        {/* Date + platform + angle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <FaInstagram className="size-3 text-white/25" />
            <span className="text-[11px] text-white/35 font-mono">
              {slot.day.slice(0, 3)}, {dateStr}
            </span>
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
        <p className="text-xs font-medium text-white/80 leading-snug line-clamp-2">
          {slot.topic}
        </p>

        {/* Scheduled time (post-approval) */}
        {isApproved && scheduledTime && (
          <p className="text-[11px] text-fuchsia-300/70 font-mono">
            Scheduled for {formatScheduledTime(scheduledTime)}
          </p>
        )}

        {/* Caption preview */}
        {captionPreview && (
          <p className="text-[11px] text-white/35 leading-relaxed line-clamp-2">
            {captionPreview}
          </p>
        )}

        {/* Hashtag preview */}
        {hashtagPreview && (
          <p className="text-[10px] text-white/22 font-mono truncate">
            {hashtagPreview}
            {(video.hashtags?.length ?? 0) > 4 && (
              <span className="text-white/18"> +{(video.hashtags?.length ?? 0) - 4}</span>
            )}
          </p>
        )}

        {/* Action row */}
        {!isRejected && !isFailed && (
          <div
            className="flex items-center gap-1 mt-0.5"
            onClick={(e) => e.stopPropagation()}
          >
            {!isApproved && (
              <Button
                size="sm"
                className="h-7 px-3 text-[11px] bg-[#C026D3] hover:bg-[#a21caf] text-white border-0 flex-1"
                onClick={() => onApprove(video.id)}
              >
                Approve
              </Button>
            )}
            {isApproved && !isPosted && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isPublishingDemo}
                    className="h-7 px-2.5 text-[11px] gap-1 border-emerald-500/25 text-emerald-300 hover:bg-emerald-500/10 hover:text-emerald-200 flex-1"
                    onClick={() => onPublishDemo(video.id)}
                  >
                    <Zap className="size-3" />
                    {isPublishingDemo ? "Publishing…" : "(demo) Publish Now"}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Instantly publish to Instagram (mock) and run analytics + optimization</TooltipContent>
              </Tooltip>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 text-white/30 hover:text-white/60 hover:bg-white/5 shrink-0"
                  onClick={onEdit}
                >
                  <Edit3 className="size-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Edit caption</TooltipContent>
            </Tooltip>
            {!isApproved && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 text-white/30 hover:text-red-400 hover:bg-red-500/10 shrink-0"
                    onClick={() => onReject(video.id)}
                  >
                    <XCircle className="size-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Reject</TooltipContent>
              </Tooltip>
            )}
          </div>
        )}

        {(isRejected || isFailed) && (
          <div
            className="mt-0.5"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-full text-[11px] text-fuchsia-400/60 hover:text-fuchsia-300 hover:bg-fuchsia-500/10 gap-1.5"
              onClick={() => onRegenerate(video.id)}
            >
              <RefreshCw className="size-3" />
              Regenerate
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
