const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";

function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  return fetch(url, { ...options, credentials: "include" });
}

// ─── Auth ───────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  instagram_id: string;
  created_at: string;
}

export async function signup(instagramId: string, password: string): Promise<{ user: AuthUser }> {
  const res = await apiFetch(`${BASE_URL}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ instagram_id: instagramId, password }),
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? `Signup failed: ${res.status}`);
  return res.json();
}

export async function login(instagramId: string, password: string): Promise<{ user: AuthUser }> {
  const res = await apiFetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ instagram_id: instagramId, password }),
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? `Login failed: ${res.status}`);
  return res.json();
}

export async function logout(): Promise<{ success: boolean }> {
  const res = await apiFetch(`${BASE_URL}/auth/logout`, { method: "POST" });
  if (!res.ok) throw new Error(`Logout failed: ${res.status}`);
  return res.json();
}

export async function getMe(): Promise<{ user: AuthUser } | null> {
  const res = await apiFetch(`${BASE_URL}/auth/me`);
  if (res.status === 401) return null;
  if (!res.ok) throw new Error(`Fetch user failed: ${res.status}`);
  return res.json();
}

export interface Message {
  role: "user" | "assistant";
  content: string;
}

export interface ExtractionState {
  collected: Record<string, string | null>;
  status: "in_progress" | "confirming" | "saved";
  card?: BrandCard | null;
}

export interface BrandCard {
  id?: string;
  brand: { name: string; niche: string; description: string; language: string };
  audience: { description: string; region?: string };
  tone: string;
  platforms: string[];
  goal: string;
  preferred_voice: string;
  content_guidelines: { avoid_topics: string[]; custom_instructions: string };
  brand_voice_summary?: string;
}

export async function sendChatMessage(
  conversationHistory: Message[],
  extractionState: ExtractionState
): Promise<{ reply: string; extractionState: ExtractionState; card: BrandCard | null }> {
  const res = await apiFetch(`${BASE_URL}/onboarding/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ conversationHistory, extractionState }),
  });
  if (!res.ok) throw new Error(`Chat failed: ${res.status}`);
  return res.json();
}

export async function saveBrandCard(card: BrandCard): Promise<BrandCard & { id: string }> {
  const res = await apiFetch(`${BASE_URL}/brand-cards`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(card),
  });
  if (!res.ok) throw new Error(`Save failed: ${res.status}`);
  return res.json();
}

export async function getBrandCard(id: string): Promise<BrandCard & { id: string }> {
  const res = await apiFetch(`${BASE_URL}/brand-cards/${id}`);
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
  return res.json();
}

export async function getMyBrandCard(): Promise<(BrandCard & { id: string }) | null> {
  const res = await apiFetch(`${BASE_URL}/brand-cards/me`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
  return res.json();
}

export async function generateVoiceSummary(id: string): Promise<BrandCard & { id: string }> {
  const res = await apiFetch(`${BASE_URL}/brand-cards/${id}/voice-summary`, { method: "POST" });
  if (!res.ok) throw new Error(`Voice summary failed: ${res.status}`);
  return res.json();
}

export interface CalendarSlot {
  _clientId: string;
  id?: string;
  day: string;
  date: string;
  platform: string;
  post_type: string;
  topic: string;
  content_angle: string;
  suggested_time: string;
  target_duration_seconds: number;
  rationale: string;
  status: string;
}

export async function generateStrategy(
  brandCardId: string,
  strategyRules?: object,
  insights?: object
): Promise<{ slots: Omit<CalendarSlot, "_clientId">[]; mode: "A" | "B" }> {
  const res = await apiFetch(`${BASE_URL}/strategy/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      brand_card_id: brandCardId,
      strategy_rules: strategyRules,
      insights,
    }),
  });
  if (!res.ok) throw new Error(`Strategy generation failed: ${res.status}`);
  return res.json();
}

export async function getStrategySlots(
  brandCardId: string
): Promise<{ slots: Omit<CalendarSlot, "_clientId">[]; mode: "A" | "B" | null }> {
  const res = await apiFetch(`${BASE_URL}/strategy/slots?brand_card_id=${brandCardId}`);
  if (!res.ok) throw new Error(`Fetching saved strategy failed: ${res.status}`);
  return res.json();
}

export async function saveStrategySlots(
  brandCardId: string,
  slots: CalendarSlot[],
  mode: "A" | "B" | null
): Promise<{ slots: Omit<CalendarSlot, "_clientId">[]; mode: "A" | "B" | null }> {
  const res = await apiFetch(`${BASE_URL}/strategy/slots`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      brand_card_id: brandCardId,
      slots: slots.map(({ _clientId, ...rest }) => rest),
      mode,
    }),
  });
  if (!res.ok) throw new Error(`Saving strategy failed: ${res.status}`);
  return res.json();
}

export async function regenerateSlot(
  brandCardId: string,
  slot: CalendarSlot
): Promise<Omit<CalendarSlot, "_clientId">> {
  const res = await apiFetch(`${BASE_URL}/strategy/slots/regenerate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ brand_card_id: brandCardId, slot }),
  });
  if (!res.ok) throw new Error(`Slot regeneration failed: ${res.status}`);
  return res.json();
}

