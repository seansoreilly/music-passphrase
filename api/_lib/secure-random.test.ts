import { test } from 'node:test';
import assert from 'node:assert/strict';
import { secureRandomInt, secureShuffle } from '../../src/api/secureRandom.ts';

test('secureRandomInt stays within [0, max) and covers the range', () => {
  const seen = new Set<number>();
  for (let i = 0; i < 2000; i++) {
    const n = secureRandomInt(8);
    assert.ok(Number.isInteger(n) && n >= 0 && n < 8, String(n));
    seen.add(n);
  }
  assert.equal(seen.size, 8);
  assert.equal(secureRandomInt(1), 0);
});

test('secureRandomInt is roughly uniform for a non-power-of-two bound', () => {
  const counts = new Array<number>(90).fill(0);
  const draws = 90000;
  for (let i = 0; i < draws; i++) counts[secureRandomInt(90)]++;
  const expected = draws / 90; // 1000, sd ~ 31
  for (const c of counts) assert.ok(Math.abs(c - expected) < 200, `bucket count ${c}`);
});

test('secureRandomInt rejects invalid bounds', () => {
  for (const bad of [0, -1, 1.5, NaN, 2 ** 32 + 1]) {
    assert.throws(() => secureRandomInt(bad), RangeError);
  }
});

test('secureShuffle returns a permutation without mutating the input', () => {
  const input = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const copy = [...input];
  const out = secureShuffle(input);
  assert.deepEqual(input, copy);
  assert.deepEqual([...out].sort((a, b) => a - b), copy);
});
