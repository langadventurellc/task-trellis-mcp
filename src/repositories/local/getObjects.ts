import { readFile, stat } from "fs/promises";
import {
  TrellisObject,
  TrellisObjectPriority,
  TrellisObjectStatus,
  TrellisObjectType,
} from "../../models";
import { isOpen } from "../../models/isOpen";
import { deserializeTrellisObject } from "../../utils/deserializeTrellisObject";
import { getChildrenByFilePath } from "./getChildrenByFilePath";
import { RepoIndex } from "./RepoIndex";
import { RepoIndexEntry } from "./RepoIndexEntry";
import { matchesScope } from "./scopeFilter";

function normalizeFilter<T>(value: T | T[] | undefined): T[] | undefined {
  if (value === undefined) return undefined;
  const arr = Array.isArray(value) ? value : [value];
  return arr.length > 0 ? arr : undefined;
}

async function isEntryFresh(entry: RepoIndexEntry): Promise<boolean> {
  try {
    const stats = await stat(entry.filePath);
    return stats.mtimeMs === entry.mtime;
  } catch {
    return false;
  }
}

async function loadObjectFromEntry(
  entry: RepoIndexEntry,
): Promise<TrellisObject | null> {
  try {
    const content = await readFile(entry.filePath, "utf-8");
    const obj = deserializeTrellisObject(content);
    obj.childrenIds = await getChildrenByFilePath(entry.filePath);
    return obj;
  } catch (error) {
    console.error(
      `Warning: Could not deserialize file ${entry.filePath}:`,
      error,
    );
    return null;
  }
}

function passesFilters(
  obj: TrellisObject,
  typeArray: TrellisObjectType[] | undefined,
  statusArray: TrellisObjectStatus[] | undefined,
  priorityArray: TrellisObjectPriority[] | undefined,
  includeClosed: boolean,
): boolean {
  if (typeArray && !typeArray.includes(obj.type)) return false;
  if (statusArray && !statusArray.includes(obj.status)) return false;
  if (priorityArray && !priorityArray.includes(obj.priority)) return false;
  if (!includeClosed && !isOpen(obj)) return false;
  return true;
}

export async function getObjects(
  planningRootFolder: string,
  includeClosed = false,
  scope?: string,
  type?: TrellisObjectType | TrellisObjectType[],
  status?: TrellisObjectStatus | TrellisObjectStatus[],
  priority?: TrellisObjectPriority | TrellisObjectPriority[],
): Promise<TrellisObject[]> {
  // Always rescan. A cold-only gate misses files created by other MCP instances
  // (or any writer that bypasses LocalRepository.saveObject), because the bucket
  // retains entries — so `entries().length === 0` stays false — while new ids
  // sit on disk un-indexed. Populate is cheap: regex-only, no YAML parse.
  await RepoIndex.populate(planningRootFolder);

  const typeArray = normalizeFilter(type);
  const statusArray = normalizeFilter(status);
  const priorityArray = normalizeFilter(priority);

  const objects: TrellisObject[] = [];

  for (const [id, entry] of RepoIndex.entries(planningRootFolder)) {
    if (scope && !matchesScope(entry.filePath, scope)) continue;
    if (!includeClosed && entry.filePath.includes("/t/closed/")) continue;

    if (!(await isEntryFresh(entry))) {
      RepoIndex.invalidate(planningRootFolder, id);
      continue;
    }

    const obj = await loadObjectFromEntry(entry);
    if (!obj) continue;

    if (
      passesFilters(obj, typeArray, statusArray, priorityArray, includeClosed)
    )
      objects.push(obj);
  }

  return objects;
}
