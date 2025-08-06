import { spawn, ChildProcess } from "child_process";
import * as path from "path";
import treeKill from "tree-kill";

export class ServerProcess {
  private process: ChildProcess | null = null;
  private serverPath: string;

  constructor() {
    // Resolve the compiled server path
    this.serverPath = path.resolve(process.cwd(), "dist", "server.js");
  }

  async start(projectRoot: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // Spawn the server process with local mode and project root
      this.process = spawn(
        "node",
        [
          this.serverPath,
          "--mode",
          "local",
          "--projectRootFolder",
          projectRoot,
        ],
        {
          stdio: ["pipe", "pipe", "pipe"],
          env: { ...process.env, NODE_ENV: "test" },
        },
      );

      // Set timeout for server startup
      const startupTimeout = setTimeout(() => {
        this.stop();
        reject(new Error("Server startup timeout"));
      }, 10000);

      const handleStartup = (data: Buffer) => {
        const output = data.toString();
        if (output.includes("Server configuration:")) {
          clearTimeout(startupTimeout);
          resolve();
        }
      };

      this.process.stdout?.on("data", handleStartup);

      this.process.on("error", (error) => {
        clearTimeout(startupTimeout);
        reject(new Error(`Failed to start server: ${error.message}`));
      });
    });
  }

  async stop(): Promise<void> {
    if (!this.process) return;

    return new Promise((resolve) => {
      const pid = this.process!.pid;

      if (!pid) {
        resolve();
        return;
      }

      // Use tree-kill to ensure all child processes are killed
      treeKill(pid, "SIGTERM", (error) => {
        if (error) {
          console.error("Error killing server process:", error);
          // Try forceful kill
          try {
            treeKill(pid, "SIGKILL");
          } catch (killError) {
            console.error("Failed to force kill:", killError);
          }
        }
        this.process = null;
        resolve();
      });
    });
  }

  getStdin() {
    return this.process?.stdin || null;
  }

  getStdout() {
    return this.process?.stdout || null;
  }

  getStderr() {
    return this.process?.stderr || null;
  }
}
