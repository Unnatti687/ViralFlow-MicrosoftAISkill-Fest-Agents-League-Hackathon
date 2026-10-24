"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { InstagramConnectCard } from "./InstagramConnectCard";
import { ScheduledPostList } from "./ScheduledPostList";
import {
  getInstagramStatus,
  listSchedule,
  retrySchedulePost,
} from "@/lib/api";
import type { InstagramStatus, ScheduledPost } from "@/lib/api";

const POLL_INTERVAL_MS = 10000;
const ACTIVE = new Set<ScheduledPost["status"]>(["scheduled", "publishing"]);

export function ScheduleView() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [status, setStatus] = useState<InstagramStatus | null>(null);
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [banner, setBanner] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const postsRef = useRef<ScheduledPost[]>([]);
  useEffect(() => { postsRef.current = posts; }, [posts]);

  // Initial load
  useEffect(() => {
    getInstagramStatus().then(setStatus).catch(() => setStatus({ connected: false }));
    listSchedule().then(setPosts).catch(() => setPosts([]));
  }, []);

  // OAuth redirect feedback
  useEffect(() => {
    const connected = searchParams.get("ig_connected");
    const error = searchParams.get("ig_error");

    if (connected) {
      setBanner({ type: "success", message: "Instagram account connected." });
      getInstagramStatus().then(setStatus).catch(() => {});
    } else if (error) {
      setBanner({ type: "error", message: `Instagram connection failed: ${error}` });
    }

    if (connected || error) {
      router.replace("/schedule");
    }
  }, [searchParams, router]);

  // Poll while any post is still pending publish
  useEffect(() => {
    const interval = setInterval(() => {
      const hasActive = postsRef.current.some((p) => ACTIVE.has(p.status));
      if (!hasActive) return;
      listSchedule().then(setPosts).catch(() => {});
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, []);

  const handleRetry = useCallback(async (id: string) => {
    try {
      const { scheduled_post } = await retrySchedulePost(id);
      setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, ...scheduled_post } : p)));
    } catch (err) {
      console.error("Retry failed:", err);
    }
  }, []);

  const handleTokenRefreshed = useCallback((expiresAt: string) => {
    setStatus((prev) => (prev ? { ...prev, expires_at: expiresAt, needs_reauth: false } : prev));
  }, []);

  return (
    <div className="flex flex-col h-full px-16 py-5 gap-4">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap pb-2 border-b border-white/5">
        <h1 className="text-2xl font-bold tracking-tight">Schedule</h1>
        <span className="text-sm text-white/40 font-mono">
          {posts.length} post{posts.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Redirect banner */}
      {banner && (
        <div
          className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm ${
            banner.type === "success"
              ? "border-green-500/25 bg-green-500/[0.06] text-green-300"
              : "border-red-500/25 bg-red-500/[0.06] text-red-300"
          }`}
        >
          <span className="flex items-center gap-2">
            <AlertTriangle className="size-4" />
            {banner.message}
          </span>
          <button onClick={() => setBanner(null)} className="text-white/40 hover:text-white/70">
            <X className="size-4" />
          </button>
        </div>
      )}

      {/* IG connect status */}
      <InstagramConnectCard status={status} onTokenRefreshed={handleTokenRefreshed} />

      {!status?.connected && posts.length > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-yellow-500/25 bg-yellow-500/[0.05] px-3 py-2 text-sm text-yellow-300">
          <AlertTriangle className="size-4 shrink-0" />
          Connect Instagram to publish these scheduled posts.
        </div>
      )}

      {/* List */}
      <div className="flex-1 min-h-0">
        <ScrollArea className="h-full">
          <ScheduledPostList posts={posts} onRetry={handleRetry} />
        </ScrollArea>
      </div>
    </div>
  );
}
