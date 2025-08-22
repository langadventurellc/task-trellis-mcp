import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { CallToolResultSchema } from "@modelcontextprotocol/sdk/types.js";
import { chmod, mkdir, writeFile } from "fs/promises";
import * as os from "os";
import path from "path";
import { TestEnvironment } from "../utils";

describe("E2E Configuration - Invalid Configuration Scenarios", () => {
  let testEnv: TestEnvironment;
  let client: Client | null = null;
  let transport: StdioClientTransport | null = null;

  beforeEach(async () => {
    testEnv = new TestEnvironment();
    testEnv.setup();

    transport = new StdioClientTransport({
      command: "node",
      args: ["dist/server.js", "--mode", "local"],
    });

    client = new Client(
      { name: "test-client", version: "1.0.0" },
      { capabilities: {} },
    );

    await client.connect(transport);
  }, 30000);

  afterEach(async () => {
    if (client) {
      await client.close();
      client = null;
    }
    if (transport) {
      await transport.close();
      transport = null;
    }
    testEnv?.cleanup();
  });

  async function callTool(name: string, args: any = {}): Promise<any> {
    if (!client) {
      throw new Error("Client not connected");
    }

    return client.request(
      {
        method: "tools/call",
        params: { name, arguments: args },
      },
      CallToolResultSchema,
    );
  }

  describe("Invalid Project Paths", () => {
    it("should handle non-existent project root", async () => {
      const fakePath = path.join(testEnv.projectRoot, "non-existent-dir");

      // Activation should succeed
      const response = await callTool("activate", {
        mode: "local",
        projectRoot: fakePath,
      });
      expect(response.content[0].text).toContain("Activated in local mode");

      // But operations should handle missing directory gracefully
      const createResponse = await callTool("create_issue", {
        type: "project",
        title: "Test Project",
      });
      expect(createResponse.content[0].text).toContain("Created object");
    });

    it("should handle invalid path characters", async () => {
      const invalidPath = path.join(testEnv.projectRoot, "\0invalid");

      const response = await callTool("activate", {
        mode: "local",
        projectRoot: invalidPath,
      });

      expect(response.content[0].text).toContain("Activated in local mode");

      // Try to use - may fail depending on OS
      try {
        await callTool("create_issue", {
          type: "project",
          title: "Test",
        });
      } catch (error: any) {
        // Expected on some systems
        expect(error.message).toBeDefined();
      }
    });

    it("should handle very long path names", async () => {
      const longName = "a".repeat(200);
      const longPath = path.join(testEnv.projectRoot, longName);

      const response = await callTool("activate", {
        mode: "local",
        projectRoot: longPath,
      });

      expect(response.content[0].text).toContain("Activated in local mode");
    });
  });

  describe("Permission Issues", () => {
    it("should handle read-only directory", async () => {
      if (os.platform() === "win32") {
        // Skip on Windows as permission model is different
        return;
      }

      const readOnlyDir = path.join(testEnv.projectRoot, "readonly");
      await mkdir(readOnlyDir);
      await chmod(readOnlyDir, 0o444); // Read-only

      await callTool("activate", {
        mode: "local",
        projectRoot: readOnlyDir,
      });

      try {
        await callTool("create_issue", {
          type: "project",
          title: "Test",
        });
        expect(true).toBe(false); // Should not reach here
      } catch (error: any) {
        expect(error.message).toMatch(/permission|access|EACCES/i);
      } finally {
        // Restore permissions for cleanup
        try {
          await chmod(readOnlyDir, 0o755);
        } catch {
          // Ignore cleanup errors
        }
      }
    });

    it("should handle directory with file instead of .trellis", async () => {
      // Create a file where .trellis directory should be
      const trellisPath = path.join(testEnv.projectRoot, ".trellis");
      await writeFile(trellisPath, "This is a file, not a directory");

      await callTool("activate", {
        mode: "local",
        projectRoot: testEnv.projectRoot,
      });

      try {
        await callTool("create_issue", {
          type: "project",
          title: "Test",
        });
        expect(true).toBe(false); // Should not reach here
      } catch (error: any) {
        expect(error.message).toMatch(/ENOTDIR|EEXIST|not a directory/i);
      }
    });
  });

  describe("State Corruption", () => {
    it("should handle activation with corrupted server state", async () => {
      // First activation
      await callTool("activate", {
        mode: "local",
        projectRoot: testEnv.projectRoot,
      });

      // Simulate state corruption by activating with incomplete remote config
      const response = await callTool("activate", {
        mode: "remote",
        // Missing required remote fields
      });

      expect(response.content[0].text).toContain("Activated in remote mode");

      // Tools should fail due to incomplete remote config
      try {
        await callTool("list_issues", {});
        expect(true).toBe(false); // Should not reach here
      } catch (error: any) {
        expect(error.message).toBeDefined();
      }
    });

    it("should recover from failed activation", async () => {
      // Try activation with missing mode (should fail at argument validation level)
      try {
        await callTool("activate", {
          projectRoot: testEnv.projectRoot,
          // Missing mode
        });
      } catch (error: any) {
        // Expected to fail
        expect(error.message).toBeDefined();
      }

      // Should be able to activate correctly afterwards
      const response = await callTool("activate", {
        mode: "local",
        projectRoot: testEnv.projectRoot,
      });

      expect(response.content[0].text).toContain("Activated in local mode");

      // And use tools
      const listResponse = await callTool("list_issues", {});
      expect(listResponse).toBeDefined();
    });
  });

  describe("Remote Mode Limitations", () => {
    it("should handle remote mode with missing configuration", async () => {
      const response = await callTool("activate", {
        mode: "remote",
        remoteProjectId: "proj-123",
        // Missing apiToken and url
      });

      // Activation succeeds but remote operations will fail
      expect(response.content[0].text).toContain("Activated in remote mode");

      // Try to use a tool - should fail due to incomplete remote config
      try {
        await callTool("list_issues", {});
        expect(true).toBe(false); // Should not reach here
      } catch (error: any) {
        expect(error.message).toBeDefined();
      }
    });
  });
});
