import { NextRequest, NextResponse } from 'next/server';
import { requireResearchSession } from '@/lib/research-auth';
import { dbRequest } from '@/lib/server-db';
import { voiceQuery, voiceSelection, voiceThemeName } from '@/lib/digital-voices';
const headers = { 'Cache-Control': 'private, no-store' };
export async function GET(request: NextRequest) {
  const denied = await requireResearchSession(); if (denied) return denied;
  let query;
  try { query = voiceQuery(request.nextUrl.searchParams); }
  catch (error) { return NextResponse.json({ error: (error as Error).message }, { status: 400, headers }); }
  try {
    const response = await dbRequest('rpc/read_soul_voices', { method: 'POST', body: JSON.stringify(query), signal: AbortSignal.timeout(10000) });
    return NextResponse.json(await response.json(), { headers });
  } catch { return NextResponse.json({ error: 'Stemmerne kunne ikke hentes. Prøv igen.' }, { status: 503, headers }); }
}
export async function POST(request: NextRequest) {
  const denied = await requireResearchSession(); if (denied) return denied;
  let body;
  try {
    body = await request.json();
    if (body?.action === 'theme') body = { action: 'theme', name: voiceThemeName(body.name) };
    else body = { action: 'selection', selection: voiceSelection(body) };
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Valget kunne ikke læses.' }, { status: 400, headers }); }
  try {
    if (body.action === 'theme') {
      const response = await dbRequest('soul_voice_themes?select=id,name', { method: 'POST', headers: { Prefer: 'return=representation' }, body: JSON.stringify({ name: body.name }), signal: AbortSignal.timeout(10000) });
      const [theme] = await response.json();
      return NextResponse.json({ ...theme, count: 0 }, { status: 201, headers });
    }
    const response = await dbRequest('rpc/save_soul_voice', { method: 'POST', body: JSON.stringify(body.selection), signal: AbortSignal.timeout(10000) });
    return NextResponse.json(await response.json(), { headers });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message.includes('409')) return NextResponse.json({ error: 'Temaet findes allerede. Luk og åbn vælgeren for at hente det.' }, { status: 409, headers });
    if (message.includes('400')) return NextResponse.json({ error: 'Svaret eller et tema findes ikke længere. Genindlæs siden.' }, { status: 400, headers });
    return NextResponse.json({ error: 'Valget kunne ikke gemmes. Prøv igen.' }, { status: 503, headers });
  }
}
