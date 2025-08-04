import { TrellisObjectType } from "./TrellisObjectType";

export function inferObjectType(id: string): TrellisObjectType {
  if (!id || id.length === 0) {
    throw new Error("ID cannot be empty");
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
        `Invalid ID format: '${id}'. ID must start with P, E, F, or T`,
      );
  }
}
