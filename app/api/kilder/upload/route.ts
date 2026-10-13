import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { MAX_PDF_BYTES, PDF_BUCKET, sourceConfig, sourceHeaders } from "@/lib/source-register";

export async function POST(request: NextRequest) {
  const config = sourceConfig();
  if (!config) return NextResponse.json({ error: "PDF-upload er ikke sat op endnu." }, { status: 503 });
  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Filen kunne ikke læses." }, { status: 400 }); }
  if (typeof body?.name !== "string" || body.name.length > 250 || !/\.pdf$/i.test(body.name) || !Number.isInteger(body.size) || body.size < 5 || body.size > MAX_PDF_BYTES) return NextResponse.json({ error: "Vælg en PDF på højst 20 MB." }, { status: 400 });
  try {
    const path = `${randomUUID()}.pdf`;
    const response = await fetch(`${config.url}/storage/v1/object/upload/sign/${PDF_BUCKET}/${path}`, { method: "POST", headers: sourceHeaders(config.key), body: "{}", cache: "no-store" });
    if (!response.ok) return NextResponse.json({ error: "PDF-upload kunne ikke startes. Prøv igen." }, { status: 502 });
    const data = await response.json();
    return NextResponse.json({ path, upload_url: `${config.url}/storage/v1${data.url}` }, { headers: { "Cache-Control": "no-store" } });
  } catch { return NextResponse.json({ error: "Forbindelsen til PDF-lagringen fejlede." }, { status: 502 }); }
}
