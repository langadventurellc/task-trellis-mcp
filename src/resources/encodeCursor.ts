/**
 * Base64-encodes a pagination offset for use as a cursor.
 * Throws if `offset` is negative or non-integer.
 */
export function encodeCursor(offset: number): string {
  if (!Number.isInteger(offset) || offset < 0) {
    throw new Error(
      `encodeCursor: offset must be a non-negative integer, got ${offset}`,
    );
  }
  return Buffer.from(String(offset)).toString("base64");
}
