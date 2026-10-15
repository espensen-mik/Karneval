import { requireResearchSession } from "@/lib/research-auth";
import { sourceConfig, sourceHeaders } from "@/lib/server-db";
import { NextResponse } from "next/server";
import { PDF_BUCKET } from "@/lib/source-register";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireResearchSession(); if (denied) return denied;
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "Ugyldig kilde." }, { status: 400 });
  const config = sourceConfig();
  if (!config) return NextResponse.json({ error: "PDF-lagring er ikke sat op endnu." }, { status: 503 });
  try {
    const source = await fetch(`${config.url}/rest/v1/sources?id=eq.${id}&select=file_path`, { headers: sourceHeaders(config.key), cache: "no-store" });
    if (!source.ok) throw new Error("Source lookup failed");
    const rows = await source.json();
    if (!rows[0]?.file_path) return NextResponse.json({ error: "PDF-filen blev ikke fundet." }, { status: 404 });
    const signed = await fetch(`${config.url}/storage/v1/object/sign/${PDF_BUCKET}/${rows[0].file_path}`, { method: "POST", headers: sourceHeaders(config.key), body: JSON.stringify({ expiresIn: 300 }), cache: "no-store" });
    if (!signed.ok) throw new Error("Signing failed");
    const data = await signed.json();
    return NextResponse.redirect(`${config.url}/storage/v1${data.signedURL}`, { headers: { "Cache-Control": "no-store" } });
  } catch { return NextResponse.json({ error: "PDF-filen kunne ikke åbnes. Prøv igen." }, { status: 502 }); }
}
