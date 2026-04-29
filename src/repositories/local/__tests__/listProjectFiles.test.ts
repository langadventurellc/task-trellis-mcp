import * as fsp from "fs/promises";
import { listProjectFiles } from "../listProjectFiles";

jest.mock("fs/promises");
jest.mock("../getProjectFilesFolder", () => ({
  getProjectFilesFolder: (root: string) => `${root}/files`,
}));

const mockReaddir = jest.mocked(fsp.readdir);

type ReadDirResult = Awaited<ReturnType<typeof fsp.readdir>>;

const makeDirents = (
  entries: Array<{ name: string; isFile: boolean }>,
): ReadDirResult =>
  entries.map((e) => ({
    name: e.name,
    isFile: () => e.isFile,
    isDirectory: () => !e.isFile,
    isBlockDevice: () => false,
    isCharacterDevice: () => false,
    isSymbolicLink: () => false,
    isFIFO: () => false,
    isSocket: () => false,
    parentPath: "",
  })) as unknown as ReadDirResult;

describe("listProjectFiles", () => {
  const root = "/planning";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns filenames when entries exist (directories excluded)", async () => {
    mockReaddir.mockResolvedValueOnce(
      makeDirents([
        { name: "notes.md", isFile: true },
        { name: "archive", isFile: false },
        { name: "report.txt", isFile: true },
      ]),
    );

    const result = await listProjectFiles(root);
    expect(result).toEqual(["notes.md", "report.txt"]);
  });

  it("returns [] when folder does not exist (ENOENT)", async () => {
    mockReaddir.mockRejectedValueOnce(
      Object.assign(new Error("ENOENT"), { code: "ENOENT" }),
    );

    const result = await listProjectFiles(root);
    expect(result).toEqual([]);
  });

  it("re-throws non-ENOENT errors", async () => {
    mockReaddir.mockRejectedValueOnce(new Error("Permission denied"));

    await expect(listProjectFiles(root)).rejects.toThrow("Permission denied");
  });
});
