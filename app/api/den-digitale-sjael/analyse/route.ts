import { NextRequest, NextResponse } from 'next/server';
import { requireResearchSession } from '@/lib/research-auth';
import { dbRequest } from '@/lib/server-db';
import { analyzeSurvey, readAnalysisResponses, selectSurveyTerms } from '@/lib/survey-analysis';
export async function GET(request: NextRequest) {
  const denied = await requireResearchSession(); if (denied) return denied;
  try {
    const rows = await readAnalysisResponses(dbRequest);
    return NextResponse.json(selectSurveyTerms(analyzeSurvey(rows), request.nextUrl.searchParams), { headers: { 'Cache-Control': 'private, no-store' } });
  } catch { return NextResponse.json({ error: 'Analysen kunne ikke hentes. Prøv igen.' }, { status: 503 }); }
}
