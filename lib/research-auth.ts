import "server-only";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE, validSession } from "./research-session";
export async function requireResearchSession() {
  if (await validSession((await cookies()).get(SESSION_COOKIE)?.value)) return null;
  return NextResponse.json({ error: "Log ind for at åbne researchrummet." }, { status: 401, headers: { "Cache-Control": "private, no-store" } });
}
