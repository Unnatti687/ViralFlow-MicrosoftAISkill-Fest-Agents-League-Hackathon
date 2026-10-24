"use client";

import { Play, Eye, Users, Heart, MessageCircle, Share2, Bookmark } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CommentSentiment } from "./CommentSentiment";
import { cn } from "@/lib/utils";
import type { GeneratedVideo, ReelAnalytics } from "@/lib/api";

const ANGLE_STYLES: Record<string, string> = {
  educational: "bg-blue-500/15 text-blue-300 border-blue-500/25",
  story: "bg-purple-500/15 text-purple-300 border-purple-500/25",
  opinion: "bg-orange-500/15 text-orange-300 border-orange-500/25",
  social_proof: "bg-green-500/15 text-green-300 border-green-500/25",
  listicle: "bg-teal-500/15 text-teal-300 border-teal-500/25",
};

interface ReelMetricsCardProps {
  video: GeneratedVideo;
  analytics: ReelAnalytics | null;
}

function fmtInt(n: number | null | undefined): string {
  return n == null ? "—" : n.toLocaleString();
}

function fmtPct(n: number | null | undefined): string {
  return n == null ? "—" : `${(n * 100).toFixed(1)}%`;
}

function fmtRatio(n: number | null | undefined): string {
  return n == null ? "—" : `${Number(n).toFixed(2)}x`;
}

export function ReelMetricsCard({ video, analytics }: ReelMetricsCardProps) {
  const slot = video.slot_data;

  const stats = analytics
    ? [
        { label: "Views", value: fmtInt(analytics.views), icon: Eye },
        { label: "Reach", value: fmtInt(analytics.reach), icon: Users },
        { label: "Likes", value: fmtInt(analytics.likes), icon: Heart },
        { label: "Comments", value: fmtInt(analytics.comments), icon: MessageCircle },
        { label: "Shares", value: fmtInt(analytics.shares), icon: Share2 },
        { label: "Saved", value: fmtInt(analytics.saved), icon: Bookmark },
      ]
    : [];

  return (
    <div className="flex flex-col rounded-xl border border-white/[0.07] bg-white/[0.02] overflow-hidden">
      {/* Thumbnail */}
      <div className="relative aspect-video bg-black overflow-hidden">
        {video.video_url ? (
          <video src={video.video_url} className="w-full h-full object-contain" preload="metadata" />
        ) : (
          <div className="flex items-center justify-center h-full">
            <Play className="size-8 text-white/10" />
          </div>
        )}
        {analytics?.is_mock && (
          <div className="absolute top-2 right-2">
            <span className="text-[10px] font-mono bg-black/60 text-amber-300/80 border border-amber-500/25 rounded px-1.5 py-0.5 backdrop-blur-sm">
              mock
            </span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-col gap-2.5 p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-medium text-white/80 leading-snug line-clamp-2 flex-1">
            {slot.topic}
          </p>
          <Badge
            variant="outline"
            className={cn(
              "text-[10px] px-1.5 py-0 border shrink-0",
              ANGLE_STYLES[slot.content_angle] ?? "bg-white/5 text-white/40 border-white/10"
            )}
          >
            {slot.content_angle.replace("_", " ")}
          </Badge>
        </div>

        {!analytics ? (
          <p className="text-[11px] text-white/25 py-2">Not collected yet.</p>
        ) : (
          <>
            {/* Metric grid */}
            <div className="grid grid-cols-3 gap-2">
              {stats.map((s) => (
                <div key={s.label} className="flex flex-col gap-0.5 rounded-lg bg-white/[0.03] px-2 py-1.5">
                  <div className="flex items-center gap-1 text-white/30">
                    <s.icon className="size-3" />
                    <span className="text-[10px]">{s.label}</span>
                  </div>
                  <span className="text-xs font-mono text-white/80">{s.value}</span>
                </div>
              ))}
            </div>

            {/* Derived metrics */}
            <div className="flex items-center gap-3 text-[11px] font-mono text-white/40 pt-0.5">
              <span>
                Engagement <span className="text-emerald-300">{fmtPct(analytics.engagement_rate)}</span>
              </span>
              <span>
                Skip rate <span className="text-white/60">{fmtPct(analytics.reels_skip_rate)}</span>
              </span>
              <span>
                vs baseline{" "}
                <span
                  className={cn(
                    analytics.vs_baseline != null && analytics.vs_baseline >= 1
                      ? "text-emerald-300"
                      : "text-orange-300"
                  )}
                >
                  {fmtRatio(analytics.vs_baseline)}
                </span>
              </span>
            </div>

            {/* Sentiment */}
            {analytics.comment_sentiment && (
              <CommentSentiment sentiment={analytics.comment_sentiment} />
            )}
          </>
        )}
      </div>
    </div>
  );
}
