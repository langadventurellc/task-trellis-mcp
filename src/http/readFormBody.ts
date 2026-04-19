import { IncomingMessage } from "node:http";

const MAX_BYTES = 1024 * 1024; // 1 MB

/** Reads and parses an application/x-www-form-urlencoded request body. */
export async function readFormBody(
  req: IncomingMessage,
): Promise<URLSearchParams> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let totalBytes = 0;

    req.on("data", (chunk: Buffer) => {
      totalBytes += chunk.length;
      if (totalBytes > MAX_BYTES) {
        req.destroy();
        reject(new Error("Request body exceeds 1 MB limit"));
        return;
      }
      chunks.push(chunk);
    });

    req.on("end", () => {
      const body = Buffer.concat(chunks).toString("utf8");
      resolve(new URLSearchParams(body));
    });

    req.on("error", reject);
  });
}
