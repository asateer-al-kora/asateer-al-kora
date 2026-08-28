import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const GNEWS_BASE = "https://gnews.io/api/v4";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const db = SUPABASE_URL && SERVICE_ROLE_KEY ? createClient(SUPABASE_URL, SERVICE_ROLE_KEY) : null;
const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey" };
const PAGE_SIZE = 20;
const categoryQueries: Record<string, { ar: string; en: string; urgent?: boolean }> = {
  latest: { ar: "كرة القدم", en: "football", urgent: true },
  saudi: { ar: "الدوري السعودي كرة القدم", en: "Saudi Pro League football" },
  ucl: { ar: "دوري أبطال أوروبا كرة القدم", en: "UEFA Champions League football" },
  premier: { ar: "الدوري الإنجليزي الممتاز كرة القدم", en: "Premier League football" },
  laliga: { ar: "الدوري الإسباني كرة القدم", en: "La Liga football" },
  seriea: { ar: "الدوري الإيطالي كرة القدم", en: "Serie A football" },
  bundesliga: { ar: "الدوري الألماني كرة القدم", en: "Bundesliga football" },
  ligue1: { ar: "الدوري الفرنسي كرة القدم", en: "Ligue 1 football" },
  worldcup: { ar: "كأس العالم كرة القدم", en: "FIFA World Cup football" },
  clubworldcup: { ar: "كأس العالم للأندية كرة القدم", en: "FIFA Club World Cup football" },
  afc: { ar: "دوري أبطال آسيا كرة القدم", en: "AFC Champions League football" },
  transfers: { ar: "انتقالات كرة القدم", en: "football transfer news" },
};
const memoryCache = new Map<string, { expires: number; payload: unknown }>();

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
  if (req.method !== "GET") return json({ error: "method_not_allowed" }, 405);
  const apiKey = Deno.env.get("GNEWS_API_KEY");
  if (!apiKey) return json({ error: "news_api_not_configured" }, 503);
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (id) {
    const article = await readCache(`article:${id}`);
    return article ? json(article, 200, true, 86_400) : json({ error: "news_not_found" }, 404);
  }
  const language = url.searchParams.get("lang") === "en" ? "en" : "ar";
  const category = url.searchParams.get("category") || "latest";
  const page = Math.max(1, Number(url.searchParams.get("page") || "1"));
  const query = url.searchParams.get("q") || categoryQueries[category]?.[language] || categoryQueries.latest[language];
  const cacheKey = `news:${language}:${category}:${query}:${page}`;
  const cacheTtl = category === "latest" ? 300_000 : 900_000;
  const cached = await readCache(cacheKey);
  if (cached !== null) return json(cached, 200, true);
  const endpoint = new URL(`${GNEWS_BASE}/search`);
  endpoint.searchParams.set("q", query);
  endpoint.searchParams.set("lang", language);
  endpoint.searchParams.set("max", String(PAGE_SIZE));
  endpoint.searchParams.set("page", String(page));
  endpoint.searchParams.set("sortby", "publishedAt");
  endpoint.searchParams.set("apikey", apiKey);
  try {
    const response = await fetch(endpoint, { signal: AbortSignal.timeout(12_000) });
    if (!response.ok) return json({ error: mapGNewsError(response.status), status: response.status }, response.status);
    const raw = await response.json();
    const articles = Array.isArray(raw.articles) ? raw.articles.map((article: GNewsArticle) => normalizeArticle(article, category, language)) : [];
    const result = { articles, page, pageSize: PAGE_SIZE, total: Number(raw.totalArticles || articles.length), hasMore: articles.length === PAGE_SIZE && page * PAGE_SIZE < Number(raw.totalArticles || 0) };
    await writeCache(cacheKey, result, cacheTtl);
    for (const article of articles) await writeCache(`article:${article.id}`, article, 86_400_000);
    return json(result, 200, false);
  } catch {
    return json({ error: "news_timeout" }, 504);
  }
});

type GNewsArticle = { title?: string; description?: string; content?: string; url?: string; image?: string; publishedAt?: string; source?: { name?: string; url?: string } };
function normalizeArticle(article: GNewsArticle, category: string, language: string) {
  const url = article.url || "";
  const id = stableId(url || `${article.title || "news"}:${article.publishedAt || ""}`);
  return { id, title: article.title || "", description: article.description || undefined, image: article.image || undefined, url, sourceName: article.source?.name || undefined, sourceUrl: article.source?.url || undefined, publishedAt: article.publishedAt || new Date().toISOString(), category, language };
}
function stableId(value: string) { let hash = 2166136261; for (let i = 0; i < value.length; i++) hash = Math.imul(hash ^ value.charCodeAt(i), 16777619); return `gnews-${(hash >>> 0).toString(36)}`; }
function mapGNewsError(status: number) { if (status === 401) return "news_unauthorized"; if (status === 403) return "news_forbidden"; if (status === 429) return "news_rate_limited"; if (status >= 500) return "news_server_error"; return "news_request_failed"; }
async function readCache(key: string): Promise<unknown | null> { const memory = memoryCache.get(key); if (memory && memory.expires > Date.now()) return memory.payload; if (memory) memoryCache.delete(key); if (!db) return null; const { data } = await db.from("football_api_cache").select("payload, expires_at").eq("cache_key", key).gt("expires_at", new Date().toISOString()).maybeSingle(); if (!data) return null; const payload = data.payload; memoryCache.set(key, { payload, expires: new Date(data.expires_at).getTime() }); return payload; }
async function writeCache(key: string, payload: unknown, ttl: number) { const expiresAt = new Date(Date.now() + ttl).toISOString(); memoryCache.set(key, { payload, expires: Date.now() + ttl }); if (db) await db.from("football_api_cache").upsert({ cache_key: key, payload, expires_at: expiresAt, updated_at: new Date().toISOString() }); }
function json(payload: unknown, status: number, cached = false, maxAge = 300) { return new Response(JSON.stringify(payload), { status, headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": cached ? `public, max-age=${maxAge}` : "no-store" } }); }
