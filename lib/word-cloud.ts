import { analyzeContributions, normalizeTerm } from './soul-analysis.ts';
import type { Contribution, SoulTerm } from './soul-types.ts';
export type CloudEdge = { source: string; target: string; count: number; strength: number };
export type CloudTerm = SoulTerm & { globalCount: number; specificity: number };
export function cloudIndex(input: Contribution[]) {
  const result = analyzeContributions(input);
  return { contributions: result.contributions, terms: result.terms, byId: new Map(result.terms.map(term => [term.id, term])) };
}
export type CloudIndex = ReturnType<typeof cloudIndex>;
export function cloudSlice(index: CloudIndex, options: { focus: string[]; hidden: string[]; source: string; category: string; minimum: number; kind: string; limit: number; nuances: boolean }) {
  const anchors = options.focus.map(id => index.byId.get(id)).filter((term): term is SoulTerm => Boolean(term));
  const focusSets = anchors.map(term => new Set(term.contributionIds));
  const base = index.contributions.filter(c => (options.source === 'all' || c.type === options.source) && (!options.category || c.category === options.category));
  const scope = base.filter(c => focusSets.every(ids => ids.has(c.id)));
  const ids = new Set(scope.map(c => c.id));
  const baseIds = new Set(base.map(c => c.id));
  const hidden = new Set(options.hidden);
  const all = index.terms.flatMap<CloudTerm>(term => {
    const contributionIds = term.contributionIds.filter(id => ids.has(id));
    if (!contributionIds.length) return [];
    const globalCount = term.contributionIds.filter(id => baseIds.has(id)).length;
    return [{ ...term, contributionIds, count: contributionIds.length, globalCount,
      specificity: base.length && scope.length ? contributionIds.length / scope.length / (globalCount / base.length) : 0 }];
  });
  const eligible = all.filter(term => !hidden.has(term.id) && term.count >= options.minimum && (options.kind === 'all' || term.kind === options.kind));
  const ranked = eligible.sort((a,b) => {
    if (options.nuances) {
      // In a focused slice: enrichment versus the source corpus. Otherwise reveal the long tail.
      const difference = anchors.length ? b.specificity - a.specificity : a.count - b.count;
      if (Math.abs(difference) > 1e-9) return difference;
    }
    return b.count - a.count || a.label.localeCompare(b.label,'da');
  });
  const terms = ranked.slice(0,options.limit);
  for (const anchor of anchors) {
    const term = all.find(t => t.id === anchor.id);
    if (term && !terms.some(t => t.id === term.id)) terms.push(term);
  }
  const sets = terms.map(term => new Set(term.contributionIds));
  const edges: CloudEdge[] = [];
  for(let i=0;i<terms.length;i++) for(let j=i+1;j<terms.length;j++) {
    let count=0;
    const [small,large] = sets[i].size<sets[j].size ? [sets[i],sets[j]] : [sets[j],sets[i]];
    for(const id of small) if(large.has(id)) count++;
    if(count) edges.push({source:terms[i].id,target:terms[j].id,count,strength:count/Math.sqrt(terms[i].count*terms[j].count)});
  }
  const eligibleIds = new Set(eligible.map(term => term.id));
  const pinnedCount = anchors.filter(anchor => !eligibleIds.has(anchor.id) && all.some(term => term.id === anchor.id)).length;
  return { contributions: scope, baseCount: base.length, terms, all, eligibleCount: eligible.length + pinnedCount, edges };
}

// Deterministic local modularity optimisation on the visible, weighted graph.
// Colours are structural groups, not inferred meanings or manually curated themes.
export function cloudGroups(terms: {id:string}[], edges: CloudEdge[]) {
  const ids = terms.map(t=>t.id).sort((a,b)=>a.localeCompare(b,'da'));
  const neighbours = new Map(ids.map(id=>[id,new Map<string,number>()]));
  for(const edge of edges) {
    neighbours.get(edge.source)?.set(edge.target,edge.strength);
    neighbours.get(edge.target)?.set(edge.source,edge.strength);
  }
  const degree = new Map(ids.map(id=>[id,[...neighbours.get(id)!.values()].reduce((a,b)=>a+b,0)]));
  const twiceWeight = [...degree.values()].reduce((a,b)=>a+b,0);
  const labels = new Map(ids.map(id=>[id,id]));
  const totals = new Map(degree);
  if(twiceWeight) for(let pass=0;pass<15;pass++) {
    let changed=false;
    for(const id of ids) {
      const current=labels.get(id)!, k=degree.get(id)!;
      totals.set(current,(totals.get(current)||0)-k);
      const weights=new Map<string,number>();
      for(const [other,weight] of neighbours.get(id)!) { const group=labels.get(other)!; weights.set(group,(weights.get(group)||0)+weight); }
      let best=current, gain=(weights.get(current)||0)-k*(totals.get(current)||0)/twiceWeight;
      for(const [candidate,weight] of weights) {
        const score=weight-k*(totals.get(candidate)||0)/twiceWeight;
        if(score>gain+1e-9) { best=candidate; gain=score; }
      }
      labels.set(id,best); totals.set(best,(totals.get(best)||0)+k);
      if(best!==current) changed=true;
    }
    if(!changed) break;
  }
  const buckets=new Map<string,string[]>();
  for(const [id,label] of labels) { if(!buckets.has(label)) buckets.set(label,[]); buckets.get(label)!.push(id); }
  const groups=[...buckets.values()].sort((a,b)=>b.length-a.length||a[0].localeCompare(b[0],'da'));
  return { groups, membership:new Map(groups.flatMap((group,i)=>group.map(id=>[id,i] as const))) };
}
export function findCloudTerms(terms: CloudTerm[], query: string) {
  const normalized=normalizeTerm(query);
  return normalized ? terms.filter(term=>term.label.includes(normalized)).sort((a,b)=>b.count-a.count||a.label.localeCompare(b.label,'da')).slice(0,12) : [];
}
