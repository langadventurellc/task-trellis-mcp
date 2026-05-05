jest.mock("../../configuration/resolveDataDir");
jest.mock("../../repositories/local/LocalRepository");
jest.mock("../../services/local/updateObject");
jest.mock("../../services/local/appendObjectLog");
jest.mock("../../services/local/createObject");

import type { IncomingMessage, ServerResponse } from "node:http";
import { resolveDataDir } from "../../configuration/resolveDataDir";
import {
  TrellisObjectPriority,
  TrellisObjectStatus,
  TrellisObjectType,
} from "../../models";
import { LocalRepository } from "../../repositories/local/LocalRepository";
import { appendObjectLog } from "../../services/local/appendObjectLog";
import { createObject } from "../../services/local/createObject";
import { updateObject } from "../../services/local/updateObject";
import {
  createChildFormHandler,
  createChildSubmitHandler,
  createTopFormHandler,
  createTopSubmitHandler,
  editFormHandler,
  editSubmitHandler,
} from "../projectTreePage";

const mockResolveDataDir = resolveDataDir as jest.MockedFunction<
  typeof resolveDataDir
>;
const MockedLocalRepository = LocalRepository as jest.MockedClass<
  typeof LocalRepository
>;
const mockUpdateObject = updateObject as jest.MockedFunction<
  typeof updateObject
>;
const mockAppendObjectLog = appendObjectLog as jest.MockedFunction<
  typeof appendObjectLog
>;
const mockCreateObject = createObject as jest.MockedFunction<
  typeof createObject
>;

const makeRes = () =>
  ({ writeHead: jest.fn(), end: jest.fn() }) as unknown as ServerResponse;

const makeReq = (body = "") =>
  ({
    url: "/",
    on: (event: string, cb: (...args: unknown[]) => void) => {
      if (event === "data") cb(Buffer.from(body));
      if (event === "end") cb();
    },
  }) as unknown as IncomingMessage;

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
    labels: [],
    created: "2026-01-01T00:00:00Z",
    updated: "2026-01-01T00:00:00Z",
    body: "",
    ...overrides,
  };
}

describe("editFormHandler", () => {
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

  it("returns 404 for unknown IDs", async () => {
    const res = makeRes();
    await editFormHandler(makeReq(), res, { key: "my-proj", id: "T-missing" });

    expect((res.writeHead as jest.Mock).mock.calls[0][0]).toBe(404);
    const html = (res.end as jest.Mock).mock.calls[0][0] as string;
    expect(html).toContain("T-missing");
  });

  it("returns edit form pre-populated with all five fields", async () => {
    mockGetObjectById.mockResolvedValue(
      makeObj({
        id: "T-edit",
        title: "My Task",
        status: TrellisObjectStatus.IN_PROGRESS,
        priority: TrellisObjectPriority.HIGH,
        body: "Task body here",
        prerequisites: ["T-prereq-1", "T-prereq-2"],
      }),
    );

    const res = makeRes();
    await editFormHandler(makeReq(), res, { key: "my-proj", id: "T-edit" });

    expect((res.writeHead as jest.Mock).mock.calls[0][0]).toBe(200);
    const html = (res.end as jest.Mock).mock.calls[0][0] as string;
    expect(html).toContain('data-view="edit"');
    expect(html).toContain('value="My Task"');
    expect(html).toContain('value="in-progress" checked');
    expect(html).toContain('value="high" checked');
    expect(html).toContain("Task body here");
    expect(html).toContain("T-prereq-1, T-prereq-2");
    expect(html).toContain('hx-put="/projects/my-proj/issues/T-edit"');
    expect(html).toContain('name="log_entry"');
  });
});

