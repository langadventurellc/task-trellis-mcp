import fs from "node:fs";
import path from "node:path";
import { httpServer } from "../httpServer";
import { landingPageHandler } from "./landingPage";
import {
  createChildFormHandler,
  createChildSubmitHandler,
  createTopFormHandler,
  createTopSubmitHandler,
  detailViewHandler,
  editFormHandler,
  editSubmitHandler,
  projectTreeHandler,
  searchHandler,
} from "./projectTreePage";
import { createRouter } from "./router";

const htmxContent = fs.readFileSync(path.join(__dirname, "htmx.min.js"));
const cssContent = fs.readFileSync(path.join(__dirname, "styles.css"));

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

httpServer.on("request", (req, res) => router.dispatch(req, res));
