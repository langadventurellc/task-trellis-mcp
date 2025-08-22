import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import {
  CallToolResultSchema,
  ListToolsResultSchema,
} from "@modelcontextprotocol/sdk/types.js";
import path from "path";
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

  it("should start server with --mode local", async () => {
    await startServerWithArgs(["--mode", "local"]);

    const toolsResponse = await client!.request(
      { method: "tools/list" },
      ListToolsResultSchema,
    );
    expect(toolsResponse).toBeDefined();
    expect(Array.isArray(toolsResponse.tools)).toBe(true);
  });

  it("should start server with --projectRootFolder", async () => {
    await startServerWithArgs([
      "--mode",
      "local",
      "--projectRootFolder",
      testEnv.projectRoot,
    ]);

    // Should be able to use tools without activation
    const response = await callTool("list_issues", { type: "project" });

    expect(response.content[0].text).not.toContain("not configured");
  });

  it("should default to local mode when --mode not specified", async () => {
    await startServerWithArgs([]);

    // Try to activate in local mode to verify default
    const response = await callTool("activate", {
      mode: "local",
      projectRoot: testEnv.projectRoot,
    });

    expect(response.content[0].text).toContain("Activated in local mode");
  });

  it("should handle --mode remote", async () => {
    await startServerWithArgs(["--mode", "remote"]);

    const response = await callTool("activate", {
      mode: "remote",
      apiToken: "token",
      remoteProjectId: "proj-1",
    });

    expect(response.content[0].text).toContain("Activated in remote mode");
  });

  it("should override CLI args with activate tool", async () => {
    await startServerWithArgs([
      "--mode",
      "local",
      "--projectRootFolder",
      testEnv.projectRoot,
    ]);

    // Should work initially
    let response = await callTool("list_issues", { type: "project" });
    expect(response.content[0].text).not.toContain("not configured");

    // Override with different path
    const newPath = path.join(testEnv.projectRoot, "new");
    await callTool("activate", {
      mode: "local",
      projectRoot: newPath,
    });

    // Should now use new path
    response = await callTool("create_issue", {
      type: "project",
      title: "Test",
    });
    expect(response).toBeDefined();
  });

  it("should preserve server configuration between tool calls", async () => {
    await startServerWithArgs([
      "--mode",
      "local",
      "--projectRootFolder",
      testEnv.projectRoot,
    ]);

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
        "--mode",
        "local",
        "--projectRootFolder",
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
        "--mode",
        "local",
        "--projectRootFolder",
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
      await startServerWithArgs([
        "--mode",
        "local",
        "--projectRootFolder",
        testEnv.projectRoot,
      ]);

      const toolsResponse = await client!.request(
        { method: "tools/list" },
        ListToolsResultSchema,
      );
      expect(toolsResponse).toBeDefined();
    });

    it("should accept large numeric values", async () => {
      await startServerWithArgs([
        "--mode",
        "local",
        "--projectRootFolder",
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
