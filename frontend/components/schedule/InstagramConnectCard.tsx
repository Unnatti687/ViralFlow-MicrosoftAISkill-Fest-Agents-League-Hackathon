"use client";

import { AlertTriangle, RefreshCw, CheckCircle2 } from "lucide-react";
import { FaInstagram } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getInstagramOAuthStartUrl, refreshInstagramToken } from "@/lib/api";
import type { InstagramStatus } from "@/lib/api";

interface InstagramConnectCardProps {
  status: InstagramStatus | null;
  onTokenRefreshed: (expiresAt: string) => void;
}

export function InstagramConnectCard({ status, onTokenRefreshed }: InstagramConnectCardProps) {
  const connect = () => {
    window.location.href = getInstagramOAuthStartUrl();
  };

  const handleRefresh = async () => {
    try {
      const result = await refreshInstagramToken();
      onTokenRefreshed(result.expires_at);
    } catch (err) {
      console.error("Token refresh failed:", err);
    }
  };

  if (!status?.connected) {
    return (
      <div className="flex items-center justify-between rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
        <div className="flex items-center gap-3">
          <FaInstagram className="size-6 text-white/30" />
          <div>
            <p className="text-sm font-medium text-white/80">Instagram not connected</p>
            <p className="text-xs text-white/35">Connect an account to publish scheduled Reels.</p>
          </div>
        </div>
        <Button
          className="gap-2 bg-[#C026D3] hover:bg-[#a21caf] text-white border-0"
          onClick={connect}
        >
          <FaInstagram className="size-4" />
          Connect Instagram
        </Button>
      </div>
    );
  }

  const expiresAt = status.expires_at ? new Date(status.expires_at) : null;
  const expiresStr = expiresAt
    ? expiresAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "unknown";

  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-xl border p-4",
        status.needs_reauth
          ? "border-red-500/25 bg-red-500/[0.04]"
          : "border-white/[0.07] bg-white/[0.02]"
      )}
    >
      <div className="flex items-center gap-3">
        <FaInstagram className={cn("size-6", status.needs_reauth ? "text-red-400" : "text-fuchsia-400")} />
        <div>
          <p className="text-sm font-medium text-white/80 flex items-center gap-1.5">
            @{status.account_name ?? status.ig_user_id}
            {!status.needs_reauth && <CheckCircle2 className="size-3.5 text-green-400" />}
          </p>
          <p className="text-xs text-white/35 font-mono">Token expires {expiresStr}</p>
        </div>
      </div>

      {status.needs_reauth ? (
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-xs text-red-300">
            <AlertTriangle className="size-3.5" />
            Reauth required — publishing paused
          </span>
          <Button
            className="gap-2 bg-[#C026D3] hover:bg-[#a21caf] text-white border-0"
            onClick={connect}
          >
            <FaInstagram className="size-4" />
            Reconnect
          </Button>
        </div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          className="gap-2 border-white/10 text-white/60 hover:bg-white/5"
          onClick={handleRefresh}
        >
          <RefreshCw className="size-3.5" />
          Refresh token
        </Button>
      )}
    </div>
  );
}
