"use client";
import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { usePathname } from "next/navigation";
import { fetchJson } from "@/lib/fetch-json";
import { WORKSHOP_PAGES, type WorkshopHeading, type WorkshopStatement, type WorkshopStory, type WorkshopSummary, type WorkshopSection } from "@/lib/workshop";
import UiIcon from "./ui-icon";
import s from "./workshop.module.css";

function useRows<T>(resource: string, query = "") {
 const [rows,setRows]=useState<T[]>([]),[total,setTotal]=useState(0),[loading,setLoading]=useState(true),[error,setError]=useState("");
 const [reload,setReload]=useState(0),[more,setMore]=useState(false);
 useEffect(()=>{
  const controller=new AbortController(); setLoading(true);setError("");setRows([]);setTotal(0);
  fetchJson<{rows:T[];total:number}>(`/api/sjaelemoede?resource=${resource}${query}`,controller.signal).then(data=>{if(!controller.signal.aborted){setRows(data.rows);setTotal(data.total);}}).catch(e=>{if(!controller.signal.aborted)setError(e.message);}).finally(()=>{if(!controller.signal.aborted)setLoading(false);});
  return ()=>controller.abort();
 },[resource,query,reload]);
 async function loadMore(){setMore(true);setError("");try {const data=await fetchJson<{rows:T[];total:number}>(`/api/sjaelemoede?resource=${resource}${query}&offset=${rows.length}`,new AbortController().signal);setRows(previous=>[...previous,...data.rows]);setTotal(data.total);}catch(e){setError(e instanceof Error?e.message:"Materialet kunne ikke hentes.");}finally{setMore(false);}}
 return {rows,setRows,total,setTotal,loading,error,retry:()=>setReload(v=>v+1),loadMore,more};
}
function useWriter(){
 const [busy,setBusy]=useState(false),[error,setError]=useState("");
 const gate=useRef(false);
 async function send<T>(data:Record<string,unknown>,method="POST"):Promise<T|null>{
  if(gate.current)return null;gate.current=true;setBusy(true);setError("");
  try {const response=await fetch("/api/sjaelemoede",{method,headers:{"Content-Type":"application/json"},body:JSON.stringify(data),signal:AbortSignal.timeout(15000)});const result=await response.json();if(!response.ok)throw new Error(result.error||"Materialet kunne ikke gemmes.");return result;}
  catch(e){setError(e instanceof Error?e.message:"Gemningen fejlede. Prøv igen.");return null;}
  finally{gate.current=false;setBusy(false);}
 }
 return {send,busy,error};
}
function useEntryId(){const entry=useRef({signature:"",id:""});const get=(data:unknown)=>{const signature=JSON.stringify(data);if(signature!==entry.current.signature||!entry.current.id)entry.current={signature,id:crypto.randomUUID()};return entry.current.id;};get.reset=()=>{entry.current={signature:"",id:""};};return get;}
function ErrorMessage({text,retry}:{text:string;retry?:()=>void}){return text?<p className={s.error} role="alert">{text} {retry&&<button type="button" onClick={retry}>Prøv igen</button>}</p>:null;}
function enterSubmit(event:KeyboardEvent<HTMLTextAreaElement>){if(event.key==="Enter"&&!event.shiftKey&&!event.nativeEvent.isComposing){event.preventDefault();event.currentTarget.form?.requestSubmit();}}
function GroupTabs({group,onChange,disabled=false}:{group:number;onChange:(n:number)=>void;disabled?:boolean}){return <div className={s.groups} aria-label="Workshopgruppe">{[1,2,3].map(n=><button key={n} type="button" aria-pressed={group===n} disabled={disabled} onClick={()=>onChange(n)}>Gruppe {n}</button>)}</div>;}

function Editor<T extends {id?:string;group_number?:number;updated_at:string}>({resource,row,fields,onSaved}:{resource:string;row:T;fields:{key:string;label:string;value:string;max:number;multiline?:boolean}[];onSaved:(value:T)=>void}){
 const [editing,setEditing]=useState(false);const writer=useWriter();
 if(!editing)return <button className={s.textButton} type="button" onClick={()=>setEditing(true)}>Ret tekst</button>;
 async function save(event:FormEvent<HTMLFormElement>){event.preventDefault();const data=new FormData(event.currentTarget);const result=await writer.send<T>({resource,id:row.id,group_number:row.group_number,updated_at:row.updated_at,...Object.fromEntries(fields.map(f=>[f.key,String(data.get(f.key)||"")]))},"PATCH");if(result){onSaved(result);setEditing(false);}}
 return <form onSubmit={save} className={s.editForm}><fieldset disabled={writer.busy}>{fields.map(f=><label key={f.key}>{f.label}{f.multiline?<textarea name={f.key} defaultValue={f.value} maxLength={f.max} rows={4} required autoFocus/>:<input name={f.key} defaultValue={f.value} maxLength={f.max} required autoFocus/>}</label>)}<ErrorMessage text={writer.error}/><div className={s.actions}><button className={s.primary}>Gem rettelse</button><button type="button" className={s.secondary} onClick={()=>setEditing(false)}>Annuller</button></div></fieldset></form>;
}

