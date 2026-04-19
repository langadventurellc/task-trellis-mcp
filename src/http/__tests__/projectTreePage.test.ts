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
  detailPartialHandler,
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
    expect(html).toContain("3 issues · 1 open · 1 in-progress · 1 done");
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
    expect(html).toContain("status-dot progress");
    expect(html).toContain("priority-bar med");
    expect(html).toContain("chevron");
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

describe("detailPartialHandler", () => {
  let mockGetObjectById: jest.Mock;

  beforeEach(() => {
    jest.resetAllMocks();
    mockGetObjectById = jest.fn().mockResolvedValue(null);
    MockedLocalRepository.mockImplementation(
      () =>
        ({ getObjectById: mockGetObjectById }) as unknown as LocalRepository,
    );
    mockResolveDataDir.mockReturnValue("/test/data");
  });

  it("renders body, status, prerequisites, and log fields", async () => {
    mockGetObjectById.mockResolvedValue(
      makeObj({
        id: "T-detail",
        title: "Detail Task",
        body: "The body text",
        status: TrellisObjectStatus.IN_PROGRESS,
        prerequisites: ["T-prereq-1"],
        log: ["2026-01-01T00:00:00Z Task logged"],
      }),
    );

    const res = makeRes();
    await detailPartialHandler(makeReq(), res, {
      key: "my-proj",
      id: "T-detail",
    });

    const html = (res.end as jest.Mock).mock.calls[0][0] as string;
    expect(html).toContain("Detail Task");
    expect(html).toContain("The body text");
    expect(html).toContain("in-progress");
    expect(html).toContain("T-prereq-1");
    expect(html).toContain("Task logged");
  });

  it("returns Not found fragment for unknown IDs", async () => {
    mockGetObjectById.mockResolvedValue(null);

    const res = makeRes();
    await detailPartialHandler(makeReq(), res, {
      key: "my-proj",
      id: "T-missing",
    });

    const html = (res.end as jest.Mock).mock.calls[0][0] as string;
    expect(html).toContain("Not found");
    expect(html).toContain("T-missing");
    expect((res.writeHead as jest.Mock).mock.calls[0][0]).toBe(200);
  });
});
