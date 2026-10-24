"use client";

import { useState } from "react";
import { CheckCircle2, Pencil, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { activateStrategyVersion, overrideStrategyVersion } from "@/lib/api";

interface AcceptOverrideControlsProps {
  strategyVersionId: string;
  updatedRules: Record<string, unknown>;
  onAccepted: () => void;
}

export function AcceptOverrideControls({
  strategyVersionId,
  updatedRules,
  onAccepted,
}: AcceptOverrideControlsProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(() => JSON.stringify(updatedRules, null, 2));
  const [submitting, setSubmitting] = useState<"accept" | "override" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAccept = async () => {
    setSubmitting("accept");
    setError(null);
    try {
      await activateStrategyVersion(strategyVersionId);
      onAccepted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Accept failed");
      setSubmitting(null);
    }
  };

  const handleSaveOverride = async () => {
    setSubmitting("override");
    setError(null);
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(draft);
    } catch {
      setError("Invalid JSON");
      setSubmitting(null);
      return;
    }
    try {
      await overrideStrategyVersion(strategyVersionId, parsed);
      onAccepted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Override failed");
      setSubmitting(null);
    }
  };

  if (editing) {
    return (
      <div className="flex flex-col gap-2">
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={10}
          className="font-mono text-[11px] bg-white/[0.02] border-white/10 text-white/70"
        />
        {error && (
          <span className="flex items-center gap-1.5 text-xs text-red-400">
            <AlertCircle className="size-3.5" />
            {error}
          </span>
        )}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            className="gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white border-0"
            onClick={handleSaveOverride}
            disabled={submitting !== null}
          >
            {submitting === "override" && <Loader2 className="size-3.5 animate-spin" />}
            Save override
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-white/40 hover:text-white/70 hover:bg-white/5"
            onClick={() => {
              setEditing(false);
              setError(null);
            }}
            disabled={submitting !== null}
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {error && (
        <span className="flex items-center gap-1.5 text-xs text-red-400">
          <AlertCircle className="size-3.5" />
          {error}
        </span>
      )}
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          className="gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white border-0 shadow-sm shadow-emerald-900/30"
          onClick={handleAccept}
          disabled={submitting !== null}
        >
          {submitting === "accept" ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <CheckCircle2 className="size-3.5" />
          )}
          Accept new strategy
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5 border-white/10 text-white/60 hover:bg-white/5"
          onClick={() => setEditing(true)}
          disabled={submitting !== null}
        >
          <Pencil className="size-3.5" />
          Override
        </Button>
      </div>
    </div>
  );
}
