jest.mock("fs/promises", () => {
  const actual =
    jest.requireActual<typeof import("fs/promises")>("fs/promises");
  return { ...actual, readFile: jest.fn(actual.readFile) };
});

import { mkdir, mkdtemp, readFile, rm, utimes, writeFile } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import {
  TrellisObjectPriority,
  TrellisObjectStatus,
  TrellisObjectType,
} from "../../../models";
import { getObjectById } from "../getObjectById";
import { RepoIndex } from "../RepoIndex";

const mockReadFile = readFile as jest.MockedFunction<typeof readFile>;

function mdContent(id: string, title = id): string {
  return [
    "---",
    `id: ${id}`,
    `title: ${title}`,
    "status: open",
    "priority: high",
    "schema: v1.0",
    "created: 2025-01-01T00:00:00Z",
    "updated: 2025-01-01T00:00:00Z",
    "---",
    "",
    `# ${title}`,
    "",
  ].join("\n");
}

describe("getObjectById", () => {
  const testPlanningRoot = join(__dirname, "schema1_0", ".trellis");

  beforeEach(() => {
    RepoIndex.invalidateAll(testPlanningRoot);
    mockReadFile.mockClear();
  });

  it("should find and return a Project object by ID", async () => {
    const result = await getObjectById(
      "P-ecommerce-platform",
      testPlanningRoot,
    );

    expect(result).not.toBeNull();
    expect(result!.id).toBe("P-ecommerce-platform");
    expect(result!.type).toBe(TrellisObjectType.PROJECT);
    expect(result!.title).toBe("E-commerce Platform");
    expect(result!.status).toBe(TrellisObjectStatus.IN_PROGRESS);
    expect(result!.priority).toBe(TrellisObjectPriority.HIGH);
    expect(result!.body).toContain("# E-commerce Platform");
    expect(result!.childrenIds).toEqual(
      expect.arrayContaining(["E-product-catalog", "E-user-management"]),
    );
  });

  it("should find and return a Task object by ID", async () => {
    const result = await getObjectById("T-setup-database", testPlanningRoot);

    expect(result).not.toBeNull();
    expect(result!.id).toBe("T-setup-database");
    expect(result!.type).toBe(TrellisObjectType.TASK);
    expect(result!.title).toBe("Setup Database Connection");
    expect(result!.status).toBe(TrellisObjectStatus.OPEN);
    expect(result!.priority).toBe(TrellisObjectPriority.HIGH);
    expect(result!.body).toContain("# Setup Database Connection");
  });

  it("should find and return a Feature object by ID", async () => {
    const result = await getObjectById(
      "F-user-authentication",
      testPlanningRoot,
    );

    expect(result).not.toBeNull();
    expect(result!.id).toBe("F-user-authentication");
    expect(result!.type).toBe(TrellisObjectType.FEATURE);
    expect(result!.title).toBeDefined();
    expect(result!.status).toBeDefined();
    expect(result!.priority).toBeDefined();
    expect(result!.childrenIds).toEqual(
      expect.arrayContaining(["T-implement-login", "T-setup-auth-models"]),
    );
  });

  it("should return null when object ID is not found", async () => {
    const result = await getObjectById("non-existent-id", testPlanningRoot);
    expect(result).toBeNull();
  });

  it("should return null when planning root does not exist", async () => {
    const result = await getObjectById(
      "T-setup-database",
      "/non/existent/path",
    );
    expect(result).toBeNull();
  });

  it("should not read child files when fetching a parent with children (warm cache)", async () => {
    // Warm the index so the follow-up call exercises the cached path only.
    await getObjectById("P-ecommerce-platform", testPlanningRoot);
    mockReadFile.mockClear();

    await getObjectById("P-ecommerce-platform", testPlanningRoot);

    const readPaths = mockReadFile.mock.calls.map((c) => c[0] as string);
    expect(readPaths.some((p) => p.includes("E-product-catalog"))).toBe(false);
    expect(readPaths.some((p) => p.includes("E-user-management"))).toBe(false);
  });

  describe("caching", () => {
    let tempRoot: string;

    beforeEach(async () => {
      tempRoot = await mkdtemp(join(tmpdir(), "gobi-cache-test-"));
      await mkdir(join(tempRoot, "t", "open"), { recursive: true });
      await writeFile(join(tempRoot, "t", "open", "T-a.md"), mdContent("T-a"));
      await writeFile(join(tempRoot, "t", "open", "T-b.md"), mdContent("T-b"));
      await writeFile(join(tempRoot, "t", "open", "T-c.md"), mdContent("T-c"));
    });

    afterEach(async () => {
      RepoIndex.invalidateAll(tempRoot);
      await rm(tempRoot, { recursive: true, force: true });
    });

    it("reads exactly one file on a warm cache hit (not the whole directory)", async () => {
      // Cold call: populates the index.
      await getObjectById("T-b", tempRoot);

      mockReadFile.mockClear();
      const result = await getObjectById("T-b", tempRoot);

      expect(result).not.toBeNull();
      expect(result!.id).toBe("T-b");
      expect(mockReadFile).toHaveBeenCalledTimes(1);
      expect(mockReadFile.mock.calls[0][0]).toBe(
        join(tempRoot, "t", "open", "T-b.md"),
      );
    });

    it("returns fresh data after an external overwrite", async () => {
      const filePath = join(tempRoot, "t", "open", "T-b.md");
      const first = await getObjectById("T-b", tempRoot);
      expect(first!.title).toBe("T-b");

      // Simulate another process overwriting the file with a different title.
      await writeFile(filePath, mdContent("T-b", "Updated Title"));
      const future = new Date(Date.now() + 60_000);
      await utimes(filePath, future, future);

      const second = await getObjectById("T-b", tempRoot);
      expect(second).not.toBeNull();
      expect(second!.title).toBe("Updated Title");
    });
  });
});
