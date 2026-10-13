import { NextRequest, NextResponse } from "next/server";
import { MAX_PDF_BYTES, PDF_BUCKET, SOURCE_COLUMNS, sourceConfig, sourceHeaders, validPdfPath, validSourceDate, validSourceUrl } from "@/lib/source-register";

export const dynamic = "force-dynamic";

export async function GET() {
  const config = sourceConfig();
  if (!config) return NextResponse.json({ error: "Kilderegisteret er ikke sat op endnu." }, { status: 503 });
  try {
    const response = await fetch(`${config.url}/rest/v1/sources?select=${SOURCE_COLUMNS}&order=created_at.desc`, { headers: sourceHeaders(config.key), cache: "no-store" });
    if (!response.ok) return NextResponse.json({ error: "Kilderne kunne ikke hentes. Prøv igen senere." }, { status: 502 });
    return NextResponse.json(await response.json(), { headers: { "Cache-Control": "no-store" } });
  } catch { return NextResponse.json({ error: "Forbindelsen til kilderegisteret fejlede." }, { status: 502 }); }
}

export async function POST(request: NextRequest) {
  const config = sourceConfig();
  if (!config) return NextResponse.json({ error: "Kilderegisteret er ikke sat op endnu." }, { status: 503 });
  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Kilden kunne ikke læses." }, { status: 400 }); }
  const text = (key: string) => typeof body?.[key] === "string" ? body[key].trim() : "";
  const title = text("title"), creator = text("creator"), source_date = text("source_date"), url = text("url"), file_path = text("file_path"), file_name = text("file_name");
  if (!title || title.length > 250 || !creator || creator.length > 200) return NextResponse.json({ error: "Angiv titel (højst 250 tegn) og forfatter/kilde (højst 200 tegn)." }, { status: 400 });
  if (!validSourceDate(source_date)) return NextResponse.json({ error: "Vælg en gyldig dato." }, { status: 400 });
  if (Boolean(url) === Boolean(file_path)) return NextResponse.json({ error: "Tilføj enten et link eller en PDF." }, { status: 400 });
  if (url && (url.length > 2000 || !validSourceUrl(url))) return NextResponse.json({ error: "Angiv et gyldigt http- eller https-link." }, { status: 400 });
  if (file_path && (!validPdfPath(file_path) || !file_name || file_name.length > 250 || !/\.pdf$/i.test(file_name))) return NextResponse.json({ error: "PDF-filen er ugyldig." }, { status: 400 });
  try {
    if (file_path) {
      const abort = new AbortController();
      const pdf = await fetch(`${config.url}/storage/v1/object/authenticated/${PDF_BUCKET}/${file_path}`, { headers: { ...sourceHeaders(config.key), Range: "bytes=0-4" }, cache: "no-store", signal: abort.signal });
      if (!pdf.ok || !pdf.body) return NextResponse.json({ error: "PDF-uploaden er ikke færdig. Prøv igen." }, { status: 400 });
      const total = pdf.headers.get("content-range")?.split("/")[1] || pdf.headers.get("content-length");
      const reader = pdf.body.getReader();
      const signature: number[] = [];
      while (signature.length < 5) {
        const chunk = await reader.read();
        if (chunk.done) break;
        signature.push(...chunk.value.subarray(0, 5 - signature.length));
      }
      abort.abort();
      void reader.cancel().catch(() => {});
      if (!total || !Number.isFinite(Number(total)) || Number(total) > MAX_PDF_BYTES || Buffer.from(signature).toString() !== "%PDF-") return NextResponse.json({ error: "Upload en gyldig PDF på højst 20 MB." }, { status: 400 });
    }
    const response = await fetch(`${config.url}/rest/v1/sources?select=${SOURCE_COLUMNS}`, { method: "POST", headers: sourceHeaders(config.key, "return=representation"), body: JSON.stringify({ title, creator, source_date, url: url || null, file_path: file_path || null, file_name: file_path ? file_name : null }), cache: "no-store" });
    if (!response.ok) return NextResponse.json({ error: "Kilden kunne ikke gemmes. Prøv igen." }, { status: 502 });
    const rows = await response.json();
    return NextResponse.json(rows[0], { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch { return NextResponse.json({ error: "Forbindelsen fejlede. Prøv at gemme kilden igen." }, { status: 502 }); }
}
