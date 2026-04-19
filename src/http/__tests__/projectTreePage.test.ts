jest.mock("../../configuration/resolveDataDir");
jest.mock("../../repositories/local/LocalRepository");

import type { IncomingMessage, ServerResponse } from "node:http";
import { resolveDataDir } from "../../configuration/resolveDataDir";
import {
  TrellisObjectPriority,
  TrellisObjectStatus,
  TrellisObjectType,
} from "../../models";
import { LocalRepository } from "../../repositories/local/LocalRepository";
import {
  childrenPartialHandler,
  detailPartialHandler,
} from "../projectTreePage";

const mockResolveDataDir = resolveDataDir as jest.MockedFunction<
  typeof resolveDataDir
>;
const MockedLocalRepository = LocalRepository as jest.MockedClass<
  typeof LocalRepository
>;

const makeRes = () =>
  ({ writeHead: jest.fn(), end: jest.fn() }) as unknown as ServerResponse;

const makeReq = () => ({}) as IncomingMessage;

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

describe("childrenPartialHandler", () => {
  let mockGetChildrenOf: jest.Mock;

  beforeEach(() => {
    jest.resetAllMocks();
    mockGetChildrenOf = jest.fn().mockResolvedValue([]);
    MockedLocalRepository.mockImplementation(
      () =>
        ({ getChildrenOf: mockGetChildrenOf }) as unknown as LocalRepository,
    );
    mockResolveDataDir.mockReturnValue("/test/data");
  });

  it("returns child node HTML when children exist", async () => {
    mockGetChildrenOf.mockResolvedValue([
      makeObj({ id: "T-child-1", title: "Child One" }),
    ]);

    const res = makeRes();
    await childrenPartialHandler(makeReq(), res, {
      key: "my-proj",
      id: "T-parent",
    });

    const html = (res.end as jest.Mock).mock.calls[0][0] as string;
    expect(html).toContain("Child One");
    expect(html).toContain("T-child-1");
    expect((res.writeHead as jest.Mock).mock.calls[0][0]).toBe(200);
  });

  it("returns empty <div> when no children", async () => {
    mockGetChildrenOf.mockResolvedValue([]);

    const res = makeRes();
    await childrenPartialHandler(makeReq(), res, {
      key: "my-proj",
      id: "T-parent",
    });

    const html = (res.end as jest.Mock).mock.calls[0][0] as string;
    expect(html).toBe("<div></div>");
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
