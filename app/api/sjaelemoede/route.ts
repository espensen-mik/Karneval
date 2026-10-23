import { NextRequest, NextResponse } from "next/server";
import { requireResearchSession } from "@/lib/research-auth";
import { sourceConfig, sourceHeaders } from "@/lib/server-db";
import { WORKSHOP_TABLES, workshopId, workshopMutation, type WorkshopResource } from "@/lib/workshop";
export const dynamic = "force-dynamic";
const cache = { "Cache-Control": "private, no-store" };
export async function GET(request: NextRequest) {
 const denied = await requireResearchSession(); if (denied) return denied;
 const config = sourceConfig(); if (!config) return NextResponse.json({error:"Forbindelsen mangler."},{status:503});
 const kind = request.nextUrl.searchParams.get("resource") || "headings";
 if (!Object.hasOwn(WORKSHOP_TABLES,kind)) return NextResponse.json({error:"Ugyldig materialetype."},{status:400});
 try {
  const resource = kind as WorkshopResource;
  const url = new URL(`${config.url}/rest/v1/${WORKSHOP_TABLES[resource]}`);
  url.searchParams.set("select",resource === "headings" ? "*,statements:workshop_statements(count)" : "*");
  url.searchParams.set("order",resource === "summaries" ? "group_number.asc" : "created_at.desc,id.asc");
  if (resource === "statements") url.searchParams.set("heading_id",`eq.${workshopId(request.nextUrl.searchParams.get("heading"))}`);
  const offset = Math.max(0,Math.floor(Number(request.nextUrl.searchParams.get("offset")) || 0));
  const paginated = resource === "statements" || resource === "stories";
  const rows: unknown[] = [];
  let total = 0;
  for (let start = paginated ? offset : 0; ; start += 500) {
   url.searchParams.set("offset",String(start)); url.searchParams.set("limit",paginated ? "50" : "500");
   const response = await fetch(url,{headers:sourceHeaders(config.key,"count=exact"),cache:"no-store",signal:AbortSignal.timeout(10000)});
   if (!response.ok) throw new Error();
   const batch = await response.json(); rows.push(...batch);
   total = Number(response.headers.get("content-range")?.split("/")[1] || rows.length);
   if (paginated || rows.length >= total || batch.length < 500) break;
  }
  return NextResponse.json({rows,total},{headers:cache});
 } catch { return NextResponse.json({error:"Materialet kunne ikke hentes. Prøv igen."},{status:503}); }
}
async function mutate(request: NextRequest,method:"POST"|"PATCH") {
 const denied = await requireResearchSession(); if (denied) return denied;
 const config = sourceConfig(); if (!config) return NextResponse.json({error:"Forbindelsen mangler."},{status:503});
 let parsed: ReturnType<typeof workshopMutation>;
 try { parsed=workshopMutation(await request.json(),method); }
 catch(error) { return NextResponse.json({error:error instanceof Error ? error.message : "Ugyldig indtastning."},{status:400}); }
 const {resource,data,expected}=parsed;
 try {
  const rpc = resource === "statements" && method === "POST";
  const url = new URL(`${config.url}/rest/v1/${rpc ? "rpc/add_workshop_statement" : WORKSHOP_TABLES[resource]}`);
  if (method === "PATCH") {
   url.searchParams.set(resource === "summaries" ? "group_number" : "id",`eq.${resource === "summaries" ? data.group_number : data.id}`);
   url.searchParams.set("updated_at",`eq.${expected}`);
  }
  const payload = rpc ? {p_id:data.id,p_heading:data.heading_id,p_text:data.text} : {...data,updated_at:new Date().toISOString()};
  const response = await fetch(url,{method,headers:sourceHeaders(config.key,method === "POST" && !rpc ? "resolution=ignore-duplicates,return=representation" : "return=representation"),body:JSON.stringify(payload),cache:"no-store",signal:AbortSignal.timeout(10000)});
  if (!response.ok) return NextResponse.json({error:rpc && response.status===400 ? "Overskriften er lukket. Genåbn den eller vælg en ny overskrift. Din tekst er bevaret." : "Teksten kunne ikke gemmes. Prøv igen."},{status:response.status===409 ? 409 : 503});
  const result = await response.json();
  let saved = rpc && !Array.isArray(result) ? result : result[0];
  if (!saved && method === "POST" && !rpc) {
   // An earlier attempt may have committed before the connection timed out.
   const retry = new URL(`${config.url}/rest/v1/${WORKSHOP_TABLES[resource]}`);
   retry.searchParams.set(resource === "summaries" ? "group_number" : "id",`eq.${resource === "summaries" ? data.group_number : data.id}`);
   const check=await fetch(retry,{headers:sourceHeaders(config.key),cache:"no-store",signal:AbortSignal.timeout(10000)});
   if (!check.ok) throw new Error();
   [saved]=await check.json();
   if (!saved || Object.entries(data).some(([key,value])=>saved[key]!==value)) return NextResponse.json({error:"Materialet er ændret af en anden. Genindlæs før du gemmer."},{status:409});
  }
  if (!saved) return NextResponse.json({error:"Materialet er ændret af en anden. Genindlæs før du gemmer. Din tekst er bevaret."},{status:409});
  return NextResponse.json(saved,{status:method === "POST" ? 201 : 200,headers:cache});
 } catch { return NextResponse.json({error:"Forbindelsen fejlede. Din tekst er bevaret; prøv at gemme igen."},{status:503}); }
}
export const POST=(request:NextRequest)=>mutate(request,"POST");
export const PATCH=(request:NextRequest)=>mutate(request,"PATCH");
