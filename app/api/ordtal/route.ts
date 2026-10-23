import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { requireResearchSession } from "@/lib/research-auth";
import { dbRequest } from "@/lib/server-db";
export const dynamic = "force-dynamic";
const countWords = unstable_cache(async () => {
 const response = await dbRequest("rpc/material_word_count", { method: "POST", body: "{}", signal: AbortSignal.timeout(10000) });
 const data = await response.json();
 if (!Number.isSafeInteger(data.total) || data.total < 0) throw new Error("Ugyldigt ordtal.");
 return data;
},["material-word-count-v1"],{revalidate:60});
export async function GET() {
 const denied = await requireResearchSession(); if (denied) return denied;
 try { return NextResponse.json(await countWords(), {headers:{"Cache-Control":"private, no-store"}}); }
 catch { return NextResponse.json({error:"Ordtallet kunne ikke hentes."},{status:503,headers:{"Cache-Control":"private, no-store"}}); }
}
