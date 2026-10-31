/**
 * Unbiased CSPRNG integer in [0, maxExclusive) for browsers (also works on
 * Node >= 19 where globalThis.crypto exists). Uses rejection sampling so the
 * result has no modulo bias.
 */
export function secureRandomInt(maxExclusive: number): number {
  if (!Number.isInteger(maxExclusive) || maxExclusive < 1 || maxExclusive > 2 ** 32) {
    throw new RangeError('maxExclusive must be an integer in [1, 2^32]');
  }
  const range = 2 ** 32;
  // Largest multiple of maxExclusive that fits in the 32-bit range; draws at
  // or above it are rejected so every residue is equally likely.
  const limit = range - (range % maxExclusive);
  const buf = new Uint32Array(1);
  let value: number;
  do {
    globalThis.crypto.getRandomValues(buf);
    value = buf[0];
  } while (value >= limit);
  return value % maxExclusive;
}

/** Fisher-Yates shuffle (returns a new array) driven by the CSPRNG. */
export function secureShuffle<T>(items: readonly T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = secureRandomInt(i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
