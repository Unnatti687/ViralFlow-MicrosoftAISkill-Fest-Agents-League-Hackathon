"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MetricsGrid } from "./MetricsGrid";
import { OptimizationPanel } from "./OptimizationPanel";
import { listVideos, getAnalytics, getMyBrandCard } from "@/lib/api";
import type { GeneratedVideo, ReelAnalytics } from "@/lib/api";

type Tab = "performance" | "optimization";

export function AnalyticsView() {
  const router = useRouter();
  const [brandCardId, setBrandCardId] = useState<string | null>(null);
  const [resolving, setResolving] = useState(true);
  const [tab, setTab] = useState<Tab>("performance");

  const [videos, setVideos] = useState<GeneratedVideo[]>([]);
  const [analyticsMap, setAnalyticsMap] = useState<Record<string, ReelAnalytics | null>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyBrandCard()
      .then((card) => setBrandCardId(card?.id ?? null))
      .catch(() => setBrandCardId(null))
      .finally(() => setResolving(false));
  }, []);

  const loadVideos = useCallback(async () => {
    setLoading(true);
    try {
      const all = await listVideos();
      const posted = all.filter((v) => v.status === "approved");
      setVideos(posted);
      const entries = await Promise.all(
        posted.map(async (v) => [v.id, await getAnalytics(v.id)] as const)
      );
      setAnalyticsMap(Object.fromEntries(entries));
    } catch {
      setVideos([]);
      setAnalyticsMap({});
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVideos();
  }, [loadVideos]);

  if (resolving) {
    return <div className="flex items-center justify-center h-full" />;
  }

  if (!brandCardId) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <p className="text-muted-foreground text-sm">No brand card selected.</p>
        <Button onClick={() => router.push("/onboarding")}>Start onboarding</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full px-16 py-5 gap-4">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap pb-2 border-b border-white/5">
        <h1 className="text-2xl font-bold tracking-tight">Analytics &amp; Optimization</h1>
        <div className="flex-1" />
        <div className="flex items-center gap-1">
          {(["performance", "optimization"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize",
                tab === t
                  ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/25"
                  : "text-white/40 hover:text-white/60 hover:bg-white/5 border border-transparent"
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0">
        {tab === "performance" ? (
          <MetricsGrid
            brandCardId={brandCardId}
            videos={videos}
            analyticsMap={analyticsMap}
            loading={loading}
            onCollected={loadVideos}
          />
        ) : (
          <OptimizationPanel
            brandCardId={brandCardId}
            onAccepted={() => router.push("/strategy")}
          />
        )}
      </div>
    </div>
  );
}
