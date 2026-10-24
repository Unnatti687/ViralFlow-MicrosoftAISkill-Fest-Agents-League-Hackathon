"use client";

import { Button } from "@/components/ui/button";
import { ScheduledPostCard } from "./ScheduledPostCard";
import type { ScheduledPost } from "@/lib/api";

interface ScheduledPostListProps {
  posts: ScheduledPost[];
  onRetry: (id: string) => void;
}

export function ScheduledPostList({ posts, onRetry }: ScheduledPostListProps) {
  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <p className="text-muted-foreground text-sm">No scheduled posts yet.</p>
        <Button
          variant="outline"
          className="border-white/10 text-white/60 hover:bg-white/5"
          onClick={() => (window.location.href = "/videos")}
        >
          Back to Videos
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
      {posts.map((post) => (
        <ScheduledPostCard key={post.id} post={post} onRetry={onRetry} />
      ))}
    </div>
  );
}
