import test from 'node:test';
import assert from 'node:assert/strict';
import { readSurveySummary } from '../lib/survey-summary.ts';

test('summary includes all batches rather than just the reader page', async () => {
  const calls = [];
  const result = await readSurveySummary(async path => {
    calls.push(path);
    const offset = Number(new URL(`https://example.test/${path}`).searchParams.get('offset'));
    // Simulate a database row cap smaller than our requested batch size.
    return Response.json(Array(Math.min(500, 1200 - offset)).fill({ age: offset === 1000 ? 60 : 30 }), { headers: { 'content-range': `${offset}-${Math.min(offset + 499, 1199)}/1200` } });
  }, '2026-10-16T12:00:00.000Z');
  assert.deepEqual(result, { total: 1200, averageAge: 35 });
  assert.equal(calls.length, 3);
  assert.ok(calls.every(path => path.includes('select=age&') && path.includes('created_at=lte.') && path.includes('order=id.asc')));
});
test('empty material has no average, rather than a misleading zero', async () => {
  assert.deepEqual(await readSurveySummary(async () => Response.json([], { headers: { 'content-range': '*/0' } }), '2026-10-16'), { total: 0, averageAge: null });
});
test('incomplete statistics fail instead of showing a partial average', async () => {
  await assert.rejects(() => readSurveySummary(async () => Response.json([], { headers: { 'content-range': '*/100' } }), '2026-10-16'));
});
