"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { fetchJson } from "@/lib/fetch-json";
import { WORKSHOP_PAGES, workshopGroups, type WorkshopArchive, type WorkshopSection } from "@/lib/workshop";
import s from "./workshop.module.css";

function StoryText({text,forceExpanded=false}:{text:string;forceExpanded?:boolean}) {
  const [expanded,setExpanded]=useState(false);
  useEffect(()=>{if(forceExpanded)setExpanded(true);},[forceExpanded]);
  const collapsible=text.length>280||text.split(/\r?\n/).length>5;
  return <><p className={expanded||!collapsible?s.storyText:`${s.storyText} ${s.storyPreview}`}>{text}</p>{collapsible&&<button type="button" className={s.readMore} aria-expanded={expanded} onClick={()=>setExpanded(value=>!value)}>{expanded?"Fold historien sammen":"Læs hele historien"}<span aria-hidden="true">{expanded?"−":"+"}</span></button>}</>;
}

export default function WorkshopApp({section}:{section:WorkshopSection}) {
  const pathname=usePathname();
  const [archive,setArchive]=useState<WorkshopArchive|null>(null);
  const [loading,setLoading]=useState(true),[error,setError]=useState("");
  const [reload,setReload]=useState(0),[group,setGroup]=useState(1),[search,setSearch]=useState("");
  const [anchor,setAnchor]=useState("");
  useEffect(()=>{
    const selected=Number(new URLSearchParams(window.location.search).get("gruppe"));
    if([1,2,3].includes(selected))setGroup(selected);
    setAnchor(window.location.hash.slice(1));
  },[]);
  useEffect(()=>{
    if(!loading&&anchor)document.getElementById(anchor)?.scrollIntoView({block:"start"});
  },[loading,anchor,group]);
  useEffect(()=>{
    const controller=new AbortController();setLoading(true);setError("");
    fetchJson<WorkshopArchive>("/api/sjaelemoede",controller.signal,20000)
      .then(data=>{if(!controller.signal.aborted)setArchive(data);})
      .catch(failure=>{if(!controller.signal.aborted)setError(failure.message);})
      .finally(()=>{if(!controller.signal.aborted)setLoading(false);});
    return ()=>controller.abort();
  },[reload]);
  const page=WORKSHOP_PAGES.find(page=>page.slug===section)!;
  const groups=archive?workshopGroups(archive,search):[];
  const current=groups.find(item=>item.number===group);
  const query=search.trim().toLocaleLowerCase("da");
  const stories=archive?.stories.filter(story=>!query||`${story.name} ${story.text}`.toLocaleLowerCase("da").includes(query))||[];
  const introductions={
    "karneval-er":"Ordene fra dagen. Samlet under de overskrifter, grupperne selv gav dem.",
    "min-oplevelse":"Personlige historier, særlige møder og øjeblikke, der bliver hængende.",
    "sjaelen-af-karneval":"Tre grupper satte ord på det, der gør Aalborg Karneval til noget særligt.",
  };
  return <div className={s.page}>
    <header className={s.header}><div><span className={s.eyebrow}>SJÆLEMØDE · STEMMER FRA WORKSHOPPEN</span><h1>{section==="karneval-er"?<>Karneval er<span>…</span></>:<>{page.label}<span>.</span></>}</h1><p>{introductions[section]}</p></div>{archive&&!error&&<div className={s.archiveCount}><strong>{section==="karneval-er"?archive.statements.length:section==="min-oplevelse"?archive.stories.length:archive.summaries.length}</strong><span>{section==="karneval-er"?"udsagn fra dagen":section==="min-oplevelse"?"personlige historier":"gruppeformuleringer"}</span></div>}</header>
    <nav className={s.tabs} aria-label="Sjælemødets materiale">{WORKSHOP_PAGES.map(page=><Link key={page.slug} href={`/sjaelemoede/${page.slug}`} aria-current={pathname.endsWith(page.slug)?"page":undefined}>{page.label}</Link>)}</nav>
    {error?<div className={s.empty} role="alert"><h2>Materialet kunne ikke hentes</h2><p>{error}</p><button className={s.secondary} onClick={()=>setReload(value=>value+1)}>Prøv igen</button></div>:loading?<p className={s.loading} role="status">Henter stemmerne fra Sjælemødet …</p>:archive&&<>
      {section!=="sjaelen-af-karneval"&&<div className={s.toolbar}>{section==="karneval-er"?<div className={s.groups} aria-label="Workshopgruppe">{groups.map(item=><button type="button" key={item.number} aria-pressed={group===item.number} onClick={()=>setGroup(item.number)}>Gruppe {item.number}<span>{query?item.matchedStatements:item.totalStatements}</span></button>)}</div>:<p className={s.collectionNote}>Deltagernes egne fortællinger</p>}<label className={s.search}><span>{section==="karneval-er"?"Søg i overskrifter og udsagn":"Søg i historier og navne"}</span><input type="search" value={search} onChange={event=>setSearch(event.target.value)} placeholder={section==="karneval-er"?"Hvilke ord leder du efter?":"Find en historie …"}/></label></div>}
      {section==="karneval-er"&&current&&<>
        <div className={s.groupHeading}><h2>Gruppe {group}</h2><p>{query?`${current.matchedStatements} udsagn matcher din søgning`:`${current.totalHeadings} overskrifter · ${current.totalStatements} udsagn`}</p></div>
        {current.headings.length>0?<><nav className={s.headingIndex} aria-label={`Overskrifter fra gruppe ${group}`}>{current.headings.map(heading=><a key={heading.id} href={`#workshop-${heading.id}`}>{heading.title}<span>{heading.statements.length}</span></a>)}</nav><div className={s.statementGrid}>{current.headings.map((heading,index)=><section key={heading.id} id={`workshop-${heading.id}`} className={s.statementCard}><header><span className={s.cardNumber}>{String(index+1).padStart(2,"0")}</span><div><h3>{heading.title}</h3><span>{heading.statements.length} udsagn</span></div></header>{heading.statements.length?<ul>{heading.statements.map(statement=><li key={statement.id}>{statement.text}</li>)}</ul>:<p className={s.muted}>Der er ikke registreret udsagn under denne overskrift.</p>}</section>)}</div></>:<div className={s.empty}>{query?"Ingen udsagn matcher. Prøv et andet ord eller vælg en anden gruppe.":"Der er ikke registreret udsagn fra denne gruppe."}</div>}
      </>}
      {section==="min-oplevelse"&&<>{query&&<p className={s.collectionNote} role="status">{stories.length} af {archive.stories.length} historier</p>}{stories.length?<div className={s.storyGrid}>{stories.map((story,index)=><article key={story.id} id={`story-${story.id}`} className={s.story}><header><span className={s.cardNumber}>{String(index+1).padStart(2,"0")}</span><h2>{story.name}</h2></header><StoryText text={story.text} forceExpanded={anchor===`story-${story.id}`}/></article>)}</div>:<div className={s.empty}>{query?"Ingen historier matcher din søgning.":"Der er ikke registreret personlige historier."}</div>}</>}
      {section==="sjaelen-af-karneval"&&<div className={s.summaries}>{[1,2,3].map(number=>{const summary=archive.summaries.find(item=>item.group_number===number);return <section className={s.summary} key={number} id={`summary-${number}`}><header><span className={s.summaryNumber}>{String(number).padStart(2,"0")}</span><h2>Gruppe {number}</h2></header>{summary?<p>{summary.text}</p>:<p className={s.muted}>Ingen formulering er registreret fra denne gruppe.</p>}</section>;})}</div>}
    </>}
  </div>;
}
