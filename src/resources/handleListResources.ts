import type { Resource } from "@modelcontextprotocol/sdk/types.js";
import type { Repository } from "../repositories/Repository";
import { decodeCursor } from "./decodeCursor";
import { encodeCursor } from "./encodeCursor";
import { toResource } from "./issueResources";

const PAGE_SIZE = 100;

/** Lists open Trellis issues as MCP resources with cursor-based pagination. */
export async function handleListResources(
  { cursor }: { cursor?: string },
  repository: Repository,
): Promise<{ resources: Resource[]; nextCursor?: string }> {
  const offset = cursor !== undefined ? decodeCursor(cursor) : 0;
  const all = await repository.getObjects(false);
  const sorted = [...all].sort((a, b) => a.id.localeCompare(b.id));
  const page = sorted.slice(offset, offset + PAGE_SIZE);
  const resources = page.map(toResource);
  const nextCursor =
    offset + PAGE_SIZE < sorted.length
      ? encodeCursor(offset + PAGE_SIZE)
      : undefined;
  return nextCursor !== undefined ? { resources, nextCursor } : { resources };
}
