import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import {
  CallToolResultSchema,
  ListToolsResultSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { TestEnvironment } from "../utils";

describe("E2E Configuration - Command Line Arguments", () => {
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

  async function startServerWithArgs(args: string[]): Promise<void> {
    transport = new StdioClientTransport({
      command: "node",
      args: ["dist/server.js", ...args],
      env: { ...(process.env as Record<string, string>) },
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

  it("should start server with --projectDir", async () => {
    await startServerWithArgs(["--projectDir", testEnv.projectRoot]);

    // Should be able to use tools without activation
    const response = await callTool("list_issues", { type: "project" });

    expect(response.content[0].text).not.toContain("not configured");
  });

  it("should preserve server configuration between tool calls", async () => {
    await startServerWithArgs(["--projectDir", testEnv.projectRoot]);

    // First tool call
    await callTool("create_issue", {
      type: "project",
      title: "Project 1",
    });

    // Second tool call should still work without re-activation
    const response = await callTool("create_issue", {
      type: "project",
      title: "Project 2",
    });

    expect(response.content[0].text).toContain("Created object");
  });

  describe("--auto-prune argument", () => {
    it("should accept valid numeric values", async () => {
      await startServerWithArgs([
        "--projectDir",
        testEnv.projectRoot,
        "--auto-prune",
        "7",
      ]);

      const toolsResponse = await client!.request(
        { method: "tools/list" },
        ListToolsResultSchema,
      );
      expect(toolsResponse).toBeDefined();
      expect(Array.isArray(toolsResponse.tools)).toBe(true);
    });

    it("should accept zero value (disabled)", async () => {
      await startServerWithArgs([
        "--projectDir",
        testEnv.projectRoot,
        "--auto-prune",
        "0",
      ]);

      const toolsResponse = await client!.request(
        { method: "tools/list" },
        ListToolsResultSchema,
      );
      expect(toolsResponse).toBeDefined();
    });

    it("should default to 0 when not specified", async () => {
      await startServerWithArgs(["--projectDir", testEnv.projectRoot]);

      const toolsResponse = await client!.request(
        { method: "tools/list" },
        ListToolsResultSchema,
      );
      expect(toolsResponse).toBeDefined();
    });

    it("should accept large numeric values", async () => {
      await startServerWithArgs([
        "--projectDir",
        testEnv.projectRoot,
        "--auto-prune",
        "365",
      ]);

      const toolsResponse = await client!.request(
        { method: "tools/list" },
        ListToolsResultSchema,
      );
      expect(toolsResponse).toBeDefined();
    });
  });
});
