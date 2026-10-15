import "server-only";
import type { NextRequest } from "next/server";
import { createHmac } from "node:crypto";
import { dbRequest } from "./server-db";
import { loginConfigured } from "./research-session";
export async function allowRequest(request: NextRequest, scope: "login" | "survey") {
  const secret = process.env.RESEARCH_PASSWORD;
  if (!secret || !loginConfigured()) throw new Error("Login er ikke konfigureret.");
  const ip = request.headers.get("x-vercel-forwarded-for") || request.headers.get("x-real-ip") || "local";
  const hash = createHmac("sha256", secret).update(`${scope}:${ip}`).digest("hex");
  const response = await dbRequest("rpc/research_request_limit", { method: "POST", body: JSON.stringify({ p_key: hash, p_seconds: scope === "login" ? 900 : 3600, p_max: scope === "login" ? 10 : 20 }) });
  return await response.json() === true;
}
