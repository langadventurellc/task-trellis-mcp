import { basename } from "path";

/** Validates that a filename is safe for use in the project files directory. Rejects empty strings, path separators, ".." sequences, and non-basename strings. */
export function assertSafeFilename(filename: string): void {
  if (typeof filename !== "string" || filename.length === 0)
    throw new Error("Filename must be a non-empty string");
  if (filename === "." || filename === "..")
    throw new Error(`Invalid filename: '${filename}'`);
  if (filename.includes("\x00"))
    throw new Error(
      `Invalid filename '${filename}': must not contain null bytes`,
    );
  if (filename.includes("/") || filename.includes("\\"))
    throw new Error(
      `Invalid filename '${filename}': must not contain path separators`,
    );
  if (filename.includes(".."))
    throw new Error(`Invalid filename '${filename}': must not contain '..'`);
  if (basename(filename) !== filename)
    throw new Error(`Invalid filename '${filename}'`);
}
