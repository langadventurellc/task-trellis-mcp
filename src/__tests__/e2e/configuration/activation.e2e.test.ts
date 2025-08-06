import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { CallToolResultSchema } from "@modelcontextprotocol/sdk/types.js";
import { TestEnvironment, pathExists } from "../utils";
import path from "path";

describe("E2E Configuration - Activation", () => {
  let testEnv: TestEnvironment;
  let client: Client | null = null;
  let transport: StdioClientTransport | null = null;

  beforeEach(() => {
    testEnv = new TestEnvironment();
    testEnv.setup();
  });

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

  async function connectWithoutProjectRoot(): Promise<void> {
    transport = new StdioClientTransport({
      command: "node",
      args: ["dist/server.js", "--mode", "local"], // No --projectRootFolder
    });

    client = new Client(
      { name: "test-client", version: "1.0.0" },
      { capabilities: {} },
    );

    await client.connect(transport);
  }

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

  describe("Local Mode Activation", () => {
    it("should activate server with local mode and create .trellis directory", async () => {
      await connectWithoutProjectRoot();

      const response = await callTool("activate", {
        mode: "local",
        projectRoot: testEnv.projectRoot,
      });

      expect(response.content[0].type).toBe("text");
      expect(response.content[0].text).toMatch(/Activated in local mode/);
      expect(response.content[0].text).toContain(testEnv.projectRoot);
      expect(response.content[0].text).toContain("planningRootFolder");

      // Verify .trellis directory exists after creating an object
      await callTool("create_object", {
        type: "project",
        title: "Test Project",
      });

      const trellisDir = path.join(testEnv.projectRoot, ".trellis");
      expect(await pathExists(trellisDir)).toBe(true);
    });

    it("should allow tool usage after activation", async () => {
      await connectWithoutProjectRoot();

      // Try to use tool before activation - should fail
      const errorResponse = await callTool("list_objects", {});
      expect(errorResponse.content[0].text).toContain(
        "Planning root folder is not configured",
      );

      // Activate
      await callTool("activate", {
        mode: "local",
        projectRoot: testEnv.projectRoot,
      });

      // Should now work
      const response = await callTool("list_objects", { type: "project" });
      expect(response.content[0].text).not.toContain("not configured");
    });

    it("should handle multiple activations with different paths", async () => {
      await connectWithoutProjectRoot();

      // First activation
      await callTool("activate", {
        mode: "local",
        projectRoot: testEnv.projectRoot,
      });

      // Create an object
      await callTool("create_object", {
        type: "project",
        title: "Test Project",
      });

      // Second activation with different path
      const newPath = path.join(testEnv.projectRoot, "subdir");
      await callTool("activate", {
        mode: "local",
        projectRoot: newPath,
      });

      // Objects from first activation should not be visible
      const response = await callTool("list_objects", { type: "project" });
      expect(response.content[0].text).toBe("[]");
    });
  });

  describe("Remote Mode Activation", () => {
    it("should activate server with remote mode parameters", async () => {
      await connectWithoutProjectRoot();

      const response = await callTool("activate", {
        mode: "remote",
        apiToken: "test-token",
        url: "https://api.example.com",
        remoteProjectId: "proj-123",
      });

      expect(response.content[0].text).toMatch(/Activated in remote mode/);
      expect(response.content[0].text).toContain("test-token");
      expect(response.content[0].text).toContain("https://api.example.com");
      expect(response.content[0].text).toContain("proj-123");
    });
  });

  describe("Parameter Validation", () => {
    it("should handle local mode without projectRoot", async () => {
      await connectWithoutProjectRoot();

      const response = await callTool("activate", {
        mode: "local",
      });

      // Should succeed but planningRootFolder will be undefined
      expect(response.content[0].text).toContain("Activated in local mode");
      expect(response.content[0].text).not.toContain("planningRootFolder");
    });
  });
});
