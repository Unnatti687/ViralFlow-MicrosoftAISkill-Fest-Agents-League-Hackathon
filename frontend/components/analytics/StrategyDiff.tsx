import { cn } from "@/lib/utils";

interface StrategyDiffProps {
  current: Record<string, unknown> | null;
  updated: Record<string, unknown>;
  alreadyActive?: boolean;
}

function fmt(value: unknown): string {
  if (value === undefined) return "—";
  if (typeof value === "string") return value;
  return JSON.stringify(value, null, 2);
}

export function StrategyDiff({ current, updated, alreadyActive }: StrategyDiffProps) {
  if (current === null) {
    return (
      <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] overflow-hidden">
        <div className="px-3 py-1.5 text-[11px] font-mono text-white/40 border-b border-white/5">
          {alreadyActive
            ? "This is the active strategy — set as the baseline for the next cycle"
            : "No active strategy yet — accepting this proposal sets the baseline for next cycle"}
        </div>
        <div className="divide-y divide-white/5">
          {Object.entries(updated).map(([key, val]) => (
            <div
              key={key}
              className="px-3 py-2 text-[11px] font-mono whitespace-pre-wrap break-words text-emerald-200/80 bg-emerald-500/[0.05]"
            >
              <span className="text-white/50">{key}: </span>
              {fmt(val)}
            </div>
          ))}
        </div>
      </div>
    );
  }

  const keys = Array.from(
    new Set([...Object.keys(current ?? {}), ...Object.keys(updated)])
  );

  return (
    <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] overflow-hidden">
      <div className="grid grid-cols-2 text-[11px] font-mono text-white/40 border-b border-white/5">
        <div className="px-3 py-1.5 border-r border-white/5">current</div>
        <div className="px-3 py-1.5">proposed</div>
      </div>
      <div className="divide-y divide-white/5">
        {keys.map((key) => {
          const oldVal = current?.[key];
          const newVal = updated[key];
          const changed = JSON.stringify(oldVal) !== JSON.stringify(newVal);
          return (
            <div key={key} className="grid grid-cols-2">
              <div
                className={cn(
                  "px-3 py-2 border-r border-white/5 text-[11px] font-mono whitespace-pre-wrap break-words",
                  changed ? "bg-red-500/[0.04] text-white/40" : "text-white/30"
                )}
              >
                <span className="text-white/50">{key}: </span>
                {fmt(oldVal)}
              </div>
              <div
                className={cn(
                  "px-3 py-2 text-[11px] font-mono whitespace-pre-wrap break-words",
                  changed ? "bg-emerald-500/[0.05] text-emerald-200/80" : "text-white/30"
                )}
              >
                <span className="text-white/50">{key}: </span>
                {fmt(newVal)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
