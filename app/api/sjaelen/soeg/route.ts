import { NextRequest, NextResponse } from 'next/server';
import { requireResearchSession } from '@/lib/research-auth';
import { dbRequest } from '@/lib/server-db';
import { frequentWords, readSearchMaterial, searchMaterial, SEARCH_SOURCES } from '@/lib/soul-search';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;
// Process-local cache avoids Next's 2 MB persisted-cache limit as the archive grows.
// Only authenticated requests reach it. Concurrent searches share one database read.
let cached: { value: Awaited<ReturnType<typeof loadMaterial>>; until: number } | undefined;
let pending: Promise<Awaited<ReturnType<typeof loadMaterial>>> | undefined;
async function loadMaterial() {
  const signal = AbortSignal.timeout(20000);
  const documents = await readSearchMaterial((path, init) => dbRequest(path, { ...init, signal }));
  return { documents, words: frequentWords(documents) };
}
async function material() {
  if (cached && cached.until > Date.now()) return cached.value;
  if (!pending) pending = loadMaterial().then(value => { cached = { value, until: Date.now() + 30000 }; return value; }).finally(() => { pending = undefined; });
  return pending;
}

export async function GET(request: NextRequest) {
  const denied = await requireResearchSession(); if (denied) return denied;
  const params = request.nextUrl.searchParams;
  const query = (params.get('q') || '').trim().slice(0, 200);
  const source = params.get('source') || '';
  if (source && !Object.hasOwn(SEARCH_SOURCES, source)) return NextResponse.json({ error: 'Ukendt materialetype.' }, { status: 400 });
  try {
    const { documents, words } = await material();
    const page = Math.min(100000, Math.max(0, Number(params.get('page')) || 0));
    const found = searchMaterial(documents, query, source, page);
    // Return bounded excerpts only; the full corpus stays on the protected server.
    const results = found.results.map(({ text, ...result }) => { void text; return result; });
    return NextResponse.json({ ...found, results, words: words.filter(word => word.count > 20), documents: documents.length }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch {
    return NextResponse.json({ error: 'Søgningen kunne ikke hente alt materialet. Prøv igen om lidt.' }, { status: 503, headers: { 'Cache-Control': 'private, no-store' } });
  }
}
