import {
  TrellisObjectPriority,
  TrellisObjectStatus,
  TrellisObjectType,
} from "../../models";
import type { TrellisObject } from "../../models/TrellisObject";
import { Repository } from "../../repositories/Repository";
import {
  buildIssueUri,
  decodeCursor,
  encodeCursor,
  handleListResources,
  handleListResourceTemplates,
  handleReadResource,
  parseIssueUri,
  toResource,
} from "../index";

const mockObject: TrellisObject = {
  id: "T-test-task",
  type: TrellisObjectType.TASK,
  title: "Test Task",
  status: TrellisObjectStatus.OPEN,
  priority: TrellisObjectPriority.MEDIUM,
  parent: "F-test-feature",
  prerequisites: [],
  affectedFiles: new Map(),
  log: [],
  schema: "v1.0",
  childrenIds: [],
  body: "Task body",
  created: "2026-01-01T00:00:00Z",
  updated: "2026-01-01T00:00:00Z",
};

describe("buildIssueUri", () => {
  it("returns trellis://issue/<id>", () => {
    expect(buildIssueUri("T-test-task")).toBe("trellis://issue/T-test-task");
  });
});

describe("parseIssueUri", () => {
  it("extracts the issue id from a valid URI", () => {
    expect(parseIssueUri("trellis://issue/T-test-task")).toBe("T-test-task");
  });

  it("returns null for wrong scheme", () => {
    expect(parseIssueUri("http://issue/T-test-task")).toBeNull();
  });

  it("returns null for wrong case (Trellis://)", () => {
    expect(parseIssueUri("Trellis://issue/T-test-task")).toBeNull();
  });

  it("returns null when issue/ segment is missing", () => {
    expect(parseIssueUri("trellis://T-test-task")).toBeNull();
  });

  it("returns null for empty id (trailing slash only)", () => {
    expect(parseIssueUri("trellis://issue/")).toBeNull();
  });

  it("returns null when a query string is present", () => {
    expect(parseIssueUri("trellis://issue/T-test-task?foo=bar")).toBeNull();
  });

  it("returns null when a fragment is present", () => {
    expect(parseIssueUri("trellis://issue/T-test-task#anchor")).toBeNull();
  });
});

describe("toResource", () => {
  it("returns the correct resource shape without a size field", () => {
    const resource = toResource(mockObject);

    expect(resource).toEqual({
      uri: "trellis://issue/T-test-task",
      name: "T-test-task",
      title: "Test Task",
      description: "Test Task [open]",
      mimeType: "text/markdown",
    });
    expect(resource).not.toHaveProperty("size");
  });
});

describe("encodeCursor / decodeCursor", () => {
  it("round-trips a non-negative integer offset", () => {
    const cursor = encodeCursor(42);
    expect(decodeCursor(cursor)).toBe(42);
  });

  it("round-trips offset 0", () => {
    expect(decodeCursor(encodeCursor(0))).toBe(0);
  });

  it("encodeCursor throws on a negative offset", () => {
    expect(() => encodeCursor(-1)).toThrow();
  });

  it("encodeCursor throws on a non-integer offset", () => {
    expect(() => encodeCursor(1.5)).toThrow();
  });

  it("decodeCursor throws on invalid base64 payload", () => {
    const badCursor = Buffer.from("not-a-number").toString("base64");
    expect(() => decodeCursor(badCursor)).toThrow();
  });
});

function makeMockRepository(): jest.Mocked<Repository> {
  return {
    getObjectById: jest.fn(),
    getObjects: jest.fn(),
    saveObject: jest.fn(),
    deleteObject: jest.fn(),
    getChildrenOf: jest.fn(),
    getAttachmentsFolder: jest.fn(),
    listAttachments: jest.fn(),
    copyAttachment: jest.fn(),
    deleteAttachment: jest.fn(),
  };
}

function makeObject(
  id: string,
  status: TrellisObjectStatus = TrellisObjectStatus.OPEN,
): TrellisObject {
  return {
    id,
    type: TrellisObjectType.TASK,
    title: `Title ${id}`,
    status,
    priority: TrellisObjectPriority.MEDIUM,
    parent: null,
    prerequisites: [],
    affectedFiles: new Map(),
    log: [],
    schema: "v1.0",
    childrenIds: [],
    body: "",
    created: "2026-01-01T00:00:00Z",
    updated: "2026-01-01T00:00:00Z",
  };
}

