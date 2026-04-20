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
import { attachmentHandler } from "../projectTreePage/attachmentHandler";

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

describe("attachmentHandler", () => {
  let mockGetObjectById: jest.Mock;
  let mockGetAttachmentsFolder: jest.Mock;

  beforeEach(() => {
    jest.resetAllMocks();
    mockGetObjectById = jest.fn().mockResolvedValue({
      id: "T-test",
      type: "task",
    });
    mockGetAttachmentsFolder = jest
      .fn()
      .mockResolvedValue("/data/projects/my-proj/t/attachments/T-test");
    MockedLocalRepository.mockImplementation(
      () =>
        ({
          getObjectById: mockGetObjectById,
          getAttachmentsFolder: mockGetAttachmentsFolder,
        }) as unknown as LocalRepository,
    );
    mockResolveDataDir.mockReturnValue("/data");
    mockExistsSync.mockReturnValue(true);
    mockStat.mockResolvedValue({});
    mockCreateReadStream.mockReturnValue(makeStream());
  });

  it("returns 200 with correct content-type for a known attachment", async () => {
    const res = makeRes();
    await attachmentHandler(makeReq(), res, {
      key: "my-proj",
      id: "T-test",
      filename: "diagram.png",
    });

    expect((res.writeHead as jest.Mock).mock.calls[0][0]).toBe(200);
    expect((res.writeHead as jest.Mock).mock.calls[0][1]).toMatchObject({
      "Content-Type": "image/png",
    });
    expect(mockCreateReadStream).toHaveBeenCalledWith(
      expect.stringContaining("diagram.png"),
    );
  });

  it("returns 200 with octet-stream for unknown extension", async () => {
    const res = makeRes();
    await attachmentHandler(makeReq(), res, {
      key: "my-proj",
      id: "T-test",
      filename: "data.bin",
    });

    expect((res.writeHead as jest.Mock).mock.calls[0][0]).toBe(200);
    expect((res.writeHead as jest.Mock).mock.calls[0][1]).toMatchObject({
      "Content-Type": "application/octet-stream",
    });
  });

  it("returns 404 when file is not found in attachments folder", async () => {
    mockStat.mockRejectedValue(
      Object.assign(new Error("ENOENT"), { code: "ENOENT" }),
    );

    const res = makeRes();
    await attachmentHandler(makeReq(), res, {
      key: "my-proj",
      id: "T-test",
      filename: "missing.txt",
    });

    expect((res.writeHead as jest.Mock).mock.calls[0][0]).toBe(404);
  });

  it("returns 404 when issue does not exist", async () => {
    mockGetObjectById.mockResolvedValue(null);

    const res = makeRes();
    await attachmentHandler(makeReq(), res, {
      key: "my-proj",
      id: "T-missing",
      filename: "file.txt",
    });

    expect((res.writeHead as jest.Mock).mock.calls[0][0]).toBe(404);
    expect(mockGetAttachmentsFolder).not.toHaveBeenCalled();
  });

  it("returns 404 when project key does not match an existing project", async () => {
    mockExistsSync.mockReturnValue(false);

    const res = makeRes();
    await attachmentHandler(makeReq(), res, {
      key: "no-such-proj",
      id: "T-test",
      filename: "file.txt",
    });

    expect((res.writeHead as jest.Mock).mock.calls[0][0]).toBe(404);
    expect(mockGetObjectById).not.toHaveBeenCalled();
  });

  it("returns 400 for filenames containing path traversal sequences", async () => {
    const res = makeRes();
    await attachmentHandler(makeReq(), res, {
      key: "my-proj",
      id: "T-test",
      filename: "../secret.txt",
    });

    expect((res.writeHead as jest.Mock).mock.calls[0][0]).toBe(400);
    expect(mockGetObjectById).not.toHaveBeenCalled();
  });

  it("returns 400 for filenames containing forward slash", async () => {
    const res = makeRes();
    await attachmentHandler(makeReq(), res, {
      key: "my-proj",
      id: "T-test",
      filename: "sub/evil.txt",
    });

    expect((res.writeHead as jest.Mock).mock.calls[0][0]).toBe(400);
  });
});
