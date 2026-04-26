import type { Resource } from "@modelcontextprotocol/sdk/types.js";
import type { TrellisObject } from "../models/TrellisObject";
import { buildIssueUri } from "./buildIssueUri";

/** Converts a TrellisObject to an MCP Resource. */
export function toResource(obj: TrellisObject): Resource {
  return {
    uri: buildIssueUri(obj.id),
    name: obj.id,
    title: obj.title,
    description: `${obj.title} [${obj.status}]`,
    mimeType: "text/markdown",
  };
}
