import {
  TrellisObject,
  TrellisObjectPriority,
  TrellisObjectStatus,
  TrellisObjectType,
} from "../models";
import { Repository } from "../repositories";
import { generateUniqueId } from "../utils";

export const createObjectTool = {
  name: "create_object",
  description: "Creates a new object in the task trellis system",
  inputSchema: {
    type: "object",
    properties: {
      kind: {
        type: "string",
        description: "Type of object to create",
      },
      title: {
        type: "string",
        description: "Title of the object",
      },
      parent: {
        type: "string",
        description: "Parent object ID (optional)",
      },
      priority: {
        type: "string",
        description: "Priority level (defaults to 'medium')",
        default: "medium",
      },
      status: {
        type: "string",
        description: "Status of the object (defaults to 'draft')",
        default: "draft",
      },
      prerequisites: {
        type: "array",
        items: {
          type: "string",
        },
        description:
          "Array of prerequisite object IDs (defaults to empty array)",
        default: [],
      },
      description: {
        type: "string",
        description: "Description of the object",
      },
    },
    required: ["kind", "title"],
  },
} as const;

export async function handleCreateObject(
  repository: Repository,
  args: unknown,
) {
  const {
    kind,
    title,
    parent,
    priority = "medium",
    status = "draft",
    prerequisites = [],
    description = "",
  } = args as {
    kind: string;
    title: string;
    parent?: string;
    priority?: string;
    status?: string;
    prerequisites?: string[];
    description?: string;
  };

  // Get existing objects to generate unique ID
  const existingObjects = await repository.getObjects(true);
  const existingIds = existingObjects.map((obj) => obj.id);

  // Generate unique ID
  const objectType = kind as TrellisObjectType;
  const id = generateUniqueId(title, objectType, existingIds);

  // Create TrellisObject
  const trellisObject: TrellisObject = {
    id,
    type: objectType,
    title,
    status: status as TrellisObjectStatus,
    priority: priority as TrellisObjectPriority,
    parent,
    prerequisites,
    affectedFiles: new Map(),
    log: [],
    schema: "v1.0",
    childrenIds: [],
    body: description,
  };

  // Save through repository
  await repository.saveObject(trellisObject);

  return {
    content: [
      {
        type: "text",
        text: `Created object with ID: ${id}`,
      },
    ],
  };
}
