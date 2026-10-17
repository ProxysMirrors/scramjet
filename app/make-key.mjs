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
// The key does NOT redirect (that would expose the live URL in the address bar).
// It embeds the proxy in a full-page iframe, so the address bar stays on the key
// file and the live link only lives in the (base64/obfuscated) iframe src.
const js = `(function(){
  var u = atob(${JSON.stringify(b64(site))});
  var c = atob(${JSON.stringify(b64(code))});
  var f = document.createElement("iframe");
  f.src = u.replace(/\\/+$/, "") + "/#" + c;
  f.allow = "fullscreen; clipboard-read; clipboard-write";
  f.setAttribute("style", "position:fixed;inset:0;border:0;width:100%;height:100%");
  (document.body || document.documentElement).appendChild(f);
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

// No title; the proxy is rendered inside this file (full-page iframe), not redirected to.
const html =
  `<!doctype html><html lang="en"><head><meta charset="utf-8">` +
  `<meta name="viewport" content="width=device-width,initial-scale=1">` +
  `<title></title><meta name="robots" content="noindex">` +
  `<style>html,body{margin:0;height:100%;background:#fff;overflow:hidden}</style></head>` +
  `<body><script>${obf}</script></body></html>`;

writeFileSync(out, html);
console.log("wrote " + out + "  (" + Buffer.byteLength(html) + " bytes)");
