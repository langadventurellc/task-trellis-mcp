import { TestEnvironment } from "../utils/testEnvironment";
import { McpTestClient } from "../utils/mcpTestClient";

describe("E2E Infrastructure - Client", () => {
  let testEnv: TestEnvironment;
  let client: McpTestClient;

  beforeEach(async () => {
    testEnv = new TestEnvironment();
    testEnv.setup();
    client = new McpTestClient(testEnv.projectRoot);
    await client.connect();
  }, 30000);

  afterEach(async () => {
    await client?.disconnect();
    testEnv?.cleanup();
  });

  it("should call activate tool successfully", async () => {
    const result = await client.callTool("activate", {
      mode: "local",
      projectRoot: testEnv.projectRoot,
    });

    expect(result).toBeDefined();
    expect(result.content).toBeDefined();
    expect(result.content[0].type).toBe("text");
    expect(result.content[0].text).toContain("Activated in local mode");
  });

  it("should create an object via MCP protocol", async () => {
    // First activate the server
    await client.callTool("activate", {
      mode: "local",
      projectRoot: testEnv.projectRoot,
    });

    // Create a project
    const result = await client.callTool("create_object", {
      type: "project",
      title: "Test Project",
      body: "Test project body",
    });

    expect(result).toBeDefined();
    expect(result.content).toBeDefined();
    expect(result.content[0].type).toBe("text");

    const responseText = result.content[0].text as string;
    expect(responseText).toContain("Created object");
    expect(responseText).toContain("P-test-project");
  });

  it("should list objects after creation", async () => {
    // Activate and create a project
    await client.callTool("activate", {
      mode: "local",
      projectRoot: testEnv.projectRoot,
    });

    await client.callTool("create_object", {
      type: "project",
      title: "Test Project",
      body: "Test project body",
    });

    // List objects with type parameter
    const result = await client.callTool("list_objects", {
      type: "project",
    });

    expect(result).toBeDefined();
    expect(result.content).toBeDefined();

    const responseText = result.content[0].text as string;
    expect(responseText).toContain("P-test-project");
  });
});
