import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const WORKER_SECRET = Deno.env.get("NOTIFICATION_WORKER_SECRET") || SERVICE_ROLE_KEY;
const API_FOOTBALL_KEY = Deno.env.get("API_FOOTBALL_KEY") || "";
const GNEWS_API_KEY = Deno.env.get("GNEWS_API_KEY") || "";
const db = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
const footballBase = "https://v3.football.api-sports.io";
const expoPushUrl = "https://exp.host/--/api/v2/push/send";
const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Worker-Secret" };

type Candidate = { key: string; type: string; fixtureId?: number; teamId?: number; playerId?: number; minute?: number; preference: string; title: { ar: string; en: string }; body: { ar: string; en: string }; payload: Record<string, unknown>; topicName?: string; targetId?: string; language?: "ar" | "en" };

type Recipient = { userId: string; tokenId: string; token: string; language: "ar" | "en" };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (req.method !== "POST") return respond({ error: "method_not_allowed" }, 405);
  if (!authorized(req)) return respond({ error: "unauthorized" }, 401);
  try { return respond(await runWorker(), 200); }
  catch (error) { console.error("notification-worker", error instanceof Error ? error.message : "unknown"); return respond({ error: "worker_failed" }, 500); }
});

function authorized(req: Request) {
  const provided = req.headers.get("x-worker-secret") || req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || "";
  return Boolean(WORKER_SECRET && provided && provided === WORKER_SECRET);
}

async function runWorker() {
  if (!SERVICE_ROLE_KEY) throw new Error("missing_service_role_key");
  const candidates = [...(API_FOOTBALL_KEY ? await detectFixtureEvents() : []), ...(GNEWS_API_KEY ? await detectNewsEvents() : [])];
  let newEvents = 0; let delivered = 0;
  for (const candidate of candidates) {
    const { data: event, error } = await db.from("notification_events").insert({ event_key: candidate.key, fixture_id: candidate.fixtureId ?? null, event_type: candidate.type, team_id: candidate.teamId ?? null, player_id: candidate.playerId ?? null, minute: candidate.minute ?? null, payload: candidate.payload }).select("id").maybeSingle();
    if (error?.code === "23505" || !event) continue;
    if (error) throw error;
    newEvents++;
    delivered += await deliver(candidate, event.id);
  }
  return { ok: true, detected: candidates.length, newEvents, delivered };
}

