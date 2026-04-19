jest.mock("fs/promises");
jest.mock("../../configuration/resolveDataDir");
jest.mock("../../repositories/local/LocalRepository");

import type { Dirent } from "node:fs";
import { readFile, readdir } from "fs/promises";
import type { IncomingMessage, ServerResponse } from "node:http";
import { resolveDataDir } from "../../configuration/resolveDataDir";
import { TrellisObjectStatus } from "../../models";
import { LocalRepository } from "../../repositories/local/LocalRepository";
import { landingPageHandler } from "../landingPage";

const mockReaddir = readdir as jest.Mock;
const mockReadFile = readFile as jest.Mock;
const mockResolveDataDir = resolveDataDir as jest.MockedFunction<
  typeof resolveDataDir
>;
const MockedLocalRepository = LocalRepository as jest.MockedClass<
  typeof LocalRepository
>;

const makeDirent = (name: string) =>
  ({ name, isDirectory: () => true }) as unknown as Dirent;

const makeRes = () =>
  ({ writeHead: jest.fn(), end: jest.fn() }) as unknown as ServerResponse;

describe("landingPageHandler", () => {
  let mockGetObjects: jest.Mock;

  beforeEach(() => {
    jest.resetAllMocks();
    mockGetObjects = jest.fn().mockResolvedValue([]);
    MockedLocalRepository.mockImplementation(
      () => ({ getObjects: mockGetObjects }) as unknown as LocalRepository,
    );
    mockResolveDataDir.mockReturnValue("/test/data");
  });

  it("renders label from meta.json and key as fallback when meta is missing", async () => {
    mockReaddir.mockResolvedValue([makeDirent("proj-1"), makeDirent("proj-2")]);
    mockReadFile.mockImplementation((filePath: unknown) => {
      if ((filePath as string).includes("proj-1")) {
        return Promise.resolve(JSON.stringify({ label: "Project One" }));
      }
      return Promise.reject(new Error("ENOENT"));
    });

    const res = makeRes();
    await landingPageHandler({} as IncomingMessage, res);

    const html = (res.end as jest.Mock).mock.calls[0][0] as string;
    expect(html).toContain("Project One");
    expect(html).toContain("proj-2");
    expect(html).toContain('href="/projects/proj-1"');
    expect(html).toContain('href="/projects/proj-2"');
  });

  it("renders accurate issue counts from getObjects", async () => {
    mockReaddir.mockResolvedValue([makeDirent("proj-a")]);
    mockReadFile.mockResolvedValue(JSON.stringify({ label: "Project A" }));
    mockGetObjects.mockResolvedValue([
      { status: TrellisObjectStatus.OPEN },
      { status: TrellisObjectStatus.IN_PROGRESS },
      { status: TrellisObjectStatus.DONE },
    ]);

    const res = makeRes();
    await landingPageHandler({} as IncomingMessage, res);

    const html = (res.end as jest.Mock).mock.calls[0][0] as string;
    expect(html).toContain("2 open");
    expect(html).toContain("1 in-progress");
    expect(html).toContain("1 done");
  });

  it("renders empty state and returns 200 when readdir throws", async () => {
    mockReaddir.mockRejectedValue(new Error("ENOENT"));

    const res = makeRes();
    await landingPageHandler({} as IncomingMessage, res);

    const html = (res.end as jest.Mock).mock.calls[0][0] as string;
    expect(html).toContain("No projects found under");
    expect((res.writeHead as jest.Mock).mock.calls[0][0]).toBe(200);
  });
});
