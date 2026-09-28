import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const port = Number(process.env.PORT || 4173);

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
};

function resolveRequestPath(url) {
  const pathname = decodeURIComponent(new URL(url, "http://localhost").pathname);
  const requested = pathname === "/" ? "/app/index.html" : pathname;
  const resolved = normalize(join(root, requested));
  const fromRoot = relative(root, resolved);
  return fromRoot.startsWith("..") || fromRoot.includes("../") ? null : resolved;
}

const server = createServer(async (request, response) => {
  const requestedPath = resolveRequestPath(request.url || "/");
  if (!requestedPath) {
    response.writeHead(403).end("Forbidden");
    return;
  }

  try {
    let filePath = requestedPath;
    if ((await stat(filePath)).isDirectory()) filePath = join(filePath, "index.html");
    const body = await readFile(filePath);
    response.writeHead(200, {
      "Cache-Control": "no-store",
      "Content-Type": mimeTypes[extname(filePath)] || "application/octet-stream",
    });
    response.end(body);
  } catch {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`AJTBD Course Player: http://127.0.0.1:${port}`);
});
