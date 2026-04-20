import * as fsp from "fs/promises";
import * as getAttachmentsFolderModule from "../getAttachmentsFolder";
import { deleteAttachment } from "../deleteAttachment";

jest.mock("fs/promises");
jest.mock("../getAttachmentsFolder");

const mockAccess = jest.mocked(fsp.access);
const mockUnlink = jest.mocked(fsp.unlink);
const mockGetAttachmentsFolder = jest.mocked(
  getAttachmentsFolderModule.getAttachmentsFolder,
);

describe("deleteAttachment", () => {
  const root = "/planning";
  const folder = "/planning/f/F-feat/attachments";

  beforeEach(() => {
    jest.clearAllMocks();
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
    mockGetAttachmentsFolder.mockRejectedValueOnce(
      new Error("Object with ID 'F-missing' not found"),
    );
    await expect(
      deleteAttachment("F-missing", "report.pdf", root),
    ).rejects.toThrow("Object with ID 'F-missing' not found");
  });
});