describe("editSubmitHandler", () => {
  let mockGetObjectById: jest.Mock;
  let mockSaveObject: jest.Mock;

  beforeEach(() => {
    jest.resetAllMocks();
    mockGetObjectById = jest.fn().mockResolvedValue(null);
    mockSaveObject = jest.fn().mockResolvedValue(undefined);
    MockedLocalRepository.mockImplementation(
      () =>
        ({
          getObjectById: mockGetObjectById,
          saveObject: mockSaveObject,
        }) as unknown as LocalRepository,
    );
    mockResolveDataDir.mockReturnValue("/test/data");
    mockUpdateObject.mockResolvedValue({
      content: [{ type: "text", text: "Success" }],
    });
    mockAppendObjectLog.mockResolvedValue({
      content: [{ type: "text", text: "Success" }],
    });
  });

  it("returns 404 for unknown IDs", async () => {
    const res = makeRes();
    await editSubmitHandler(makeReq(), res, {
      key: "my-proj",
      id: "T-missing",
    });

    expect((res.writeHead as jest.Mock).mock.calls[0][0]).toBe(404);
  });

  it("re-renders edit form with 422 when prereq ID is unknown", async () => {
    const obj = makeObj({ id: "T-edit", parent: null });
    mockGetObjectById.mockImplementation((id: string) =>
      id === "T-edit" ? Promise.resolve(obj) : Promise.resolve(null),
    );

    const body = new URLSearchParams({
      title: "Updated",
      status: "open",
      priority: "medium",
      body: "",
      prerequisites: "T-unknown",
      log_entry: "",
    }).toString();

    const res = makeRes();
    await editSubmitHandler(makeReq(body), res, {
      key: "my-proj",
      id: "T-edit",
    });

    expect((res.writeHead as jest.Mock).mock.calls[0][0]).toBe(422);
    const html = (res.end as jest.Mock).mock.calls[0][0] as string;
    expect(html).toContain("error-banner");
    expect(html).toContain("T-unknown");
    expect(html).toContain('data-view="edit"');
    expect(mockUpdateObject).not.toHaveBeenCalled();
  });

  it("calls updateObject with force=true on valid submit", async () => {
    const obj = makeObj({ id: "T-edit", parent: null });
    mockGetObjectById.mockResolvedValue(obj);

    const body = new URLSearchParams({
      title: "Updated Title",
      status: "done",
      priority: "high",
      body: "new body",
      prerequisites: "",
      log_entry: "",
    }).toString();

    const res = makeRes();
    await editSubmitHandler(makeReq(body), res, {
      key: "my-proj",
      id: "T-edit",
    });

    expect(mockUpdateObject).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ autoCompleteParent: false }),
      "T-edit",
      "Updated Title",
      "high",
      [],
      "new body",
      "done",
      true,
      undefined,
    );
    const [status, headers] = (res.writeHead as jest.Mock).mock.calls[0] as [
      number,
      Record<string, string>,
    ];
    expect(status).toBe(200);
    expect(headers["HX-Trigger"]).toBe("refreshTree");
  });

  it("calls appendObjectLog when log_entry is non-empty", async () => {
    const obj = makeObj({ id: "T-edit", parent: null });
    mockGetObjectById.mockResolvedValue(obj);

    const body = new URLSearchParams({
      title: "Title",
      status: "open",
      priority: "medium",
      body: "",
      prerequisites: "",
      log_entry: "Work started",
    }).toString();

    const res = makeRes();
    await editSubmitHandler(makeReq(body), res, {
      key: "my-proj",
      id: "T-edit",
    });

    expect(mockAppendObjectLog).toHaveBeenCalledWith(
      expect.anything(),
      "T-edit",
      "Work started",
    );
  });

  it("does not call appendObjectLog when log_entry is empty", async () => {
    const obj = makeObj({ id: "T-edit", parent: null });
    mockGetObjectById.mockResolvedValue(obj);

    const body = new URLSearchParams({
      title: "Title",
      status: "open",
      priority: "medium",
      body: "",
      prerequisites: "",
      log_entry: "",
    }).toString();

    const res = makeRes();
    await editSubmitHandler(makeReq(body), res, {
      key: "my-proj",
      id: "T-edit",
    });

    expect(mockAppendObjectLog).not.toHaveBeenCalled();
  });
});

