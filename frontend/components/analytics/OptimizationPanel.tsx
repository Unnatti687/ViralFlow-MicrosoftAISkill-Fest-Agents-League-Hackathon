"use client";

import { useState, useEffect } from "react";
import { Loader2, Sparkles, AlertCircle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { InsightCard } from "./InsightCard";
import { UnderperformingCard } from "./UnderperformingCard";
import { StrategyDiff } from "./StrategyDiff";
import { AcceptOverrideControls } from "./AcceptOverrideControls";
import { runOptimization, getLatestOptimization } from "@/lib/api";
import type { OptimizeResult } from "@/lib/api";

interface OptimizationPanelProps {
  brandCardId: string;
  onAccepted: () => void;
}

export function OptimizationPanel({ brandCardId, onAccepted }: OptimizationPanelProps) {
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [result, setResult] = useState<OptimizeResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setInitialLoading(true);
    getLatestOptimization(brandCardId)
      .then((res) => {
        if (!cancelled && res) setResult(res);
      })
      .catch(() => {
        // No persisted optimization yet — leave the empty state showing.
      })
      .finally(() => {
        if (!cancelled) setInitialLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [brandCardId]);

  const handleRun = async () => {
    setLoading(true);
    setError(null);
    setAccepted(false);
    try {
      const res = await runOptimization(brandCardId);
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Optimization failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full gap-3">
      {/* Sub-header */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-sm text-white/40">
          Run the Optimization Agent to score the last cycle&apos;s reels and rewrite the strategy.
        </span>
        {error && (
          <span className="flex items-center gap-1.5 text-xs text-red-400">
            <AlertCircle className="size-3.5" />
            {error}
          </span>
        )}
        <div className="flex-1" />
        <Button
          size="sm"
          className="gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white border-0 shadow-sm shadow-emerald-900/30"
          onClick={handleRun}
          disabled={loading}
        >
          {loading ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
          Run Optimization
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0">
        <ScrollArea className="h-full">
          {!result && !loading && !initialLoading && (
            <div className="flex items-center justify-center h-40 text-sm text-white/25">
              No optimization run yet for this cycle.
            </div>
          )}

          {(loading || initialLoading) && (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="size-6 animate-spin text-emerald-400" />
            </div>
          )}

          {result?.status === "not_enough_data" && (
            <div className="flex flex-col items-center justify-center h-40 gap-2 text-center">
              <Info className="size-5 text-white/30" />
              <p className="text-sm text-white/50">{result.message}</p>
              <Badge variant="outline" className="text-[11px] px-2 py-0.5 border-white/10 text-white/40 font-mono">
                {result.reel_count} reel{result.reel_count !== 1 ? "s" : ""} analyzed
              </Badge>
            </div>
          )}

          {result?.status === "ok" && (
            <div className="flex flex-col gap-5 pb-4">
              {/* Insights */}
              <section className="flex flex-col gap-2">
                <h2 className="text-xs font-semibold text-white/50 uppercase tracking-wide">Insights</h2>
                <div className="flex flex-col gap-2">
                  {result.insights.map((insight, i) => (
                    <InsightCard key={i} {...insight} />
                  ))}
                </div>
              </section>

              {/* Underperforming */}
              {result.underperforming.length > 0 && (
                <section className="flex flex-col gap-2">
                  <h2 className="text-xs font-semibold text-white/50 uppercase tracking-wide">
                    Underperforming Patterns
                  </h2>
                  <div className="flex flex-col gap-2">
                    {result.underperforming.map((item, i) => (
                      <UnderperformingCard key={i} {...item} />
                    ))}
                  </div>
                </section>
              )}

              {/* Strategy diff */}
              <section className="flex flex-col gap-2">
                <h2 className="text-xs font-semibold text-white/50 uppercase tracking-wide">
                  Strategy Rules — Cycle {result.cycle_number}
                </h2>
                <StrategyDiff
                  current={result.current_strategy_rules}
                  updated={result.updated_strategy_rules}
                  alreadyActive={result.already_accepted}
                />
              </section>

              {/* Accept / Override */}
              <section className="flex flex-col gap-2">
                {accepted ? (
                  <p className="text-sm text-emerald-300">
                    Strategy updated. Redirecting to Strategy…
                  </p>
                ) : result.already_accepted ? (
                  <Badge
                    variant="outline"
                    className="self-start text-[11px] px-2 py-0.5 border-emerald-500/20 text-emerald-300 font-mono"
                  >
                    Active strategy for this cycle
                  </Badge>
                ) : (
                  <AcceptOverrideControls
                    strategyVersionId={result.strategy_version.id}
                    updatedRules={result.updated_strategy_rules}
                    onAccepted={() => {
                      setAccepted(true);
                      onAccepted();
                    }}
                  />
                )}
              </section>
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}
