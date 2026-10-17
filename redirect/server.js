// Minimal server: serves the single-file Cloudflare-521 gate page and injects
// the redirect destination from the REDIRECT_URL env var. No dependencies.
const http = require("node:http");
const fs = require("node:fs");
const path = require("path");

const page = fs.readFileSync(path.join(__dirname, "public", "index.html"), "utf8");
// JSON.stringify makes the URL a safe JS string literal (escapes quotes etc.).
const dest = JSON.stringify(process.env.REDIRECT_URL || "");
const body = Buffer.from(page.replace("__REDIRECT_URL__", () => dest), "utf8");

const server = http.createServer((req, res) => {
  if (req.url === "/favicon.ico") { res.writeHead(204).end(); return; }
  // A downed origin behaves the same for every path: always the 521 page.
  res.writeHead(200, {
    "content-type": "text/html; charset=UTF-8",
    "cache-control": "no-store",
  });
  res.end(req.method === "HEAD" ? undefined : body);
});

const port = process.env.PORT || 3031;
server.listen(port, () => console.log("redirect gate on :" + port));
