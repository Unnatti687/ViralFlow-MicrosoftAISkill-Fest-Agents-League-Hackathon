"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CalendarSlot } from "@/lib/api";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const CONTENT_ANGLES = ["educational", "story", "opinion", "social_proof", "listicle"];

interface AddSlotDialogProps {
  open: boolean;
  defaultDay?: string;
  weekDates: Record<string, string>;
  onClose: () => void;
  onAdd: (slot: Omit<CalendarSlot, "_clientId">) => void;
}

const EMPTY: Omit<CalendarSlot, "_clientId"> = {
  day: "",
  date: "",
  platform: "Instagram",
  post_type: "reel",
  topic: "",
  content_angle: "",
  suggested_time: "10:00 AM",
  target_duration_seconds: 30,
  rationale: "",
  status: "pending_generation",
};

export function AddSlotDialog({
  open,
  defaultDay,
  weekDates,
  onClose,
  onAdd,
}: AddSlotDialogProps) {
  const [form, setForm] = useState<Omit<CalendarSlot, "_clientId">>({
    ...EMPTY,
    day: defaultDay ?? "",
    date: defaultDay ? (weekDates[defaultDay] ?? "") : "",
  });

  const set = (k: keyof typeof form, v: string | number) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const handleDayChange = (day: string) => {
    setForm((prev) => ({ ...prev, day, date: weekDates[day] ?? "" }));
  };

  const handleSubmit = () => {
    if (!form.day || !form.topic || !form.content_angle) return;
    onAdd(form);
    setForm({ ...EMPTY, day: defaultDay ?? "", date: defaultDay ? (weekDates[defaultDay] ?? "") : "" });
    onClose();
  };

  const isValid = !!form.day && !!form.topic.trim() && !!form.content_angle;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add slot</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          {/* Day */}
          <div className="grid grid-cols-3 items-center gap-3">
            <Label className="text-right text-sm">Day</Label>
            <div className="col-span-2">
              <Select value={form.day} onValueChange={handleDayChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select day" />
                </SelectTrigger>
                <SelectContent>
                  {DAYS.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                      {weekDates[d] ? ` — ${new Date(weekDates[d] + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Content angle */}
          <div className="grid grid-cols-3 items-center gap-3">
            <Label className="text-right text-sm">Angle</Label>
            <div className="col-span-2">
              <Select value={form.content_angle} onValueChange={(v) => set("content_angle", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Content angle" />
                </SelectTrigger>
                <SelectContent>
                  {CONTENT_ANGLES.map((a) => (
                    <SelectItem key={a} value={a}>
                      {a.replace("_", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Topic */}
          <div className="grid grid-cols-3 items-start gap-3">
            <Label className="text-right text-sm pt-2">Topic</Label>
            <Textarea
              className="col-span-2 resize-none"
              rows={3}
              placeholder="Specific, opinionated topic…"
              value={form.topic}
              onChange={(e) => set("topic", e.target.value)}
            />
          </div>

          {/* Suggested time */}
          <div className="grid grid-cols-3 items-center gap-3">
            <Label className="text-right text-sm">Post time</Label>
            <Input
              className="col-span-2"
              placeholder="10:00 AM"
              value={form.suggested_time}
              onChange={(e) => set("suggested_time", e.target.value)}
            />
          </div>

          {/* Duration */}
          <div className="grid grid-cols-3 items-center gap-3">
            <Label className="text-right text-sm">Duration (s)</Label>
            <Input
              className="col-span-2"
              type="number"
              min={5}
              max={90}
              placeholder="30"
              value={form.target_duration_seconds}
              onChange={(e) => set("target_duration_seconds", Number(e.target.value))}
            />
          </div>

          {/* Rationale */}
          <div className="grid grid-cols-3 items-start gap-3">
            <Label className="text-right text-sm pt-2">Rationale</Label>
            <Textarea
              className="col-span-2 resize-none"
              rows={2}
              placeholder="Why this post?"
              value={form.rationale}
              onChange={(e) => set("rationale", e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid}>
            Add slot
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
