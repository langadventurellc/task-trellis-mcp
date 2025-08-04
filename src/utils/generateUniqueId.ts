import { TrellisObjectType } from "../models/TrellisObjectType";

const TYPE_PREFIXES: Record<TrellisObjectType, string> = {
  [TrellisObjectType.PROJECT]: "P-",
  [TrellisObjectType.EPIC]: "E-",
  [TrellisObjectType.FEATURE]: "F-",
  [TrellisObjectType.TASK]: "T-",
};

const MAX_SLUG_LENGTH = 30;

/**
 * Converts a string to a URL-friendly slug
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove special characters except spaces and hyphens
    .replace(/[\s_-]+/g, "-") // Replace spaces, underscores, and multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, ""); // Remove leading and trailing hyphens
}

/**
 * Truncates a slug to a reasonable length while preserving word boundaries
 */
function truncateSlug(slug: string, maxLength: number): string {
  if (slug.length <= maxLength) {
    return slug;
  }

  // Try to cut at a word boundary (hyphen)
  const truncated = slug.substring(0, maxLength);
  const lastHyphen = truncated.lastIndexOf("-");

  // If we found a hyphen and it's not too close to the beginning, cut there
  if (lastHyphen > maxLength * 0.6) {
    return truncated.substring(0, lastHyphen);
  }

  // Otherwise, just truncate at max length
  return truncated;
}

/**
 * Generates a unique ID for a Trellis object
 * @param title - The title to generate an ID from
 * @param type - The type of Trellis object
 * @param existingIds - List of existing IDs to avoid duplicates
 * @returns A unique ID with appropriate prefix
 */
export function generateUniqueId(
  title: string,
  type: TrellisObjectType,
  existingIds: string[],
): string {
  if (!title.trim()) {
    throw new Error("Title cannot be empty");
  }

  const prefix = TYPE_PREFIXES[type];
  const slug = truncateSlug(slugify(title), MAX_SLUG_LENGTH);

  if (!slug) {
    throw new Error("Title must contain at least one alphanumeric character");
  }

  let candidateId = `${prefix}${slug}`;
  let counter = 1;

  // Create a Set for O(1) lookup performance
  const existingIdSet = new Set(existingIds);

  // Keep incrementing counter until we find a unique ID
  while (existingIdSet.has(candidateId)) {
    candidateId = `${prefix}${slug}-${counter}`;
    counter++;
  }

  return candidateId;
}
