import { TrendingDown, ArrowRight } from "lucide-react";
import type { UnderperformingItem } from "@/lib/api";

export function UnderperformingCard({ pattern, evidence, action }: UnderperformingItem) {
  return (
    <div className="flex flex-col gap-1.5 rounded-xl border border-orange-500/15 bg-orange-500/[0.03] p-3">
      <div className="flex items-start gap-2">
        <TrendingDown className="size-3.5 text-orange-400 mt-0.5 shrink-0" />
        <p className="text-xs font-medium text-white/80 leading-snug">{pattern}</p>
      </div>
      <p className="text-[11px] text-white/35 leading-relaxed pl-6">{evidence}</p>
      <div className="flex items-start gap-2 pl-6">
        <ArrowRight className="size-3 text-orange-400/60 mt-0.5 shrink-0" />
        <p className="text-[11px] text-orange-300/80 leading-relaxed">{action}</p>
      </div>
    </div>
  );
}
