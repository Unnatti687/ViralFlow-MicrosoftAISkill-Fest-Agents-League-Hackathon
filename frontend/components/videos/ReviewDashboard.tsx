"use client";

import { useState } from "react";
import { CheckCircle2, ArrowRight, X, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { VideoCard } from "./VideoCard";
import { VideoDetailPanel } from "./VideoDetailPanel";
import { cn } from "@/lib/utils";
import type { GeneratedVideo } from "@/lib/api";

type FilterTab = "all" | "pending" | "approved" | "rejected" | "failed";

const TABS: { value: FilterTab; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "failed", label: "Failed" },
];

interface ReviewDashboardProps {
  videos: GeneratedVideo[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onRegenerate: (id: string, note?: string) => void;
  onUpdateCaption: (id: string, caption: string, hashtags: string[]) => void;
  onBulkApprove: () => void;
  onPublishDemo: (id: string) => void;
  onPublishAllDemo: () => void;
  scheduledTimes: Record<string, string>;
  postedVideoIds: Set<string>;
  publishingDemoIds: Set<string>;
  isPublishingAllDemo: boolean;
  banner: string | null;
  onDismissBanner: () => void;
}

export function ReviewDashboard({
  videos,
  onApprove,
  onReject,
  onRegenerate,
  onUpdateCaption,
  onBulkApprove,
  onPublishDemo,
  onPublishAllDemo,
  scheduledTimes,
  postedVideoIds,
  publishingDemoIds,
  isPublishingAllDemo,
  banner,
  onDismissBanner,
}: ReviewDashboardProps) {
  const [filter, setFilter] = useState<FilterTab>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const pendingCount = videos.filter((v) => v.status === "under_review").length;
  const approvedCount = videos.filter((v) => v.status === "approved").length;
  const unpostedApprovedCount = videos.filter(
    (v) => v.status === "approved" && !postedVideoIds.has(v.id)
  ).length;
  const rejectedCount = videos.filter((v) => v.status === "rejected").length;
  const failedCount = videos.filter((v) => v.status === "failed").length;

  const counts: Record<FilterTab, number> = {
    all: videos.length,
    pending: pendingCount,
    approved: approvedCount,
    rejected: rejectedCount,
    failed: failedCount,
  };

  const filtered = videos.filter((v) => {
    if (filter === "all") return true;
    if (filter === "pending") return v.status === "under_review";
    if (filter === "approved") return v.status === "approved";
    if (filter === "rejected") return v.status === "rejected";
    if (filter === "failed") return v.status === "failed";
    return true;
  });

  const selectedVideo = videos.find((v) => v.id === selectedId) ?? null;

  return (
    <div className="flex h-full">
      {/* Main column */}
      <div className="flex flex-col flex-1 min-w-0 px-16 py-5 gap-4">
        {/* Header */}
        <div className="flex items-center gap-3 flex-wrap pb-2 border-b border-white/5">
          <h1 className="text-2xl font-bold tracking-tight">Video Review</h1>
          <span className="text-sm text-white/40 font-mono">
            {pendingCount} pending · {approvedCount} approved
            {rejectedCount > 0 && ` · ${rejectedCount} rejected`}
            {failedCount > 0 && ` · ${failedCount} failed`}
          </span>
          <div className="flex-1" />
          {pendingCount > 0 && (
            <Button
              size="sm"
              className="gap-1.5 bg-[#C026D3] hover:bg-[#a21caf] text-white border-0 shadow-sm shadow-fuchsia-900/30"
              onClick={onBulkApprove}
            >
              <CheckCircle2 className="size-3.5" />
              Approve all
            </Button>
          )}
          {unpostedApprovedCount > 0 && (
            <Button
              size="sm"
              variant="outline"
              disabled={isPublishingAllDemo}
              className="gap-1.5 border-emerald-500/25 text-emerald-300 hover:bg-emerald-500/10 hover:text-emerald-200"
              onClick={onPublishAllDemo}
            >
              <Zap className="size-3.5" />
              {isPublishingAllDemo ? "Publishing…" : "(demo) Publish All & Analyze"}
            </Button>
          )}
        </div>

        {/* Approval banner */}
        {banner && (
          <div className="flex items-center justify-between rounded-lg border border-fuchsia-500/25 bg-fuchsia-500/[0.06] px-3 py-2 text-sm text-fuchsia-200">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="size-4" />
              {banner}
            </span>
            <div className="flex items-center gap-3">
              <Button
                size="sm"
                variant="ghost"
                className="h-7 gap-1.5 text-fuchsia-300 hover:text-fuchsia-200 hover:bg-fuchsia-500/10"
                onClick={() => (window.location.href = "/schedule")}
              >
                View Schedule
                <ArrowRight className="size-3.5" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 gap-1.5 text-fuchsia-300 hover:text-fuchsia-200 hover:bg-fuchsia-500/10"
                onClick={() => (window.location.href = "/analytics")}
              >
                View Analytics
                <ArrowRight className="size-3.5" />
              </Button>
              <button onClick={onDismissBanner} className="text-fuchsia-300/60 hover:text-fuchsia-200">
                <X className="size-4" />
              </button>
            </div>
          </div>
        )}

        {/* Filter tabs */}
        <div className="flex items-center gap-1">
          {TABS.map((tab) => {
            const count = counts[tab.value];
            if (tab.value !== "all" && count === 0) return null;
            return (
              <button
                key={tab.value}
                onClick={() => setFilter(tab.value)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                  filter === tab.value
                    ? "bg-fuchsia-500/15 text-fuchsia-300 border border-fuchsia-500/25"
                    : "text-white/40 hover:text-white/60 hover:bg-white/5 border border-transparent"
                )}
              >
                {tab.label}
                {count > 0 && (
                  <span className={cn(
                    "text-[10px] font-mono px-1 rounded",
                    filter === tab.value ? "text-fuchsia-400/70" : "text-white/20"
                  )}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Grid */}
        <div className="flex-1 min-h-0">
          <ScrollArea className="h-full">
            {filtered.length === 0 ? (
              <div className="flex items-center justify-center h-40 text-sm text-white/25">
                No videos in this filter.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
                {filtered.map((video) => (
                  <VideoCard
                    key={video.id}
                    video={video}
                    isSelected={video.id === selectedId}
                    onSelect={() =>
                      setSelectedId((prev) => (prev === video.id ? null : video.id))
                    }
                    onApprove={onApprove}
                    onReject={onReject}
                    onRegenerate={onRegenerate}
                    onEdit={() =>
                      setSelectedId((prev) => (prev === video.id ? null : video.id))
                    }
                    onPublishDemo={onPublishDemo}
                    scheduledTime={scheduledTimes[video.id]}
                    isPosted={postedVideoIds.has(video.id)}
                    isPublishingDemo={publishingDemoIds.has(video.id)}
                  />
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </div>

      {/* Detail panel */}
      {selectedVideo && (
        <div className="w-80 shrink-0">
          <VideoDetailPanel
            video={selectedVideo}
            onClose={() => setSelectedId(null)}
            onApprove={onApprove}
            onReject={onReject}
            onRegenerate={onRegenerate}
            onUpdateCaption={onUpdateCaption}
          />
        </div>
      )}
    </div>
  );
}
