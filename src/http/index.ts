import type { Server } from "node:http";
import fs from "node:fs";
import path from "node:path";
import { landingPageHandler } from "./landingPage";
import {
  attachmentHandler,
  createChildFormHandler,
  createChildSubmitHandler,
  createTopFormHandler,
  createTopSubmitHandler,
  deleteFormHandler,
  deleteSubmitHandler,
  detailViewHandler,
  editFormHandler,
  editSubmitHandler,
  fileHandler,
  projectTreeHandler,
  searchHandler,
} from "./projectTreePage";
import { createRouter } from "./router";

const htmxContent = fs.readFileSync(path.join(__dirname, "htmx.min.js"));
const cssContent = fs.readFileSync(path.join(__dirname, "styles.css"));

function buildRouter() {
  const router = createRouter();

  router.get("/", (req, res) => landingPageHandler(req, res));

  router.get("/_htmx.js", (_req, res) => {
    res.writeHead(200, { "Content-Type": "application/javascript" });
    res.end(htmxContent);
  });

  router.get("/_styles.css", (_req, res) => {
    res.writeHead(200, { "Content-Type": "text/css" });
    res.end(cssContent);
  });

  router.get("/projects/:key", (req, res, params) =>
    projectTreeHandler(req, res, params),
  );
  router.get("/projects/:key/issues/search", (req, res, params) =>
    searchHandler(req, res, params),
  );
  router.get("/projects/:key/issues/new", (req, res, params) =>
    createTopFormHandler(req, res, params),
  );
  router.get("/projects/:key/issues/:id/detail", (req, res, params) =>
    detailViewHandler(req, res, params),
  );
  router.get(
    "/projects/:key/issues/:id/attachments/:filename",
    (req, res, params) => attachmentHandler(req, res, params),
  );
  router.get("/projects/:key/issues/:id/file", (req, res, params) =>
    fileHandler(req, res, params),
  );
  router.get("/projects/:key/issues/:id/edit", (req, res, params) =>
    editFormHandler(req, res, params),
  );
  router.get("/projects/:key/issues/:id/children/new", (req, res, params) =>
    createChildFormHandler(req, res, params),
  );
  router.put("/projects/:key/issues/:id", (req, res, params) =>
    editSubmitHandler(req, res, params),
  );
  router.post("/projects/:key/issues", (req, res, params) =>
    createTopSubmitHandler(req, res, params),
  );
  router.post("/projects/:key/issues/:id/children", (req, res, params) =>
    createChildSubmitHandler(req, res, params),
  );
  router.get("/projects/:key/issues/:id/delete", (req, res, params) =>
    deleteFormHandler(req, res, params),
  );
  router.delete("/projects/:key/issues/:id", (req, res, params) =>
    deleteSubmitHandler(req, res, params),
  );

  return router;
}

export function wireRoutes(server: Server): void {
  const router = buildRouter();
  server.on("request", (req, res) => router.dispatch(req, res));
}
