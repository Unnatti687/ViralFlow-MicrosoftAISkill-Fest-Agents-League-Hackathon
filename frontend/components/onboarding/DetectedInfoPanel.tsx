"use client";

import { Sparkles, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ExtractionState } from "@/lib/api";

const FIELDS: { key: string; label: string }[] = [
  { key: "brand_name", label: "Brand" },
  { key: "niche", label: "Niche" },
  { key: "audience", label: "Audience" },
  { key: "tone", label: "Tone" },
  { key: "goal", label: "Goal" },
  { key: "preferred_voice", label: "Voice" },
];

interface DetectedInfoPanelProps {
  extractionState: ExtractionState;
  canSave?: boolean;
  isSaving?: boolean;
  saved?: boolean;
  onSaveAndContinue?: () => void;
}

export function DetectedInfoPanel({
  extractionState,
  canSave = false,
  isSaving = false,
  saved = false,
  onSaveAndContinue,
}: DetectedInfoPanelProps) {
  const collected = extractionState.collected || {};
  const anyDetected = FIELDS.some((f) => collected[f.key]);

  return (
    <div className="flex flex-col gap-5 p-5">
      <div className="flex items-center justify-between text-xs font-semibold tracking-wider text-muted-foreground">
        <span className="flex items-center gap-2">
          <Sparkles className="size-3.5 text-primary" />
          DETECTED INFORMATION
        </span>
        <span className="flex items-center gap-1.5 text-[10px] text-emerald-400">
          <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Live
        </span>
      </div>

      {!anyDetected ? (
        <p className="text-sm text-muted-foreground">
          Nothing detected yet — keep chatting and we&apos;ll fill this in.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {FIELDS.map(({ key, label }) => {
            const value = collected[key];
            return (
              <div
                key={key}
                className="flex items-center justify-between gap-3 text-sm transition-opacity duration-300"
              >
                <span className="text-muted-foreground">{label}</span>
                {value ? (
                  <span className="max-w-[60%] truncate rounded-full bg-primary/15 px-2.5 py-1 text-xs font-medium text-primary text-right">
                    {value}
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground/50">—</span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {canSave ? (
        <Button
          onClick={onSaveAndContinue}
          disabled={isSaving || saved}
          className="w-full gap-2"
        >
          {isSaving || saved ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Generating…
            </>
          ) : (
            <>
              Save &amp; Generate Strategy
              <ArrowRight className="size-4" />
            </>
          )}
        </Button>
      ) : (
        <p className="text-xs text-muted-foreground">
          AI is continuously refining your brand profile as you chat.
        </p>
      )}
    </div>
  );
}
