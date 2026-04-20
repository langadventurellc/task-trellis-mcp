jest.mock("node:fs");
jest.mock("../../configuration/resolveDataDir");
jest.mock("../../repositories/local/LocalRepository");

import fs from "node:fs";
import type { IncomingMessage, ServerResponse } from "node:http";
import { resolveDataDir } from "../../configuration/resolveDataDir";
import {
  TrellisObjectPriority,
  TrellisObjectStatus,
  TrellisObjectType,
} from "../../models";
import { LocalRepository } from "../../repositories/local/LocalRepository";
import {
  detailViewHandler,
  projectTreeHandler,
  searchHandler,
} from "../projectTreePage";

const mockResolveDataDir = resolveDataDir as jest.MockedFunction<
  typeof resolveDataDir
>;
const MockedLocalRepository = LocalRepository as jest.MockedClass<
  typeof LocalRepository
>;
const mockExistsSync = fs.existsSync as jest.Mock;

const makeRes = () =>
  ({ writeHead: jest.fn(), end: jest.fn() }) as unknown as ServerResponse;

const makeReq = (url = "/") => ({ url }) as IncomingMessage;

function makeObj(overrides: Record<string, unknown> = {}) {
  return {
    id: "T-test",
    type: TrellisObjectType.TASK,
    title: "Test Task",
    status: TrellisObjectStatus.OPEN,
    priority: TrellisObjectPriority.MEDIUM,
    parent: null,
    prerequisites: [],
    affectedFiles: new Map<string, string>(),
    log: [],
    schema: "v1.0",
    childrenIds: [],
    created: "2026-01-01T00:00:00Z",
    updated: "2026-01-01T00:00:00Z",
    body: "",
    ...overrides,
  };
}

describe("projectTreeHandler", () => {
  let mockGetObjects: jest.Mock;

  beforeEach(() => {
    jest.resetAllMocks();
    mockGetObjects = jest.fn().mockResolvedValue([]);
    MockedLocalRepository.mockImplementation(
      () => ({ getObjects: mockGetObjects }) as unknown as LocalRepository,
    );
    mockResolveDataDir.mockReturnValue("/test/data");
    mockExistsSync.mockReturnValue(true);
  });

  it("returns 404 when project directory does not exist", async () => {
    mockExistsSync.mockReturnValue(false);

    const res = makeRes();
    await projectTreeHandler(makeReq(), res, { key: "missing-proj" });

    expect((res.writeHead as jest.Mock).mock.calls[0][0]).toBe(404);
  });

  it("renders full page with appShell, sidebar, and meta bar", async () => {
    mockGetObjects.mockResolvedValue([
      makeObj({
        id: "T-one",
        title: "Task One",
        status: TrellisObjectStatus.OPEN,
      }),
      makeObj({
        id: "T-two",
        title: "Task Two",
        status: TrellisObjectStatus.IN_PROGRESS,
      }),
      makeObj({
        id: "T-three",
        title: "Task Three",
        status: TrellisObjectStatus.DONE,
      }),
    ]);

    const res = makeRes();
    await projectTreeHandler(makeReq(), res, { key: "my-proj" });

    expect((res.writeHead as jest.Mock).mock.calls[0][0]).toBe(200);
    const html = (res.end as jest.Mock).mock.calls[0][0] as string;
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("Task One");
    expect(html).toContain('id="issue-tree"');
    expect(html).toContain('hx-trigger="refreshTree from:body"');
    expect(html).toContain("/projects/my-proj/issues/search");
    expect(html).toContain("<strong>3</strong> issues");
    expect(html).toContain("1 open · 1 in-progress · 1 done");
  });

  it("renders search input wired to search endpoint", async () => {
    mockGetObjects.mockResolvedValue([]);

    const res = makeRes();
    await projectTreeHandler(makeReq(), res, { key: "my-proj" });

    const html = (res.end as jest.Mock).mock.calls[0][0] as string;
    expect(html).toContain('hx-get="/projects/my-proj/issues/search"');
    expect(html).toContain('hx-trigger="keyup changed delay:200ms"');
    expect(html).toContain('id="detail"');
  });

  it("renders tree nodes with kind letter and correct status/priority classes", async () => {
    mockGetObjects.mockResolvedValue([
      makeObj({
        id: "T-alpha",
        title: "Alpha",
        type: TrellisObjectType.TASK,
        status: TrellisObjectStatus.IN_PROGRESS,
        priority: TrellisObjectPriority.MEDIUM,
        childrenIds: ["T-child"],
      }),
    ]);

    const res = makeRes();
    await projectTreeHandler(makeReq(), res, { key: "my-proj" });

    const html = (res.end as jest.Mock).mock.calls[0][0] as string;
    expect(html).toContain('class="kind">T<');
    expect(html).toContain("sdot progress");
    expect(html).toContain("pbar med");
    expect(html).toContain('class="chev"');
  });
});

