import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analyzeContributions, networkEdges, nodeRadius, normalizeTerm } from '../lib/soul-analysis.ts';

// Deliberately tiny algorithm fixtures. Never seeded or displayed in the app.
const contribution = (id, text, category = 'Parade') => ({ id, text, type: 'quote', category, contextHref: '/citater', source: 'Afsenderinformation uden for selve teksten' });
const term = (analysis, label) => analysis.terms.find((term) => term.id === label);

test('count once per contribution; deduplicate identical contribution IDs; ignore metadata', () => {
  const result = analyzeContributions([contribution('a', 'Fællesskab, fællesskab og fællesskab.'), contribution('b', 'FÆLLESSKAB!'), contribution('b', 'FÆLLESSKAB!')]);
  assert.equal(term(result, 'fællesskab').count, 2);
  assert.equal(result.contributions.length, 2);
  assert(!term(result, 'afsenderinformation'));
  assert(!term(result, 'parade'));
  assert(!term(result, 'og'));
});

test('normalization preserves Danish distinctions without automatic stemming', () => {
  assert.equal(normalizeTerm('  FRIHED, ÆØÅ! '), 'frihed æøå');
  const result = analyzeContributions([contribution('a', 'Frihed og friheden.')]);
  assert.equal(term(result, 'frihed').count, 1);
  assert.equal(term(result, 'friheden').count, 1);
});

test('phrases must occur in at least two independent texts and cannot cross punctuation', () => {
  const result = analyzeContributions([contribution('a', 'God stemning. Være sig selv!'), contribution('b', 'God stemning og være sig selv.'), contribution('c', 'God. Stemning. God stemning.')]);
  assert.equal(term(result, 'god stemning').count, 3);
  assert.equal(term(result, 'være sig selv').count, 2);
  assert.equal(term(result, 'god stemning').kind, 'phrase');
  assert(!term(analyzeContributions([contribution('a', 'God stemning. God stemning.')]), 'god stemning'));
  assert(!term(analyzeContributions([contribution('a', 'God. Stemning.'), contribution('b', 'God. Stemning.')]), 'god stemning'));
});

test('manual synonym groups use the union of contributions, never sum overlapping counts', () => {
  const result = analyzeContributions([contribution('a', 'Fest og festen.'), contribution('b', 'Festen.'), contribution('c', 'Fest.')], [{ id: 'g', label: 'fest', terms: ['fest', 'festen'] }]);
  assert.equal(term(result, 'fest').count, 3);
  assert.deepEqual(term(result, 'fest').variants, ['fest', 'festen']);
  assert(!term(result, 'festen'));
});

test('shared categories do not create documented edges; editorial edges remain distinct', () => {
  const result = analyzeContributions([contribution('a', 'Frihed.'), contribution('b', 'Fællesskab.')]);
  const edges = networkEdges(result.terms, [{ id: 'l', source_term: 'frihed', target_term: 'fællesskab', note: 'Manual interpretation', example_quote_id: 'a' }], result.aliases);
  assert.equal(edges.documented.length, 0);
  assert.equal(edges.interpreted.length, 1);
  assert.equal(edges.interpreted[0].count, 0);
  assert.deepEqual(edges.interpreted[0].contributionIds, []);
});

test('edge evidence includes only independent contributions with both words', () => {
  const result = analyzeContributions([contribution('a', 'Frihed, frihed og fest.'), contribution('b', 'Frihed og fest.'), contribution('c', 'Frihed.')]);
  const edges = networkEdges(result.terms.filter((t) => ['frihed', 'fest'].includes(t.id)), [], result.aliases, 2);
  assert.equal(edges.documented[0].count, 2);
  assert.deepEqual(edges.documented[0].contributionIds, ['a', 'b']);
  assert.equal(networkEdges(result.terms, [], result.aliases, 4).documented.length, 0);
});

test('empty and unreadable texts produce no invented nodes or counts', () => {
  assert.equal(analyzeContributions([]).terms.length, 0);
  assert.equal(analyzeContributions([contribution('a', 'og at det 1234!')]).terms.length, 0);
  assert.equal(analyzeContributions([contribution('a', '   ')]).contributions.length, 0);
});

test('years and alphanumeric tokens do not become fabricated word fragments', () => {
  const result = analyzeContributions([contribution('a', '1980’erne og TV2Nord. Dans!')]);
  assert(!term(result, 'erne'));
  assert(!term(result, 'nord'));
  assert(!term(result, 'tv'));
  assert.equal(term(result, 'dans').count, 1);
  const separated = analyzeContributions([contribution('a', 'Dans 2026 energi.'), contribution('b', 'Dans 2026 energi.')]);
  assert(!term(separated, 'dans energi'));
});

test('circle area follows independent contribution count', () => {
  const small = Math.PI * nodeRadius(1, 4) ** 2;
  const large = Math.PI * nodeRadius(4, 4) ** 2;
  assert.equal(large / small, 4);
});

test('filtered denominator and counts use only the selected contributions', () => {
  const material = [contribution('a', 'Frihed.', 'Parade'), contribution('b', 'Frihed.', 'Gløden'), contribution('c', 'Dans.', 'Parade')];
  const result = analyzeContributions(material.filter((c) => c.category === 'Parade'));
  assert.equal(result.contributions.length, 2);
  assert.equal(term(result, 'frihed').count, 1);
});