describe("createChildFormHandler", () => {
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

  it("returns 404 for unknown parent", async () => {
    const res = makeRes();
    await createChildFormHandler(makeReq(), res, {
      key: "my-proj",
      id: "T-missing",
    });

    expect((res.writeHead as jest.Mock).mock.calls[0][0]).toBe(404);
  });

  it("returns 400 when parent is a task", async () => {
    mockGetObjectById.mockResolvedValue(
      makeObj({ id: "T-task", type: TrellisObjectType.TASK }),
    );

    const res = makeRes();
    await createChildFormHandler(makeReq(), res, {
      key: "my-proj",
      id: "T-task",
    });

    expect((res.writeHead as jest.Mock).mock.calls[0][0]).toBe(400);
    const html = (res.end as jest.Mock).mock.calls[0][0] as string;
    expect(html).toContain("Tasks cannot have children");
  });

  it("derives epic as child type for project parent", async () => {
    mockGetObjectById.mockResolvedValue(
      makeObj({ id: "P-proj", type: TrellisObjectType.PROJECT }),
    );

    const res = makeRes();
    await createChildFormHandler(makeReq(), res, {
      key: "my-proj",
      id: "P-proj",
    });

    expect((res.writeHead as jest.Mock).mock.calls[0][0]).toBe(200);
    const html = (res.end as jest.Mock).mock.calls[0][0] as string;
    expect(html).toContain('data-view="create"');
    expect(html).toContain("Epic");
    expect(html).toContain(
      'hx-post="/projects/my-proj/issues/P-proj/children"',
    );
  });

  it("derives task as child type for feature parent", async () => {
    mockGetObjectById.mockResolvedValue(
      makeObj({ id: "F-feat", type: TrellisObjectType.FEATURE }),
    );

    const res = makeRes();
    await createChildFormHandler(makeReq(), res, {
      key: "my-proj",
      id: "F-feat",
    });

    const html = (res.end as jest.Mock).mock.calls[0][0] as string;
    expect(html).toContain("Task");
  });
});

describe("createChildSubmitHandler", () => {
  let mockGetObjectById: jest.Mock;

  beforeEach(() => {
    jest.resetAllMocks();
    mockGetObjectById = jest.fn().mockResolvedValue(null);
    MockedLocalRepository.mockImplementation(
      () =>
        ({ getObjectById: mockGetObjectById }) as unknown as LocalRepository,
    );
    mockResolveDataDir.mockReturnValue("/test/data");
    mockCreateObject.mockResolvedValue({
      content: [{ type: "text", text: "Created object with ID: T-new-child" }],
    });
  });

  it("returns 400 when parent is a task", async () => {
    mockGetObjectById.mockResolvedValue(
      makeObj({ id: "T-task", type: TrellisObjectType.TASK }),
    );

    const res = makeRes();
    await createChildSubmitHandler(makeReq(), res, {
      key: "my-proj",
      id: "T-task",
    });

    expect((res.writeHead as jest.Mock).mock.calls[0][0]).toBe(400);
  });

  it("returns 422 with create form when prereq is unknown", async () => {
    const parent = makeObj({ id: "F-feat", type: TrellisObjectType.FEATURE });
    mockGetObjectById.mockImplementation((id: string) =>
      id === "F-feat" ? Promise.resolve(parent) : Promise.resolve(null),
    );

    const body = new URLSearchParams({
      title: "New Task",
      status: "draft",
      priority: "medium",
      body: "",
      prerequisites: "T-bad-prereq",
    }).toString();

    const res = makeRes();
    await createChildSubmitHandler(makeReq(body), res, {
      key: "my-proj",
      id: "F-feat",
    });

    expect((res.writeHead as jest.Mock).mock.calls[0][0]).toBe(422);
    const html = (res.end as jest.Mock).mock.calls[0][0] as string;
    expect(html).toContain("error-banner");
    expect(html).toContain('data-view="create"');
    expect(mockCreateObject).not.toHaveBeenCalled();
  });

  it("calls createObject and returns detail view on success", async () => {
    const parent = makeObj({ id: "F-feat", type: TrellisObjectType.FEATURE });
    const newChild = makeObj({
      id: "T-new-child",
      title: "New Task",
      type: TrellisObjectType.TASK,
      parent: "F-feat",
    });
    mockGetObjectById.mockImplementation((id: string) => {
      if (id === "F-feat") return Promise.resolve(parent);
      if (id === "T-new-child") return Promise.resolve(newChild);
      return Promise.resolve(null);
    });

    const body = new URLSearchParams({
      title: "New Task",
      status: "draft",
      priority: "medium",
      body: "",
      prerequisites: "",
    }).toString();

    const res = makeRes();
    await createChildSubmitHandler(makeReq(body), res, {
      key: "my-proj",
      id: "F-feat",
    });

    expect(mockCreateObject).toHaveBeenCalledWith(
      expect.anything(),
      TrellisObjectType.TASK,
      "New Task",
      "F-feat",
      TrellisObjectPriority.MEDIUM,
      TrellisObjectStatus.DRAFT,
      [],
      "",
    );
    const [status, headers] = (res.writeHead as jest.Mock).mock.calls[0] as [
      number,
      Record<string, string>,
    ];
    expect(status).toBe(200);
    expect(headers["HX-Trigger"]).toBe("refreshTree");
    const html = (res.end as jest.Mock).mock.calls[0][0] as string;
    expect(html).toContain('data-view="view"');
    expect(html).toContain("New Task");
  });
});

