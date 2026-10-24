import { Lightbulb } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { InsightItem } from "@/lib/api";

const CONFIDENCE_STYLES: Record<string, string> = {
  high: "text-emerald-300 border-emerald-500/25 bg-emerald-500/10",
  medium: "text-amber-300 border-amber-500/25 bg-amber-500/10",
  low: "text-white/40 border-white/10 bg-white/5",
};

export function InsightCard({ observation, evidence, confidence }: InsightItem) {
  return (
    <div className="flex flex-col gap-1.5 rounded-xl border border-white/[0.07] bg-white/[0.02] p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2">
          <Lightbulb className="size-3.5 text-emerald-400 mt-0.5 shrink-0" />
          <p className="text-xs font-medium text-white/80 leading-snug">{observation}</p>
        </div>
        <Badge
          variant="outline"
          className={cn("text-[10px] px-1.5 py-0 border shrink-0", CONFIDENCE_STYLES[confidence] ?? CONFIDENCE_STYLES.low)}
        >
          {confidence}
        </Badge>
      </div>
      <p className="text-[11px] text-white/35 leading-relaxed pl-6">{evidence}</p>
    </div>
  );
}
