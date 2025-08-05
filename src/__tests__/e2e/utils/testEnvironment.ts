import * as tmp from "tmp";
import * as fs from "fs/promises";
import * as path from "path";

export class TestEnvironment {
  private tempDir: tmp.DirResult | null = null;
  public projectRoot: string = "";

  async setup(): Promise<void> {
    // Create temporary directory for test
    this.tempDir = tmp.dirSync({
      prefix: "trellis-test-",
      unsafeCleanup: true,
    });
    this.projectRoot = this.tempDir.name;

    // Create .trellis directory structure
    const trellisDir = path.join(this.projectRoot, ".trellis");
    await fs.mkdir(trellisDir, { recursive: true });

    // Create planning subdirectories
    const directories = [
      "projects-open",
      "projects-closed",
      "epics-open",
      "epics-closed",
      "features-open",
      "features-closed",
      "tasks-open",
      "tasks-closed",
    ];

    for (const dir of directories) {
      await fs.mkdir(path.join(trellisDir, dir), { recursive: true });
    }
  }

  cleanup(): void {
    // Remove temporary directory
    if (this.tempDir) {
      try {
        this.tempDir.removeCallback();
      } catch (error) {
        console.error("Error removing temp directory:", error);
      }
      this.tempDir = null;
    }
  }

  async createTestObject(
    type: string,
    id: string,
    content: string,
  ): Promise<void> {
    const typeDir = `${type}s-open`;
    const fileName = `${id}.md`;
    const filePath = path.join(this.projectRoot, ".trellis", typeDir, fileName);
    await fs.writeFile(filePath, content, "utf-8");
  }

  getProjectRoot(): string {
    return this.projectRoot;
  }
}
