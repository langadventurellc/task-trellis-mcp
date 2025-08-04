import { TrellisObjectType } from "../models";

export function inferObjectType(id: string): TrellisObjectType {
  if (!id || id.length === 0) {
    throw new Error("ID cannot be empty");
  }

  if (id.length < 2 || id.charAt(1) !== "-") {
    throw new Error(
      `Invalid ID format: '${id}'. ID must follow pattern X- where X is P, E, F, or T`,
    );
  }

  const firstChar = id.charAt(0).toUpperCase();

  switch (firstChar) {
    case "P":
      return TrellisObjectType.PROJECT;
    case "E":
      return TrellisObjectType.EPIC;
    case "F":
      return TrellisObjectType.FEATURE;
    case "T":
      return TrellisObjectType.TASK;
    default:
      throw new Error(
        `Invalid ID format: '${id}'. ID must follow pattern X- where X is P, E, F, or T`,
      );
  }
}
