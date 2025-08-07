/**
 * Error thrown when multiple regex matches are found but not allowed
 */
export class MultipleMatchesError extends Error {
  constructor(matchCount: number, pattern: string) {
    super(
      `Found ${matchCount} matches for pattern "${pattern}" but allowMultipleOccurrences is false. ` +
        "Use allowMultipleOccurrences: true to replace all matches, or provide a more specific regex.",
    );
    this.name = "MultipleMatchesError";
  }
}
