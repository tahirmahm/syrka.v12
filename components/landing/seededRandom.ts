/** Deterministic 0–1 generator (Park–Miller), so server and client renders produce identical output. */
export function seededRandom(seed: number) {
  let s = Math.max(1, Math.floor(seed) % 2147483647)
  return () => (s = (s * 16807) % 2147483647) / 2147483647
}
