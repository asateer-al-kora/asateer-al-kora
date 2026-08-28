import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const testSecret = Deno.env.get("TEST_PUSH_SECRET") || Deno.env.get("NOTIFICATION_WORKER_SECRET") || "";
const supabase = createClient(supabaseUrl, serviceRoleKey);
const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Test-Push-Secret" };

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (request.method !== "POST") return response({ error: "method_not_allowed" }, 405);
  if (!authorized(request)) return response({ error: "unauthorized" }, 401);
  if (!serviceRoleKey || !testSecret) return response({ error: "test_push_not_configured" }, 503);

  try {
    const body = await request.json().catch(() => ({}));
    const tokenId = typeof body.token_id === "string" ? body.token_id : null;
    const tokenValue = typeof body.token === "string" ? body.token : null;
    if (!tokenId && !tokenValue) return response({ error: "token_id_or_token_required" }, 400);
    if (tokenId && tokenValue) return response({ error: "send_one_token_selector_only" }, 400);

    let query = supabase.from("push_tokens").select("id,user_id,token,platform").limit(1);
    query = tokenId ? query.eq("id", tokenId) : query.eq("token", tokenValue as string);
    const { data: rows, error } = await query;
    if (error) throw error;
    const row = rows?.[0];
    if (!row) return response({ error: "push_token_not_found" }, 404);

    const title = typeof body.title === "string" && body.title.trim() ? body.title.trim() : "أساطير الكرة";
    const message = typeof body.body === "string" && body.body.trim() ? body.body.trim() : "إشعار تجريبي من أساطير الكرة";
    const push = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ to: row.token, title, body: message, sound: "default", channelId: "matches", priority: "high", data: { type: "test-push", url: "/notifications", notificationId: `test-${Date.now()}` } }),
    });
    const result = await push.json().catch(() => ({}));
    if (!push.ok) return response({ error: "expo_push_failed", status: push.status }, 502);
    return response({ ok: true, token_id: row.id, platform: row.platform, ticket: result.data || result }, 200);
  } catch (error) {
    console.error("test-push", error instanceof Error ? error.message : "unknown");
    return response({ error: "test_push_failed" }, 500);
  }
});

function authorized(request: Request) {
  const supplied = request.headers.get("x-test-push-secret") || request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || "";
  return Boolean(testSecret && supplied && supplied === testSecret);
}

function response(body: unknown, status: number) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
}
