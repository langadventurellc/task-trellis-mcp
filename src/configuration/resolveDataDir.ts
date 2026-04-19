import { homedir } from "node:os";
import { join } from "node:path";

/** Returns the Trellis data root directory. */
export function resolveDataDir(): string {
  return process.env.TRELLIS_DATA_DIR || join(homedir(), ".trellis");
}
