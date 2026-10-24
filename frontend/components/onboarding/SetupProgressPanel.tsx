"use client";

import { CheckCircle2, Circle, Zap } from "lucide-react";
import type { ExtractionState } from "@/lib/api";

const STEPS: { key: string; label: string }[] = [
  { key: "brand_name", label: "Brand Name" },
  { key: "niche", label: "Niche" },
  { key: "audience", label: "Audience" },
  { key: "tone", label: "Tone" },
  { key: "goal", label: "Goal" },
  { key: "preferred_voice", label: "Voice" },
];

export function SetupProgressPanel({ extractionState }: { extractionState: ExtractionState }) {
  const collected = extractionState.collected || {};
  const doneCount = STEPS.filter((s) => collected[s.key]).length;
  const percent = Math.round((doneCount / STEPS.length) * 100);
  const activeIndex = STEPS.findIndex((s) => !collected[s.key]);

  return (
    <div className="flex flex-col gap-5 p-5 h-full">
      <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-muted-foreground">
        <Zap className="size-3.5 text-primary" />
        SETUP PROGRESS
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Brand Setup Progress</h3>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{doneCount} of {STEPS.length} complete</span>
          <span className="font-semibold text-primary">{percent}%</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-muted/50 overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {STEPS.map((step, i) => {
          const done = !!collected[step.key];
          const active = !done && i === activeIndex;
          return (
            <div
              key={step.key}
              className={`flex items-center justify-between rounded-lg border px-3 py-2.5 text-sm transition-colors duration-300 ${
                done
                  ? "border-primary/20 bg-primary/5 text-primary"
                  : active
                  ? "border-primary/40 bg-primary/10"
                  : "border-border/50 text-muted-foreground"
              }`}
            >
              <span className="flex items-center gap-2">
                {done ? (
                  <CheckCircle2 className="size-4 text-primary" />
                ) : (
                  <Circle className="size-4" />
                )}
                {step.label}
              </span>
              {active && (
                <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-semibold uppercase text-primary">
                  Active
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-auto flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/5 p-3">
        <Zap className="size-4 shrink-0 text-primary mt-0.5" />
        <div className="text-xs text-muted-foreground">
          <p className="font-medium text-foreground">AI Extraction Active</p>
          <p className="mt-1">Your answers are being analyzed in real-time to build your brand profile.</p>
        </div>
      </div>
    </div>
  );
}
