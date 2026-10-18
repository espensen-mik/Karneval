"use client";

import { forceCollide, forceManyBody, forceSimulation, forceX, forceY, Simulation, SimulationNodeDatum } from "d3-force";
import { KeyboardEvent, PointerEvent, useEffect, useRef, useState } from "react";
import { nodeRadius } from "@/lib/soul-analysis";
import type { SoulTerm } from "@/lib/soul-types";

type BubbleNode = SimulationNodeDatum & { id: string; radius: number; collision: number };
type Point = { x: number; y: number };
type Drag = { id: string; pointer: number; x: number; y: number; moved: boolean; target: string | null };

function lines(label: string) {
  const words = label.split(/\s+/);
  if (words.length === 1) return [label.length > 18 ? label.slice(0, 17) + "…" : label];
  const mid = Math.ceil(words.length / 2);
  return [words.slice(0, mid).join(" "), words.slice(mid).join(" ")].map((line) => line.length > 18 ? line.slice(0, 17) + "…" : line);
}

export default function WordPlayCanvas({ bubbles, scaleCount, selectedId, onSelect, onMerge, onRemove }: {
  scaleCount: number;
  bubbles: SoulTerm[]; selectedId: string | null; onSelect: (id: string) => void;
  onMerge: (source: string, target: string) => void; onRemove: (id: string) => void;
}) {
  const root = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const nodes = useRef(new Map<string, BubbleNode>());
  const simulation = useRef<Simulation<BubbleNode, undefined> | null>(null);
  const drag = useRef<Drag | null>(null);
  const reduced = useRef(false);
  const [size, setSize] = useState({ width: 900, height: 640 });
  const [points, setPoints] = useState(new Map<string, Point>());
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  // Keep the original material's scale while playing, so a merge really grows
  // the target bubble instead of shrinking every other bubble.
  const maxCount = Math.max(1, scaleCount);

  useEffect(() => {
    if (!root.current) return;
    const observer = new ResizeObserver(([entry]) => setSize({ width: entry.contentRect.width, height: entry.contentRect.height }));
    observer.observe(root.current);
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const change = () => { reduced.current = preference.matches; if (preference.matches) simulation.current?.stop(); };
    change(); preference.addEventListener("change", change);
    return () => { observer.disconnect(); preference.removeEventListener("change", change); };
  }, []);

  useEffect(() => {
    const previous = nodes.current;
    const list: BubbleNode[] = bubbles.map((bubble, index) => {
      const radius = nodeRadius(bubble.count, maxCount);
      const before = previous.get(bubble.id);
      const angle = index * 2.399963;
      return { id: bubble.id, radius, collision: Math.max(radius + 12, Math.max(...lines(bubble.label).map((line) => line.length)) * 3.7 + 8), x: before?.x ?? size.width / 2 + Math.cos(angle) * Math.sqrt(index) * 58, y: before?.y ?? size.height / 2 + Math.sin(angle) * Math.sqrt(index) * 58 };
    });
    nodes.current = new Map(list.map((node) => [node.id, node]));
    const sim = forceSimulation(list)
      .force("charge", forceManyBody().strength(-120))
      .force("x", forceX(size.width / 2).strength(.018))
      .force("y", forceY(size.height / 2).strength(.026))
      .force("collision", forceCollide<BubbleNode>().radius((node) => node.collision).iterations(3))
      .velocityDecay(.65).alphaDecay(.06).stop();
    simulation.current = sim;
    const publish = () => {
      const next = new Map<string, Point>();
      for (const node of list) {
        const margin = Math.min(node.collision + 6, size.width / 2);
        node.x = Math.max(margin, Math.min(size.width - margin, node.x ?? size.width / 2));
        node.y = Math.max(node.radius + 20, Math.min(size.height - node.radius - 20, node.y ?? size.height / 2));
        next.set(node.id, { x: node.x, y: node.y });
      }
      setPoints(next);
    };
    sim.tick(reduced.current ? 160 : 70); publish(); sim.on("tick", publish);
    if (!reduced.current) sim.alpha(.12).restart();
    return () => { sim.stop(); };
  }, [bubbles, size, maxCount]);

  function publishDrag(node: BubbleNode, x: number, y: number) {
    node.x = Math.max(node.radius + 10, Math.min(size.width - node.radius - 10, x));
    node.y = Math.max(node.radius + 20, Math.min(size.height - node.radius - 20, y));
    setPoints(new Map([...nodes.current].map(([id, item]) => [id, { x: item.x ?? 0, y: item.y ?? 0 }])));
  }
  function hitTarget(id: string) {
    const source = nodes.current.get(id);
    if (!source) return null;
    return [...nodes.current.values()].filter((node) => node.id !== id)
      .map((node) => ({ id: node.id, distance: Math.hypot((source.x ?? 0) - (node.x ?? 0), (source.y ?? 0) - (node.y ?? 0)), threshold: Math.max(18, Math.min(source.radius, node.radius) * .85) }))
      .filter((node) => node.distance < node.threshold).sort((a, b) => a.distance - b.distance)[0]?.id ?? null;
  }
  function down(event: PointerEvent<SVGGElement>, id: string) {
    if (!event.isPrimary || event.button !== 0) return;
    simulation.current?.stop();
    event.currentTarget.setPointerCapture(event.pointerId); event.currentTarget.focus();
    drag.current = { id, pointer: event.pointerId, x: event.clientX, y: event.clientY, moved: false, target: null };
  }
  function move(event: PointerEvent<SVGGElement>) {
    const current = drag.current;
    if (!current || current.pointer !== event.pointerId) return;
    current.moved ||= Math.hypot(event.clientX - current.x, event.clientY - current.y) > 5;
    if (!current.moved) return;
    const matrix = svg.current?.getScreenCTM(), node = nodes.current.get(current.id);
    if (!matrix || !node) return;
    const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
    publishDrag(node, point.x, point.y);
    current.target = hitTarget(current.id);
    setDropTarget(current.target); setDragging(current.id);
  }
  function release(event: PointerEvent<SVGGElement>, cancelled = false) {
    const current = drag.current;
    if (!current || current.pointer !== event.pointerId) return;
    drag.current = null; setDropTarget(null); setDragging(null);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    if (!cancelled && current.moved && current.target) onMerge(current.id, current.target);
    else if (!cancelled && !current.moved) onSelect(current.id);
    else if (!reduced.current) simulation.current?.alpha(.15).restart();
  }
  function keyboard(event: KeyboardEvent<SVGGElement>, id: string) {
    if (["Enter", " "].includes(event.key)) { event.preventDefault(); onSelect(id); return; }
    if (["Delete", "Backspace"].includes(event.key)) { event.preventDefault(); onRemove(id); return; }
    const node = nodes.current.get(id);
    if (!node) return;
    const delta: Record<string, [number, number]> = { ArrowLeft: [-20, 0], ArrowRight: [20, 0], ArrowUp: [0, -20], ArrowDown: [0, 20] };
    if (delta[event.key]) { event.preventDefault(); simulation.current?.stop(); publishDrag(node, (node.x ?? 0) + delta[event.key][0], (node.y ?? 0) + delta[event.key][1]); }
  }
  const targetLabel = bubbles.find((bubble) => bubble.id === dropTarget)?.label;
  return <div className="word-play-canvas" ref={root}>
    <svg ref={svg} viewBox={`0 0 ${size.width} ${size.height}`} role="group" aria-label="Leg med ord: bobler uden forbindelseslinjer" aria-describedby="word-play-help">
      {bubbles.map((bubble) => {
        const point = points.get(bubble.id), node = nodes.current.get(bubble.id);
        if (!point || !node) return null;
        const label = lines(bubble.label), minus = node.radius * .72;
        return <g key={bubble.id} data-bubble={bubble.id} transform={`translate(${point.x},${point.y})`} className={`word-bubble ${bubble.kind === "group" ? "is-group" : ""} ${selectedId === bubble.id ? "selected" : ""} ${dropTarget === bubble.id ? "drop-target" : ""} ${dragging === bubble.id ? "is-dragging" : ""}`}>
          <g className="word-bubble-body" role="button" tabIndex={0} aria-label={`${bubble.label}, ${bubble.count} forskellige bidrag${bubble.kind === "group" ? `, samlet fra ${bubble.variants.join(", ")}` : ""}. Enter åbner detaljer og sammenlægning. Delete fjerner boblen.`} onPointerDown={(event) => down(event, bubble.id)} onPointerMove={move} onPointerUp={(event) => release(event)} onPointerCancel={(event) => release(event, true)} onClick={(event) => { if (event.detail === 0) onSelect(bubble.id); }} onKeyDown={(event) => keyboard(event, bubble.id)}>
            <circle className="word-bubble-halo" r={node.radius + 7} />
            <circle className="word-bubble-disc" r={node.radius} />
            <text className="word-bubble-label" textAnchor="middle" fontSize={Math.min(21, 13 + 8 * bubble.count / maxCount)}>{label.map((line, index) => <tspan key={index} x="0" dy={index === 0 ? (label.length === 1 ? "-.1em" : "-.6em") : "1.1em"}>{line}</tspan>)}</text>
            <text className="word-bubble-count" textAnchor="middle" y={label.length === 1 ? 17 : 25}>{bubble.count} bidrag{bubble.kind === "group" ? ` · ${bubble.variants.length} ord` : ""}</text>
          </g>
          <g role="button" tabIndex={0} className="word-bubble-minus" transform={`translate(${minus},${-minus})`} aria-label={`Fjern ${bubble.label} fra legen`} onClick={() => onRemove(bubble.id)} onKeyDown={(event) => { if (["Enter", " "].includes(event.key)) { event.preventDefault(); event.stopPropagation(); onRemove(bubble.id); } }}>
            <circle r="13" /><path d="M-4,0 H4" />
          </g>
        </g>;
      })}
    </svg>
    <p className="word-play-drop-hint" role="status">{targetLabel ? `Slip for at samle med “${targetLabel}”` : ""}</p>
  </div>;
}
