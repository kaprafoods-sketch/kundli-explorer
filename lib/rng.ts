// Deterministic, seedable PRNG (mulberry32). Pure and idempotent, so it can be
// called inside useMemo/render without violating react-hooks/purity — and it makes
// decorative 3D layouts stable across renders and SSR (no hydration flicker) instead
// of reshuffling on every mount the way Math.random() would.
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
