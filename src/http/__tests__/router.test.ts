import { IncomingMessage, ServerResponse } from "node:http";
import { createRouter } from "../router";

function makeRes() {
  return {
    writeHead: jest.fn(),
    end: jest.fn(),
  } as unknown as ServerResponse;
}

function makeReq(url: string): IncomingMessage {
  return { url } as IncomingMessage;
}

describe("createRouter", () => {
  it("calls the correct handler for a static route", () => {
    const router = createRouter();
    const handler = jest.fn();
    router.get("/foo", handler);

    const req = makeReq("/foo");
    const res = makeRes();
    router.dispatch(req, res);

    expect(handler).toHaveBeenCalledWith(req, res, {});
  });

  it("extracts named params from a parameterized route", () => {
    const router = createRouter();
    const handler = jest.fn();
    router.get("/projects/:key", handler);

    const req = makeReq("/projects/my-project");
    const res = makeRes();
    router.dispatch(req, res);

    expect(handler).toHaveBeenCalledWith(req, res, { key: "my-project" });
  });

  it("returns 404 for unknown routes", () => {
    const router = createRouter();

    const req = makeReq("/does-not-exist");
    const res = makeRes();
    router.dispatch(req, res);

    expect(res.writeHead).toHaveBeenCalledWith(404, {
      "Content-Type": "text/plain",
    });
    expect(res.end).toHaveBeenCalledWith("404 Not Found");
  });
});
