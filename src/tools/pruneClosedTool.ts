import { Repository } from "../repositories";

export const pruneClosedTool = {
  name: "prune_closed",
  description: "Prunes closed objects from the task trellis system",
  inputSchema: {
    type: "object",
    properties: {
      scope: {
        type: "string",
        description: "Scope to prune objects from (optional)",
      },
      age: {
        type: "number",
        description: "Age in minutes for objects to be considered for pruning",
      },
    },
    required: ["age"],
  },
} as const;

export function handlePruneClosed(repository: Repository, args: unknown) {
  const { scope, age } = args as {
    scope?: string;
    age: number;
  };

  // No-op implementation - just return the received parameters
  return {
    content: [
      {
        type: "text",
        text: `Pruned closed objects: ${JSON.stringify(
          { scope, age },
          null,
          2,
        )}`,
      },
    ],
  };
}
