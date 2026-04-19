import { createHash } from "node:crypto";
import { homedir } from "node:os";
import { join, resolve } from "node:path";

jest.mock("node:child_process");

import { spawnSync } from "node:child_process";
import { resolveDataDir } from "../resolveDataDir";
import { resolveProjectKey } from "../resolveProjectKey";

const mockSpawnSync = spawnSync as jest.MockedFunction<typeof spawnSync>;

const sha1 = (input: string) =>
  createHash("sha1").update(input).digest("hex").slice(0, 12);

describe("resolveDataDir", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.TRELLIS_DATA_DIR;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("returns TRELLIS_DATA_DIR when set", () => {
    process.env.TRELLIS_DATA_DIR = "/custom/data/dir";
    expect(resolveDataDir()).toBe("/custom/data/dir");
  });

  it("returns ~/.trellis when TRELLIS_DATA_DIR is not set", () => {
    expect(resolveDataDir()).toBe(join(homedir(), ".trellis"));
  });
});

describe("resolveProjectKey", () => {
  beforeEach(() => {
    mockSpawnSync.mockReset();
  });

  it("returns sha1 of git remote URL when git succeeds", () => {
    const remoteUrl = "https://github.com/example/repo.git";
    mockSpawnSync.mockReturnValue({
      pid: 1,
      output: [null, `${remoteUrl}\n`, ""],
      stdout: `${remoteUrl}\n`,
      stderr: "",
      status: 0,
      signal: null,
    } as ReturnType<typeof spawnSync>);

    expect(resolveProjectKey("/path/to/repo")).toBe(sha1(remoteUrl));
  });

  it("returns sha1 of absolute path when git exits non-zero", () => {
    mockSpawnSync.mockReturnValue({
      pid: 1,
      output: [null, "", "fatal: Not a git repository"],
      stdout: "",
      stderr: "fatal: Not a git repository",
      status: 128,
      signal: null,
    } as ReturnType<typeof spawnSync>);

    const projectDir = "/path/to/non-git-dir";
    expect(resolveProjectKey(projectDir)).toBe(sha1(resolve(projectDir)));
  });

  it("returns sha1 of absolute path when spawnSync throws", () => {
    mockSpawnSync.mockImplementation(() => {
      throw new Error("git not found");
    });

    const projectDir = "/path/to/dir";
    expect(resolveProjectKey(projectDir)).toBe(sha1(resolve(projectDir)));
  });

  it("returns sha1 of absolute path when spawnSync sets error field", () => {
    mockSpawnSync.mockReturnValue({
      pid: 1,
      output: [null, "", ""],
      stdout: "",
      stderr: "",
      status: null,
      signal: null,
      error: new Error("spawn git ENOENT"),
    } as ReturnType<typeof spawnSync>);

    const projectDir = "/path/to/dir";
    expect(resolveProjectKey(projectDir)).toBe(sha1(resolve(projectDir)));
  });
});
