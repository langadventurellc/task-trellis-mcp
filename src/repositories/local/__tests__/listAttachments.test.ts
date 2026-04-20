import * as fsp from "fs/promises";
import * as getAttachmentsFolderModule from "../getAttachmentsFolder";
import { listAttachments } from "../listAttachments";

jest.mock("fs/promises");
jest.mock("../getAttachmentsFolder");

const mockReaddir = jest.mocked(fsp.readdir);
const mockGetAttachmentsFolder = jest.mocked(
  getAttachmentsFolderModule.getAttachmentsFolder,
);

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

describe("listAttachments", () => {
  const root = "/planning";
  const folder = "/planning/f/F-feat/attachments";

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetAttachmentsFolder.mockResolvedValue(folder);
  });

  it("returns filenames when files exist", async () => {
    mockReaddir.mockResolvedValueOnce(
      makeDirents([
        { name: "report.pdf", isFile: true },
        { name: "image.png", isFile: true },
      ]),
    );

    const result = await listAttachments("F-feat", root);
    expect(result).toEqual(["report.pdf", "image.png"]);
  });

  it("returns empty array when folder does not exist", async () => {
    mockReaddir.mockRejectedValueOnce(
      Object.assign(new Error("ENOENT"), { code: "ENOENT" }),
    );
    const result = await listAttachments("F-feat", root);
    expect(result).toEqual([]);
  });

  it("excludes directories from results", async () => {
    mockReaddir.mockResolvedValueOnce(
      makeDirents([
        { name: "report.pdf", isFile: true },
        { name: "subdir", isFile: false },
      ]),
    );

    const result = await listAttachments("F-feat", root);
    expect(result).toEqual(["report.pdf"]);
  });
});