// ─── Slice 3: Videos ───────────────────────────────────────────────────────

export interface VideoScript {
  narration_script: string;
  caption: string;
  cta: string;
  hashtags: string[];
  footage_keywords: string[];
}

export type VideoStatus =
  | "script_ready"
  | "rendering"
  | "render_complete"
  | "under_review"
  | "approved"
  | "rejected"
  | "failed";

export interface GeneratedVideo {
  id: string;
  user_id: string;
  brand_card_id: string;
  slot_data: CalendarSlot;
  script: VideoScript | null;
  mpt_task_id: string | null;
  video_url: string | null;
  caption: string | null;
  hashtags: string[] | null;
  status: VideoStatus;
  parent_video_id: string | null;
  version: number;
  review_note: string | null;
  created_at: string;
  updated_at: string;
}

export async function generateVideo(
  brandCardId: string,
  slot: CalendarSlot
): Promise<GeneratedVideo> {
  const res = await apiFetch(`${BASE_URL}/videos/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ brandCardId, slot }),
  });
  if (!res.ok) throw new Error(`Generate failed: ${res.status}`);
  return res.json();
}

export async function getVideoStatus(id: string): Promise<GeneratedVideo> {
  const res = await apiFetch(`${BASE_URL}/videos/${id}/status`);
  if (!res.ok) throw new Error(`Status fetch failed: ${res.status}`);
  return res.json();
}

export async function listVideos(): Promise<GeneratedVideo[]> {
  const res = await apiFetch(`${BASE_URL}/videos`);
  if (!res.ok) throw new Error(`List videos failed: ${res.status}`);
  return res.json();
}

export async function approveVideo(
  id: string
): Promise<{ success: boolean; scheduled_post: ScheduledPost }> {
  const res = await apiFetch(`${BASE_URL}/videos/${id}/approve`, { method: "POST" });
  if (!res.ok) throw new Error(`Approve failed: ${res.status}`);
  return res.json();
}

export async function rejectVideo(id: string): Promise<{ success: boolean }> {
  const res = await apiFetch(`${BASE_URL}/videos/${id}/reject`, { method: "POST" });
  if (!res.ok) throw new Error(`Reject failed: ${res.status}`);
  return res.json();
}

export async function regenerateVideo(
  id: string,
  note?: string
): Promise<GeneratedVideo> {
  const res = await apiFetch(`${BASE_URL}/videos/${id}/regenerate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ note }),
  });
  if (!res.ok) throw new Error(`Regenerate failed: ${res.status}`);
  return res.json();
}

export async function updateVideoCaption(
  id: string,
  caption: string,
  hashtags: string[]
): Promise<GeneratedVideo> {
  const res = await apiFetch(`${BASE_URL}/videos/${id}/caption`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ caption, hashtags }),
  });
  if (!res.ok) throw new Error(`Caption update failed: ${res.status}`);
  return res.json();
}

// ─── Slice 4: Scheduler & Publisher ────────────────────────────────────────

export interface InstagramStatus {
  connected: boolean;
  account_name?: string;
  ig_user_id?: string;
  expires_at?: string;
  needs_reauth?: boolean;
}

export type ScheduledPostStatus = "scheduled" | "publishing" | "posted" | "failed";

export interface ScheduledPost {
  id: string;
  user_id: string;
  video_id: string;
  public_video_url: string;
  caption: string;
  scheduled_time: string;
  ig_container_id: string | null;
  instagram_media_id: string | null;
  status: ScheduledPostStatus;
  error_message: string | null;
  published_at: string | null;
  retry_count: number;
  created_at: string;
  updated_at: string;
  video_url: string;
  hashtags: string[] | null;
}

export function getInstagramOAuthStartUrl(): string {
  return `${BASE_URL}/instagram/oauth/start`;
}

export async function getInstagramStatus(): Promise<InstagramStatus> {
  const res = await apiFetch(`${BASE_URL}/instagram/status`);
  if (!res.ok) throw new Error(`Instagram status fetch failed: ${res.status}`);
  return res.json();
}

export async function refreshInstagramToken(): Promise<{ success: boolean; expires_at: string }> {
  const res = await apiFetch(`${BASE_URL}/instagram/token/refresh`, { method: "POST" });
  if (!res.ok) throw new Error(`Token refresh failed: ${res.status}`);
  return res.json();
}

export async function listSchedule(): Promise<ScheduledPost[]> {
  const res = await apiFetch(`${BASE_URL}/schedule`);
  if (!res.ok) throw new Error(`Schedule fetch failed: ${res.status}`);
  return res.json();
}

export async function retrySchedulePost(
  id: string
): Promise<{ success: boolean; scheduled_post: ScheduledPost }> {
  const res = await apiFetch(`${BASE_URL}/schedule/${id}/retry`, { method: "POST" });
  if (!res.ok) throw new Error(`Retry failed: ${res.status}`);
  return res.json();
}

