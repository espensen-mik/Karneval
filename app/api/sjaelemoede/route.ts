import { NextResponse } from "next/server";
import { requireResearchSession } from "@/lib/research-auth";
import { dbRequest } from "@/lib/server-db";
import { readWorkshopArchive } from "@/lib/workshop";
export const dynamic = "force-dynamic";
export async function GET() {
  const denied = await requireResearchSession(); if (denied) return denied;
  try {
    const signal = AbortSignal.timeout(15000);
    const archive = await readWorkshopArchive((path, init) => dbRequest(path, { ...init, signal }));
    return NextResponse.json(archive, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return NextResponse.json({ error: "Materialet kunne ikke hentes. Prøv igen." }, { status: 503, headers: { "Cache-Control": "private, no-store" } });
  }
}
// Workshop entry is complete. Unsupported mutation methods return 405.