describe("searchHandler", () => {
  let mockGetObjects: jest.Mock;

  beforeEach(() => {
    jest.resetAllMocks();
    mockGetObjects = jest.fn().mockResolvedValue([]);
    MockedLocalRepository.mockImplementation(
      () => ({ getObjects: mockGetObjects }) as unknown as LocalRepository,
    );
    mockResolveDataDir.mockReturnValue("/test/data");
  });

  it("returns full tree when q is absent", async () => {
    mockGetObjects.mockResolvedValue([
      makeObj({ id: "T-one", title: "One", parent: null }),
    ]);

    const res = makeRes();
    await searchHandler(makeReq("/projects/my-proj/issues/search"), res, {
      key: "my-proj",
    });

    expect((res.writeHead as jest.Mock).mock.calls[0][0]).toBe(200);
    const html = (res.end as jest.Mock).mock.calls[0][0] as string;
    expect(html).toContain("One");
  });

  it("emits OOB tree-meta update alongside tree fragment", async () => {
    mockGetObjects.mockResolvedValue([
      makeObj({ id: "T-one", status: TrellisObjectStatus.OPEN }),
      makeObj({ id: "T-two", status: TrellisObjectStatus.DONE }),
    ]);

    const res = makeRes();
    await searchHandler(makeReq("/projects/my-proj/issues/search"), res, {
      key: "my-proj",
    });

    const html = (res.end as jest.Mock).mock.calls[0][0] as string;
    expect(html).toContain('id="tree-meta"');
    expect(html).toContain('hx-swap-oob="true"');
    expect(html).toContain("<strong>2</strong> issues");
  });

  it("filters results by case-insensitive title match", async () => {
    mockGetObjects.mockResolvedValue([
      makeObj({ id: "T-auth", title: "Auth Login" }),
      makeObj({ id: "T-other", title: "Other Task" }),
    ]);

    const res = makeRes();
    await searchHandler(
      makeReq("/projects/my-proj/issues/search?q=auth"),
      res,
      { key: "my-proj" },
    );

    const html = (res.end as jest.Mock).mock.calls[0][0] as string;
    expect(html).toContain("Auth Login");
    expect(html).not.toContain("Other Task");
  });

  it("filters by id and body as well as title", async () => {
    mockGetObjects.mockResolvedValue([
      makeObj({ id: "T-xyz", title: "Some Task", body: "contains keyword" }),
      makeObj({ id: "T-abc", title: "Another" }),
      makeObj({ id: "match-id", title: "By ID" }),
    ]);

    const res = makeRes();
    await searchHandler(
      makeReq("/projects/my-proj/issues/search?q=keyword"),
      res,
      { key: "my-proj" },
    );

    const html = (res.end as jest.Mock).mock.calls[0][0] as string;
    expect(html).toContain("Some Task");
    expect(html).not.toContain("Another");
  });

  it("returns no-results message when nothing matches", async () => {
    mockGetObjects.mockResolvedValue([
      makeObj({ id: "T-one", title: "Unrelated" }),
    ]);

    const res = makeRes();
    await searchHandler(
      makeReq("/projects/my-proj/issues/search?q=zzznomatch"),
      res,
      { key: "my-proj" },
    );

    const html = (res.end as jest.Mock).mock.calls[0][0] as string;
    expect(html).toContain("No results found");
  });
});

