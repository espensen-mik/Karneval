import { createHash, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createSession, loginConfigured, SESSION_COOKIE, SESSION_SECONDS } from "@/lib/research-session";
import { allowRequest } from "@/lib/request-limits";
import { loginFingerprint } from "@/lib/login-statistics";
import { dbRequest } from "@/lib/server-db";
const headers = { "Cache-Control": "private, no-store" };
export async function POST(request: NextRequest) {
  if (!loginConfigured()) return NextResponse.json({ error: "Adgangen er ved at blive sat op. Prøv igen senere." }, { status: 503, headers });
  try {
    if (!await allowRequest(request, "login")) return NextResponse.json({ error: "For mange forsøg. Vent 15 minutter, før du prøver igen." }, { status: 429, headers });
    const body = await request.text();
    if (body.length > 2048) return NextResponse.json({ error: "Ugyldigt password." }, { status: 400, headers });
    const value = JSON.parse(body).password;
    if (typeof value !== "string" || !timingSafeEqual(createHash("sha256").update(value).digest(), createHash("sha256").update(process.env.RESEARCH_PASSWORD!).digest())) return NextResponse.json({ error: "Passwordet er ikke korrekt." }, { status: 401, headers });
    const response = NextResponse.json({ ok: true }, { headers });
    response.cookies.set(SESSION_COOKIE, await createSession(), { httpOnly: true, secure: request.nextUrl.protocol === "https:", sameSite: "lax", path: "/", maxAge: SESSION_SECONDS });
    // Statistics must never prevent a valid login. Never log the raw IP.
    try {
      const secret = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
      const fingerprint = secret ? loginFingerprint(request.headers, secret) : null;
      await dbRequest("research_login_events", { method: "POST", body: JSON.stringify({ ip_hash: fingerprint }), signal: AbortSignal.timeout(1500) });
    } catch { console.warn("Login statistics could not be recorded."); }
    return response;
  } catch { return NextResponse.json({ error: "Login kunne ikke gennemføres. Prøv igen senere." }, { status: 503, headers }); }
}
export async function DELETE(request: NextRequest) {
  const response = NextResponse.json({ ok: true }, { headers });
  response.cookies.set(SESSION_COOKIE, "", { httpOnly: true, secure: request.nextUrl.protocol === "https:", sameSite: "lax", path: "/", maxAge: 0 });
  return response;
}
