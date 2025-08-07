import { MultipleMatchesError } from "./MultipleMatchesError";
import { ReplaceStringOptions } from "./ReplaceStringOptions";

/**
 * Replaces portions of a string using a regular expression pattern
 *
 * This function provides regex-based string replacement similar to Python's re.sub(),
 * with multiline and global matching capabilities. When allowMultipleOccurrences is false,
 * it will throw an error if the regex matches multiple times, helping prevent unintended
 * bulk replacements.
 *
 * @param input - The string to modify
 * @param options - Configuration object containing regex, replacement, and options
 * @returns The modified string
 * @throws {MultipleMatchesError} When multiple matches found but not allowed
 * @throws {Error} When regex pattern is invalid
 *
 * @example
 * ```typescript
 * // Simple replacement
 * replaceStringWithRegex("hello world", {
 *   regex: "world",
 *   replacement: "universe"
 * }); // "hello universe"
 *
 * // With backreferences
 * replaceStringWithRegex("John Doe", {
 *   regex: "(\\w+) (\\w+)",
 *   replacement: "$2, $1"
 * }); // "Doe, John"
 *
 * // Multiple matches with permission
 * replaceStringWithRegex("foo bar foo", {
 *   regex: "foo",
 *   replacement: "baz",
 *   allowMultipleOccurrences: true
 * }); // "baz bar baz"
 *
 * // Multiple matches without permission (throws error)
 * replaceStringWithRegex("foo bar foo", {
 *   regex: "foo",
 *   replacement: "baz"
 * }); // throws MultipleMatchesError
 * ```
 */
export function replaceStringWithRegex(
  input: string,
  options: ReplaceStringOptions,
): string {
  const { regex, replacement, allowMultipleOccurrences = false } = options;

  if (!regex) {
    throw new Error("Regex pattern cannot be empty");
  }

  let regexObj: RegExp;
  try {
    // Create regex with global and multiline flags (similar to Python's DOTALL + multiline)
    // Using 's' flag for dotAll (. matches newlines) and 'm' flag for multiline
    regexObj = new RegExp(regex, "gsm");
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Invalid regex pattern: ${errorMessage}`);
  }

  // Efficiently check for matches without creating full array
  const matchIterator = input.matchAll(regexObj);
  const firstMatch = matchIterator.next();

  if (firstMatch.done) {
    // No matches, return original string
    return input;
  }

  // If we don't allow multiple occurrences, check if there's a second match
  if (!allowMultipleOccurrences) {
    const secondMatch = matchIterator.next();
    if (!secondMatch.done) {
      // We have at least 2 matches, need to count them all for the error
      // Reset and count all matches for accurate error reporting
      regexObj.lastIndex = 0;
      const allMatches = Array.from(input.matchAll(regexObj));
      throw new MultipleMatchesError(allMatches.length, regex);
    }
  }

  // Perform the replacement
  // Reset the regex since matchAll() affects the lastIndex
  regexObj.lastIndex = 0;

  try {
    return input.replace(regexObj, replacement);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Error during replacement: ${errorMessage}`);
  }
}
