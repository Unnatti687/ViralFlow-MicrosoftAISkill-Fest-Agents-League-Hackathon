"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import type { BrandCard } from "@/lib/api";
import { CheckCircle, Loader2 } from "lucide-react";

interface BrandContextCardProps {
  card: BrandCard;
  onSave: () => void;
  isSaving: boolean;
  saved: boolean;
}

const FIELD_LABELS: { key: string; label: string; getValue: (c: BrandCard) => string }[] = [
  { key: "brand", label: "Brand", getValue: (c) => c.brand.name },
  { key: "niche", label: "Niche", getValue: (c) => c.brand.niche },
  { key: "description", label: "About", getValue: (c) => c.brand.description || "—" },
  { key: "audience", label: "Audience", getValue: (c) => c.audience.description },
  { key: "tone", label: "Tone", getValue: (c) => c.tone },
  { key: "platforms", label: "Platforms", getValue: (c) => c.platforms.join(", ") },
  { key: "goal", label: "Goal", getValue: (c) => c.goal },
  { key: "voice", label: "Voice style", getValue: (c) => c.preferred_voice },
];

export function BrandContextCard({ card, onSave, isSaving, saved }: BrandContextCardProps) {
  return (
    <Card className="border-primary/20 bg-primary/5 w-full max-w-md">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-primary flex items-center gap-2">
          {saved ? (
            <>
              <CheckCircle className="size-4" />
              Brand Profile Saved
            </>
          ) : (
            "Brand Profile — Does this look right?"
          )}
        </CardTitle>
      </CardHeader>

      <Separator />

      <CardContent className="pt-4 space-y-2">
        {FIELD_LABELS.map(({ key, label, getValue }) => (
          <div key={key} className="flex gap-3 text-sm">
            <span className="w-24 shrink-0 text-muted-foreground">{label}</span>
            <span className="font-medium">{getValue(card)}</span>
          </div>
        ))}

        {card.content_guidelines?.avoid_topics?.length > 0 && (
          <div className="flex gap-3 text-sm">
            <span className="w-24 shrink-0 text-muted-foreground">Avoid</span>
            <div className="flex flex-wrap gap-1">
              {card.content_guidelines.avoid_topics.map((t) => (
                <Badge key={t} variant="secondary" className="text-xs">
                  {t}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>

      {!saved && (
        <>
          <Separator />
          <div className="p-4">
            <Button onClick={onSave} disabled={isSaving} className="w-full" size="sm">
              {isSaving ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Saving…
                </>
              ) : (
                "Looks good, save it →"
              )}
            </Button>
            <p className="mt-2 text-center text-xs text-muted-foreground">
              Or keep typing to make corrections
            </p>
          </div>
        </>
      )}
    </Card>
  );
}