// ─── Slice 5: Analytics & Optimization ─────────────────────────────────────

export interface CommentSentimentSample {
  text: string;
  username: string;
  label: "positive" | "neutral" | "negative";
}

export interface CommentSentiment {
  positive: number;
  neutral: number;
  negative: number;
  samples: CommentSentimentSample[];
}

export interface ReelAnalytics {
  id: string;
  user_id: string;
  video_id: string;
  scheduled_post_id: string | null;
  instagram_media_id: string;
  views: number | null;
  reach: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  saved: number | null;
  reposts: number | null;
  total_interactions: number | null;
  reels_skip_rate: number | null;
  ig_reels_avg_watch_time: number | null;
  engagement_rate: number | null;
  vs_baseline: number | null;
  save_share_ratio: number | null;
  retention: number | null;
  comment_sentiment: CommentSentiment | null;
  is_mock: boolean;
  collected_at: string;
}

export async function getAnalytics(videoId: string): Promise<ReelAnalytics | null> {
  const res = await apiFetch(`${BASE_URL}/analytics/${videoId}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Analytics fetch failed: ${res.status}`);
  return res.json();
}

export async function collectAnalytics(
  brandCardId: string
): Promise<{ collected: number; analytics: ReelAnalytics[]; optimize_result: OptimizeResult }> {
  const res = await apiFetch(`${BASE_URL}/analytics/collect/${brandCardId}`, { method: "POST" });
  if (!res.ok) throw new Error(`Analytics collection failed: ${res.status}`);
  return res.json();
}

export interface InsightItem {
  observation: string;
  evidence: string;
  confidence: "high" | "medium" | "low";
}

export interface UnderperformingItem {
  pattern: string;
  evidence: string;
  action: string;
}

export interface StrategyVersion {
  id: string;
  user_id: string;
  brand_card_id: string;
  cycle_number: number;
  strategy_rules: Record<string, unknown>;
  insights: { insights: InsightItem[]; underperforming: UnderperformingItem[] } | null;
  source: "agent" | "user_override";
  is_active: boolean;
  created_at: string;
}

export type OptimizeResult =
  | { status: "not_enough_data"; message: string; reel_count: number }
  | {
      status: "ok";
      cycle_number: number;
      insights: InsightItem[];
      underperforming: UnderperformingItem[];
      current_strategy_rules: Record<string, unknown> | null;
      updated_strategy_rules: Record<string, unknown>;
      strategy_version: StrategyVersion;
      performance_report: object | null;
      already_accepted?: boolean;
    };

export async function runOptimization(brandCardId: string): Promise<OptimizeResult> {
  const res = await apiFetch(`${BASE_URL}/internal/optimize`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ brand_card_id: brandCardId }),
  });
  if (!res.ok) throw new Error(`Optimization failed: ${res.status}`);
  return res.json();
}

export async function getLatestOptimization(brandCardId: string): Promise<OptimizeResult | null> {
  const res = await apiFetch(`${BASE_URL}/internal/optimize/latest?brand_card_id=${brandCardId}`);
  if (!res.ok) throw new Error(`Fetching latest optimization failed: ${res.status}`);
  return res.json();
}

export async function activateStrategyVersion(
  id: string
): Promise<{ success: boolean; strategy_version: StrategyVersion }> {
  const res = await apiFetch(`${BASE_URL}/strategy/versions/${id}/activate`, { method: "POST" });
  if (!res.ok) throw new Error(`Activate failed: ${res.status}`);
  return res.json();
}

export async function overrideStrategyVersion(
  id: string,
  strategyRules: Record<string, unknown>
): Promise<{ success: boolean; strategy_version: StrategyVersion }> {
  const res = await apiFetch(`${BASE_URL}/strategy/versions/${id}/override`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ strategy_rules: strategyRules }),
  });
  if (!res.ok) throw new Error(`Override failed: ${res.status}`);
  return res.json();
}

// ─── (demo) Instant publish + analyze ──────────────────────────────────────

export interface PublishDemoResult {
  success: boolean;
  scheduled_post: ScheduledPost;
  analytics: ReelAnalytics[];
  optimize_result: OptimizeResult;
}

export interface PublishAllDemoResult {
  success: boolean;
  published: number;
  analytics: ReelAnalytics[];
  optimize_result: OptimizeResult;
}

export async function publishVideoDemo(id: string): Promise<PublishDemoResult> {
  const res = await apiFetch(`${BASE_URL}/videos/${id}/publish-demo`, { method: "POST" });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? `(demo) publish failed: ${res.status}`);
  return res.json();
}

export async function publishAllDemo(brandCardId: string): Promise<PublishAllDemoResult> {
  const res = await apiFetch(`${BASE_URL}/videos/publish-all-demo`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ brandCardId }),
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? `(demo) publish all failed: ${res.status}`);
  return res.json();
}
