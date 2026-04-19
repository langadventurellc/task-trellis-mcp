jest.mock("node:fs");
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
import { deleteFormHandler, deleteSubmitHandler } from "../projectTreePage";

const mockResolveDataDir = resolveDataDir as jest.MockedFunction<
  typeof resolveDataDir
>;
const MockedLocalRepository = LocalRepository as jest.MockedClass<
  typeof LocalRepository
>;

const makeRes = () =>
  ({ writeHead: jest.fn(), end: jest.fn() }) as unknown as ServerResponse;

const makeReq = () => ({ url: "/" }) as IncomingMessage;

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

describe("deleteFormHandler", () => {
  let mockGetObjectById: jest.Mock;
  let mockGetObjects: jest.Mock;

  beforeEach(() => {
    jest.resetAllMocks();
    mockResolveDataDir.mockReturnValue("/test/data");
    mockGetObjectById = jest.fn().mockResolvedValue(null);
    mockGetObjects = jest.fn().mockResolvedValue([]);
    MockedLocalRepository.mockImplementation(
      () =>
        ({
          getObjectById: mockGetObjectById,
          getObjects: mockGetObjects,
        }) as unknown as LocalRepository,
    );
  });

  it("returns 404 for unknown id", async () => {
    mockGetObjectById.mockResolvedValue(null);

    const res = makeRes();
    await deleteFormHandler(makeReq(), res, { key: "proj", id: "T-missing" });

    expect((res.writeHead as jest.Mock).mock.calls[0][0]).toBe(404);
    const html = (res.end as jest.Mock).mock.calls[0][0] as string;
    expect(html).toContain("Not found");
    expect(html).toContain("T-missing");
  });

  it("returns modal with title and no warn block when no dependents", async () => {
    const obj = makeObj({ id: "T-one", title: "My Task" });
    mockGetObjectById.mockResolvedValue(obj);
    mockGetObjects.mockResolvedValue([obj]);

    const res = makeRes();
    await deleteFormHandler(makeReq(), res, { key: "proj", id: "T-one" });

    expect((res.writeHead as jest.Mock).mock.calls[0][0]).toBe(200);
    const html = (res.end as jest.Mock).mock.calls[0][0] as string;
    expect(html).toContain("My Task");
    expect(html).toContain("hx-delete");
    expect(html).not.toContain('class="warn"');
  });

  it("shows warn block listing dependents when issue is a prerequisite for others", async () => {
    const obj = makeObj({ id: "T-base", title: "Base Task" });
    const depA = makeObj({
      id: "T-depA",
      title: "Dependent A",
      prerequisites: ["T-base"],
    });
    const depB = makeObj({
      id: "T-depB",
      title: "Dependent B",
      prerequisites: ["T-base"],
      status: TrellisObjectStatus.IN_PROGRESS,
    });
    mockGetObjectById.mockResolvedValue(obj);
    mockGetObjects.mockResolvedValue([obj, depA, depB]);

    const res = makeRes();
    await deleteFormHandler(makeReq(), res, { key: "proj", id: "T-base" });

    const html = (res.end as jest.Mock).mock.calls[0][0] as string;
    expect(html).toContain('class="warn"');
    expect(html).toContain("T-depA");
    expect(html).toContain("Dependent A");
    expect(html).toContain("T-depB");
    expect(html).toContain("Dependent B");
  });
});

describe("deleteSubmitHandler", () => {
  let mockGetObjectById: jest.Mock;
  let mockGetObjects: jest.Mock;
  let mockSaveObject: jest.Mock;
  let mockDeleteObject: jest.Mock;

  beforeEach(() => {
    jest.resetAllMocks();
    mockResolveDataDir.mockReturnValue("/test/data");
    mockGetObjectById = jest.fn().mockResolvedValue(null);
    mockGetObjects = jest.fn().mockResolvedValue([]);
    mockSaveObject = jest.fn().mockResolvedValue(undefined);
    mockDeleteObject = jest.fn().mockResolvedValue(undefined);
    MockedLocalRepository.mockImplementation(
      () =>
        ({
          getObjectById: mockGetObjectById,
          getObjects: mockGetObjects,
          saveObject: mockSaveObject,
          deleteObject: mockDeleteObject,
        }) as unknown as LocalRepository,
    );
  });

  it("returns 404 for unknown id", async () => {
    mockGetObjectById.mockResolvedValue(null);

    const res = makeRes();
    await deleteSubmitHandler(makeReq(), res, { key: "proj", id: "T-missing" });

    expect((res.writeHead as jest.Mock).mock.calls[0][0]).toBe(404);
  });

  it("sweeps reverse prereqs before deleting", async () => {
    const obj = makeObj({ id: "T-target" });
    const dep = makeObj({
      id: "T-dep",
      prerequisites: ["T-target", "T-other"],
    });
    const unrelated = makeObj({
      id: "T-unrelated",
      prerequisites: ["T-other"],
    });
    mockGetObjectById.mockResolvedValue(obj);
    mockGetObjects.mockResolvedValue([obj, dep, unrelated]);

    const res = makeRes();
    await deleteSubmitHandler(makeReq(), res, { key: "proj", id: "T-target" });

    expect(mockSaveObject).toHaveBeenCalledTimes(1);
    const savedDep = mockSaveObject.mock.calls[0][0] as {
      prerequisites: string[];
    };
    expect(savedDep.prerequisites).toEqual(["T-other"]);
    expect(mockDeleteObject).toHaveBeenCalledWith("T-target", true);
  });

  it("responds 200 with HX-Trigger: refreshTree and OOB modal clear", async () => {
    const obj = makeObj({ id: "T-del" });
    mockGetObjectById.mockResolvedValue(obj);
    mockGetObjects.mockResolvedValue([obj]);

    const res = makeRes();
    await deleteSubmitHandler(makeReq(), res, { key: "proj", id: "T-del" });

    const [status, headers] = (res.writeHead as jest.Mock).mock.calls[0] as [
      number,
      Record<string, string>,
    ];
    expect(status).toBe(200);
    expect(headers["HX-Trigger"]).toBe("refreshTree");

    const html = (res.end as jest.Mock).mock.calls[0][0] as string;
    expect(html).toContain('id="modal"');
    expect(html).toContain("hx-swap-oob");
  });

  it("does not save objects that do not reference the deleted id", async () => {
    const obj = makeObj({ id: "T-gone" });
    const other = makeObj({
      id: "T-safe",
      prerequisites: ["T-something-else"],
    });
    mockGetObjectById.mockResolvedValue(obj);
    mockGetObjects.mockResolvedValue([obj, other]);

    const res = makeRes();
    await deleteSubmitHandler(makeReq(), res, { key: "proj", id: "T-gone" });

    expect(mockSaveObject).not.toHaveBeenCalled();
  });
});
