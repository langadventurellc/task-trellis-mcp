import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import {
  CallToolResultSchema,
  ListToolsResultSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { TestEnvironment } from "../utils";

describe("E2E Configuration - Pre-Activation Behavior", () => {
  let testEnv: TestEnvironment;
  let client: Client | null = null;
  let transport: StdioClientTransport | null = null;

  beforeEach(async () => {
    testEnv = new TestEnvironment();
    testEnv.setup();

    // Create client WITHOUT CLI args to test pure pre-activation state
    transport = new StdioClientTransport({
      command: "node",
      args: ["dist/server.js"], // No --projectRootFolder
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

  it("should block create_object before activation", async () => {
    const response = await callTool("create_object", {
      type: "project",
      title: "Test",
    });
    expect(response.content[0].text).toContain(
      "Planning root folder is not configured",
    );
  });

  it("should block update_object before activation", async () => {
    const response = await callTool("update_object", {
      id: "P-test",
      yamlPatch: { title: "Updated" },
    });
    expect(response.content[0].text).toContain(
      "Planning root folder is not configured",
    );
  });

  it("should block get_object before activation", async () => {
    const response = await callTool("get_object", {
      id: "P-test",
    });
    expect(response.content[0].text).toContain(
      "Planning root folder is not configured",
    );
  });

  it("should block list_objects before activation", async () => {
    const response = await callTool("list_objects", { type: "project" });
    expect(response.content[0].text).toContain(
      "Planning root folder is not configured",
    );
  });

  it("should block claim_task before activation", async () => {
    const response = await callTool("claim_task", {});
    expect(response.content[0].text).toContain(
      "Planning root folder is not configured",
    );
  });

  it("should block complete_task before activation", async () => {
    const response = await callTool("complete_task", {
      taskId: "T-test",
    });
    expect(response.content[0].text).toContain(
      "Planning root folder is not configured",
    );
  });

  it("should allow activate tool before activation", async () => {
    const response = await callTool("activate", {
      mode: "local",
      projectRoot: testEnv.projectRoot,
    });

    expect(response.content[0].text).toContain("Activated in local mode");
  });

  it("should allow list_tools before activation", async () => {
    const response = await client!.request(
      { method: "tools/list" },
      ListToolsResultSchema,
    );

    expect(response.tools).toBeDefined();
    expect(Array.isArray(response.tools)).toBe(true);
    expect(response.tools.length).toBeGreaterThan(0);

    const toolNames = response.tools.map((t: any) => t.name);
    expect(toolNames).toContain("activate");
    expect(toolNames).toContain("create_object");
    expect(toolNames).toContain("list_objects");
  });

  it("should establish MCP handshake before activation", async () => {
    // The fact that we can call list tools proves handshake worked
    const response = await client!.request(
      { method: "tools/list" },
      ListToolsResultSchema,
    );
    expect(response).toBeDefined();
  });

  it("should provide clear error message for each blocked tool", async () => {
    const tools = [
      "create_object",
      "update_object",
      "get_object",
      "list_objects",
      "claim_task",
      "complete_task",
    ];

    for (const tool of tools) {
      const response = await callTool(tool, { id: "test" });
      expect(response.content[0].text).toContain(
        "Planning root folder is not configured",
      );
    }
  });

  it("should allow tools after activation", async () => {
    // Activate first
    await callTool("activate", {
      mode: "local",
      projectRoot: testEnv.projectRoot,
    });

    // Should now work
    const response = await callTool("list_objects", { type: "project" });
    expect(response.content[0].text).not.toContain("not configured");
  });
});
