import test from 'node:test';
import assert from 'node:assert/strict';
import { loginFingerprint } from '../lib/login-statistics.ts';
test('login fingerprints ignore spoofable headers and canonicalize IPv6', () => {
  assert.equal(loginFingerprint(new Headers({'x-forwarded-for':'192.0.2.1'}),'secret',true),null);
  assert.equal(loginFingerprint(new Headers({'x-vercel-forwarded-for':'invalid'}),'secret',true),null);
  const a=loginFingerprint(new Headers({'x-vercel-forwarded-for':'2001:db8::1'}),'secret',true);
  assert.equal(a,loginFingerprint(new Headers({'x-vercel-forwarded-for':'2001:0db8:0:0:0:0:0:1'}),'secret',true));
  assert.match(a,/^[a-f0-9]{64}$/);
  assert.notEqual(a,loginFingerprint(new Headers({'x-vercel-forwarded-for':'2001:db8::1'}),'other-secret',true));
});
