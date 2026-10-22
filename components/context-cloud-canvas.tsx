'use client';
import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { forceSimulation, forceLink, forceManyBody, forceX, forceY, type Simulation, type SimulationNodeDatum, type SimulationLinkDatum } from 'd3-force';
import type { CloudEdge, CloudTerm } from '@/lib/word-cloud';
import styles from './context-cloud.module.css';
type Node = SimulationNodeDatum & {id:string; width:number; font:number; group:number};
type Camera = {x:number;y:number;k:number};
function collideLabels(list:Node[]) {
 return () => {
  for(let pass=0;pass<2;pass++) for(let i=0;i<list.length;i++) for(let j=i+1;j<list.length;j++) {
   const a=list[i],b=list[j],dx=(b.x||0)+(b.vx||0)-(a.x||0)-(a.vx||0),dy=(b.y||0)+(b.vy||0)-(a.y||0)-(a.vy||0);
   const overlapX=(a.width+b.width)/2+12-Math.abs(dx),overlapY=(a.font+b.font)*.8+10-Math.abs(dy);
   if(overlapX<=0||overlapY<=0)continue;
   if(overlapX<overlapY){const move=(dx>=0?1:-1)*overlapX*.4;if(a.fx==null)a.vx=(a.vx||0)-move;if(b.fx==null)b.vx=(b.vx||0)+move;}
   else {const move=(dy>=0?1:-1)*overlapY*.4;if(a.fy==null)a.vy=(a.vy||0)-move;if(b.fy==null)b.vy=(b.vy||0)+move;}
  }
 };
}
export const cloudColor = (group:number) => `hsl(${(group*137.508+5)%360} 48% 36%)`;
export default function ContextCloudCanvas({terms,edges,membership,focus,activeGroup,showLines,onWord,reset}:{terms:CloudTerm[];edges:CloudEdge[];membership:Map<string,number>;focus:string[];activeGroup:number|null;showLines:boolean;onWord:(id:string)=>void;reset:number}) {
 const svg=useRef<SVGSVGElement>(null),root=useRef<HTMLDivElement>(null);
 const sim=useRef<Simulation<Node,SimulationLinkDatum<Node>>|null>(null);
 const nodes=useRef(new Map<string,Node>());
 const reduced=useRef(false);
 const [size,setSize]=useState({width:900,height:620});
 const [points,setPoints]=useState(new Map<string,{x:number;y:number}>());
 const [camera,setCamera]=useState<Camera>({x:0,y:0,k:1});
 const cameraRef=useRef(camera); cameraRef.current=camera;
 const drag=useRef<{id:string|null;pointer:number;startX:number;startY:number;camera:Camera;moved:boolean}|null>(null);
 const world={width:Math.max(1150,Math.sqrt(terms.length/50)*1150),height:Math.max(780,Math.sqrt(terms.length/50)*780)};
 const worldRef=useRef(world); worldRef.current=world;
 const publish=()=>setPoints(new Map([...nodes.current].map(([id,n])=>[id,{x:n.x||0,y:n.y||0}])));
 useEffect(()=>{if(!root.current)return;const observer=new ResizeObserver(([entry])=>setSize({width:entry.contentRect.width,height:entry.contentRect.height}));observer.observe(root.current);return()=>observer.disconnect();},[]);
 useEffect(()=>{const media=matchMedia('(prefers-reduced-motion: reduce)');const update=()=>{reduced.current=media.matches;if(media.matches)sim.current?.stop();};update();media.addEventListener('change',update);return()=>media.removeEventListener('change',update);},[]);
 useEffect(()=>{
  const maximum=Math.max(1,...terms.map(t=>t.count)), groupCount=Math.max(1,...membership.values())+1;
  const list:Node[]=terms.map((t,i)=>{const font=17+18*Math.sqrt(t.count/maximum),group=membership.get(t.id)||0,angle=(group/groupCount)*Math.PI*2;return{id:t.id,font,width:Math.max(50,t.label.length*font*.55+20),group,x:world.width/2+Math.cos(angle)*world.width*.23+Math.cos(i*2.4)*70,y:world.height/2+Math.sin(angle)*world.height*.23+Math.sin(i*2.4)*70};});
  nodes.current=new Map(list.map(n=>[n.id,n]));
  const links=edges.map(e=>({source:e.source,target:e.target,strength:e.strength}));
  const simulation=forceSimulation(list).force('charge',forceManyBody().strength(-70))
   .force('link',forceLink<Node,SimulationLinkDatum<Node>&{strength:number}>(links).id(n=>n.id).distance(110).strength(e=>e.strength*.15))
   .force('x',forceX<Node>(n=>world.width/2+Math.cos(n.group/groupCount*Math.PI*2)*world.width*.25).strength(.055))
   .force('y',forceY<Node>(n=>world.height/2+Math.sin(n.group/groupCount*Math.PI*2)*world.height*.25).strength(.065))
   .force('collision',collideLabels(list)).velocityDecay(.65).alphaDecay(.06).stop();
  sim.current=simulation;simulation.tick(150);publish();
  return()=>{simulation.stop();};
 },[terms,edges,membership,reset]);
 function fitCamera() {
  const list=[...nodes.current.values()];
  const minX=list.length?Math.min(...list.map(n=>(n.x||0)-n.width/2))-45:0;
  const maxX=list.length?Math.max(...list.map(n=>(n.x||0)+n.width/2))+45:worldRef.current.width;
  const minY=list.length?Math.min(...list.map(n=>(n.y||0)-n.font))-60:0;
  const maxY=list.length?Math.max(...list.map(n=>(n.y||0)+n.font))+60:worldRef.current.height;
  const fit=Math.min(size.width/(maxX-minX),size.height/(maxY-minY))*.93;
  const k=Math.min(1.2,fit);
  setCamera({x:size.width/2-(minX+maxX)*k/2,y:size.height/2-(minY+maxY)*k/2,k});
 }
 useEffect(()=>{fitCamera();},[size.width,size.height,terms,reset]);
 function zoom(factor:number,at={x:size.width/2,y:size.height/2}) {setCamera(p=>{const k=Math.max(.18,Math.min(3.5,p.k*factor));return{x:at.x-(at.x-p.x)*k/p.k,y:at.y-(at.y-p.y)*k/p.k,k};});}
 useEffect(()=>{const element=svg.current;if(!element)return;const wheel=(event:WheelEvent)=>{event.preventDefault();const rect=element.getBoundingClientRect();const p=cameraRef.current,k=Math.max(.18,Math.min(3.5,p.k*Math.exp(-event.deltaY*.0015))),x=event.clientX-rect.left,y=event.clientY-rect.top;setCamera({x:x-(x-p.x)*k/p.k,y:y-(y-p.y)*k/p.k,k});};element.addEventListener('wheel',wheel,{passive:false});return()=>element.removeEventListener('wheel',wheel);},[]);
 function point(event:PointerEvent<SVGSVGElement>) {const rect=svg.current!.getBoundingClientRect();return{x:(event.clientX-rect.left-cameraRef.current.x)/cameraRef.current.k,y:(event.clientY-rect.top-cameraRef.current.y)/cameraRef.current.k};}
 function finish(event:PointerEvent<SVGSVGElement>,cancel=false){const current=drag.current;if(!current||current.pointer!==event.pointerId)return;drag.current=null;if(svg.current?.hasPointerCapture(event.pointerId))svg.current.releasePointerCapture(event.pointerId);if(current.id){const n=nodes.current.get(current.id);if(n){n.fx=null;n.fy=null;}sim.current?.stop();if(!cancel&&!current.moved)onWord(current.id);}}
 return <div className={styles.canvas} ref={root}>
  <div className={styles.mapTools}><button aria-label="Zoom ind" onClick={()=>zoom(1.3)}>+</button><button aria-label="Zoom ud" onClick={()=>zoom(1/1.3)}>−</button><button onClick={()=>fitCamera()}>Vis hele kortet</button><span>{Math.round(camera.k*100)} %</span></div>
  <svg ref={svg} viewBox={`0 0 ${size.width} ${size.height}`} aria-label="Interaktiv ordsky. Vælg ord for at dykke ned i deres sammenhæng." onPointerDown={event=>{if(event.button!==0||drag.current)return;svg.current?.setPointerCapture(event.pointerId);drag.current={id:null,pointer:event.pointerId,startX:event.clientX,startY:event.clientY,camera:cameraRef.current,moved:false};}} onPointerMove={event=>{const d=drag.current;if(!d||d.pointer!==event.pointerId)return;if(Math.hypot(event.clientX-d.startX,event.clientY-d.startY)>5)d.moved=true;if(d.id){const n=nodes.current.get(d.id),p=point(event);if(n){n.fx=n.x=p.x;n.fy=n.y=p.y;if(!reduced.current){sim.current?.alpha(.12).restart();sim.current?.on('tick',publish);}else{sim.current?.tick(3);publish();}}}else setCamera({...d.camera,x:d.camera.x+event.clientX-d.startX,y:d.camera.y+event.clientY-d.startY});}} onPointerUp={event=>finish(event)} onPointerCancel={event=>finish(event,true)}>
   <g transform={`translate(${camera.x},${camera.y}) scale(${camera.k})`}>
    {showLines&&edges.map(e=>{const a=points.get(e.source),b=points.get(e.target);return a&&b?<line key={e.source+'|'+e.target} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={cloudColor(membership.get(e.source)||0)} strokeWidth={.6+e.strength*1.8} opacity={activeGroup!==null&&membership.get(e.source)!==activeGroup ? .03 : .18}><title>{e.source} + {e.target} · {e.count} fælles bidrag</title></line>:null;})}
    {terms.map(term=>{const n=nodes.current.get(term.id),p=points.get(term.id);if(!n||!p)return null;const dim=activeGroup!==null&&n.group!==activeGroup;return <g key={term.id} role="button" tabIndex={0} aria-label={`${term.label}, ${term.count} af ${term.globalCount} bidrag. Vælg for at dykke ned.`} className={styles.word} transform={`translate(${p.x},${p.y})`} opacity={dim ? .16 : 1} onPointerDown={event=>{event.stopPropagation();if(event.button!==0||drag.current)return;svg.current?.setPointerCapture(event.pointerId);drag.current={id:term.id,pointer:event.pointerId,startX:event.clientX,startY:event.clientY,camera:cameraRef.current,moved:false};}} onClick={event=>{if(event.detail===0)onWord(term.id);}} onKeyDown={event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();onWord(term.id);}else if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)){event.preventDefault();n.x=(n.x||0)+(event.key==='ArrowLeft'?-18:event.key==='ArrowRight'?18:0);n.y=(n.y||0)+(event.key==='ArrowUp'?-18:event.key==='ArrowDown'?18:0);publish();}}}>
      <title>{term.label} · {term.count} bidrag i udsnittet · {term.globalCount} i materialet</title><rect x={-n.width/2} y={-n.font*.8} width={n.width} height={n.font*1.55} rx="8" fill={focus.includes(term.id)?'#f2e2d7':'#fcfaf6'} fillOpacity={focus.includes(term.id)?1:.88}/><text textAnchor="middle" dominantBaseline="central" fontSize={n.font} fontWeight={focus.includes(term.id)?650:500} fill={cloudColor(n.group)}>{term.label}</text>
     </g>;})}
   </g>
  </svg><span className={styles.mapHint}>Klik på ord · Træk i kortet · Rul eller brug + / − for at zoome</span>
 </div>;
}
