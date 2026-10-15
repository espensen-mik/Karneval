import { NextResponse } from "next/server";
import { soulRows } from "@/lib/soul-server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rows = await soulRows("quotes", "id,quote_text,category,quote_source", { status: "eq.approved", publication_consent: "eq.true" });
    return NextResponse.json(rows.map((quote) => ({ id: quote.id, text: quote.quote_text, type: "quote", category: quote.category, source: quote.quote_source, contextHref: `/citater#citat-${quote.id}` })), { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Citaterne kunne ikke hentes. Ingen optællinger vises, før materialet kan læses." }, { status: 502 });
  }
}