describe("detailViewHandler", () => {
  let mockGetObjectById: jest.Mock;
  let mockListAttachments: jest.Mock;

  beforeEach(() => {
    jest.resetAllMocks();
    mockGetObjectById = jest.fn().mockResolvedValue(null);
    mockListAttachments = jest.fn().mockResolvedValue([]);
    MockedLocalRepository.mockImplementation(
      () =>
        ({
          getObjectById: mockGetObjectById,
          listAttachments: mockListAttachments,
        }) as unknown as LocalRepository,
    );
    mockResolveDataDir.mockReturnValue("/test/data");
  });

  it("returns 404 for unknown IDs", async () => {
    mockGetObjectById.mockResolvedValue(null);

    const res = makeRes();
    await detailViewHandler(makeReq(), res, {
      key: "my-proj",
      id: "T-missing",
    });

    expect((res.writeHead as jest.Mock).mock.calls[0][0]).toBe(404);
    const html = (res.end as jest.Mock).mock.calls[0][0] as string;
    expect(html).toContain("Not found");
    expect(html).toContain("T-missing");
  });

  it("renders title, badges, and description", async () => {
    mockGetObjectById.mockResolvedValue(
      makeObj({
        id: "T-detail",
        title: "Detail Task",
        body: "The body text",
        status: TrellisObjectStatus.IN_PROGRESS,
        priority: TrellisObjectPriority.MEDIUM,
        type: TrellisObjectType.TASK,
        parent: null,
      }),
    );

    const res = makeRes();
    await detailViewHandler(makeReq(), res, {
      key: "my-proj",
      id: "T-detail",
    });

    const html = (res.end as jest.Mock).mock.calls[0][0] as string;
    expect(html).toContain("Detail Task");
    expect(html).toContain("The body text");
    expect(html).toContain("status-progress");
    expect(html).toContain("In Progress");
    expect(html).toContain("priority med");
    expect(html).toContain("Medium priority");
    expect(html).toContain("Task");
    expect(html).toContain('data-view="view"');
  });

  it("hides Add child button for task type", async () => {
    mockGetObjectById.mockResolvedValue(
      makeObj({ id: "T-task", type: TrellisObjectType.TASK, parent: null }),
    );

    const res = makeRes();
    await detailViewHandler(makeReq(), res, { key: "my-proj", id: "T-task" });

    const html = (res.end as jest.Mock).mock.calls[0][0] as string;
    expect(html).toContain('style="display:none"');
    expect(html).toContain("Add child");
  });

  it("shows Add child button for non-task types", async () => {
    mockGetObjectById.mockResolvedValue(
      makeObj({
        id: "F-feat",
        type: TrellisObjectType.FEATURE,
        parent: null,
      }),
    );

    const res = makeRes();
    await detailViewHandler(makeReq(), res, { key: "my-proj", id: "F-feat" });

    const html = (res.end as jest.Mock).mock.calls[0][0] as string;
    expect(html).not.toContain('style="display:none"');
    expect(html).toContain("Add child");
  });

  it("renders breadcrumbs with ancestor links", async () => {
    mockGetObjectById.mockImplementation((id: string) => {
      if (id === "T-child")
        return Promise.resolve(
          makeObj({ id: "T-child", title: "Child Task", parent: "F-parent" }),
        );
      if (id === "F-parent")
        return Promise.resolve(
          makeObj({
            id: "F-parent",
            title: "Parent Feature",
            type: TrellisObjectType.FEATURE,
            parent: null,
          }),
        );
      return Promise.resolve(null);
    });

    const res = makeRes();
    await detailViewHandler(makeReq(), res, {
      key: "my-proj",
      id: "T-child",
    });

    const html = (res.end as jest.Mock).mock.calls[0][0] as string;
    expect(html).toContain("Parent Feature");
    expect(html).toContain('hx-get="/projects/my-proj/issues/F-parent/detail"');
    expect(html).toContain("Child Task");
  });

  it("renders prerequisites with resolved titles and status badges", async () => {
    mockGetObjectById.mockImplementation((id: string) => {
      if (id === "T-detail")
        return Promise.resolve(
          makeObj({
            id: "T-detail",
            title: "Detail Task",
            prerequisites: ["T-prereq-1"],
            parent: null,
          }),
        );
      if (id === "T-prereq-1")
        return Promise.resolve(
          makeObj({
            id: "T-prereq-1",
            title: "Prereq One",
            status: TrellisObjectStatus.DONE,
            parent: null,
          }),
        );
      return Promise.resolve(null);
    });

    const res = makeRes();
    await detailViewHandler(makeReq(), res, {
      key: "my-proj",
      id: "T-detail",
    });

    const html = (res.end as jest.Mock).mock.calls[0][0] as string;
    expect(html).toContain("T-prereq-1");
    expect(html).toContain("Prereq One");
    expect(html).toContain("Done");
  });

  it("renders log entries as list items without timestamps", async () => {
    mockGetObjectById.mockResolvedValue(
      makeObj({
        id: "T-logged",
        log: ["First log entry", "Second log entry"],
        parent: null,
      }),
    );

    const res = makeRes();
    await detailViewHandler(makeReq(), res, {
      key: "my-proj",
      id: "T-logged",
    });

    const html = (res.end as jest.Mock).mock.calls[0][0] as string;
    expect(html).toContain('<span class="entry">First log entry</span>');
    expect(html).toContain('<span class="entry">Second log entry</span>');
  });

  it("renders affectedFiles with path and description", async () => {
    const files = new Map([
      ["src/foo.ts", "Added foo feature"],
      ["src/bar.ts", "Updated bar"],
    ]);
    mockGetObjectById.mockResolvedValue(
      makeObj({ id: "T-files", affectedFiles: files, parent: null }),
    );

    const res = makeRes();
    await detailViewHandler(makeReq(), res, {
      key: "my-proj",
      id: "T-files",
    });

    const html = (res.end as jest.Mock).mock.calls[0][0] as string;
    expect(html).toContain("src/foo.ts");
    expect(html).toContain("Added foo feature");
    expect(html).toContain("src/bar.ts");
    expect(html).toContain("Updated bar");
  });

  it("renders empty states when sections have no content", async () => {
    mockGetObjectById.mockResolvedValue(
      makeObj({
        id: "T-empty",
        body: "",
        prerequisites: [],
        log: [],
        affectedFiles: new Map(),
        parent: null,
      }),
    );

    const res = makeRes();
    await detailViewHandler(makeReq(), res, {
      key: "my-proj",
      id: "T-empty",
    });

    const html = (res.end as jest.Mock).mock.calls[0][0] as string;
    expect(html).toContain("No description.");
    expect(html).toContain("No prerequisites.");
    expect(html).toContain("No log entries.");
    expect(html).toContain("No modified files.");
  });

  it("renders attachment links when attachments are present", async () => {
    mockGetObjectById.mockResolvedValue(
      makeObj({ id: "T-attach", title: "Attach Task", parent: null }),
    );
    mockListAttachments.mockResolvedValue(["diagram.png", "notes.txt"]);

    const res = makeRes();
    await detailViewHandler(makeReq(), res, {
      key: "my-proj",
      id: "T-attach",
    });

    const html = (res.end as jest.Mock).mock.calls[0][0] as string;
    expect(html).toContain("Attachments");
    expect(html).toContain(
      'href="/projects/my-proj/issues/T-attach/attachments/diagram.png"',
    );
    expect(html).toContain(
      'href="/projects/my-proj/issues/T-attach/attachments/notes.txt"',
    );
    expect(html).toContain("diagram.png");
    expect(html).toContain("notes.txt");
  });

  it("renders no attachments section when list is empty", async () => {
    mockGetObjectById.mockResolvedValue(
      makeObj({ id: "T-noattach", parent: null }),
    );
    mockListAttachments.mockResolvedValue([]);

    const res = makeRes();
    await detailViewHandler(makeReq(), res, {
      key: "my-proj",
      id: "T-noattach",
    });

    const html = (res.end as jest.Mock).mock.calls[0][0] as string;
    expect(html).not.toContain("Attachments");
  });
});
