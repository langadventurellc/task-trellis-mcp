import fs from "node:fs";
import path from "node:path";
import { httpServer } from "../httpServer";
import { landingPageHandler } from "./landingPage";
import {
  childrenPartialHandler,
  detailPartialHandler,
  projectTreeHandler,
} from "./projectTreePage";
import { createRouter } from "./router";

const htmxContent = fs.readFileSync(path.join(__dirname, "htmx.min.js"));

const router = createRouter();

router.get("/", (req, res) => landingPageHandler(req, res));

router.get("/_htmx.js", (_req, res) => {
  res.writeHead(200, { "Content-Type": "application/javascript" });
  res.end(htmxContent);
});

router.get("/projects/:key", (req, res, params) =>
  projectTreeHandler(req, res, params),
);
router.get("/projects/:key/issues/:id/children", (req, res, params) =>
  childrenPartialHandler(req, res, params),
);
router.get("/projects/:key/issues/:id/detail", (req, res, params) =>
  detailPartialHandler(req, res, params),
);

httpServer.on("request", (req, res) => router.dispatch(req, res));
