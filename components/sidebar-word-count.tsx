"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { fetchJson } from "@/lib/fetch-json";
export default function SidebarWordCount() {
 const pathname=usePathname();
 const [total,setTotal]=useState<number|null>(null),[error,setError]=useState(false);
 useEffect(()=>{
  const desktop=window.matchMedia("(min-width: 721px)");
  const controller=new AbortController();let pending=false;
  async function refresh(){
   if(!desktop.matches||document.visibilityState!=="visible"||pending||controller.signal.aborted)return;
   pending=true;
   try {const data=await fetchJson<{total:number}>("/api/ordtal",controller.signal);if(!Number.isSafeInteger(data.total)||data.total<0)throw new Error();if(!controller.signal.aborted){setTotal(data.total);setError(false);}}
   catch {if(!controller.signal.aborted)setError(true);}finally{pending=false;}
  }
  void refresh();const timer=setInterval(()=>{void refresh();},60000);
  desktop.addEventListener("change",refresh);document.addEventListener("visibilitychange",refresh);
  return ()=>{controller.abort();clearInterval(timer);desktop.removeEventListener("change",refresh);document.removeEventListener("visibilitychange",refresh);};
 },[pathname]);
 return <div className="sidebar-word-count" title="Ord i alle citater, spørgeskemasvar og workshoptekster. Navne og metadata tælles ikke. Overførte citater tæller også med i deres oprindelige besvarelse. Opdateres løbende."><span>Ord i Sjælen</span><strong>{total===null?"—":new Intl.NumberFormat("da-DK").format(total)}</strong>{error&&<small>{total===null?"Kan ikke hentes lige nu":"Opdatering afventer"}</small>}</div>;
}
