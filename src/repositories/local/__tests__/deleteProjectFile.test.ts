import * as fsp from "fs/promises";
import * as assertSafeFilenameModule from "../assertSafeFilename";
import { deleteProjectFile } from "../deleteProjectFile";

jest.mock("fs/promises");
jest.mock("../assertSafeFilename");
jest.mock("../getProjectFilesFolder", () => ({
  getProjectFilesFolder: (root: string) => `${root}/files`,
}));

const mockAccess = jest.mocked(fsp.access);
const mockUnlink = jest.mocked(fsp.unlink);
const mockAssertSafeFilename = jest.mocked(
  assertSafeFilenameModule.assertSafeFilename,
);

describe("deleteProjectFile", () => {
  const root = "/planning";
  const folder = "/planning/files";

  beforeEach(() => {
    jest.clearAllMocks();
    mockAccess.mockResolvedValue(undefined);
    mockUnlink.mockResolvedValue(undefined);
  });

  it("deletes file when it exists", async () => {
    await deleteProjectFile("foo.md", root);

    expect(mockAssertSafeFilename).toHaveBeenCalledWith("foo.md");
    expect(mockAccess).toHaveBeenCalledWith(`${folder}/foo.md`);
    expect(mockUnlink).toHaveBeenCalledWith(`${folder}/foo.md`);
  });

  it("throws user-friendly message when file does not exist", async () => {
    mockAccess.mockRejectedValueOnce(
      Object.assign(new Error("ENOENT"), { code: "ENOENT" }),
    );

    await expect(deleteProjectFile("foo.md", root)).rejects.toThrow(
      "Project file 'foo.md' does not exist",
    );

    expect(mockUnlink).not.toHaveBeenCalled();
  });

  it("filename rejection happens before any fs call", async () => {
    mockAssertSafeFilename.mockImplementationOnce(() => {
      throw new Error("Filename must be a non-empty string");
    });

    await expect(deleteProjectFile("", root)).rejects.toThrow(
      "Filename must be a non-empty string",
    );

    expect(mockAccess).not.toHaveBeenCalled();
    expect(mockUnlink).not.toHaveBeenCalled();
  });
});
