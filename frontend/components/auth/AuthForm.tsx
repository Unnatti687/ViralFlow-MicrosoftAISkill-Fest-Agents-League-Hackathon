"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login, signup } from "@/lib/api";
import { cn } from "@/lib/utils";
import { FaInstagram } from "react-icons/fa";

type Mode = "login" | "signup";

export function AuthForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [instagramId, setInstagramId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "login") {
        await login(instagramId, password);
      } else {
        await signup(instagramId, password);
      }
      router.push("/onboarding");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex w-full max-w-sm flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-semibold">Welcome to ViralFlow</h1>
        <p className="text-sm text-muted-foreground">
          {mode === "login" ? "Log in to continue" : "Create an account to get started"}
        </p>
      </div>

      <button
        type="button"
        disabled
        title="Mock only — Instagram login is simulated for now"
        className="flex items-center justify-center gap-2 rounded-lg bg-gradient-to-tr from-amber-400 via-pink-500 to-purple-600 px-4 py-2 text-sm font-medium text-white opacity-90 cursor-not-allowed"
      >
        <FaInstagram className="size-4" />
        Continue with Instagram
      </button>

      <div className="flex items-center gap-2">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">or</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="instagram_id">Instagram ID</Label>
          <Input
            id="instagram_id"
            placeholder="yourusername"
            value={instagramId}
            onChange={(e) => setInstagramId(e.target.value)}
            required
            autoComplete="username"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete={mode === "login" ? "current-password" : "new-password"}
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button type="submit" disabled={loading} className="h-9 w-full">
          {loading ? "Please wait…" : mode === "login" ? "Log in" : "Sign up"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
        <button
          type="button"
          onClick={() => {
            setError(null);
            setMode(mode === "login" ? "signup" : "login");
          }}
          className={cn("font-medium text-primary hover:underline")}
        >
          {mode === "login" ? "Sign up" : "Log in"}
        </button>
      </p>
    </div>
  );
}