async function detectFixtureEvents(): Promise<Candidate[]> {
  const { data: favoriteMatches } = await db.from("favorite_matches").select("match_id").limit(100);
  const { data: favoriteTeams } = await db.from("favorite_teams").select("team_id").limit(100);
  const { data: favoriteLeagues } = await db.from("favorite_leagues").select("league_id").limit(100);
  const ids = new Set<number>();
  for (const row of favoriteMatches || []) { const id = Number(row.match_id); if (id) ids.add(id); }
  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  for (const row of favoriteTeams || []) {
    const team = Number(row.team_id); if (!team) continue;
    const data = await footballFetch("/fixtures", { team, from: today, to: tomorrow, status: "NS-LIVE-1H-HT-2H-ET-PEN-FT-AET-PEN" });
    for (const fixture of data.response || []) if (fixture.fixture?.id) ids.add(Number(fixture.fixture.id));
  }
  for (const row of favoriteLeagues || []) {
    const league = Number(row.league_id); if (!league) continue;
    const data = await footballFetch("/fixtures", { league, season: currentSeason(), from: today, to: tomorrow, status: "NS-LIVE-1H-HT-2H-ET-PEN-FT-AET-PEN" });
    for (const fixture of data.response || []) if (fixture.fixture?.id) ids.add(Number(fixture.fixture.id));
  }
  const out: Candidate[] = [];
  for (const fixtureId of Array.from(ids).slice(0, 100)) {
    const data = await footballFetch("/fixtures", { id: fixtureId });
    const fixture = data.response?.[0]; if (!fixture) continue;
    const status = String(fixture.fixture?.status?.short || "");
    const home = fixture.teams?.home || {}; const away = fixture.teams?.away || {};
    const label = `${home.name || "Home"} × ${away.name || "Away"}`;
    const base = { fixtureId, payload: { type: "match", fixtureId, homeTeamId: home.id, awayTeamId: away.id, leagueId: fixture.league?.id, url: `/match/${fixtureId}` }, targetId: String(fixtureId) };
    const baselineKey = `fixture_${fixtureId}_baseline`;
    const { data: baseline } = await db.from("notification_events").select("id").eq("event_key", baselineKey).maybeSingle();
    if (!baseline && ["1H", "2H", "ET", "P", "HT"].includes(status)) {
      await db.from("notification_events").insert({ event_key: baselineKey, fixture_id: fixtureId, event_type: "baseline", payload: { status, homeGoals: fixture.goals?.home ?? 0, awayGoals: fixture.goals?.away ?? 0, elapsed: fixture.fixture?.status?.elapsed ?? null } });
      continue;
    }
    if (["1H", "2H", "ET", "P"].includes(status)) out.push({ ...base, key: `fixture_${fixtureId}_start`, type: "match_start", preference: "match_start", title: { ar: "بدأت المباراة ⚽", en: "Match Started ⚽" }, body: { ar: `${label} بدأت الآن`, en: `${label} has started` } });
    if (status === "HT") out.push({ ...base, key: `fixture_${fixtureId}_half_time`, type: "half_time", preference: "half_time", title: { ar: "نهاية الشوط الأول", en: "Half Time" }, body: { ar: `${label} انتهى شوطها الأول`, en: `${label} reached half time` } });
    if (["FT", "AET", "PEN"].includes(status)) out.push({ ...base, key: `fixture_${fixtureId}_end_${fixture.goals?.home ?? 0}_${fixture.goals?.away ?? 0}`, type: "match_end", preference: "match_end", title: { ar: "نهاية المباراة", en: "Full Time" }, body: { ar: `${label} ${fixture.goals?.home ?? 0} - ${fixture.goals?.away ?? 0}`, en: `${label} ${fixture.goals?.home ?? 0} - ${fixture.goals?.away ?? 0}` } });
    if (["PST", "CANC", "SUSP"].includes(status)) out.push({ ...base, key: `fixture_${fixtureId}_${status}`, type: status === "PST" ? "postponed" : status === "CANC" ? "cancelled" : "suspended", preference: "match_start", title: { ar: "تحديث على المباراة", en: "Match Update" }, body: { ar: `${label}: تم تحديث حالة المباراة`, en: `${label}: match status updated` } });
    if (["1H", "2H", "ET", "P"].includes(status)) {
      const events = await footballFetch("/fixtures/events", { fixture: fixtureId });
      for (const item of events.response || []) {
        const minute = Number(item.time?.elapsed || 0); const teamId = Number(item.team?.id || 0) || undefined; const playerId = Number(item.player?.id || 0) || undefined;
        if (item.type === "Goal") out.push({ ...base, key: `fixture_${fixtureId}_goal_${item.id || `${teamId}_${playerId}_${minute}`}`, type: "goal", teamId, playerId, minute, preference: "goals", title: { ar: "هدف! ⚽", en: "GOAL! ⚽" }, body: { ar: `${label} ${fixture.goals?.home ?? 0} - ${fixture.goals?.away ?? 0}${item.player?.name ? ` — ${item.player.name}` : ""}`, en: `${label} ${fixture.goals?.home ?? 0} - ${fixture.goals?.away ?? 0}${item.player?.name ? ` — ${item.player.name}` : ""}` }});
        if (item.type === "Card" && /red/i.test(String(item.detail || ""))) out.push({ ...base, key: `fixture_${fixtureId}_red_${teamId}_${playerId}_${minute}`, type: "red_card", teamId, playerId, minute, preference: "red_cards", title: { ar: "بطاقة حمراء 🟥", en: "Red Card 🟥" }, body: { ar: `${item.player?.name || "لاعب"} تلقى بطاقة حمراء`, en: `${item.player?.name || "Player"} received a red card` } });
      }
    }
  }
  return out;
}

