"use client";

import { useState } from "react";
import { Loader2, RefreshCw, AlertCircle, FlaskConical, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ReelMetricsCard } from "./ReelMetricsCard";
import { collectAnalytics, publishAllDemo } from "@/lib/api";
import type { GeneratedVideo, ReelAnalytics, OptimizeResult } from "@/lib/api";

function describeOptimizeResult(result: OptimizeResult): string {
  if (result.status === "ok") {
    return `New strategy v${result.cycle_number} generated — review it in the Optimization tab.`;
  }
  return result.message;
}

interface MetricsGridProps {
  brandCardId: string;
  videos: GeneratedVideo[];
  analyticsMap: Record<string, ReelAnalytics | null>;
  loading: boolean;
  onCollected: () => void;
}

export function MetricsGrid({
  brandCardId,
  videos,
  analyticsMap,
  loading,
  onCollected,
}: MetricsGridProps) {
  const [collecting, setCollecting] = useState(false);
  const [publishingDemo, setPublishingDemo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [demoMessage, setDemoMessage] = useState<string | null>(null);

  const handleCollect = async () => {
    setCollecting(true);
    setError(null);
    setDemoMessage(null);
    try {
      const { optimize_result } = await collectAnalytics(brandCardId);
      setDemoMessage(describeOptimizeResult(optimize_result));
      onCollected();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Collection failed");
    } finally {
      setCollecting(false);
    }
  };

  const handlePublishAllDemo = async () => {
    setPublishingDemo(true);
    setError(null);
    setDemoMessage(null);
    try {
      const { published, optimize_result } = await publishAllDemo(brandCardId);
      setDemoMessage(
        `Published ${published} reel${published !== 1 ? "s" : ""} (demo) + analytics collected. ${describeOptimizeResult(optimize_result)}`
      );
      onCollected();
    } catch (err) {
      setError(err instanceof Error ? err.message : "(demo) publish failed");
    } finally {
      setPublishingDemo(false);
    }
  };

  const collected = videos.filter((v) => analyticsMap[v.id]);
  const isMock = collected.some((v) => analyticsMap[v.id]?.is_mock);

  return (
    <div className="flex flex-col h-full gap-3">
      {/* Sub-header */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-sm text-white/40 font-mono">
          {collected.length} of {videos.length} reels analyzed
        </span>
        {isMock && (
          <Badge className="text-[11px] px-2 py-0.5 bg-amber-500/10 text-amber-300 border border-amber-500/25 font-mono gap-1">
            <FlaskConical className="size-3" />
            mock data
          </Badge>
        )}
        {error && (
          <span className="flex items-center gap-1.5 text-xs text-red-400">
            <AlertCircle className="size-3.5" />
            {error}
          </span>
        )}
        <div className="flex-1" />
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5 border-fuchsia-500/25 text-fuchsia-300 hover:bg-fuchsia-500/10 hover:text-fuchsia-200"
          onClick={handlePublishAllDemo}
          disabled={publishingDemo || videos.length === 0}
        >
          {publishingDemo ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Zap className="size-3.5" />
          )}
          (demo) Publish All & Analyze
        </Button>
        <Button
          size="sm"
          className="gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white border-0 shadow-sm shadow-emerald-900/30"
          onClick={handleCollect}
          disabled={collecting || videos.length === 0}
        >
          {collecting ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <RefreshCw className="size-3.5" />
          )}
          Collect Analytics
        </Button>
      </div>

      {demoMessage && (
        <div className="flex items-center gap-2 rounded-lg border border-fuchsia-500/25 bg-fuchsia-500/[0.06] px-3 py-2 text-sm text-fuchsia-200">
          <Zap className="size-4 shrink-0" />
          {demoMessage}
        </div>
      )}

      {/* Grid */}
      <div className="flex-1 min-h-0">
        <ScrollArea className="h-full">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="size-6 animate-spin text-emerald-400" />
            </div>
          ) : videos.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-sm text-white/25">
              No published reels yet. Approve and schedule videos first.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
              {videos.map((video) => (
                <ReelMetricsCard
                  key={video.id}
                  video={video}
                  analytics={analyticsMap[video.id] ?? null}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}
