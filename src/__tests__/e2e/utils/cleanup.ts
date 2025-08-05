import * as fs from "fs/promises";
import treeKill from "tree-kill";

export class TestCleanup {
  private static tempDirs: Set<string> = new Set();
  private static processes: Set<number> = new Set();

  static registerTempDir(dir: string): void {
    this.tempDirs.add(dir);
  }

  static unregisterTempDir(dir: string): void {
    this.tempDirs.delete(dir);
  }

  static registerProcess(pid: number): void {
    this.processes.add(pid);
  }

  static unregisterProcess(pid: number): void {
    this.processes.delete(pid);
  }

  static async cleanupAll(): Promise<void> {
    // Kill all registered processes
    const killPromises = Array.from(this.processes).map(
      (pid) =>
        new Promise<void>((resolve) => {
          treeKill(pid, "SIGKILL", () => resolve());
        }),
    );
    await Promise.all(killPromises);
    this.processes.clear();

    // Remove all temp directories
    const removePromises = Array.from(this.tempDirs).map(async (dir) => {
      try {
        await fs.rm(dir, { recursive: true, force: true });
      } catch (error) {
        console.error(`Failed to remove ${dir}:`, error);
      }
    });
    await Promise.all(removePromises);
    this.tempDirs.clear();
  }
}

// Register cleanup on process exit
process.on("exit", () => {
  // Synchronous cleanup only in exit handler
  console.log("Process exiting, cleanup handled by other handlers");
});

process.on("SIGINT", () => {
  TestCleanup.cleanupAll()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Cleanup error:", error);
      process.exit(1);
    });
});

process.on("SIGTERM", () => {
  TestCleanup.cleanupAll()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Cleanup error:", error);
      process.exit(1);
    });
});
