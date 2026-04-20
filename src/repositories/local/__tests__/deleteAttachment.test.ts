import * as fsp from "fs/promises";
import {
  TrellisObjectPriority,
  TrellisObjectStatus,
  TrellisObjectType,
} from "../../../models";
import * as getAttachmentsFolderModule from "../getAttachmentsFolder";
import * as getObjectByIdModule from "../getObjectById";
import { deleteAttachment } from "../deleteAttachment";

jest.mock("fs/promises");
jest.mock("../getAttachmentsFolder");
jest.mock("../getObjectById");

const mockAccess = jest.mocked(fsp.access);
const mockUnlink = jest.mocked(fsp.unlink);
const mockGetAttachmentsFolder = jest.mocked(
  getAttachmentsFolderModule.getAttachmentsFolder,
);
const mockGetObjectById = jest.mocked(getObjectByIdModule.getObjectById);

const mockObj = {
  id: "F-feat",
  type: TrellisObjectType.FEATURE,
  title: "Test Feature",
  status: TrellisObjectStatus.OPEN,
  priority: TrellisObjectPriority.MEDIUM,
  parent: null,
  prerequisites: [],
  affectedFiles: new Map(),
  log: [],
  schema: "1.0",
  childrenIds: [],
  body: "",
  created: "2025-01-15T10:00:00Z",
  updated: "2025-01-15T10:00:00Z",
};

describe("deleteAttachment", () => {
  const root = "/planning";
  const folder = "/planning/f/F-feat/attachments";

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetObjectById.mockResolvedValue(mockObj);
    mockGetAttachmentsFolder.mockResolvedValue(folder);
    mockAccess.mockResolvedValue(undefined);
    mockUnlink.mockResolvedValue(undefined);
  });

  it("deletes the file on success", async () => {
    await deleteAttachment("F-feat", "report.pdf", root);
    expect(mockUnlink).toHaveBeenCalledWith(`${folder}/report.pdf`);
  });

  it("throws when the file does not exist", async () => {
    mockAccess.mockRejectedValueOnce(
      Object.assign(new Error("ENOENT"), { code: "ENOENT" }),
    );
    await expect(
      deleteAttachment("F-feat", "missing.pdf", root),
    ).rejects.toThrow(
      "File 'missing.pdf' does not exist in attachments for F-feat",
    );
  });

  it("throws when the issue does not exist", async () => {
    mockGetObjectById.mockResolvedValueOnce(null);
    await expect(
      deleteAttachment("F-missing", "report.pdf", root),
    ).rejects.toThrow("Object with ID 'F-missing' not found");
  });
});
