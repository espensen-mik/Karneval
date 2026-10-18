import { requireResearchSession } from "@/lib/research-auth";
import { NextResponse } from "next/server";
import { soulRows } from "@/lib/soul-server";
import { dbRequest } from "@/lib/server-db";
import { readSurveyContributions } from "@/lib/soul-material";

export const dynamic = "force-dynamic";

export async function GET() {
  const denied = await requireResearchSession(); if (denied) return denied;
  try {
    const [rows, answers] = await Promise.all([
      soulRows("quotes", "id,quote_text,category,quote_source", { status: "eq.approved", publication_consent: "eq.true" }),
      readSurveyContributions(dbRequest),
    ]);
    const quotes = rows.map((quote) => ({ id: quote.id, text: quote.quote_text, type: "quote", category: quote.category, source: quote.quote_source, contextHref: `/citater#citat-${quote.id}` }));
    return NextResponse.json([...quotes, ...answers], { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return NextResponse.json({ error: "Materialet kunne ikke hentes. Ingen optællinger vises, før både citater og spørgeskemasvar kan læses." }, { status: 502 });
  }
}
