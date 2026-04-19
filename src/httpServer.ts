import http, { type Server } from "node:http";
import { wireRoutes } from "./http";

export function createHttpServer(): Server {
  const server = http.createServer();
  wireRoutes(server);
  return server;
}
