import test from 'node:test';
import assert from 'node:assert/strict';
import { fetchJson } from '../lib/fetch-json.ts';

test('slow requests time out with a retry message, including a stalled body', async t => {
  t.mock.method(globalThis, 'fetch', async (_url, { signal }) => ({
    ok: true,
    json: () => new Promise((_resolve, reject) => signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true })),
  }));
  await assert.rejects(fetchJson('/test', new AbortController().signal, 10), /tog for lang tid/);
});

test('cancelling outdated searches aborts the request without reporting a timeout', async t => {
  t.mock.method(globalThis, 'fetch', (_url, { signal }) => new Promise((_resolve, reject) => {
    signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true });
  }));
  const controller = new AbortController();
  const pending = fetchJson('/test', controller.signal, 1000);
  controller.abort();
  await assert.rejects(pending, { name: 'AbortError' });
});

test('successful requests return data and server errors remain readable', async t => {
  t.mock.method(globalThis, 'fetch', async () => Response.json({ rows: [], matched: 0 }));
  assert.deepEqual(await fetchJson('/test', new AbortController().signal), { rows: [], matched: 0 });
  globalThis.fetch = async () => Response.json({ error: 'Log ind for at fortsætte.' }, { status: 401 });
  await assert.rejects(fetchJson('/test', new AbortController().signal), /Log ind/);
});