async function detectNewsEvents(): Promise<Candidate[]> {
  const topics: { name: string; type: string }[] = [];
  const { data: teams } = await db.from("favorite_teams").select("team_id,team_name").limit(200);
  const { data: leagues } = await db.from("favorite_leagues").select("league_id,league_name").limit(200);
  const { data: players } = await db.from("favorite_players").select("player_id,player_name").limit(200);
  for (const row of teams || []) if (row.team_name) topics.push({ name: String(row.team_name), type: "team" });
  for (const row of leagues || []) if (row.league_name) topics.push({ name: String(row.league_name), type: "league" });
  for (const row of players || []) if (row.player_name) topics.push({ name: String(row.player_name), type: "player" });
  const unique = Array.from(new Map(topics.map((topic) => [`${topic.type}:${topic.name}`, topic])).values()).slice(0, 100);
  const out: Candidate[] = [];
  for (const topic of unique) {
    for (const language of ["ar", "en"] as const) {
      const data = await gnewsFetch(topic.name, language);
    for (const article of (data.articles || []).slice(0, 5)) {
      const id = await stableId(article.url || `${article.title}:${article.source?.name}`);
      const text = `${article.title} ${article.description || ""}`;
      const transfer = /transfer|انتقال|صفقة|تعاقد/i.test(text);
        out.push({ key: `news_${id}_${language}`, type: transfer ? "transfer_news" : "breaking_news", preference: transfer ? "transfers" : topic.type === "team" ? "team_news" : topic.type === "player" ? "player_news" : "breaking_news", topicName: topic.name, language, title: { ar: transfer ? "تحديث انتقالات" : "خبر جديد", en: transfer ? "Transfer Update" : "Breaking News" }, body: { ar: language === "ar" ? article.title : article.title, en: language === "en" ? article.title : article.title }, payload: { type: transfer ? "transfer" : "news", articleId: id, url: article.url, topicName: topic.name, language }, targetId: id });
      }
    }
  }
  return out;
}

async function findRecipients(candidate: Candidate): Promise<Recipient[]> {
  const { data: tokens } = await db.from("push_tokens").select("id,user_id,token").limit(2000);
  if (!tokens?.length) return [];
  const userIds = Array.from(new Set(tokens.map((row: any) => row.user_id)));
  const { data: prefs } = await db.from("notification_preferences").select("user_id,match_start,goals,half_time,match_end,red_cards,team_news,player_news,transfers,breaking_news").in("user_id", userIds).limit(2000);
  const { data: profiles } = await db.from("profiles").select("id,language").in("id", userIds).limit(2000);
  const prefMap = new Map((prefs || []).map((row: any) => [row.user_id, row]));
  const languageMap = new Map((profiles || []).map((row: any) => [row.id, row.language === "en" ? "en" : "ar"]));
  const [favMatches, favTeams, favLeagues, favPlayers] = await Promise.all([
    db.from("favorite_matches").select("user_id,match_id").in("user_id", userIds).limit(5000),
    db.from("favorite_teams").select("user_id,team_id,team_name").in("user_id", userIds).limit(5000),
    db.from("favorite_leagues").select("user_id,league_id,league_name").in("user_id", userIds).limit(5000),
    db.from("favorite_players").select("user_id,player_id,player_name").in("user_id", userIds).limit(5000),
  ]);
  return (tokens as any[]).filter((token) => {
    const pref = prefMap.get(token.user_id) || {};
    if (pref[candidate.preference] === false) return false;
    const userLanguage = languageMap.get(token.user_id) || "ar";
    if (candidate.language && candidate.language !== userLanguage) return false;
    if (["breaking_news", "transfer_news"].includes(candidate.type)) {
      const name = String(candidate.topicName || "").toLowerCase();
      return [favTeams.data || [], favLeagues.data || [], favPlayers.data || []].some((rows: any[]) => rows.some((row) => row.user_id === token.user_id && String(row.team_name || row.league_name || row.player_name || "").toLowerCase() === name));
    }
    const fixtureId = Number(candidate.fixtureId || 0); const teamId = Number(candidate.teamId || 0); const homeTeamId = Number(candidate.payload?.homeTeamId || 0); const awayTeamId = Number(candidate.payload?.awayTeamId || 0); const leagueId = Number(candidate.payload?.leagueId || 0);
    return (favMatches.data || []).some((row: any) => row.user_id === token.user_id && Number(row.match_id) === fixtureId) || (favTeams.data || []).some((row: any) => row.user_id === token.user_id && [teamId, homeTeamId, awayTeamId].includes(Number(row.team_id))) || (favLeagues.data || []).some((row: any) => row.user_id === token.user_id && Number(row.league_id) === leagueId) || (favPlayers.data || []).some((row: any) => row.user_id === token.user_id && Number(row.player_id) === Number(candidate.playerId || 0));
  }).map((token: any) => ({ userId: token.user_id, tokenId: String(token.id), token: token.token, language: (languageMap.get(token.user_id) || "ar") as "ar" | "en" }));
}

