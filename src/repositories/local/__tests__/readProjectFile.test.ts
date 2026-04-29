import * as fsp from "fs/promises";
import * as assertSafeFilenameModule from "../assertSafeFilename";
import { readProjectFile } from "../readProjectFile";

jest.mock("fs/promises");
jest.mock("../assertSafeFilename");
jest.mock("../getProjectFilesFolder", () => ({
  getProjectFilesFolder: (root: string) => `${root}/files`,
}));

const mockReadFile = jest.mocked(fsp.readFile);
const mockAssertSafeFilename = jest.mocked(
  assertSafeFilenameModule.assertSafeFilename,
);

describe("readProjectFile", () => {
  const root = "/planning";
  const folder = "/planning/files";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns content on successful read", async () => {
    mockReadFile.mockResolvedValueOnce("file contents" as unknown as Buffer);

    const result = await readProjectFile("foo.md", root);

    expect(result).toBe("file contents");
    expect(mockReadFile).toHaveBeenCalledWith(`${folder}/foo.md`, {
      encoding: "utf8",
    });
  });

  it("throws user-friendly message on ENOENT", async () => {
    mockReadFile.mockRejectedValueOnce(
      Object.assign(new Error("ENOENT"), { code: "ENOENT" }),
    );

    await expect(readProjectFile("foo.md", root)).rejects.toThrow(
      "Project file 'foo.md' does not exist",
    );
  });

  it("re-throws non-ENOENT errors", async () => {
    mockReadFile.mockRejectedValueOnce(new Error("Permission denied"));

    await expect(readProjectFile("foo.md", root)).rejects.toThrow(
      "Permission denied",
    );
  });

  it("filename rejection happens before readFile", async () => {
    mockAssertSafeFilename.mockImplementationOnce(() => {
      throw new Error("Filename must be a non-empty string");
    });

    await expect(readProjectFile("", root)).rejects.toThrow(
      "Filename must be a non-empty string",
    );

    expect(mockReadFile).not.toHaveBeenCalled();
  });
});
