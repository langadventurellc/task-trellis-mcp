import { TestEnvironment } from "../utils/testEnvironment";
import { McpTestClient } from "../utils/mcpTestClient";

describe("E2E Infrastructure - Server", () => {
  let testEnv: TestEnvironment;
  let client: McpTestClient;

  beforeEach(() => {
    testEnv = new TestEnvironment();
    testEnv.setup();
    client = new McpTestClient(testEnv.projectRoot);
  }, 30000);

  afterEach(async () => {
    await client?.disconnect();
    testEnv?.cleanup();
  });

  it("should start server and establish MCP connection", async () => {
    await client.connect();
    expect(client.isConnected()).toBe(true);
  });

  it("should list available tools", async () => {
    await client.connect();
    const response = await client.listTools();

    expect(response).toBeDefined();
    expect(response.tools).toBeDefined();
    expect(Array.isArray(response.tools)).toBe(true);
    expect(response.tools.length).toBeGreaterThan(0);

    // Verify expected tools are present
    const toolNames = response.tools.map((t: any) => t.name);
    expect(toolNames).toContain("create_object");
    expect(toolNames).toContain("list_objects");
    expect(toolNames).toContain("get_object");
    expect(toolNames).toContain("update_object");
    expect(toolNames).toContain("delete_object");
  });
});
