jest.mock("node:fs");
jest.mock("node:fs/promises");
jest.mock("../../configuration/resolveDataDir");
jest.mock("../../repositories/local/LocalRepository");

import fs from "node:fs";
import { stat } from "node:fs/promises";
import { EventEmitter } from "node:events";
import type { IncomingMessage, ServerResponse } from "node:http";
import { resolveDataDir } from "../../configuration/resolveDataDir";
import { LocalRepository } from "../../repositories/local/LocalRepository";
import { fileHandler } from "../projectTreePage/fileHandler";

const mockResolveDataDir = resolveDataDir as jest.MockedFunction<
  typeof resolveDataDir
>;
const MockedLocalRepository = LocalRepository as jest.MockedClass<
  typeof LocalRepository
>;
const mockExistsSync = fs.existsSync as jest.Mock;
const mockCreateReadStream = fs.createReadStream as jest.Mock;
const mockStat = stat as jest.Mock;

const makeRes = () =>
  ({
    writeHead: jest.fn(),
    end: jest.fn(),
    headersSent: false,
  }) as unknown as ServerResponse;

const makeReq = () => ({ url: "/" }) as IncomingMessage;

function makeStream() {
  const emitter = new EventEmitter() as NodeJS.ReadableStream & {
    pipe: jest.Mock;
  };
  (emitter as { pipe: jest.Mock }).pipe = jest.fn();
  return emitter;
}

describe("fileHandler", () => {
  let mockGetObjectFilePath: jest.Mock;

  beforeEach(() => {
    jest.resetAllMocks();
    mockGetObjectFilePath = jest
      .fn()
      .mockResolvedValue("/data/projects/my-proj/t/open/T-test.md");
    MockedLocalRepository.mockImplementation(
      () =>
        ({
          getObjectFilePath: mockGetObjectFilePath,
        }) as unknown as LocalRepository,
    );
    mockResolveDataDir.mockReturnValue("/data");
    mockExistsSync.mockReturnValue(true);
    mockStat.mockResolvedValue({});
    mockCreateReadStream.mockReturnValue(makeStream());
  });

  it("returns 200 text/plain for an existing issue file", async () => {
    const res = makeRes();
    await fileHandler(makeReq(), res, { key: "my-proj", id: "T-test" });

    expect((res.writeHead as jest.Mock).mock.calls[0][0]).toBe(200);
    expect((res.writeHead as jest.Mock).mock.calls[0][1]).toMatchObject({
      "Content-Type": "text/plain; charset=utf-8",
    });
    expect(mockCreateReadStream).toHaveBeenCalledWith(
      "/data/projects/my-proj/t/open/T-test.md",
    );
  });

  it("returns 404 when project key does not match an existing project", async () => {
    mockExistsSync.mockReturnValue(false);
    const res = makeRes();
    await fileHandler(makeReq(), res, { key: "no-such-proj", id: "T-test" });

    expect((res.writeHead as jest.Mock).mock.calls[0][0]).toBe(404);
    expect(mockGetObjectFilePath).not.toHaveBeenCalled();
  });

  it("returns 404 when issue does not exist", async () => {
    mockGetObjectFilePath.mockResolvedValue(null);
    const res = makeRes();
    await fileHandler(makeReq(), res, { key: "my-proj", id: "T-missing" });

    expect((res.writeHead as jest.Mock).mock.calls[0][0]).toBe(404);
  });

  it("returns 404 when resolved path escapes project root", async () => {
    mockGetObjectFilePath.mockResolvedValue("/etc/passwd");
    const res = makeRes();
    await fileHandler(makeReq(), res, { key: "my-proj", id: "T-evil" });

    expect((res.writeHead as jest.Mock).mock.calls[0][0]).toBe(404);
    expect(mockCreateReadStream).not.toHaveBeenCalled();
  });

  it("returns 404 when file does not exist on disk", async () => {
    mockStat.mockRejectedValue(
      Object.assign(new Error("ENOENT"), { code: "ENOENT" }),
    );
    const res = makeRes();
    await fileHandler(makeReq(), res, { key: "my-proj", id: "T-test" });

    expect((res.writeHead as jest.Mock).mock.calls[0][0]).toBe(404);
  });
});
