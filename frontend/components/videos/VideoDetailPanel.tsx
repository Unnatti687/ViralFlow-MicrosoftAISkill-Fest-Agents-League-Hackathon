"use client";

import { useState } from "react";
import { X, Edit3, RefreshCw, XCircle, Check } from "lucide-react";
import { FaInstagram } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { GeneratedVideo } from "@/lib/api";

const ANGLE_STYLES: Record<string, string> = {
  educational: "bg-blue-500/15 text-blue-300 border-blue-500/25",
  story: "bg-purple-500/15 text-purple-300 border-purple-500/25",
  opinion: "bg-orange-500/15 text-orange-300 border-orange-500/25",
  social_proof: "bg-green-500/15 text-green-300 border-green-500/25",
  listicle: "bg-teal-500/15 text-teal-300 border-teal-500/25",
};

type PanelMode = "view" | "edit" | "reject";

interface VideoDetailPanelProps {
  video: GeneratedVideo;
  onClose: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onRegenerate: (id: string, note?: string) => void;
  onUpdateCaption: (id: string, caption: string, hashtags: string[]) => void;
}

export function VideoDetailPanel({
  video,
  onClose,
  onApprove,
  onReject,
  onRegenerate,
  onUpdateCaption,
}: VideoDetailPanelProps) {
  const [mode, setMode] = useState<PanelMode>("view");
  const [editCaption, setEditCaption] = useState(video.caption ?? "");
  const [editHashtags, setEditHashtags] = useState(
    video.hashtags?.join(" ") ?? ""
  );
  const [rejectNote, setRejectNote] = useState("");
  const [saving, setSaving] = useState(false);

  const slot = video.slot_data;
  const date = new Date(slot.date + "T00:00:00");
  const dateStr = date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const isApproved = video.status === "approved";
  const isRejected = video.status === "rejected";

  async function handleSaveCaption() {
    setSaving(true);
    const tags = editHashtags
      .split(/[\s,]+/)
      .map((t) => (t.startsWith("#") ? t : `#${t}`))
      .filter((t) => t.length > 1);
    await onUpdateCaption(video.id, editCaption, tags);
    setSaving(false);
    setMode("view");
  }

  async function handleRejectConfirm() {
    await onReject(video.id);
    setMode("view");
  }

  async function handleRegenerateConfirm() {
    await onRegenerate(video.id, rejectNote || undefined);
    setMode("view");
  }

  return (
    <div className="flex flex-col h-full border-l border-white/[0.07] bg-[#0d0d0d] animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4 pb-3 shrink-0">
        <div className="flex items-center gap-2">
          <FaInstagram className="size-3.5 text-white/30" />
          <span className="text-sm font-medium text-white/80">{dateStr}</span>
          {video.version > 1 && (
            <span className="text-[10px] font-mono text-fuchsia-400/70 border border-fuchsia-500/20 rounded px-1.5 py-0.5">
              v{video.version}
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="size-7 text-white/30 hover:text-white/60 hover:bg-white/5"
          onClick={onClose}
        >
          <X className="size-4" />
        </Button>
      </div>

      <Separator className="bg-white/[0.06]" />

      <div className="flex-1 overflow-y-auto">
        {/* Video player */}
        <div className="relative bg-black aspect-video w-full">
          {video.video_url ? (
            <video
              src={video.video_url}
              controls
              className="w-full h-full object-contain"
              playsInline
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-[11px] text-white/20 font-mono">no preview</p>
            </div>
          )}
        </div>

        <div className="p-4 space-y-5">
          {/* Angle + post type */}
          <div className="flex flex-wrap gap-2">
            <Badge
              variant="outline"
              className={cn(
                "border",
                ANGLE_STYLES[slot.content_angle] ?? "bg-white/5 text-white/40 border-white/10"
              )}
            >
              {slot.content_angle.replace("_", " ")}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {slot.post_type}
            </Badge>
            {isApproved && (
              <Badge className="text-[10px] bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30">
                approved
              </Badge>
            )}
            {isRejected && (
              <Badge className="text-[10px] bg-white/10 text-white/35 border border-white/10">
                rejected
              </Badge>
            )}
          </div>

          {/* Topic */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-white/30 mb-1.5">
              Topic
            </p>
            <p className="text-sm text-white/80 leading-relaxed">{slot.topic}</p>
          </div>

          <Separator className="bg-white/[0.06]" />

          {/* Caption section */}
          {mode === "edit" ? (
            <div className="space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-white/30">
                Caption
              </p>
              <Textarea
                value={editCaption}
                onChange={(e) => setEditCaption(e.target.value)}
                rows={4}
                className="text-sm bg-white/[0.04] border-white/[0.08] text-white/85 resize-none focus-visible:ring-fuchsia-500/40"
                placeholder="Caption…"
              />
              <p className="text-[11px] font-semibold uppercase tracking-wider text-white/30">
                Hashtags
              </p>
              <Textarea
                value={editHashtags}
                onChange={(e) => setEditHashtags(e.target.value)}
                rows={2}
                className="text-sm bg-white/[0.04] border-white/[0.08] text-white/85 font-mono resize-none focus-visible:ring-fuchsia-500/40"
                placeholder="#growth #instagram …"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="bg-[#C026D3] hover:bg-[#a21caf] text-white border-0 gap-1.5"
                  onClick={handleSaveCaption}
                  disabled={saving}
                >
                  <Check className="size-3.5" />
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-white/40 hover:text-white/60 hover:bg-white/5"
                  onClick={() => setMode("view")}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : mode === "reject" ? (
            <div className="space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-white/30">
                Note (optional)
              </p>
              <Textarea
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
                rows={3}
                className="text-sm bg-white/[0.04] border-white/[0.08] text-white/85 resize-none focus-visible:ring-fuchsia-500/40"
                placeholder="e.g. Wrong tone, try more casual…"
              />
              <div className="flex flex-col gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 gap-1.5"
                  onClick={handleRejectConfirm}
                >
                  <XCircle className="size-3.5" />
                  Reject only
                </Button>
                <Button
                  size="sm"
                  className="bg-[#C026D3] hover:bg-[#a21caf] text-white border-0 gap-1.5"
                  onClick={handleRegenerateConfirm}
                >
                  <RefreshCw className="size-3.5" />
                  Reject &amp; regenerate
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-white/40 hover:text-white/60 hover:bg-white/5"
                  onClick={() => setMode("view")}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Caption display */}
              {video.caption && (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-white/30 mb-1.5">
                    Caption
                  </p>
                  <p className="text-sm text-white/65 leading-relaxed whitespace-pre-wrap break-words">
                    {video.caption}
                  </p>
                </div>
              )}

              {/* Hashtags display */}
              {video.hashtags && video.hashtags.length > 0 && (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-white/30 mb-1.5">
                    Hashtags
                  </p>
                  <p className="text-[11px] text-white/40 font-mono leading-relaxed">
                    {video.hashtags.join(" ")}
                  </p>
                </div>
              )}

              <Separator className="bg-white/[0.06]" />

              {/* Actions */}
              {!isApproved && !isRejected && (
                <div className="flex flex-col gap-2">
                  <Button
                    size="sm"
                    className="bg-[#C026D3] hover:bg-[#a21caf] text-white border-0"
                    onClick={() => onApprove(video.id)}
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-white/40 hover:text-white/60 hover:bg-white/5 gap-1.5"
                    onClick={() => setMode("edit")}
                  >
                    <Edit3 className="size-3.5" />
                    Edit caption
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-400/70 hover:text-red-400 hover:bg-red-500/10 gap-1.5"
                    onClick={() => setMode("reject")}
                  >
                    <XCircle className="size-3.5" />
                    Reject
                  </Button>
                </div>
              )}

              {isRejected && (
                <Button
                  size="sm"
                  className="bg-[#C026D3] hover:bg-[#a21caf] text-white border-0 gap-1.5 w-full"
                  onClick={() => onRegenerate(video.id)}
                >
                  <RefreshCw className="size-3.5" />
                  Regenerate
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
