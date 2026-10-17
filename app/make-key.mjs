// Generate a "key" HTML file: opened in a browser, it navigates (same tab) to
// the proxy site with the access code in the URL hash, which auto-unlocks the
// proxy. The site URL and code are base64-encoded and the script is obfuscated
// ("tracking harder"); the key shows no error page. The code is NOT stored here
// in plaintext — pass it at build time so it never lands in the repo:
//
//   node make-key.mjs <siteURL> <code> [outFile]
//   node make-key.mjs https://scramjet-kd1y.onrender.com oyzqpiieqv0mk ../proxy-key.html
import { writeFileSync } from "node:fs";
import Obfuscator from "javascript-obfuscator";

const [, , site, code, out = "proxy-key.html"] = process.argv;
if (!site || !code) {
  console.error("usage: node make-key.mjs <siteURL> <code> [outFile]");
  process.exit(1);
}

const b64 = (s) => Buffer.from(s, "utf8").toString("base64");
const js = `(function(){
  var u = atob(${JSON.stringify(b64(site))});
  var c = atob(${JSON.stringify(b64(code))});
  location.replace(u.replace(/\\/+$/, "") + "/#" + c);
})();`;

const obf = Obfuscator.obfuscate(js, {
  target: "browser",
  compact: true,
  controlFlowFlattening: true,
  controlFlowFlatteningThreshold: 0.75,
  deadCodeInjection: true,
  deadCodeInjectionThreshold: 0.4,
  identifierNamesGenerator: "hexadecimal",
  numbersToExpressions: true,
  simplify: true,
  splitStrings: true,
  splitStringsChunkLength: 6,
  stringArray: true,
  stringArrayEncoding: ["rc4"],
  stringArrayThreshold: 1,
  stringArrayWrappersCount: 3,
  stringArrayWrappersChainedCalls: true,
  stringArrayWrappersType: "function",
  transformObjectKeys: true,
  selfDefending: true,
}).getObfuscatedCode().replace(/<\/script>/gi, "<\\/script>");

const html =
  `<!doctype html><html lang="en"><head><meta charset="utf-8">` +
  `<meta name="viewport" content="width=device-width,initial-scale=1">` +
  `<title>Redirecting…</title><meta name="robots" content="noindex"></head>` +
  `<body><script>${obf}</script></body></html>`;

writeFileSync(out, html);
console.log("wrote " + out + "  (" + Buffer.byteLength(html) + " bytes)");