function Statements(){
 const headings=useRows<WorkshopHeading>("headings");const [group,setGroup]=useState(1),[headingId,setHeadingId]=useState("");
 const [title,setTitle]=useState(""),[text,setText]=useState(""),[notice,setNotice]=useState("");
 const input=useRef<HTMLTextAreaElement>(null),titleInput=useRef<HTMLInputElement>(null);const writer=useWriter();const newId=useEntryId();
 const groupHeadings=headings.rows.filter(h=>h.group_number===group);
 const active=groupHeadings.find(h=>h.id===headingId);
 const statements=useRows<WorkshopStatement>("statements",`&heading=${active?.id||"00000000-0000-4000-8000-000000000000"}`);
 useEffect(()=>{if(active&&!active.closed&&!statements.loading)requestAnimationFrame(()=>input.current?.focus());},[headingId,statements.loading,active?.closed]);
 function chooseGroup(n:number){if(writer.busy)return;setGroup(n);setHeadingId("");setNotice("");}
 async function createHeading(event:FormEvent){event.preventDefault();const data={resource:"headings",group_number:group,title};const saved=await writer.send<WorkshopHeading>({...data,id:newId(data)});if(saved){newId.reset();headings.setRows(items=>[{...saved,statements:[]},...items]);setHeadingId(saved.id);setTitle("");setNotice("Overskriften er klar. Indtast det første udsagn.");}}
 async function saveStatement(event:FormEvent){event.preventDefault();if(!active||active.closed||!text.trim())return;const data={resource:"statements",heading_id:active.id,text:text.trim()};const saved=await writer.send<WorkshopStatement>({...data,id:newId(data)});if(saved){newId.reset();statements.setRows(items=>[saved,...items.filter(item=>item.id!==saved.id)]);statements.setTotal(n=>n+1);headings.setRows(items=>items.map(h=>h.id===active.id?{...h,statements:[{count:(h.statements[0]?.count||0)+1}]}:h));setText("");setNotice("Gemt · klar til næste udsagn");requestAnimationFrame(()=>input.current?.focus());}}
 async function toggleClosed(){if(!active)return;const saved=await writer.send<WorkshopHeading>({resource:"headings",id:active.id,closed:!active.closed,updated_at:active.updated_at},"PATCH");if(saved){headings.setRows(items=>items.map(h=>h.id===saved.id?{...h,...saved}:h));if(saved.closed){setHeadingId("");setNotice("Overskriften er lukket. Opret den næste eller vælg en tidligere.");requestAnimationFrame(()=>titleInput.current?.focus());}else{requestAnimationFrame(()=>input.current?.focus());}}}
 return <><GroupTabs group={group} onChange={chooseGroup} disabled={writer.busy||Boolean(text.trim())}/><ErrorMessage text={headings.error} retry={headings.retry}/><div className={s.statementLayout}>
  <aside className={s.headingList}><div className={s.sectionTop}><h2>Gruppens overskrifter</h2><span>{groupHeadings.length}</span></div>{headings.loading?<p>Henter overskrifter …</p>:!groupHeadings.length?<p className={s.muted}>Ingen overskrifter endnu. Begynd med at oprette den første.</p>:groupHeadings.map(h=><button className={s.headingItem} key={h.id} aria-pressed={h.id===headingId} disabled={writer.busy||Boolean(text.trim())} onClick={()=>{setHeadingId(h.id);setNotice("");}}><strong>{h.title}</strong><span>{h.statements[0]?.count||0} udsagn · {h.closed?"Lukket":"Åben"}</span></button>)}<button className={s.secondary} type="button" disabled={writer.busy||Boolean(text.trim())} onClick={()=>{setHeadingId("");requestAnimationFrame(()=>titleInput.current?.focus());}}>Ny overskrift <UiIcon name="arrow"/></button></aside>
  <section className={s.workspace}>
   {!active?<form onSubmit={createHeading}><span className={s.eyebrow}>GRUPPE {group} · NY OVERSKRIFT</span><h2>Hvad kalder I samlingen?</h2><label>Overskrift<input ref={titleInput} value={title} onChange={e=>setTitle(e.target.value)} maxLength={200} required disabled={writer.busy||headings.loading||Boolean(headings.error)} placeholder="Skriv gruppens overskrift"/></label><button className={s.primary} disabled={writer.busy||headings.loading||Boolean(headings.error)||!title.trim()}>{writer.busy?"Gemmer …":"Start indtastning"}<UiIcon name="arrow"/></button></form>:<>
   <div className={s.sectionTop}><div><span className={s.eyebrow}>GRUPPE {group} · {active.closed?"LUKKET":"ÅBEN"}</span><h2>{active.title}</h2></div><button className={s.secondary} type="button" disabled={writer.busy||Boolean(text.trim())} title={text.trim()?"Gem dit udsagn først":undefined} onClick={toggleClosed}>{active.closed?"Genåbn overskrift":"Luk overskrift"}</button></div>
   <Editor resource="headings" row={active} fields={[{key:"title",label:"Overskrift",value:active.title,max:200}]} onSaved={(value:WorkshopHeading)=>headings.setRows(items=>items.map(h=>h.id===value.id?{...h,...value}:h))}/>
   {!active.closed?<form className={s.quickEntry} onSubmit={saveStatement}><label htmlFor="workshop-statement">Karneval er…</label><textarea id="workshop-statement" ref={input} value={text} onChange={e=>setText(e.target.value)} onKeyDown={enterSubmit} maxLength={3000} rows={3} required disabled={writer.busy||statements.loading} placeholder="Skriv ét udsagn ad gangen …"/><div className={s.entryFooter}><span>Enter gemmer · Shift + Enter laver linjeskift</span><button className={s.primary} disabled={writer.busy||statements.loading||!text.trim()}>{writer.busy?"Gemmer …":"Gem udsagn"}<UiIcon name="check"/></button></div></form>:<p className={s.closedNote}>Overskriften er lukket. Udsagnene er gemt, og du kan genåbne den for at tilføje flere.</p>}
   <div className={s.sectionTop}><h3>Gemte udsagn</h3><span>{active.statements[0]?.count||0}</span></div><ErrorMessage text={statements.error} retry={statements.retry}/>{statements.loading?<p>Henter udsagn …</p>:!statements.rows.length?<p className={s.muted}>Det første udsagn får sin plads her.</p>:<ol className={s.statementList}>{statements.rows.map(item=><li key={item.id}><p>{item.text}</p><Editor resource="statements" row={item} fields={[{key:"text",label:"Udsagn",value:item.text,max:3000,multiline:true}]} onSaved={(value:WorkshopStatement)=>statements.setRows(items=>items.map(row=>row.id===value.id?value:row))}/></li>)}</ol>}{statements.rows.length<statements.total&&<button className={s.secondary} disabled={statements.more} onClick={statements.loadMore}>{statements.more?"Henter …":"Vis flere udsagn"}</button>}
   </>}
   <ErrorMessage text={writer.error}/><p className={s.saved} role="status">{notice}</p>
  </section></div></>;
}

