import { join } from "node:path";
import type { ServerConfig } from "../../configuration";
import { resolveDataDir } from "../../configuration/resolveDataDir";
import { LocalRepository } from "../../repositories/local/LocalRepository";

export const SERVER_CONFIG: ServerConfig = {
  autoCompleteParent: false,
  autoPrune: 0,
};

export function makeRepo(key: string): LocalRepository {
  return new LocalRepository({
    planningRootFolder: join(resolveDataDir(), "projects", key) + "/",
    ...SERVER_CONFIG,
  });
}
