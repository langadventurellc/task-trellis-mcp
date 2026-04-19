import * as tmp from "tmp";
import * as fs from "fs/promises";
import * as path from "path";
import { resolveProjectKey } from "../../../configuration/resolveProjectKey";

export class TestEnvironment {
  private projectTmp: tmp.DirResult | null = null;
  private dataTmp: tmp.DirResult | null = null;
  private prevDataDirEnv: string | undefined;
  public projectRoot: string = "";
  public dataDir: string = "";
  public projectDataDir: string = "";

  setup(): void {
    this.projectTmp = tmp.dirSync({
      prefix: "trellis-test-",
      unsafeCleanup: true,
    });
    this.projectRoot = this.projectTmp.name;

    this.dataTmp = tmp.dirSync({
      prefix: "trellis-data-",
      unsafeCleanup: true,
    });
    this.dataDir = this.dataTmp.name;

    this.prevDataDirEnv = process.env.TRELLIS_DATA_DIR;
    process.env.TRELLIS_DATA_DIR = this.dataDir;

    const key = resolveProjectKey(this.projectRoot);
    this.projectDataDir = path.join(this.dataDir, "projects", key);
  }

  cleanup(): void {
    if (this.prevDataDirEnv === undefined) {
      delete process.env.TRELLIS_DATA_DIR;
    } else {
      process.env.TRELLIS_DATA_DIR = this.prevDataDirEnv;
    }

    for (const handle of [this.projectTmp, this.dataTmp]) {
      if (!handle) continue;
      try {
        handle.removeCallback();
      } catch (error) {
        console.error("Error removing temp directory:", error);
      }
    }
    this.projectTmp = null;
    this.dataTmp = null;
  }

  async createTestObject(
    type: string,
    id: string,
    content: string,
  ): Promise<void> {
    const typeDir = `${type}s-open`;
    const fileName = `${id}.md`;
    const filePath = path.join(this.projectDataDir, typeDir, fileName);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, content, "utf-8");
  }

  getProjectRoot(): string {
    return this.projectRoot;
  }
}
