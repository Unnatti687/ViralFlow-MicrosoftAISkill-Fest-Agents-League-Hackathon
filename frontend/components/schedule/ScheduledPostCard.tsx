"use client";

import { Clock, Loader2, CheckCircle2, XCircle, RefreshCw, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ScheduledPost } from "@/lib/api";

const STATUS_STYLES: Record<ScheduledPost["status"], string> = {
  scheduled: "bg-white/5 text-white/40 border-white/10",
  publishing: "bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/25",
  posted: "bg-green-500/15 text-green-300 border-green-500/25",
  failed: "bg-red-500/15 text-red-300 border-red-500/25",
};

interface ScheduledPostCardProps {
  post: ScheduledPost;
  onRetry: (id: string) => void;
}

export function ScheduledPostCard({ post, onRetry }: ScheduledPostCardProps) {
  const time = new Date(post.scheduled_time);
  const timeStr = time.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  const captionPreview = post.caption.split("\n")[0].slice(0, 80) + (post.caption.length > 80 ? "…" : "");
  const hashtagPreview = post.hashtags?.slice(0, 4).join(" ") ?? null;

  return (
    <div className="flex gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] p-3">
      {/* Thumbnail */}
      <div className="relative aspect-[9/16] w-20 shrink-0 overflow-hidden rounded-lg bg-black">
        {post.video_url && (
          <video src={post.video_url} className="h-full w-full object-cover" preload="metadata" />
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 min-w-0 flex-col gap-1.5">
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 text-xs text-white/40 font-mono">
            <Clock className="size-3" />
            {timeStr}
          </span>
          <span
            className={cn(
              "flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-mono shrink-0",
              STATUS_STYLES[post.status]
            )}
          >
            {post.status === "publishing" && <Loader2 className="size-3 animate-spin" />}
            {post.status === "posted" && <CheckCircle2 className="size-3" />}
            {post.status === "failed" && <XCircle className="size-3" />}
            {post.status}
          </span>
        </div>

        <p className="text-xs text-white/70 leading-snug line-clamp-2">{captionPreview}</p>

        {hashtagPreview && (
          <p className="text-[10px] text-white/22 font-mono truncate">{hashtagPreview}</p>
        )}

        {post.status === "failed" && post.error_message && (
          <p className="text-[11px] text-red-300/80 leading-snug line-clamp-2">
            {post.error_message}
          </p>
        )}

        <div className="mt-auto flex items-center gap-2 pt-1">
          {post.status === "failed" && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2.5 text-[11px] text-fuchsia-400/60 hover:text-fuchsia-300 hover:bg-fuchsia-500/10 gap-1.5"
              onClick={() => onRetry(post.id)}
            >
              <RefreshCw className="size-3" />
              Retry
            </Button>
          )}
          {post.status === "posted" && post.published_at && (
            <span className="flex items-center gap-1.5 text-[11px] text-white/35 font-mono">
              <ExternalLink className="size-3" />
              Posted {new Date(post.published_at).toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </span>
          )}
          {post.retry_count > 0 && (
            <span className="text-[10px] text-white/25 font-mono ml-auto">
              {post.retry_count} retr{post.retry_count === 1 ? "y" : "ies"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
