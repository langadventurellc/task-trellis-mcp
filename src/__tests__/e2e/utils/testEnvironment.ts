import * as tmp from "tmp";
import * as fs from "fs/promises";
import * as path from "path";

export class TestEnvironment {
  private tempDir: tmp.DirResult | null = null;
  public projectRoot: string = "";

  setup(): void {
    // Create temporary directory for test
    this.tempDir = tmp.dirSync({
      prefix: "trellis-test-",
      unsafeCleanup: true,
    });
    this.projectRoot = this.tempDir.name;
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