function Stories(){
 const stories=useRows<WorkshopStory>("stories");const writer=useWriter(),newId=useEntryId();
 const [name,setName]=useState(""),[text,setText]=useState(""),[notice,setNotice]=useState("");const nameInput=useRef<HTMLInputElement>(null);
 async function save(event:FormEvent){event.preventDefault();const data={resource:"stories",name:name.trim(),text:text.trim()};const result=await writer.send<WorkshopStory>({...data,id:newId(data)});if(result){newId.reset();stories.setRows(items=>[result,...items.filter(item=>item.id!==result.id)]);stories.setTotal(n=>n+1);setName("");setText("");setNotice("Oplevelsen er gemt. Klar til den næste.");requestAnimationFrame(()=>nameInput.current?.focus());}}
 return <div className={s.storyLayout}><section className={s.workspace}><span className={s.eyebrow}>EN PERSON · EN OPLEVELSE</span><h2>Tilføj en historie</h2><form onSubmit={save}><fieldset disabled={writer.busy||stories.loading||Boolean(stories.error)}><label>Navn<input ref={nameInput} value={name} onChange={e=>setName(e.target.value)} maxLength={160} required placeholder="Deltagerens navn"/></label><label>Min oplevelse<textarea value={text} onChange={e=>setText(e.target.value)} maxLength={12000} rows={8} required placeholder="Skriv historien, som deltageren har fortalt den …"/></label><ErrorMessage text={writer.error}/><button className={s.primary} disabled={!name.trim()||!text.trim()}>{writer.busy?"Gemmer …":"Gem oplevelse"}<UiIcon name="check"/></button></fieldset></form><p className={s.saved} role="status">{notice}</p></section><section><div className={s.sectionTop}><h2>Oplevelser</h2><span>{stories.total}</span></div><ErrorMessage text={stories.error} retry={stories.retry}/>{stories.loading?<p>Henter oplevelser …</p>:!stories.rows.length?<div className={s.empty}>Her samles de personlige historier fra Sjælemødet. Ingen oplevelser er indtastet endnu.</div>:stories.rows.map(item=><article key={item.id} className={s.story}><h3>{item.name}</h3><p>{item.text}</p><Editor resource="stories" row={item} fields={[{key:"name",label:"Navn",value:item.name,max:160},{key:"text",label:"Oplevelse",value:item.text,max:12000,multiline:true}]} onSaved={(value:WorkshopStory)=>stories.setRows(items=>items.map(row=>row.id===value.id?value:row))}/></article>)}{stories.rows.length<stories.total&&<button className={s.secondary} disabled={stories.more} onClick={stories.loadMore}>{stories.more?"Henter …":"Vis flere oplevelser"}</button>}</section></div>;
}
function SummaryForm({group,row,onSaved}:{group:number;row?:WorkshopSummary;onSaved:(row:WorkshopSummary)=>void}){
 const [text,setText]=useState(row?.text||""),[notice,setNotice]=useState("");const writer=useWriter();
 async function save(event:FormEvent){event.preventDefault();const result=await writer.send<WorkshopSummary>({resource:"summaries",group_number:group,text,updated_at:row?.updated_at},row?"PATCH":"POST");if(result){onSaved(result);setNotice("Gruppens formulering er gemt.");}}
 return <section className={s.workspace}><span className={s.eyebrow}>GRUPPE {group}</span><h2>Sjælen af Karneval</h2><form onSubmit={save}><label htmlFor={`summary-${group}`}>Gruppens samlede formulering<textarea id={`summary-${group}`} value={text} onChange={e=>{setText(e.target.value);setNotice("");}} disabled={writer.busy} maxLength={12000} required rows={10} placeholder="Skriv gruppens formulering her …"/></label><ErrorMessage text={writer.error}/><button className={s.primary} disabled={writer.busy||!text.trim()||text===row?.text}>{writer.busy?"Gemmer …":"Gem formulering"}<UiIcon name="check"/></button></form><p className={s.saved} role="status">{notice|| (row&&text===row.text?"Gemt":"")}</p></section>;
}
function Summaries(){const summaries=useRows<WorkshopSummary>("summaries");return <><ErrorMessage text={summaries.error} retry={summaries.retry}/>{summaries.loading?<p>Henter gruppernes formuleringer …</p>:summaries.error?null:<div className={s.summaries}>{[1,2,3].map(group=><SummaryForm key={`${group}:${summaries.rows.find(r=>r.group_number===group)?.updated_at||"new"}`} group={group} row={summaries.rows.find(r=>r.group_number===group)} onSaved={row=>summaries.setRows(items=>[...items.filter(item=>item.group_number!==row.group_number),row])}/>)}</div>}</>;}
export default function WorkshopApp({section}:{section:WorkshopSection}){
 const pathname=usePathname();const page=WORKSHOP_PAGES.find(p=>p.slug===section)!;
 return <div className={s.page}><header className={s.header}><span className={s.eyebrow}>SJÆLEMØDE · WORKSHOP</span><h1>{section==="karneval-er"?<>Karneval er<span>…</span></>:<>{page.label}<span>.</span></>}</h1><p>{section==="karneval-er"?"Deltagernes udsagn, samlet under gruppernes egne overskrifter.":section==="min-oplevelse"?"De konkrete historier og øjeblikke fra deltagernes karneval.":"Tre grupper. Tre formuleringer af sjælen i Aalborg Karneval."}</p></header><nav className={s.tabs} aria-label="Sjælemødets materiale">{WORKSHOP_PAGES.map(p=><Link key={p.slug} href={`/sjaelemoede/${p.slug}`} aria-current={pathname.endsWith(p.slug)?"page":undefined}>{p.label}</Link>)}</nav>{section==="karneval-er"?<Statements/>:section==="min-oplevelse"?<Stories/>:<Summaries/>}</div>;
}
