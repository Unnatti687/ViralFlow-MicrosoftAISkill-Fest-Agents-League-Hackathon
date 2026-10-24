"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { MessageBubble } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";
import { SetupProgressPanel } from "./SetupProgressPanel";
import { DetectedInfoPanel } from "./DetectedInfoPanel";
import {
  sendChatMessage,
  saveBrandCard,
  generateVoiceSummary,
  type Message,
  type ExtractionState,
} from "@/lib/api";

const INITIAL_STATE: ExtractionState = {
  collected: {},
  status: "in_progress",
  card: null,
};

const CHIPS = [
  "I run a B2B SaaS startup",
  "E-commerce fashion brand",
  "Fitness & wellness creator",
  "Food & recipe blog",
];

export function ChatInterface() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [extractionState, setExtractionState] = useState<ExtractionState>(INITIAL_STATE);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedCardId, setSavedCardId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const hasStarted = messages.some((m) => m.role === "user");

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const send = useCallback(async (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if (!text || isLoading || savedCardId) return;

    const userMessage: Message = { role: "user", content: text };
    const nextHistory = [...messages, userMessage];

    setMessages(nextHistory);
    setInput("");
    setIsLoading(true);
    setError(null);

    try {
      const result = await sendChatMessage(nextHistory, extractionState);
      setExtractionState(result.extractionState);
      setMessages([...nextHistory, { role: "assistant", content: result.reply }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Try again.");
    } finally {
      setIsLoading(false);
      textareaRef.current?.focus();
    }
  }, [input, isLoading, messages, extractionState, savedCardId]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const handleSaveAndContinue = async () => {
    if (!extractionState.card || isSaving) return;
    setIsSaving(true);
    setError(null);
    try {
      const saved = await saveBrandCard(extractionState.card);
      setSavedCardId(saved.id);
      setExtractionState((s) => ({ ...s, status: "saved" }));
      generateVoiceSummary(saved.id).catch(() => {});
      router.push(`/strategy?brandCardId=${saved.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed. Try again.");
      setIsSaving(false);
    }
  };

  const showCard =
    (extractionState.status === "confirming" || extractionState.status === "saved") &&
    extractionState.card;

  const inputBox = (
    <div className="max-w-2xl mx-auto relative">
      <Textarea
        ref={textareaRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={savedCardId ? "Brand saved! Click Generate Strategy above." : "Tell me about your brand…"}
        disabled={isLoading || !!savedCardId}
        rows={2}
        className="min-h-14 max-h-40 resize-none rounded-full px-6 pr-16 py-4 text-base leading-relaxed"
      />
      <Button
        onClick={() => send()}
        disabled={!input.trim() || isLoading || !!savedCardId}
        size="icon"
        className="absolute right-3 bottom-3 rounded-full size-9"
      >
        <Send className="size-4" />
      </Button>
    </div>
  );

  const centerContent = !hasStarted ? (
    <div className="flex flex-1 min-w-0 flex-col items-center justify-center h-full px-4 gap-8">
      <div className="text-center space-y-3">
        <h2 className="text-5xl font-semibold tracking-tight leading-tight">
          Your{" "}
          <em className="text-[#FF1493] not-italic" style={{ fontStyle: "italic" }}>brand</em>
          ,{" "}
          viral-ready
          .
        </h2>
        <p className="text-muted-foreground text-sm">Just talk. We handle the rest.</p>
      </div>

      <div className="w-full max-w-2xl space-y-4">
        {inputBox}

        <div className="flex flex-wrap justify-center gap-2">
          {CHIPS.map((chip) => (
            <button
              key={chip}
              onClick={() => send(chip)}
              className="rounded-full border border-border bg-muted/50 px-4 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {chip}
            </button>
          ))}
        </div>
      </div>
    </div>
  ) : (
    <div className="flex flex-col flex-1 h-full min-w-0">
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4">
        <div className="max-w-2xl mx-auto py-6 space-y-5">
          {messages.map((msg, i) => (
            <MessageBubble key={i} message={msg} />
          ))}

          {isLoading && (
            <div className="py-1">
              <TypingIndicator />
            </div>
          )}

          {error && (
            <div className="text-sm text-destructive text-center py-2">{error}</div>
          )}
        </div>
      </div>

      <div className="relative -mt-12 h-12 pointer-events-none bg-gradient-to-t from-background to-transparent" />

      <div className="bg-background px-4 pb-10 pt-3">
        {inputBox}
      </div>
    </div>
  );

  return (
    <div className="flex h-full">
      <aside
        className={`hidden lg:block shrink-0 overflow-hidden transition-all duration-500 ease-out ${
          hasStarted ? "w-72 opacity-100" : "w-0 opacity-0"
        }`}
      >
        <div className="w-64 mt-20 mb-6 mx-4 rounded-2xl border border-border/50 bg-background/60 backdrop-blur-sm shadow-lg overflow-y-auto" style={{ height: "calc(100vh - 6.5rem)" }}>
          <SetupProgressPanel extractionState={extractionState} />
        </div>
      </aside>

      {centerContent}

      <aside
        className={`hidden lg:block shrink-0 overflow-hidden transition-all duration-500 ease-out ${
          hasStarted ? "w-72 opacity-100" : "w-0 opacity-0"
        }`}
      >
        <div className="w-64 mt-20 mb-4 mx-4 rounded-2xl border border-border/50 bg-background/60 backdrop-blur-sm shadow-lg">
          <DetectedInfoPanel
            extractionState={extractionState}
            canSave={!!showCard}
            isSaving={isSaving}
            saved={!!savedCardId}
            onSaveAndContinue={handleSaveAndContinue}
          />
        </div>
      </aside>
    </div>
  );
}
