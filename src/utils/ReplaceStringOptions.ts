/**
 * Options for string replacement with regex
 */
export interface ReplaceStringOptions {
  /** The regular expression pattern to match */
  regex: string;
  /** The replacement string (may contain backreferences like \1, \2, etc.) */
  replacement: string;
  /** Whether to allow multiple occurrences to be replaced. If false and multiple matches found, throws an error */
  allowMultipleOccurrences?: boolean;
}
