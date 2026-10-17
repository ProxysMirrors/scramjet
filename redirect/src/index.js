// Access gate. The page is only a Cloudflare 521 error until the correct code
// is typed; then it redirects to the URL the server injected as window.__R
// (from the REDIRECT_URL env var). The code is checked as a SHA-256 hash.
const H = "82e2316835165f33f99e0d7583c3e8ac2d2ed3d5b550a19712d44b83308d6e0e";
const L = 13;

// Populate the Cloudflare facade with live-looking values.
(function () {
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  const host = location.hostname || "example.com";
  const d = new Date(), p = (n) => String(n).padStart(2, "0");
  const ts = `${d.getUTCFullYear()}-${p(d.getUTCMonth()+1)}-${p(d.getUTCDate())} ` +
             `${p(d.getUTCHours())}:${p(d.getUTCMinutes())}:${p(d.getUTCSeconds())} UTC`;
  const cities = ["Dallas","Phoenix","Ashburn","Chicago","San Jose",
    "Los Angeles","Atlanta","Seattle","Miami","Denver"];
  const ip = [Math.floor(Math.random()*223)+1, Math.floor(Math.random()*256),
    Math.floor(Math.random()*256), Math.floor(Math.random()*254)+1].join(".");
  set("cf-host", host);
  set("cf-city", cities[Math.floor(Math.random() * cities.length)]);
  set("cf-time", ts);
  const ipEl = document.getElementById("cf-ip"); if (ipEl) ipEl.dataset.ip = ip;
  try { document.title = host + " | 521: Web server is down"; } catch {}
  const caret = document.getElementById("cf-caret"), col = caret && caret.closest(".col"),
        band = document.querySelector("#error .band");
  const place = () => {
    if (!caret || !col || !band) return;
    const c = col.getBoundingClientRect(), b = band.getBoundingClientRect();
    caret.style.left = (c.left - b.left + c.width / 2 - 12) + "px";
  };
  place(); addEventListener("resize", place);
})();

async function digest(str) {
  const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
  return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
}

let buf = "";
async function onKey(e) {
  if (e.key === "Backspace") buf = buf.slice(0, -1);
  else if (e.key.length === 1) buf += e.key.toLowerCase();
  else return;
  if (buf.length > 128) buf = buf.slice(-128);
  const tail = buf.slice(-L);
  if (tail.length === L && (await digest(tail)) === H) {
    document.removeEventListener("keydown", onKey);
    reveal();
  }
}
document.addEventListener("keydown", onKey);

function reveal() {
  const dest = window["__R"];
  if (!dest) return;               // no destination configured -> stay a 521 page
  try { location.replace(dest); } catch { location.href = dest; }
}
