import { join } from "path";

jest.mock("fs/promises");

import { access, mkdir, writeFile } from "fs/promises";
import { writeProjectMeta } from "../writeProjectMeta";

const mockAccess = access as jest.MockedFunction<typeof access>;
const mockMkdir = mkdir as jest.MockedFunction<typeof mkdir>;
const mockWriteFile = writeFile as jest.MockedFunction<typeof writeFile>;

describe("writeProjectMeta", () => {
  const planningRoot = "/test/planning/root";
  const metaPath = join(planningRoot, "meta.json");

  beforeEach(() => {
    jest.resetAllMocks();
    mockMkdir.mockResolvedValue(undefined);
    mockWriteFile.mockResolvedValue(undefined);
  });

  it("creates meta.json with the provided label on first call", async () => {
    mockAccess.mockRejectedValue(new Error("ENOENT"));

    await writeProjectMeta(planningRoot, "https://github.com/example/repo.git");

    expect(mockWriteFile).toHaveBeenCalledWith(
      metaPath,
      JSON.stringify({ label: "https://github.com/example/repo.git" }, null, 2),
      "utf8",
    );
  });

  it("does not overwrite meta.json on second call with a different label", async () => {
    mockAccess.mockResolvedValue(undefined);

    await writeProjectMeta(planningRoot, "https://github.com/other/repo.git");

    expect(mockWriteFile).not.toHaveBeenCalled();
  });

  it("uses planningRoot as fallback label when no label is provided", async () => {
    mockAccess.mockRejectedValue(new Error("ENOENT"));

    await writeProjectMeta(planningRoot);

    expect(mockWriteFile).toHaveBeenCalledWith(
      metaPath,
      JSON.stringify({ label: planningRoot }, null, 2),
      "utf8",
    );
  });
});
