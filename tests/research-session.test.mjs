import test from 'node:test';
import assert from 'node:assert/strict';
import { createSession, validSession, safeReturnPath, SESSION_SECONDS } from '../lib/research-session.ts';

test('sessions reject tampering, expiry, future dates and a changed password', async () => {
  const previous = process.env.RESEARCH_PASSWORD;
  const previousSecret = process.env.SUPABASE_SECRET_KEY;
  process.env.SUPABASE_SECRET_KEY = 'sb_secret_isolated_session_test';
  process.env.RESEARCH_PASSWORD = 'twelve-chars';
  assert.equal(process.env.RESEARCH_PASSWORD.length, 12);
  try {
    const now = 1700000000000;
    const token = await createSession(now);
    assert.equal(await validSession(token, now), true);
    assert.equal(await validSession('x' + token, now), false);
    assert.equal(await validSession(token, now + SESSION_SECONDS * 1000), false);
    assert.equal(await validSession(token, now - 1000), false);
    assert.equal(await validSession(undefined, now), false);
    process.env.RESEARCH_PASSWORD = 'a-different-isolated-test-password';
    assert.equal(await validSession(token, now), false);
    process.env.RESEARCH_PASSWORD = '';
    assert.equal(await validSession(token, now), false);
  } finally {
    if (previous === undefined) delete process.env.RESEARCH_PASSWORD; else process.env.RESEARCH_PASSWORD = previous;
    if (previousSecret === undefined) delete process.env.SUPABASE_SECRET_KEY; else process.env.SUPABASE_SECRET_KEY = previousSecret;
  }
});
test('return paths remain on this site and cannot redirect to an API or login loop', () => {
  assert.equal(safeReturnPath('/den-digitale-sjael'), '/den-digitale-sjael');
  for (const path of ['//example.com', '/\\example.com', 'https://example.com', '/login', '/api/citater', '/\nexample.com']) assert.equal(safeReturnPath(path), '/');
});
