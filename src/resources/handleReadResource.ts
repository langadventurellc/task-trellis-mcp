import type { Repository } from "../repositories/Repository";
import { parseIssueUri } from "./parseIssueUri";

/** Reads a Trellis issue by URI and returns its minimal MCP resource contents (id, title, status only). */
export async function handleReadResource(
  { uri }: { uri: string },
  repository: Repository,
): Promise<{
  contents: Array<{ uri: string; mimeType: string; text: string }>;
}> {
  const parsedId = parseIssueUri(uri);
  if (parsedId === null) {
    throw new Error(`Invalid Trellis issue URI: ${uri}`);
  }

  const obj = await repository.getObjectById(parsedId);
  if (obj === null) {
    throw new Error(`Trellis issue not found: ${parsedId}`);
  }

  return {
    contents: [
      {
        uri,
        mimeType: "text/markdown",
        text: `# ${obj.title}\n\n- id: ${obj.id}\n- status: ${obj.status}`,
      },
    ],
  };
}
