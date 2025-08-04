import { parse } from "yaml";
import { TrellisObject } from "./TrellisObject";
import { inferObjectType } from "./inferObjectType";
import { TrellisObjectStatus } from "./TrellisObjectStatus";
import { TrellisObjectPriority } from "./TrellisObjectPriority";

/**
 * Deserializes a markdown string with YAML frontmatter back to a TrellisObject
 * @param markdownString - The markdown string with YAML frontmatter to deserialize
 * @returns A TrellisObject reconstructed from the markdown string
 * @throws Error if the input string is not properly formatted or missing required fields
 */
export function deserializeTrellisObject(
  markdownString: string,
): TrellisObject {
  // Split the string into frontmatter and body sections
  // Find the first and second --- markers
  const frontmatterStart = markdownString.indexOf("---");
  if (frontmatterStart === -1) {
    throw new Error(
      "Invalid format: Expected YAML frontmatter delimited by --- markers",
    );
  }

  const frontmatterEnd = markdownString.indexOf("---", frontmatterStart + 3);
  if (frontmatterEnd === -1) {
    throw new Error(
      "Invalid format: Expected YAML frontmatter delimited by --- markers",
    );
  }

  // Extract the YAML frontmatter
  const yamlContent = markdownString
    .substring(frontmatterStart + 3, frontmatterEnd)
    .trim();

  // Extract the body content (everything after the second ---)
  const bodyContent = markdownString
    .substring(frontmatterEnd + 3)
    .replace(/^\n+/, "");

  // Parse the YAML frontmatter
  let frontmatter: unknown;
  try {
    frontmatter = parse(yamlContent);
  } catch (error) {
    throw new Error(
      `Invalid YAML frontmatter: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }

  // Type guard to ensure frontmatter is an object
  if (typeof frontmatter !== "object" || frontmatter === null) {
    throw new Error("Invalid frontmatter: Expected an object");
  }

  const fm = frontmatter as Record<string, unknown>;

  // Validate required fields
  const requiredFields = [
    "id",
    "title",
    "status",
    "priority",
    "schema",
  ] as const;
  for (const field of requiredFields) {
    if (fm[field] === undefined || fm[field] === null) {
      throw new Error(`Missing required field: ${field}`);
    }
    if (typeof fm[field] !== "string") {
      throw new Error(`Invalid type for field ${field}: Expected string`);
    }
  }

  // Convert plain object back to Map for affectedFiles
  const affectedFilesMap = new Map<string, string>();
  if (
    fm.affectedFiles &&
    typeof fm.affectedFiles === "object" &&
    fm.affectedFiles !== null
  ) {
    for (const [key, value] of Object.entries(
      fm.affectedFiles as Record<string, unknown>,
    )) {
      if (typeof value === "string") {
        affectedFilesMap.set(key, value);
      }
    }
  }

  // Helper function to safely convert to string array
  const toStringArray = (value: unknown): string[] => {
    if (Array.isArray(value)) {
      return value.filter((item): item is string => typeof item === "string");
    }
    return [];
  };

  // Helper function to convert status string to enum
  const toStatus = (statusString: unknown): TrellisObjectStatus => {
    const status = statusString as string;
    if (
      Object.values(TrellisObjectStatus).includes(status as TrellisObjectStatus)
    ) {
      return status as TrellisObjectStatus;
    }
    throw new Error(`Invalid status value: ${status}`);
  };

  // Helper function to convert priority string to enum
  const toPriority = (priorityString: unknown): TrellisObjectPriority => {
    const priority = priorityString as string;
    if (
      Object.values(TrellisObjectPriority).includes(
        priority as TrellisObjectPriority,
      )
    ) {
      return priority as TrellisObjectPriority;
    }
    throw new Error(`Invalid priority value: ${priority}`);
  };

  // Construct and return the TrellisObject
  const trellisObject: TrellisObject = {
    id: fm.id as string,
    type: inferObjectType(fm.id as string),
    title: fm.title as string,
    status: toStatus(fm.status),
    priority: toPriority(fm.priority),
    prerequisites: toStringArray(fm.prerequisites),
    affectedFiles: affectedFilesMap,
    log: toStringArray(fm.log),
    schema: fm.schema as string,
    childrenIds: toStringArray(fm.childrenIds),
    body: bodyContent,
  };

  return trellisObject;
}
