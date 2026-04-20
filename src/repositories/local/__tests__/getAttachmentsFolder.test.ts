import { join } from "path";
import {
  TrellisObject,
  TrellisObjectPriority,
  TrellisObjectStatus,
  TrellisObjectType,
} from "../../../models";
import * as getObjectByIdModule from "../getObjectById";
import { getAttachmentsFolder } from "../getAttachmentsFolder";

jest.mock("../getObjectById");
const mockGetObjectById = jest.mocked(getObjectByIdModule.getObjectById);

describe("getAttachmentsFolder", () => {
  const root = "/test/planning/root";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const makeObj = (
    id: string,
    type: TrellisObjectType,
    parent: string | null = null,
  ): TrellisObject => ({
    id,
    type,
    title: `Test ${id}`,
    status: TrellisObjectStatus.OPEN,
    priority: TrellisObjectPriority.MEDIUM,
    parent,
    prerequisites: [],
    affectedFiles: new Map(),
    log: [],
    schema: "1.0",
    childrenIds: [],
    body: "",
    created: "2025-01-15T10:00:00Z",
    updated: "2025-01-15T10:00:00Z",
  });

  it("throws when issue not found", async () => {
    mockGetObjectById.mockResolvedValueOnce(null);
    await expect(getAttachmentsFolder("T-missing", root)).rejects.toThrow(
      "Object with ID 'T-missing' not found",
    );
  });

  it("returns correct path for a Project", async () => {
    mockGetObjectById.mockResolvedValueOnce(
      makeObj("P-proj", TrellisObjectType.PROJECT),
    );
    const result = await getAttachmentsFolder("P-proj", root);
    expect(result).toBe(join(root, "p", "P-proj", "attachments"));
  });

  it("returns correct path for a standalone Epic", async () => {
    mockGetObjectById.mockResolvedValueOnce(
      makeObj("E-epic", TrellisObjectType.EPIC),
    );
    const result = await getAttachmentsFolder("E-epic", root);
    expect(result).toBe(join(root, "e", "E-epic", "attachments"));
  });

  it("returns correct path for an Epic with parent project", async () => {
    mockGetObjectById.mockResolvedValueOnce(
      makeObj("E-epic", TrellisObjectType.EPIC, "P-proj"),
    );
    const result = await getAttachmentsFolder("E-epic", root);
    expect(result).toBe(
      join(root, "p", "P-proj", "e", "E-epic", "attachments"),
    );
  });

  it("returns correct path for a standalone Feature", async () => {
    mockGetObjectById.mockResolvedValueOnce(
      makeObj("F-feat", TrellisObjectType.FEATURE),
    );
    const result = await getAttachmentsFolder("F-feat", root);
    expect(result).toBe(join(root, "f", "F-feat", "attachments"));
  });

  it("returns correct path for Feature under standalone Epic", async () => {
    mockGetObjectById.mockResolvedValueOnce(
      makeObj("F-feat", TrellisObjectType.FEATURE, "E-epic"),
    );
    mockGetObjectById.mockResolvedValueOnce(
      makeObj("E-epic", TrellisObjectType.EPIC),
    );
    const result = await getAttachmentsFolder("F-feat", root);
    expect(result).toBe(
      join(root, "e", "E-epic", "f", "F-feat", "attachments"),
    );
  });

  it("returns correct path for Feature under Epic under Project", async () => {
    mockGetObjectById.mockResolvedValueOnce(
      makeObj("F-feat", TrellisObjectType.FEATURE, "E-epic"),
    );
    mockGetObjectById.mockResolvedValueOnce(
      makeObj("E-epic", TrellisObjectType.EPIC, "P-proj"),
    );
    const result = await getAttachmentsFolder("F-feat", root);
    expect(result).toBe(
      join(root, "p", "P-proj", "e", "E-epic", "f", "F-feat", "attachments"),
    );
  });

  it("returns correct path for a standalone Task", async () => {
    mockGetObjectById.mockResolvedValueOnce(
      makeObj("T-task", TrellisObjectType.TASK),
    );
    const result = await getAttachmentsFolder("T-task", root);
    expect(result).toBe(join(root, "t", "attachments", "T-task"));
  });

  it("returns correct path for Task under standalone Feature", async () => {
    mockGetObjectById.mockResolvedValueOnce(
      makeObj("T-task", TrellisObjectType.TASK, "F-feat"),
    );
    mockGetObjectById.mockResolvedValueOnce(
      makeObj("F-feat", TrellisObjectType.FEATURE),
    );
    const result = await getAttachmentsFolder("T-task", root);
    expect(result).toBe(
      join(root, "f", "F-feat", "t", "attachments", "T-task"),
    );
  });

  it("returns correct path for Task under Feature under Project hierarchy", async () => {
    mockGetObjectById.mockResolvedValueOnce(
      makeObj("T-task", TrellisObjectType.TASK, "F-feat"),
    );
    mockGetObjectById.mockResolvedValueOnce(
      makeObj("F-feat", TrellisObjectType.FEATURE, "E-epic"),
    );
    mockGetObjectById.mockResolvedValueOnce(
      makeObj("E-epic", TrellisObjectType.EPIC, "P-proj"),
    );
    const result = await getAttachmentsFolder("T-task", root);
    expect(result).toBe(
      join(
        root,
        "p",
        "P-proj",
        "e",
        "E-epic",
        "f",
        "F-feat",
        "t",
        "attachments",
        "T-task",
      ),
    );
  });
});