describe("handleListResources", () => {
  it("returns correct resource shape for each object", async () => {
    const repo = makeMockRepository();
    repo.getObjects.mockResolvedValue([makeObject("T-alpha")]);

    const { resources } = await handleListResources({}, repo);

    expect(resources).toHaveLength(1);
    expect(resources[0]).toEqual({
      uri: "trellis://issue/T-alpha",
      name: "T-alpha",
      title: "Title T-alpha",
      description: "Title T-alpha [open]",
      mimeType: "text/markdown",
    });
  });

  it("calls getObjects with false to exclude closed issues", async () => {
    const repo = makeMockRepository();
    repo.getObjects.mockResolvedValue([]);

    await handleListResources({}, repo);

    expect(repo.getObjects).toHaveBeenCalledWith(false);
  });

  it("includes draft, open, and in-progress objects", async () => {
    const repo = makeMockRepository();
    repo.getObjects.mockResolvedValue([
      makeObject("T-a", TrellisObjectStatus.DRAFT),
      makeObject("T-b", TrellisObjectStatus.OPEN),
      makeObject("T-c", TrellisObjectStatus.IN_PROGRESS),
    ]);

    const { resources } = await handleListResources({}, repo);

    const ids = resources.map((r) => r.name);
    expect(ids).toContain("T-a");
    expect(ids).toContain("T-b");
    expect(ids).toContain("T-c");
  });

  it("paginates across two pages for 150 items", async () => {
    const repo = makeMockRepository();
    const items = Array.from({ length: 150 }, (_, i) =>
      makeObject(`T-${String(i).padStart(3, "0")}`),
    );
    repo.getObjects.mockResolvedValue(items);

    const page1 = await handleListResources({}, repo);
    expect(page1.resources).toHaveLength(100);
    expect(page1.nextCursor).toBeDefined();

    const page2 = await handleListResources({ cursor: page1.nextCursor }, repo);
    expect(page2.resources).toHaveLength(50);
    expect(page2.nextCursor).toBeUndefined();
  });

  it("returns empty resources and no nextCursor when getObjects returns []", async () => {
    const repo = makeMockRepository();
    repo.getObjects.mockResolvedValue([]);

    const result = await handleListResources({}, repo);

    expect(result).toEqual({ resources: [] });
    expect(result.nextCursor).toBeUndefined();
  });
});

describe("handleListResourceTemplates", () => {
  it("returns the trellis-issue template", () => {
    const { resourceTemplates } = handleListResourceTemplates();

    expect(resourceTemplates).toHaveLength(1);
    expect(resourceTemplates[0]).toEqual({
      uriTemplate: "trellis://issue/{id}",
      name: "trellis-issue",
      title: "Trellis Issue",
      description:
        "A Trellis issue (project, epic, feature, or task) referenced by ID",
      mimeType: "text/markdown",
    });
  });
});

describe("handleReadResource", () => {
  it("returns minimal payload for a known id", async () => {
    const repo = makeMockRepository();
    const obj = makeObject("T-known", TrellisObjectStatus.IN_PROGRESS);
    obj.body = "should not appear";
    repo.getObjectById.mockResolvedValue(obj);

    const result = await handleReadResource(
      { uri: "trellis://issue/T-known" },
      repo,
    );

    const text = result.contents[0].text;
    expect(text).toContain("Title T-known");
    expect(text).toContain("T-known");
    expect(text).toContain("in-progress");
    expect(text).not.toContain("should not appear");
    expect(text).not.toContain("prerequisites");
    expect(text).not.toContain("parent");
    expect(text).not.toContain("log");
  });

  it("throws with the id when the issue is not found", async () => {
    const repo = makeMockRepository();
    repo.getObjectById.mockResolvedValue(null);

    await expect(
      handleReadResource({ uri: "trellis://issue/T-missing" }, repo),
    ).rejects.toThrow("Trellis issue not found: T-missing");
  });

  it("throws before calling repository when URI has no issue/ segment", async () => {
    const repo = makeMockRepository();

    await expect(
      handleReadResource({ uri: "trellis://T-no-segment" }, repo),
    ).rejects.toThrow();

    expect(repo.getObjectById).not.toHaveBeenCalled();
  });

  it("throws before calling repository for http:// scheme", async () => {
    const repo = makeMockRepository();

    await expect(
      handleReadResource({ uri: "http://issue/T-wrong-scheme" }, repo),
    ).rejects.toThrow();

    expect(repo.getObjectById).not.toHaveBeenCalled();
  });
});
