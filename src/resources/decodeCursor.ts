/**
 * Decodes a base64 cursor back to an integer offset.
 * Throws if the decoded value is not a valid non-negative integer.
 */
export function decodeCursor(cursor: string): number {
  const decoded = Buffer.from(cursor, "base64").toString("utf8");
  if (!/^\d+$/.test(decoded)) {
    throw new Error(
      `decodeCursor: "${cursor}" does not decode to a non-negative integer`,
    );
  }
  return parseInt(decoded, 10);
}
