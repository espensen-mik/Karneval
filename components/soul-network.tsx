"use client";

import { forceCollide, forceLink, forceManyBody, forceSimulation, forceX, forceY, Simulation, SimulationLinkDatum, SimulationNodeDatum } from "d3-force";
import { KeyboardEvent, PointerEvent, useEffect, useRef, useState } from "react";
import { nodeRadius } from "@/lib/soul-analysis";
import type { SoulEdge, SoulTerm } from "@/lib/soul-types";

type Node = SimulationNodeDatum & { id: string; radius: number; collision: number };
type Point = { x: number; y: number };

function labelLines(label: string) {
  const short = (text: string) => text.length > 24 ? text.slice(0, 23) + "…" : text;
  if (label.length <= 17 || !label.includes(" ")) return [short(label)];
  const words = label.split(" ");
  const middle = Math.ceil(words.length / 2);
  return [short(words.slice(0, middle).join(" ")), short(words.slice(middle).join(" "))];
}

export default function SoulNetwork({ terms, edges, highlighted, selectedId, onTerm, onEdge, reset, colors }: {
  terms: SoulTerm[]; edges: SoulEdge[]; highlighted: Set<string> | null; selectedId: string | null;
  onTerm: (id: string) => void; onEdge: (id: string) => void; reset: number; colors: Map<string, string>;
}) {
  const root = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const simulation = useRef<Simulation<Node, SimulationLinkDatum<Node>> | null>(null);
  const nodeMap = useRef(new Map<string, Node>());
  const reduced = useRef(false);
  const lastReset = useRef(reset);
  const drag = useRef<{ id: string; pointer: number; x: number; y: number; moved: boolean } | null>(null);
  const [size, setSize] = useState({ width: 900, height: 640 });
  const [positions, setPositions] = useState(new Map<string, Point>());
  const maxCount = Math.max(1, ...terms.map((term) => term.count));

  useEffect(() => {
    if (!root.current) return;
    const observer = new ResizeObserver(([entry]) => setSize({ width: entry.contentRect.width, height: entry.contentRect.height }));
    observer.observe(root.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => { reduced.current = preference.matches; if (preference.matches) simulation.current?.stop(); };
    update(); preference.addEventListener("change", update);
    return () => preference.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const { width, height } = size;
    const old = nodeMap.current;
    const nodes: Node[] = terms.map((term, index) => {
      const radius = nodeRadius(term.count, maxCount);
      const previous = reset === lastReset.current ? old.get(term.id) : undefined;
      const angle = index * 2.399963;
      const distance = Math.sqrt(index) * 48;
      const textWidth = Math.max(...labelLines(term.label).map((line) => line.length)) * 7;
      return { id: term.id, radius, collision: Math.max(radius + 10, textWidth / 2 + 7), x: previous?.x ?? width / 2 + Math.cos(angle) * distance, y: previous?.y ?? height / 2 + Math.sin(angle) * distance, fx: previous?.fx, fy: previous?.fy };
    });
    lastReset.current = reset;
    nodeMap.current = new Map(nodes.map((node) => [node.id, node]));
    const links = edges.filter((edge) => edge.kind === "documented").map((edge) => ({ source: edge.source, target: edge.target, count: edge.count }));
    const sim = forceSimulation(nodes)
      .force("links", forceLink<Node, SimulationLinkDatum<Node> & { count: number }>(links).id((node) => node.id).distance((link) => 150 - 16 * Math.log2(link.count + 1)).strength((link) => .045 + .08 * link.count / maxCount))
      .force("charge", forceManyBody().strength(-260))
      .force("x", forceX(width / 2).strength(.022))
      .force("y", forceY(height / 2).strength(.035))
      .force("collide", forceCollide<Node>().radius((node) => node.collision).iterations(3))
      .velocityDecay(.62).alphaDecay(.045).stop();
    simulation.current = sim;
    const publish = () => {
      const next = new Map<string, Point>();
      for (const node of nodes) {
        const margin = node.collision + 8;
        node.x = Math.max(Math.min(margin, width / 2), Math.min(width - margin, node.x ?? width / 2));
        node.y = Math.max(node.radius + 24, Math.min(height - node.radius - 24, node.y ?? height / 2));
        next.set(node.id, { x: node.x, y: node.y });
      }
      setPositions(next);
    };
    // Settle before first paint; then only a short, damped motion remains.
    sim.tick(reduced.current ? 180 : 70);
    publish();
    sim.on("tick", publish);
    if (!reduced.current) sim.alpha(.15).restart();
    return () => { sim.stop(); };
  }, [terms, edges, size, reset, maxCount]);

  function position(event: PointerEvent) {
    const matrix = svg.current?.getScreenCTM();
    if (!matrix) return { x: 0, y: 0 };
    return new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
  }
  function settle() {
    if (reduced.current) {
      simulation.current?.tick(12);
      setPositions(new Map([...nodeMap.current].map(([id, node]) => [id, { x: node.x ?? 0, y: node.y ?? 0 }])));
    } else simulation.current?.alpha(.2).restart();
  }
  function pointerDown(event: PointerEvent<SVGGElement>, id: string) {
    if (!event.isPrimary || event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    event.currentTarget.focus();
    drag.current = { id, pointer: event.pointerId, x: event.clientX, y: event.clientY, moved: false };
  }
  function pointerMove(event: PointerEvent<SVGGElement>) {
    const active = drag.current;
    if (!active || active.pointer !== event.pointerId) return;
    active.moved ||= Math.hypot(event.clientX - active.x, event.clientY - active.y) > 5;
    if (!active.moved) return;
    const point = position(event), node = nodeMap.current.get(active.id);
    if (!node) return;
    node.fx = Math.max(node.collision, Math.min(size.width - node.collision, point.x));
    node.fy = Math.max(node.radius + 24, Math.min(size.height - node.radius - 24, point.y));
    settle();
  }
  function release(event: PointerEvent<SVGGElement>, cancel = false) {
    const active = drag.current;
    if (!active || active.pointer !== event.pointerId) return;
    drag.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    if (!cancel && !active.moved) onTerm(active.id);
    else {
      const node = nodeMap.current.get(active.id);
      if (node) { node.fx = null; node.fy = null; }
      settle();
    }
  }
  function keyboard(event: KeyboardEvent<SVGGElement>, id: string) {
    if (["Enter", " "].includes(event.key)) { event.preventDefault(); onTerm(id); return; }
    const node = nodeMap.current.get(id);
    if (!node) return;
    if (event.key === "Escape") { node.fx = null; node.fy = null; settle(); return; }
    const delta: Record<string, [number, number]> = { ArrowLeft: [-20, 0], ArrowRight: [20, 0], ArrowUp: [0, -20], ArrowDown: [0, 20] };
    if (!delta[event.key]) return;
    event.preventDefault();
    node.fx = Math.max(node.collision, Math.min(size.width - node.collision, (node.x ?? 0) + delta[event.key][0]));
    node.fy = Math.max(node.radius + 24, Math.min(size.height - node.radius - 24, (node.y ?? 0) + delta[event.key][1]));
    settle();
  }
  const maxEdge = Math.max(1, ...edges.map((edge) => edge.count));
  return <div className="soul-network" ref={root}>
    <svg ref={svg} viewBox={`0 0 ${size.width} ${size.height}`} aria-label="Interaktivt ordnetværk" role="group" aria-describedby="soul-network-help">
      <title>Ord og dokumenterede forbindelser i citaterne</title>
      {edges.map((edge, edgeIndex) => {
        const a = positions.get(edge.source), b = positions.get(edge.target);
        if (!a || !b) return null;
        const siblings = edges.slice(0, edgeIndex).filter((previous) => previous.kind === "editorial" && [previous.source, previous.target].sort().join("|") === [edge.source, edge.target].sort().join("|")).length;
        const curve = 30 + siblings * 22;
        const d = edge.kind === "editorial" ? `M${a.x},${a.y} Q${(a.x + b.x) / 2 + curve / 2},${(a.y + b.y) / 2 - curve} ${b.x},${b.y}` : `M${a.x},${a.y} L${b.x},${b.y}`;
        return <g key={edge.id} className={`soul-edge ${edge.kind} ${selectedId === edge.id ? "selected" : ""}`} role="button" tabIndex={0} aria-label={`${edge.source} og ${edge.target}: ${edge.kind === "documented" ? `${edge.count} fælles bidrag` : "redaktionel forbindelse"}`} onClick={() => onEdge(edge.id)} onKeyDown={(event) => { if (["Enter", " "].includes(event.key)) { event.preventDefault(); onEdge(edge.id); } }}>
          <path className="soul-edge-hit" d={d} />
          <path className="soul-edge-ink" d={d} strokeWidth={edge.kind === "editorial" ? 1.4 : .6 + 2.6 * edge.count / maxEdge} style={{ opacity: edge.kind === "editorial" ? .65 : .18 + .45 * edge.count / maxEdge }} />
        </g>;
      })}
      {terms.map((term) => {
        const point = positions.get(term.id);
        if (!point) return null;
        const lines = labelLines(term.label), selected = selectedId === term.id;
        return <g key={term.id} data-term={term.id} role="button" tabIndex={0} transform={`translate(${point.x},${point.y})`} className={`soul-node ${selected ? "selected" : ""} ${highlighted && !highlighted.has(term.id) ? "dimmed" : ""}`} aria-label={`${term.label}, ${term.count} bidrag. Enter åbner detaljer. Piletaster flytter, Escape slipper.`} onClick={(event) => { if (event.detail === 0) onTerm(term.id); }} onPointerDown={(e) => pointerDown(e, term.id)} onPointerMove={pointerMove} onPointerUp={(e) => release(e)} onPointerCancel={(e) => release(e, true)} onKeyDown={(e) => keyboard(e, term.id)}>
          <circle className="soul-node-halo" r={nodeRadius(term.count, maxCount) + 6} />
          <circle className="soul-node-disc" r={nodeRadius(term.count, maxCount)} style={{ fill: colors.get(term.id) || (term.kind === "phrase" ? "#42636c" : "#c25148") }} />
          <text textAnchor="middle" fontSize={Math.min(23, 14 + 9 * term.count / maxCount)}>
            {lines.map((line, index) => <tspan key={index} x="0" dy={index === 0 ? (lines.length === 1 ? ".32em" : "-.25em") : "1.15em"}>{line}</tspan>)}
          </text>
          <title>{term.label}: {term.count} forskellige bidrag</title>
        </g>;
      })}
    </svg>
  </div>;
}
