import { parse } from "yaml";
import {
  TrellisObject,
  TrellisObjectPriority,
  TrellisObjectStatus,
} from "../models";
import { inferObjectType } from "./inferObjectType";

/**
 * Extracts frontmatter and body content from markdown string
 */
function extractFrontmatterAndBody(markdownString: string): {
  yamlContent: string;
  bodyContent: string;
} {
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

  const yamlContent = markdownString
    .substring(frontmatterStart + 3, frontmatterEnd)
    .trim();

  const bodyContent = markdownString
    .substring(frontmatterEnd + 3)
    .replace(/^\n+/, "");

  return { yamlContent, bodyContent };
}

/**
 * Parses YAML content and validates it's an object
 */
function parseFrontmatter(yamlContent: string): Record<string, unknown> {
  let frontmatter: unknown;
  try {
    frontmatter = parse(yamlContent);
  } catch (error) {
    throw new Error(
      `Invalid YAML frontmatter: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }

  if (typeof frontmatter !== "object" || frontmatter === null) {
    throw new Error("Invalid frontmatter: Expected an object");
  }

  return frontmatter as Record<string, unknown>;
}

/**
 * Validates required fields in frontmatter
 */
function validateRequiredFields(fm: Record<string, unknown>): void {
  const requiredFields = [
    "id",
    "title",
    "status",
    "priority",
    "schema",
    "created",
    "updated",
  ] as const;

  for (const field of requiredFields) {
    if (fm[field] === undefined || fm[field] === null) {
      throw new Error(`Missing required field: ${field}`);
    }
    if (typeof fm[field] !== "string") {
      throw new Error(`Invalid type for field ${field}: Expected string`);
    }
  }
}

/**
 * Converts affectedFiles object to Map
 */
function processAffectedFiles(
  fm: Record<string, unknown>,
): Map<string, string> {
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

  return affectedFilesMap;
}

/**
 * Safely converts value to string array
 */
function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }
  return [];
}

/**
 * Converts status string to enum
 */
function toStatus(statusString: unknown): TrellisObjectStatus {
  const status = statusString as string;
  if (
    Object.values(TrellisObjectStatus).includes(status as TrellisObjectStatus)
  ) {
    return status as TrellisObjectStatus;
  }
  throw new Error(`Invalid status value: ${status}`);
}

/**
 * Converts priority string to enum
 */
function toPriority(priorityString: unknown): TrellisObjectPriority {
  const priority = priorityString as string;
  if (
    Object.values(TrellisObjectPriority).includes(
      priority as TrellisObjectPriority,
    )
  ) {
    return priority as TrellisObjectPriority;
  }
  throw new Error(`Invalid priority value: ${priority}`);
}

/**
 * Deserializes a markdown string with YAML frontmatter back to a TrellisObject
 * @param markdownString - The markdown string with YAML frontmatter to deserialize
 * @returns A TrellisObject reconstructed from the markdown string
 * @throws Error if the input string is not properly formatted or missing required fields
 */
export function deserializeTrellisObject(
  markdownString: string,
): TrellisObject {
  const { yamlContent, bodyContent } =
    extractFrontmatterAndBody(markdownString);
  const fm = parseFrontmatter(yamlContent);

  validateRequiredFields(fm);
  const affectedFilesMap = processAffectedFiles(fm);

  const trellisObject: TrellisObject = {
    id: fm.id as string,
    type: inferObjectType(fm.id as string),
    title: fm.title as string,
    status: toStatus(fm.status),
    priority: toPriority(fm.priority),
    parent: typeof fm.parent === "string" ? fm.parent : undefined,
    prerequisites: toStringArray(fm.prerequisites),
    affectedFiles: affectedFilesMap,
    log: toStringArray(fm.log),
    schema: fm.schema as string,
    childrenIds: toStringArray(fm.childrenIds),
    created: fm.created as string,
    updated: fm.updated as string,
    body: bodyContent,
  };

  return trellisObject;
}
