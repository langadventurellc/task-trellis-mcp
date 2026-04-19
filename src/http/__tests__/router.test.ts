import { IncomingMessage, ServerResponse } from "node:http";
import { createRouter } from "../router";

function makeRes() {
  return {
    writeHead: jest.fn(),
    end: jest.fn(),
  } as unknown as ServerResponse;
}

function makeReq(url: string, method = "GET"): IncomingMessage {
  return { url, method } as IncomingMessage;
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

  it("extracts named params on a POST route", () => {
    const router = createRouter();
    const handler = jest.fn();
    router.post("/projects/:key/issues", handler);

    const req = makeReq("/projects/my-project/issues", "POST");
    const res = makeRes();
    router.dispatch(req, res);

    expect(handler).toHaveBeenCalledWith(req, res, { key: "my-project" });
  });

  it("extracts named params on a PUT route", () => {
    const router = createRouter();
    const handler = jest.fn();
    router.put("/projects/:key/issues/:id", handler);

    const req = makeReq("/projects/my-project/issues/T-123", "PUT");
    const res = makeRes();
    router.dispatch(req, res);

    expect(handler).toHaveBeenCalledWith(req, res, {
      key: "my-project",
      id: "T-123",
    });
  });

  it("extracts named params on a DELETE route", () => {
    const router = createRouter();
    const handler = jest.fn();
    router.delete("/projects/:key/issues/:id", handler);

    const req = makeReq("/projects/my-project/issues/T-123", "DELETE");
    const res = makeRes();
    router.dispatch(req, res);

    expect(handler).toHaveBeenCalledWith(req, res, {
      key: "my-project",
      id: "T-123",
    });
  });

  it("does not match GET route for POST request", () => {
    const router = createRouter();
    const handler = jest.fn();
    router.get("/foo", handler);

    const req = makeReq("/foo", "POST");
    const res = makeRes();
    router.dispatch(req, res);

    expect(handler).not.toHaveBeenCalled();
    expect(res.writeHead).toHaveBeenCalledWith(404, {
      "Content-Type": "text/plain",
    });
  });
});
