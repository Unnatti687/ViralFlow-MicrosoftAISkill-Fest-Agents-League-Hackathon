"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CommentSentiment as CommentSentimentType } from "@/lib/api";

const LABEL_STYLES: Record<string, string> = {
  positive: "text-emerald-300 border-emerald-500/25 bg-emerald-500/10",
  neutral: "text-white/40 border-white/10 bg-white/5",
  negative: "text-red-300 border-red-500/25 bg-red-500/10",
};

interface CommentSentimentProps {
  sentiment: CommentSentimentType;
}

export function CommentSentiment({ sentiment }: CommentSentimentProps) {
  const [expanded, setExpanded] = useState(false);
  const { positive, neutral, negative, samples } = sentiment;
  const total = positive + neutral + negative;

  if (total === 0 && samples.length === 0) return null;

  const pct = (n: number) => (total > 0 ? (n / total) * 100 : 0);

  return (
    <div className="flex flex-col gap-1.5 pt-1 border-t border-white/5">
      <button
        onClick={() => setExpanded((e) => !e)}
        className="flex items-center gap-2 text-[11px] text-white/40 hover:text-white/60"
      >
        <span className="flex-1 flex items-center gap-2">
          <span>Sentiment</span>
          {total > 0 && (
            <div className="flex h-1.5 flex-1 max-w-32 rounded-full overflow-hidden bg-white/5">
              <div className="bg-emerald-500/60" style={{ width: `${pct(positive)}%` }} />
              <div className="bg-white/20" style={{ width: `${pct(neutral)}%` }} />
              <div className="bg-red-500/60" style={{ width: `${pct(negative)}%` }} />
            </div>
          )}
          <span className="font-mono text-white/30">
            {positive}/{neutral}/{negative}
          </span>
        </span>
        {expanded ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
      </button>

      {expanded && samples.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {samples.map((s, i) => (
            <div key={i} className="flex items-start gap-2 text-[11px]">
              <span
                className={cn(
                  "shrink-0 mt-0.5 rounded border px-1 py-0 text-[9px] font-mono uppercase",
                  LABEL_STYLES[s.label] ?? LABEL_STYLES.neutral
                )}
              >
                {s.label[0]}
              </span>
              <p className="text-white/45 leading-snug">
                <span className="text-white/30">@{s.username}:</span> {s.text}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
