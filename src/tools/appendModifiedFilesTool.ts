import { Repository } from "../repositories";
import { TaskTrellisService } from "../services/TaskTrellisService";

export const appendModifiedFilesTool = {
  name: "append_modified_files",
  description: `Appends modified files information to a trellis issue in the task trellis system

Use this tool to record files that have been modified during task execution, along with descriptions of the modifications made. This helps maintain a comprehensive record of changes associated with each work item for tracking and audit purposes.

File modification tracking purposes:
- Record which files were changed during task execution
- Document the nature of changes made to each file
- Maintain audit trail of file-level modifications
- Support code review and change management processes
- Enable impact analysis for future changes

Input requirements:
- Issue ID: The unique identifier of the trellis issue to update
- Files Changed: A record mapping file paths to descriptions of modifications

File path guidelines:
- Use relative paths from project root (e.g., "src/components/Button.tsx")
- Include file extensions for clarity
- Use forward slashes for path separators

Description guidelines:
- Provide clear, concise descriptions of what was changed
- Focus on the purpose and impact of changes rather than implementation details
- Use consistent terminology across related modifications

The tool automatically merges descriptions for files that were previously modified, creating a comprehensive change history for each file within the context of the trellis issue.`,
  inputSchema: {
    type: "object",
    properties: {
      id: {
        type: "string",
        description:
          "ID of the trellis issue to update with modified files information",
      },
      filesChanged: {
        type: "object",
        description:
          "Record of file paths to descriptions of modifications made",
        additionalProperties: {
          type: "string",
        },
      },
    },
    required: ["id", "filesChanged"],
  },
} as const;

export async function handleAppendModifiedFiles(
  service: TaskTrellisService,
  repository: Repository,
  args: unknown,
): Promise<{ content: Array<{ type: string; text: string }> }> {
  const { id, filesChanged } = args as {
    id: string;
    filesChanged: Record<string, string>;
  };

  return await service.appendModifiedFiles(repository, id, filesChanged);
}
