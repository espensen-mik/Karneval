import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EMPTY_WORD_PLAY, mergeWordBubbles, readWordPlay, removeWordBubble, wordPlayBubbles } from '../lib/word-play.ts';

// Isolated counting fixtures, never seeded into the actual material.
const word = (id, ids) => ({ id, label: id, kind: 'word', variants: [id], contributionIds: ids, count: ids.length });
const words = [word('mennesker', ['a', 'b']), word('folk', ['b', 'c']), word('fest', ['a', 'd'])];

test('merging bubbles unions the quote IDs instead of summing overlapping counts', () => {
  const state = mergeWordBubbles(EMPTY_WORD_PLAY, words[0], words[1]);
  const bubbles = wordPlayBubbles(words, state);
  const group = bubbles.find((bubble) => bubble.id === 'folk');
  assert.equal(group.count, 3);
  assert.deepEqual(new Set(group.contributionIds), new Set(['a', 'b', 'c']));
  assert.deepEqual(new Set(group.variants), new Set(['folk', 'mennesker']));
  assert.equal(bubbles.length, 2);
  assert.equal(words[0].count, 2);
  assert.deepEqual(EMPTY_WORD_PLAY, { groups: [], excluded: [] });
});

test('a merged bubble can be combined again without duplicate words or quotes', () => {
  let state = mergeWordBubbles(EMPTY_WORD_PLAY, words[0], words[1]);
  const firstGroup = wordPlayBubbles(words, state).find((bubble) => bubble.kind === 'group');
  state = mergeWordBubbles(state, firstGroup, words[2]);
  const group = wordPlayBubbles(words, state)[0];
  assert.equal(state.groups.length, 1);
  assert.equal(group.variants.length, 3);
  assert.equal(group.count, 4);
});

test('minus on a group hides all member words; restoring a snapshot undoes it', () => {
  const before = mergeWordBubbles(EMPTY_WORD_PLAY, words[0], words[1]);
  const group = wordPlayBubbles(words, before).find((bubble) => bubble.kind === 'group');
  const after = removeWordBubble(before, group);
  assert.deepEqual(wordPlayBubbles(words, after).map((bubble) => bubble.id), ['fest']);
  assert.equal(wordPlayBubbles(words, before).length, 2);
});

test('saved experiments reload without creating words missing from the material', () => {
  const state = mergeWordBubbles(EMPTY_WORD_PLAY, words[0], words[1]);
  const restored = readWordPlay(JSON.parse(JSON.stringify(state)));
  assert.deepEqual(restored, state);
  assert.equal(wordPlayBubbles([], restored).length, 0);
  assert.deepEqual(readWordPlay(null), EMPTY_WORD_PLAY);
});

test('a removed word stays excluded after reload and does not alter the original terms', () => {
  const state = readWordPlay(removeWordBubble(EMPTY_WORD_PLAY, words[0]));
  assert(!wordPlayBubbles(words, state).some((bubble) => bubble.id === 'mennesker'));
  assert.equal(words.length, 3);
  assert.deepEqual(words[0].contributionIds, ['a', 'b']);
});