describe("createTopFormHandler", () => {
  it("returns create form with type picker", () => {
    const res = makeRes();
    createTopFormHandler(makeReq(), res, { key: "my-proj" });

    expect((res.writeHead as jest.Mock).mock.calls[0][0]).toBe(200);
    const html = (res.end as jest.Mock).mock.calls[0][0] as string;
    expect(html).toContain('data-view="create"');
    expect(html).toContain('name="type"');
    expect(html).toContain('value="project"');
    expect(html).toContain('value="epic"');
    expect(html).toContain('value="feature"');
    expect(html).toContain('value="task"');
    expect(html).toContain('hx-post="/projects/my-proj/issues"');
  });
});

describe("createTopSubmitHandler", () => {
  let mockGetObjectById: jest.Mock;

  beforeEach(() => {
    jest.resetAllMocks();
    mockGetObjectById = jest.fn().mockResolvedValue(null);
    MockedLocalRepository.mockImplementation(
      () =>
        ({ getObjectById: mockGetObjectById }) as unknown as LocalRepository,
    );
    mockResolveDataDir.mockReturnValue("/test/data");
    mockCreateObject.mockResolvedValue({
      content: [{ type: "text", text: "Created object with ID: F-new" }],
    });
  });

  it("returns 422 with top form when prereq is unknown", async () => {
    mockGetObjectById.mockResolvedValue(null);

    const body = new URLSearchParams({
      type: "feature",
      title: "My Feature",
      status: "draft",
      priority: "medium",
      body: "",
      prerequisites: "T-nonexistent",
    }).toString();

    const res = makeRes();
    await createTopSubmitHandler(makeReq(body), res, { key: "my-proj" });

    expect((res.writeHead as jest.Mock).mock.calls[0][0]).toBe(422);
    const html = (res.end as jest.Mock).mock.calls[0][0] as string;
    expect(html).toContain("error-banner");
    expect(html).toContain('data-view="create"');
    expect(html).toContain('name="type"');
    expect(mockCreateObject).not.toHaveBeenCalled();
  });

  it("calls createObject with null parent and returns detail on success", async () => {
    const newObj = makeObj({
      id: "F-new",
      title: "My Feature",
      type: TrellisObjectType.FEATURE,
      parent: null,
    });
    mockGetObjectById.mockImplementation((id: string) =>
      id === "F-new" ? Promise.resolve(newObj) : Promise.resolve(null),
    );

    const body = new URLSearchParams({
      type: "feature",
      title: "My Feature",
      status: "open",
      priority: "high",
      body: "Some description",
      prerequisites: "",
    }).toString();

    const res = makeRes();
    await createTopSubmitHandler(makeReq(body), res, { key: "my-proj" });

    expect(mockCreateObject).toHaveBeenCalledWith(
      expect.anything(),
      "feature",
      "My Feature",
      null,
      "high",
      "open",
      [],
      "Some description",
      undefined,
    );
    const [status, headers] = (res.writeHead as jest.Mock).mock.calls[0] as [
      number,
      Record<string, string>,
    ];
    expect(status).toBe(200);
    expect(headers["HX-Trigger"]).toBe("refreshTree");
    const html = (res.end as jest.Mock).mock.calls[0][0] as string;
    expect(html).toContain('data-view="view"');
  });
});
