import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { CallToolResultSchema } from "@modelcontextprotocol/sdk/types.js";
import { mkdir, readdir, stat, writeFile } from "fs/promises";
import path from "path";
import { TestEnvironment, pathExists } from "../utils";

describe("E2E Configuration - Directory Setup", () => {
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

  describe(".trellis Directory Creation", () => {
    it("should create .trellis directory on first object creation", async () => {
      await callTool("activate", {
        mode: "local",
        projectRoot: testEnv.projectRoot,
      });

      const trellisPath = path.join(testEnv.projectRoot, ".trellis");

      // Directory should not exist yet
      expect(await pathExists(trellisPath)).toBe(false);

      // Create first object
      await callTool("create_issue", {
        type: "project",
        title: "Test Project",
      });

      // Now directory should exist
      expect(await pathExists(trellisPath)).toBe(true);

      // Verify it's a directory
      const stats = await stat(trellisPath);
      expect(stats.isDirectory()).toBe(true);
    });

    it("should create subdirectory structure for projects", async () => {
      await callTool("activate", {
        mode: "local",
        projectRoot: testEnv.projectRoot,
      });

      await callTool("create_issue", {
        type: "project",
        title: "Test Project",
      });

      const projectDir = path.join(
        testEnv.projectRoot,
        ".trellis",
        "p",
        "P-test-project",
      );
      expect(await pathExists(projectDir)).toBe(true);

      const files = await readdir(projectDir);
      expect(files).toContain("P-test-project.md");
    });

    it("should create nested structure for epics", async () => {
      await callTool("activate", {
        mode: "local",
        projectRoot: testEnv.projectRoot,
      });

      // Create project first
      await callTool("create_issue", {
        type: "project",
        title: "Parent Project",
      });

      // Create epic
      await callTool("create_issue", {
        type: "epic",
        title: "Test Epic",
        parent: "P-parent-project",
      });

      const epicDir = path.join(
        testEnv.projectRoot,
        ".trellis",
        "p",
        "P-parent-project",
        "e",
        "E-test-epic",
      );
      expect(await pathExists(epicDir)).toBe(true);
    });

    it("should create nested structure for features", async () => {
      await callTool("activate", {
        mode: "local",
        projectRoot: testEnv.projectRoot,
      });

      // Create hierarchy
      await callTool("create_issue", {
        type: "project",
        title: "Project",
      });

      await callTool("create_issue", {
        type: "epic",
        title: "Epic",
        parent: "P-project",
      });

      await callTool("create_issue", {
        type: "feature",
        title: "Feature",
        parent: "E-epic",
      });

      const featureDir = path.join(
        testEnv.projectRoot,
        ".trellis",
        "p",
        "P-project",
        "e",
        "E-epic",
        "f",
        "F-feature",
      );
      expect(await pathExists(featureDir)).toBe(true);
    });

    it("should create task structure within features", async () => {
      await callTool("activate", {
        mode: "local",
        projectRoot: testEnv.projectRoot,
      });

      // Create feature
      await callTool("create_issue", {
        type: "feature",
        title: "Feature",
      });

      // Create task
      await callTool("create_issue", {
        type: "task",
        title: "Open Task",
        parent: "F-feature",
        status: "open",
      });

      // Check task is in the correct location
      const taskPath = path.join(
        testEnv.projectRoot,
        ".trellis",
        "f",
        "F-feature",
        "t",
      );
      expect(await pathExists(taskPath)).toBe(true);

      // Check task is created in status subdirectory
      const files = await readdir(taskPath);
      expect(files).toContain("open");

      // Check task file exists in the open subdirectory
      const openTaskFiles = await readdir(path.join(taskPath, "open"));
      expect(
        openTaskFiles.some(
          (f) => f.includes("open-task") || f.startsWith("T-"),
        ),
      ).toBe(true);
    });

    it("should handle standalone tasks", async () => {
      await callTool("activate", {
        mode: "local",
        projectRoot: testEnv.projectRoot,
      });

      // Create standalone task
      await callTool("create_issue", {
        type: "task",
        title: "Standalone Task",
        status: "open",
      });

      // Check task is in standalone location
      const taskPath = path.join(testEnv.projectRoot, ".trellis", "t");
      expect(await pathExists(taskPath)).toBe(true);

      const files = await readdir(taskPath);
      expect(files).toContain("open");

      // Check task file exists in the open subdirectory
      const openTaskFiles = await readdir(path.join(taskPath, "open"));
      expect(
        openTaskFiles.some(
          (f) => f.includes("standalone-task") || f.startsWith("T-"),
        ),
      ).toBe(true);
    });
  });

  describe("Directory Permissions", () => {
    it("should create directories with proper permissions", async () => {
      await callTool("activate", {
        mode: "local",
        projectRoot: testEnv.projectRoot,
      });

      await callTool("create_issue", {
        type: "project",
        title: "Test",
      });

      const trellisPath = path.join(testEnv.projectRoot, ".trellis");
      const stats = await stat(trellisPath);

      // Check directory is readable and writable
      expect(stats.mode & 0o400).toBeTruthy(); // Readable
      expect(stats.mode & 0o200).toBeTruthy(); // Writable
    });
  });

  describe("Existing Files Handling", () => {
    it("should handle existing .trellis directory", async () => {
      const trellisPath = path.join(testEnv.projectRoot, ".trellis");
      await mkdir(trellisPath, { recursive: true });

      await callTool("activate", {
        mode: "local",
        projectRoot: testEnv.projectRoot,
      });

      // Should work with existing directory
      await callTool("create_issue", {
        type: "project",
        title: "Test",
      });

      expect(await pathExists(path.join(trellisPath, "p", "P-test"))).toBe(
        true,
      );
    });

    it("should handle existing subdirectories and files", async () => {
      const projectPath = path.join(
        testEnv.projectRoot,
        ".trellis",
        "p",
        "P-existing",
      );
      await mkdir(projectPath, { recursive: true });
      await writeFile(
        path.join(projectPath, "P-existing.md"),
        "---\nkind: project\nid: P-existing\ntitle: Existing\nstatus: open\npriority: normal\ncreated: 2025-01-01T00:00:00.000Z\nupdated: 2025-01-01T00:00:00.000Z\nschema_version: 1.1\n---\nExisting project\n",
      );

      await callTool("activate", {
        mode: "local",
        projectRoot: testEnv.projectRoot,
      });

      // Should be able to read existing objects
      const response = await callTool("get_issue", {
        id: "P-existing",
      });
      expect(response.content[0].text).toContain("P-existing");

      // And create new ones
      await callTool("create_issue", {
        type: "project",
        title: "New",
      });

      const newProjectPath = path.join(
        testEnv.projectRoot,
        ".trellis",
        "p",
        "P-new",
      );
      expect(await pathExists(newProjectPath)).toBe(true);
    });
  });

  describe("Complex Hierarchy Creation", () => {
    it("should create full project hierarchy structure", async () => {
      await callTool("activate", {
        mode: "local",
        projectRoot: testEnv.projectRoot,
      });

      // Create complete hierarchy
      await callTool("create_issue", {
        type: "project",
        title: "Full Project",
      });

      await callTool("create_issue", {
        type: "epic",
        title: "Epic One",
        parent: "P-full-project",
      });

      await callTool("create_issue", {
        type: "feature",
        title: "Feature Alpha",
        parent: "E-epic-one",
      });

      await callTool("create_issue", {
        type: "task",
        title: "Task Beta",
        parent: "F-feature-alpha",
      });

      // Verify complete path exists
      const fullPath = path.join(
        testEnv.projectRoot,
        ".trellis",
        "p",
        "P-full-project",
        "e",
        "E-epic-one",
        "f",
        "F-feature-alpha",
        "t",
      );
      expect(await pathExists(fullPath)).toBe(true);

      // Verify task directory structure exists
      const files = await readdir(fullPath);
      expect(files).toContain("open");

      // Check task file exists in the open subdirectory
      const openTaskFiles = await readdir(path.join(fullPath, "open"));
      expect(
        openTaskFiles.some(
          (f) => f.includes("task-beta") || f.startsWith("T-"),
        ),
      ).toBe(true);
    });
  });
});
