import type { ResourceTemplate } from "@modelcontextprotocol/sdk/types.js";

/** Returns the MCP resource template for Trellis issues. */
export function handleListResourceTemplates(): {
  resourceTemplates: ResourceTemplate[];
} {
  return {
    resourceTemplates: [
      {
        uriTemplate: "trellis://issue/{id}",
        name: "trellis-issue",
        title: "Trellis Issue",
        description:
          "A Trellis issue (project, epic, feature, or task) referenced by ID",
        mimeType: "text/markdown",
      },
    ],
  };
}
