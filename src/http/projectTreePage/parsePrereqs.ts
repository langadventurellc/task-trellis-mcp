/** Splits a comma/newline-separated string of IDs into a trimmed, non-empty array. */
export function parsePrereqs(raw: string): string[] {
  return raw
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
}
