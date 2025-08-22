import { Repository } from "../repositories";
import { TaskTrellisService } from "../services/TaskTrellisService";

export const replaceObjectBodyRegexTool = {
  name: "replace_issue_body_regex",
  description: `Replaces portions of an issue's body using regular expressions

Use this tool to make targeted edits to specific sections of an issue's body content without recreating the entire text. This is safer and more efficient than wholesale body replacement for surgical text modifications.

The tool uses regex pattern matching with multiline and global capabilities, similar to Python's re.sub(). When allowMultipleOccurrences is false (default), it prevents unintended bulk replacements by throwing an error if multiple matches are found.

Regex Features:
- Multiline matching: patterns can span multiple lines
- Dot-all mode: . matches newlines  
- Backreferences: use \\1, \\2, etc. in replacement text
- Case-sensitive matching (use (?i) flag in pattern for case-insensitive)

Common use cases:
- Update specific sections of documentation
- Modify code snippets within issue descriptions
- Replace outdated information while preserving structure
- Update specific parameters or values
- Fix formatting or content errors in targeted areas

Safety features:
- Single-match enforcement (unless explicitly allowed)
- Pattern validation before execution
- Graceful error handling with detailed messages
- Original content preservation on pattern mismatch

Example patterns:
- Simple text: "old text" → "new text"
- With context: "(section:\\s*)old content(\\s*end)" → "\\1new content\\2"  
- Multi-line: "BEGIN.*?END" → "BEGIN\\nnew content\\nEND"
- Backreferences: "(\\w+) (\\w+)" → "\\2, \\1"

The replacement preserves all issue metadata and relationships while only modifying the body content that matches your pattern.`,
  inputSchema: {
    type: "object",
    properties: {
      id: {
        type: "string",
        description: "ID of the issue whose body should be modified",
      },
      regex: {
        type: "string",
        description: "Regular expression pattern to match content in the body",
      },
      replacement: {
        type: "string",
        description:
          "Replacement text (may contain backreferences like \\1, \\2, etc.)",
      },
      allowMultipleOccurrences: {
        type: "boolean",
        description:
          "Allow replacing multiple pattern matches (defaults to false)",
        default: false,
      },
    },
    required: ["id", "regex", "replacement"],
  },
} as const;

export async function handleReplaceObjectBodyRegex(
  service: TaskTrellisService,
  repository: Repository,
  args: unknown,
) {
  const {
    id,
    regex,
    replacement,
    allowMultipleOccurrences = false,
  } = args as {
    id: string;
    regex: string;
    replacement: string;
    allowMultipleOccurrences?: boolean;
  };

  return service.replaceObjectBodyRegex(
    repository,
    id,
    regex,
    replacement,
    allowMultipleOccurrences,
  );
}
