import { NextRequest, NextResponse } from "next/server";
import { validateSurvey } from "@/lib/survey";
import { dbRequest } from "@/lib/server-db";
import { allowRequest } from "@/lib/request-limits";
export async function POST(request: NextRequest) {
  const headers = { "Cache-Control": "no-store" };
  if (Number(request.headers.get("content-length")) > 65_000) return NextResponse.json({ error: "Besvarelsen er for lang." }, { status: 413, headers });
  let data;
  try {
    const raw = await request.text();
    if (raw.length > 65_000) throw new Error("Besvarelsen er for lang.");
    const body = JSON.parse(raw);
    if (body.website) return NextResponse.json({ ok: true }, { headers });
    data = validateSurvey(body);
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Besvarelsen kunne ikke læses." }, { status: 400, headers }); }
  try {
    if (!await allowRequest(request, "survey")) return NextResponse.json({ error: "Der er sendt mange svar fra din forbindelse. Prøv igen om en time." }, { status: 429, headers });
    await dbRequest("rpc/submit_digital_soul", { method: "POST", body: JSON.stringify({ p_response: { id: data.id, first_name: data.first_name, age: data.age, postal_code: data.postal_code, participations: data.participations, answers: data.answers, publication_permission: data.publication_permission, contact_permission: data.contact_permission, questionnaire_version: data.questionnaire_version }, p_name: data.name, p_email: data.email }) });
    return NextResponse.json({ ok: true }, { status: 201, headers });
  } catch { return NextResponse.json({ error: "Dit svar kunne ikke gemmes lige nu. Dine svar står stadig her — prøv igen." }, { status: 503, headers }); }
}
