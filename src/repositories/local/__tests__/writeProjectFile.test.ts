import * as fsp from "fs/promises";
import * as assertSafeFilenameModule from "../assertSafeFilename";
import { writeProjectFile } from "../writeProjectFile";

jest.mock("fs/promises");
jest.mock("../assertSafeFilename");
jest.mock("../getProjectFilesFolder", () => ({
  getProjectFilesFolder: (root: string) => `${root}/files`,
}));

const mockAccess = jest.mocked(fsp.access);
const mockMkdir = jest.mocked(fsp.mkdir);
const mockWriteFile = jest.mocked(fsp.writeFile);
const mockAssertSafeFilename = jest.mocked(
  assertSafeFilenameModule.assertSafeFilename,
);

describe("writeProjectFile", () => {
  const root = "/planning";
  const folder = "/planning/files";

  beforeEach(() => {
    jest.clearAllMocks();
    mockMkdir.mockResolvedValue(undefined as unknown as string);
    mockWriteFile.mockResolvedValue(undefined);
    mockAccess.mockRejectedValue(
      Object.assign(new Error("ENOENT"), { code: "ENOENT" }),
    );
  });

  it("calls mkdir with recursive:true then writeFile with utf8 encoding (failIfExists=false default)", async () => {
    await writeProjectFile("foo.md", "content", root);

    expect(mockAssertSafeFilename).toHaveBeenCalledWith("foo.md");
    expect(mockMkdir).toHaveBeenCalledWith(folder, { recursive: true });
    expect(mockWriteFile).toHaveBeenCalledWith(`${folder}/foo.md`, "content", {
      encoding: "utf8",
    });
  });

  it("failIfExists=true, file absent: succeeds", async () => {
    await expect(
      writeProjectFile("foo.md", "content", root, true),
    ).resolves.toBeUndefined();
    expect(mockWriteFile).toHaveBeenCalled();
  });

  it("failIfExists=true, file exists: throws", async () => {
    mockAccess.mockResolvedValueOnce(undefined);

    await expect(
      writeProjectFile("foo.md", "content", root, true),
    ).rejects.toThrow("Project file 'foo.md' already exists");

    expect(mockWriteFile).not.toHaveBeenCalled();
  });

  it("failIfExists=false, file exists: overwrites without error", async () => {
    mockAccess.mockResolvedValueOnce(undefined);

    await expect(
      writeProjectFile("foo.md", "content", root, false),
    ).resolves.toBeUndefined();

    expect(mockWriteFile).toHaveBeenCalled();
  });

  it("filename rejected by assertSafeFilename before any fs call", async () => {
    mockAssertSafeFilename.mockImplementationOnce(() => {
      throw new Error("Filename must be a non-empty string");
    });

    await expect(writeProjectFile("", "content", root)).rejects.toThrow(
      "Filename must be a non-empty string",
    );

    expect(mockMkdir).not.toHaveBeenCalled();
    expect(mockWriteFile).not.toHaveBeenCalled();
  });

  it("mkdir non-ENOENT failure propagates", async () => {
    mockMkdir.mockRejectedValueOnce(new Error("Permission denied"));

    await expect(writeProjectFile("foo.md", "content", root)).rejects.toThrow(
      "Permission denied",
    );
  });
});
