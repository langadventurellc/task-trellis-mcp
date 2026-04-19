import { join } from "node:path";
import { resolveDataDir } from "../../configuration/resolveDataDir";
import { LocalRepository } from "../../repositories/local/LocalRepository";

export function makeRepo(key: string): LocalRepository {
  return new LocalRepository({
    planningRootFolder: join(resolveDataDir(), "projects", key) + "/",
    autoCompleteParent: false,
    autoPrune: 0,
  });
}
