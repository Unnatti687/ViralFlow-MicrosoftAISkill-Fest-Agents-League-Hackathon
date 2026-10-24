"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { GenerationQueue } from "./GenerationQueue";
import { ReviewDashboard } from "./ReviewDashboard";
import {
  generateVideo,
  getVideoStatus,
  approveVideo,
  rejectVideo,
  regenerateVideo,
  updateVideoCaption,
  getMyBrandCard,
  publishVideoDemo,
  publishAllDemo,
} from "@/lib/api";
import type { CalendarSlot, GeneratedVideo, OptimizeResult } from "@/lib/api";
import { formatScheduledTime } from "@/lib/utils";

type Phase = "generation" | "review";
type VideoMap = Record<string, GeneratedVideo>; // slot._clientId → video

const POLL_INTERVAL_MS = 5000;
const IN_PROGRESS = new Set(["script_ready", "rendering", "render_complete"]);
const TERMINAL = new Set(["under_review", "approved", "rejected", "failed"]);

function describeOptimizeResult(result: OptimizeResult): string {
  if (result.status === "ok") {
    return `New strategy v${result.cycle_number} generated — review it in Analytics.`;
  }
  return result.message;
}

export function VideoView() {
  const [slots, setSlots] = useState<CalendarSlot[]>([]);
  const [brandCardId, setBrandCardId] = useState<string | null>(null);
  const [videoMap, setVideoMap] = useState<VideoMap>({});
  const [phase, setPhase] = useState<Phase>("generation");
  const [initiated, setInitiated] = useState(false);
  const [scheduledTimes, setScheduledTimes] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState<string | null>(null);
  const [postedVideoIds, setPostedVideoIds] = useState<Set<string>>(new Set());
  const [publishingDemoIds, setPublishingDemoIds] = useState<Set<string>>(new Set());
  const [isPublishingAllDemo, setIsPublishingAllDemo] = useState(false);

  // Ref keeps polling closure fresh without re-registering the interval
  const videoMapRef = useRef<VideoMap>({});
  useEffect(() => { videoMapRef.current = videoMap; }, [videoMap]);

  // Load slots from localStorage (per spec, slots are frontend-only state)
  useEffect(() => {
    try {
      const rawSlots = localStorage.getItem("viralflow:strategy:slots");
      if (rawSlots) setSlots(JSON.parse(rawSlots) as CalendarSlot[]);
    } catch { /* ignore */ }
    getMyBrandCard()
      .then((card) => setBrandCardId(card?.id ?? null))
      .catch(() => setBrandCardId(null));
  }, []);

  // Kick off generation once per mount
  useEffect(() => {
    if (slots.length === 0 || initiated || !brandCardId) return;
    setInitiated(true);

    slots.forEach((slot) => {
      generateVideo(brandCardId, slot)
        .then((video) => {
          setVideoMap((prev) => ({ ...prev, [slot._clientId]: video }));
        })
        .catch((err: Error) => {
          // Synthetic failed entry — id prefixed so we know no DB row exists
          setVideoMap((prev) => ({
            ...prev,
            [slot._clientId]: {
              id: `local-failed-${slot._clientId}`,
              user_id: "",
              brand_card_id: brandCardId,
              slot_data: slot,
              script: null,
              mpt_task_id: null,
              video_url: null,
              caption: null,
              hashtags: null,
              status: "failed",
              parent_video_id: null,
              version: 1,
              review_note: err.message,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            } as GeneratedVideo,
          }));
        });
    });
  }, [slots, brandCardId, initiated]);

  // Stable polling interval — reads fresh state via ref
  useEffect(() => {
    const interval = setInterval(async () => {
      const map = videoMapRef.current;
      const inProgress = Object.entries(map).filter(
        ([, v]) => v && IN_PROGRESS.has(v.status)
      );
      if (inProgress.length === 0) return;

      for (const [clientId, video] of inProgress) {
        try {
          const updated = await getVideoStatus(video.id);
          setVideoMap((prev) => ({ ...prev, [clientId]: updated }));
        } catch { /* keep stale, retry next tick */ }
      }
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, []); // intentionally empty — uses ref

  // Derived state
  const allVideos = Object.values(videoMap);
  const inProgressCount = allVideos.filter((v) => IN_PROGRESS.has(v.status)).length;
  const terminalCount = allVideos.filter((v) => TERMINAL.has(v.status)).length;
  const allSettled =
    slots.length > 0 &&
    inProgressCount === 0 &&
    Object.keys(videoMap).length === slots.length;

  const reviewVideos = allVideos.filter((v) =>
    ["under_review", "approved", "rejected", "failed"].includes(v.status)
  );

  // Handlers
  const handleApprove = useCallback(async (id: string, opts?: { silent?: boolean }) => {
    try {
      const { scheduled_post } = await approveVideo(id);
      setVideoMap((prev) => {
        const entry = Object.entries(prev).find(([, v]) => v.id === id);
        if (!entry) return prev;
        return { ...prev, [entry[0]]: { ...entry[1], status: "approved" } };
      });
      setScheduledTimes((prev) => ({ ...prev, [id]: scheduled_post.scheduled_time }));
      if (!opts?.silent) {
        setBanner(`Scheduled for ${formatScheduledTime(scheduled_post.scheduled_time)}`);
      }
    } catch (err) {
      console.error("Approve failed:", err);
    }
  }, []);

  const handleReject = useCallback(async (id: string) => {
    try {
      await rejectVideo(id);
      setVideoMap((prev) => {
        const entry = Object.entries(prev).find(([, v]) => v.id === id);
        if (!entry) return prev;
        return { ...prev, [entry[0]]: { ...entry[1], status: "rejected" } };
      });
    } catch (err) {
      console.error("Reject failed:", err);
    }
  }, []);

  const handleRegenerate = useCallback(async (id: string, note?: string) => {
    try {
      const newVideo = await regenerateVideo(id, note);
      setVideoMap((prev) => {
        const entry = Object.entries(prev).find(([, v]) => v.id === id);
        if (!entry) return prev;
        return { ...prev, [entry[0]]: newVideo };
      });
    } catch (err) {
      console.error("Regenerate failed:", err);
    }
  }, []);

  const handleUpdateCaption = useCallback(
    async (id: string, caption: string, hashtags: string[]) => {
      try {
        const updated = await updateVideoCaption(id, caption, hashtags);
        setVideoMap((prev) => {
          const entry = Object.entries(prev).find(([, v]) => v.id === id);
          if (!entry) return prev;
          return { ...prev, [entry[0]]: updated };
        });
      } catch (err) {
        console.error("Caption update failed:", err);
      }
    },
    []
  );

  const handleBulkApprove = useCallback(async () => {
    const pending = Object.values(videoMap).filter(
      (v) => v.status === "under_review"
    );
    await Promise.allSettled(pending.map((v) => handleApprove(v.id, { silent: true })));
    if (pending.length > 0) {
      setBanner(`${pending.length} video${pending.length !== 1 ? "s" : ""} scheduled`);
    }
  }, [videoMap, handleApprove]);

  const handlePublishDemo = useCallback(async (id: string) => {
    setPublishingDemoIds((prev) => new Set(prev).add(id));
    try {
      const { optimize_result } = await publishVideoDemo(id);
      setPostedVideoIds((prev) => new Set(prev).add(id));
      setBanner(`Published (demo) + analytics collected. ${describeOptimizeResult(optimize_result)}`);
    } catch (err) {
      console.error("(demo) publish failed:", err);
      setBanner(err instanceof Error ? err.message : "(demo) publish failed");
    } finally {
      setPublishingDemoIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }, []);

  const handlePublishAllDemo = useCallback(async () => {
    if (!brandCardId) return;
    const unposted = Object.values(videoMap).filter(
      (v) => v.status === "approved" && !postedVideoIds.has(v.id)
    );
    setIsPublishingAllDemo(true);
    try {
      const { published, optimize_result } = await publishAllDemo(brandCardId);
      setPostedVideoIds((prev) => {
        const next = new Set(prev);
        unposted.forEach((v) => next.add(v.id));
        return next;
      });
      setBanner(
        `Published ${published} reel${published !== 1 ? "s" : ""} (demo) + analytics collected. ${describeOptimizeResult(optimize_result)}`
      );
    } catch (err) {
      console.error("(demo) publish all failed:", err);
      setBanner(err instanceof Error ? err.message : "(demo) publish all failed");
    } finally {
      setIsPublishingAllDemo(false);
    }
  }, [brandCardId, videoMap, postedVideoIds]);

  const handleRetry = useCallback(
    (slot: CalendarSlot) => {
      if (!brandCardId) return;
      generateVideo(brandCardId, slot)
        .then((video) => {
          setVideoMap((prev) => ({ ...prev, [slot._clientId]: video }));
        })
        .catch((err: Error) => {
          setVideoMap((prev) => ({
            ...prev,
            [slot._clientId]: {
              ...prev[slot._clientId],
              status: "failed",
              review_note: err.message,
            },
          }));
        });
    },
    [brandCardId]
  );

  // Empty state
  if (slots.length === 0 && !initiated) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <p className="text-muted-foreground text-sm">No strategy slots found.</p>
        <Button
          variant="outline"
          className="border-white/10 text-white/60 hover:bg-white/5"
          onClick={() => (window.location.href = "/strategy")}
        >
          Back to Strategy
        </Button>
      </div>
    );
  }

  // Review phase
  if (phase === "review") {
    return (
      <ReviewDashboard
        videos={reviewVideos}
        onApprove={handleApprove}
        onReject={handleReject}
        onRegenerate={handleRegenerate}
        onUpdateCaption={handleUpdateCaption}
        onBulkApprove={handleBulkApprove}
        onPublishDemo={handlePublishDemo}
        onPublishAllDemo={handlePublishAllDemo}
        scheduledTimes={scheduledTimes}
        postedVideoIds={postedVideoIds}
        publishingDemoIds={publishingDemoIds}
        isPublishingAllDemo={isPublishingAllDemo}
        banner={banner}
        onDismissBanner={() => setBanner(null)}
      />
    );
  }

  // Generation phase
  return (
    <div className="flex flex-col h-full px-16 py-5 gap-4">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap pb-2 border-b border-white/5">
        <h1 className="text-2xl font-bold tracking-tight">Content Generation</h1>
        <span className="text-sm text-white/40 font-mono">
          {terminalCount} of {slots.length} complete
        </span>
        {inProgressCount > 0 && (
          <Loader2 className="size-4 animate-spin text-fuchsia-400" />
        )}
      </div>

      {/* Cards */}
      <div className="flex-1 min-h-0">
        <ScrollArea className="h-full">
          <GenerationQueue
            slots={slots}
            videoMap={videoMap}
            onRetry={handleRetry}
          />
        </ScrollArea>
      </div>

      {/* CTA — visible once all slots are in terminal state */}
      {allSettled && (
        <div className="flex items-center justify-between border-t border-white/5 pt-4">
          <p className="text-sm text-muted-foreground">
            {reviewVideos.length} video{reviewVideos.length !== 1 ? "s" : ""} ready for review
          </p>
          <Button
            size="lg"
            className="gap-2 bg-[#C026D3] hover:bg-[#a21caf] text-white border-0 shadow-lg shadow-fuchsia-900/30 transition-colors"
            onClick={() => setPhase("review")}
          >
            Review Videos
            <ArrowRight className="size-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
