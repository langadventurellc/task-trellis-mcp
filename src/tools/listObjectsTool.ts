import {
  TrellisObjectType,
  TrellisObjectStatus,
  TrellisObjectPriority,
} from "../models";
import { Repository } from "../repositories";

export const listObjectsTool = {
  name: "list_objects",
  description: "Lists objects from the task trellis system",
  inputSchema: {
    type: "object",
    properties: {
      type: {
        type: "string",
        description: "Type of objects to list",
      },
      scope: {
        type: "string",
        description: "Scope to filter objects (optional)",
      },
      status: {
        type: "string",
        description: "Status to filter objects (optional)",
      },
      priority: {
        type: "string",
        description: "Priority to filter objects (optional)",
      },
      includeClosed: {
        type: "boolean",
        description: "Include closed objects (defaults to false)",
        default: false,
      },
    },
    required: ["type"],
  },
} as const;

export async function handleListObjects(repository: Repository, args: unknown) {
  const {
    type,
    scope,
    status,
    priority,
    includeClosed = false,
  } = args as {
    type: string;
    scope?: string;
    status?: string;
    priority?: string;
    includeClosed?: boolean;
  };

  // Helper function to convert type string to enum
  const toType = (typeString: string): TrellisObjectType => {
    if (
      Object.values(TrellisObjectType).includes(typeString as TrellisObjectType)
    ) {
      return typeString as TrellisObjectType;
    }
    throw new Error(`Invalid type value: ${typeString}`);
  };

  // Helper function to convert status string to enum
  const toStatus = (statusString: string): TrellisObjectStatus => {
    if (
      Object.values(TrellisObjectStatus).includes(
        statusString as TrellisObjectStatus,
      )
    ) {
      return statusString as TrellisObjectStatus;
    }
    throw new Error(`Invalid status value: ${statusString}`);
  };

  // Helper function to convert priority string to enum
  const toPriority = (priorityString: string): TrellisObjectPriority => {
    if (
      Object.values(TrellisObjectPriority).includes(
        priorityString as TrellisObjectPriority,
      )
    ) {
      return priorityString as TrellisObjectPriority;
    }
    throw new Error(`Invalid priority value: ${priorityString}`);
  };

  try {
    // Convert string parameters to enum types
    const typeEnum = toType(type);
    const statusEnum = status ? toStatus(status) : undefined;
    const priorityEnum = priority ? toPriority(priority) : undefined;

    // Get objects from repository
    const objects = await repository.getObjects(
      includeClosed,
      scope,
      typeEnum,
      statusEnum,
      priorityEnum,
    );

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(objects, null, 2),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error listing objects: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
    };
  }
}
