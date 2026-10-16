import test from 'node:test';
import assert from 'node:assert/strict';
import { wrapQuoteText } from '../lib/quote-export.ts';
const measure = text => Array.from(text).length;
test('JPG line wrapping preserves Danish text and explicit line breaks', () => {
  assert.deepEqual(wrapQuoteText('Vi elsker Aalborg\nKarneval er glæde', 10, measure), ['Vi elsker', 'Aalborg', 'Karneval', 'er glæde']);
});
test('long unbroken words wrap without losing characters', () => {
  const text = 'æøå'.repeat(50);
  const lines = wrapQuoteText(text, 12, measure);
  assert.equal(lines.join(''), text);
  assert.ok(lines.every(line => measure(line) <= 12));
});
test('all of a maximum-length quote is included in the export layout', () => {
  const text = 'Karneval er fællesskab. '.repeat(130);
  const lines = wrapQuoteText(text, 60, measure);
  assert.equal(lines.join(' '), text.trim());
});
