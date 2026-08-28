import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const API_BASE = "https://v3.football.api-sports.io";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const db = SUPABASE_URL && SERVICE_ROLE_KEY ? createClient(SUPABASE_URL, SERVICE_ROLE_KEY) : null;
const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey" };
const allowedRoutes = new Set(["/fixtures", "/fixtures/events", "/fixtures/statistics", "/fixtures/lineups", "/fixtures/headtohead", "/leagues", "/standings", "/teams", "/players/squads", "/players", "/players/topscorers"]);
const memoryCache = new Map<string, { expires: number; payload: unknown }>();

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
  if (req.method !== "GET") return json({ error: "method_not_allowed" }, 405);
  const apiKey = Deno.env.get("API_FOOTBALL_KEY");
  if (!apiKey) return json({ error: "football_api_not_configured" }, 503);
  const url = new URL(req.url);
  const path = url.pathname.replace(/^.*\/football-api/, "") || "/fixtures";
  if (!allowedRoutes.has(path)) return json({ error: "route_not_allowed" }, 404);
  const cacheKey = `${path}?${url.searchParams.toString()}`;
  const ttl = path === "/fixtures" && url.searchParams.has("live") ? 20_000 : path === "/leagues" ? 86_400_000 : 300_000;
  const cached = await readCache(cacheKey);
  if (cached !== null) return json(cached, 200, true);
  const endpoint = new URL(`${API_BASE}${path}`);
  url.searchParams.forEach((value, name) => endpoint.searchParams.set(name, value));
  try {
    const apiResponse = await fetch(endpoint, { headers: { "x-apisports-key": apiKey } });
    const data = await apiResponse.json();
    if (!apiResponse.ok) return json({ error: "football_api_error", status: apiResponse.status }, apiResponse.status);
    await writeCache(cacheKey, data, ttl);
    return json(data, 200, false);
  } catch {
    return json({ error: "football_api_unavailable" }, 503);
  }
});

async function readCache(key: string): Promise<unknown | null> {
  const memory = memoryCache.get(key);
  if (memory && memory.expires > Date.now()) return memory.payload;
  if (memory) memoryCache.delete(key);
  if (!db) return null;
  const { data } = await db.from("football_api_cache").select("payload, expires_at").eq("cache_key", key).gt("expires_at", new Date().toISOString()).maybeSingle();
  if (!data) return null;
  const payload = data.payload as unknown;
  if (isApiErrorPayload(payload)) return null;
  memoryCache.set(key, { payload, expires: new Date(data.expires_at).getTime() });
  return payload;
}

async function writeCache(key: string, payload: unknown, ttl: number) {
  if (isApiErrorPayload(payload)) return;
  const expiresAt = new Date(Date.now() + ttl).toISOString();
  memoryCache.set(key, { payload, expires: Date.now() + ttl });
  if (!db) return;
  await db.from("football_api_cache").upsert({ cache_key: key, payload, expires_at: expiresAt, updated_at: new Date().toISOString() });
}

function isApiErrorPayload(payload: unknown): boolean {
  if (!payload || typeof payload !== 'object') return false;
  const errors = (payload as { errors?: unknown }).errors;
  return Boolean(errors && typeof errors === 'object' && Object.keys(errors as object).length > 0);
}

function json(payload: unknown, status: number, cached = false) {
  return new Response(JSON.stringify(payload), { status, headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": cached ? "public, max-age=60" : "no-store" } });
}