async function deliver(candidate: Candidate, eventId: string) {
  const recipients = await findRecipients(candidate); if (!recipients.length) return 0;
  const rows = recipients.map((recipient) => ({ event_id: eventId, user_id: recipient.userId, push_token_id: recipient.tokenId, status: "queued" }));
  const { data: inserted } = await db.from("notification_deliveries").upsert(rows, { onConflict: "event_id,user_id,push_token_id", ignoreDuplicates: true }).select("user_id,push_token_id");
  const keys = new Set((inserted || []).map((row: any) => `${row.user_id}:${row.push_token_id}`));
  const fresh = recipients.filter((recipient) => keys.has(`${recipient.userId}:${recipient.tokenId}`)); let sent = 0;
  for (let i = 0; i < fresh.length; i += 100) {
    const batch = fresh.slice(i, i + 100);
    const response = await fetch(expoPushUrl, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(batch.map((recipient) => ({ to: recipient.token, title: candidate.title[recipient.language], body: candidate.body[recipient.language], sound: "default", channelId: candidate.type === "goal" ? "goals" : candidate.type.endsWith("news") ? candidate.type === "transfer_news" ? "transfers" : "news" : "matches", priority: candidate.type === "goal" || candidate.type === "match_start" ? "high" : "default", data: { type: candidate.type, fixtureId: candidate.fixtureId, teamId: candidate.teamId, articleId: candidate.targetId, url: candidate.payload.url } }))) });
    const result = await response.json().catch(() => ({ data: [] }));
    for (let j = 0; j < batch.length; j++) {
      const ticket = result.data?.[j] || {}; const invalid = ticket.details?.error === "DeviceNotRegistered" || /invalid/i.test(String(ticket.message || ""));
      await db.from("notification_deliveries").update({ status: invalid ? "invalid_token" : ticket.status === "ok" ? "sent" : "error", expo_ticket_id: ticket.id || null, sent_at: ticket.status === "ok" ? new Date().toISOString() : null, error: ticket.message || ticket.details?.error || null }).eq("event_id", eventId).eq("user_id", batch[j].userId).eq("push_token_id", batch[j].tokenId);
      if (invalid) await db.from("push_tokens").delete().eq("id", batch[j].tokenId);
      await db.from("user_notifications").insert({ user_id: batch[j].userId, event_id: eventId, title: candidate.title[batch[j].language], body: candidate.body[batch[j].language], type: candidate.type, target_id: candidate.targetId || String(candidate.fixtureId || ""), data: { ...candidate.payload, fixtureId: candidate.fixtureId, teamId: candidate.teamId } });
      if (ticket.status === "ok") sent++;
    }
  }
  return sent;
}

async function footballFetch(path: string, params: Record<string, string | number>) { const url = new URL(`${footballBase}${path}`); for (const [key, value] of Object.entries(params)) url.searchParams.set(key, String(value)); const response = await fetch(url, { headers: { "x-apisports-key": API_FOOTBALL_KEY } }); if (!response.ok) throw new Error(`football_${response.status}`); return response.json(); }
async function gnewsFetch(query: string, language: "ar" | "en") { const url = new URL("https://gnews.io/api/v4/search"); url.searchParams.set("q", query); url.searchParams.set("lang", language); url.searchParams.set("max", "10"); url.searchParams.set("apikey", GNEWS_API_KEY); const response = await fetch(url); return response.ok ? response.json() : { articles: [] }; }
function currentSeason() { const now = new Date(); return now.getUTCMonth() >= 6 ? now.getUTCFullYear() : now.getUTCFullYear() - 1; }
async function stableId(value: string) { const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)); return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("").slice(0, 32); }
function respond(body: unknown, status: number) { return new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } }); }
