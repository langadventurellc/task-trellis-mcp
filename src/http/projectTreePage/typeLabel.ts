/** Returns a display label for an issue type (e.g. "epic" → "Epic"). */
export function typeLabel(type: string): string {
  return type.charAt(0).toUpperCase() + type.slice(1);
}
