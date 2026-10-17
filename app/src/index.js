// Access gate. Until the correct code is typed, NO proxy assets load, no service
// worker registers, and no proxy markup exists — the page is only a Cloudflare
// error. The code is checked as a SHA-256 hash (obscurity, not security).
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

function loadScript(src) {
  return new Promise((res, rej) => {
    const s = document.createElement("script");
    s.src = src; s.onload = res; s.onerror = rej;
    document.head.appendChild(s);
  });
}

let started = false;
async function reveal() {
  if (started) return; started = true;
  try { sessionStorage.setItem("__cf_rl", "1"); } catch {}

  const err = document.getElementById("error"); if (err) err.remove();

  const style = document.createElement("style");
  style.textContent =
    "html,body{margin:0;height:100%;background:#0d1017}" +
    "#v{position:fixed;inset:0;display:flex;flex-direction:column;background:#0d1017;color:#e6e9ef;font:14px system-ui,sans-serif}" +
    "#v .ts{display:flex;align-items:center;gap:4px;padding:6px 8px 0;background:#10141c;overflow-x:auto}" +
    "#v .ts .tab{display:flex;align-items:center;gap:8px;max-width:200px;padding:7px 10px;border-radius:8px 8px 0 0;background:#151a23;color:#9aa4b2;cursor:pointer;white-space:nowrap}" +
    "#v .ts .tab.on{background:#0d1017;color:#e6e9ef}" +
    "#v .ts .tab .tl{overflow:hidden;text-overflow:ellipsis;max-width:150px}" +
    "#v .ts .tab .tx{opacity:.6;font-size:16px;line-height:1}" +
    "#v .ts .tab .tx:hover{opacity:1}" +
    "#v .ts .newt{padding:4px 10px;font-size:18px;line-height:1;background:transparent;color:#9aa4b2;border:0;cursor:pointer}" +
    "#v .b{display:flex;align-items:center;gap:8px;padding:8px 12px;background:#151a23;border-bottom:1px solid #232a36}" +
    "#v .b .nav{width:34px;height:34px;border-radius:7px;border:1px solid #2a323f;background:#0d1017;color:#e6e9ef;font-size:16px;cursor:pointer}" +
    "#v .b .nav:hover{border-color:#6ea8fe}" +
    "#v form{flex:1;display:flex;margin:0}" +
    "#v input{flex:1;padding:9px 12px;border-radius:7px;border:1px solid #2a323f;background:#0d1017;color:#e6e9ef;font-size:14px}" +
    "#v input:focus{outline:none;border-color:#6ea8fe}" +
    "#v .u{padding:4px 14px;font-size:12px;color:#7d8797;background:#10141c;border-bottom:1px solid #232a36;min-height:18px}" +
    "#v .vc{position:relative;flex:1}" +
    "#v .vc iframe{position:absolute;inset:0;border:0;width:100%;height:100%;background:#fff}";
  document.head.appendChild(style);

  const v = document.createElement("div"); v.id = "v";
  v.innerHTML =
    '<div class="ts" id="vts"><button class="newt" id="vnt" title="New tab">+</button></div>' +
    '<div class="b">' +
      '<button class="nav" id="vb" title="Back">‹</button>' +
      '<button class="nav" id="vfwd" title="Forward">›</button>' +
      '<button class="nav" id="vr" title="Reload">↻</button>' +
      '<form id="vn"><input id="va" placeholder="Search or enter address" autocomplete="off" spellcheck="false"></form>' +
    '</div>' +
    '<div class="u" id="vu"></div><div class="vc" id="vc"></div>';
  document.body.appendChild(v);

  // Proxy runtime is fetched only now.
  await loadScript("/bootstrap-init.js");
  const controller = await window["initBootstrap"]();

  const U = window.$scramjetUtils;
  const vts = document.getElementById("vts"), vnt = document.getElementById("vnt"),
        vc = document.getElementById("vc"), vu = document.getElementById("vu"),
        a = document.getElementById("va");
  const tabs = []; let active = 0, seq = 0;
  const cur = () => tabs.find((t) => t.id === active);

  // Each tab is an independent Scramjet frame; the toolbar acts on the active one.
  function makePlugins(tab) {
    const p = [];
    if (U) {
      if (U.HttpCachePlugin) p.push(new U.HttpCachePlugin());
      if (U.UrlWatcherPlugin) p.push(new U.UrlWatcherPlugin((u) => onUrl(tab, u)));
      if (U.CatchEscapedLinksPlugin) p.push(new U.CatchEscapedLinksPlugin(
        (u) => new URL(`/?goto=${encodeURIComponent(u.href)}`, location.origin)));
    }
    return p;
  }

  function onUrl(tab, u) {
    tab.url = u;
    try { tab.label.textContent = new URL(u).hostname || u; } catch { tab.label.textContent = u; }
    if (tab.id === active) {
      vu.textContent = u;
      if (document.activeElement !== a) a.value = u;
    }
  }

  function activate(id) {
    active = id;
    for (const t of tabs) {
      const on = t.id === id;
      t.iframe.style.display = on ? "block" : "none";
      t.chip.classList.toggle("on", on);
      if (on) { vu.textContent = t.url; if (document.activeElement !== a) a.value = t.url; }
    }
  }

  function closeTab(id) {
    const i = tabs.findIndex((t) => t.id === id);
    if (i < 0) return;
    tabs[i].iframe.remove(); tabs[i].chip.remove();
    tabs.splice(i, 1);
    if (active === id) { const n = tabs[i] || tabs[i - 1]; n ? activate(n.id) : newTab(); }
  }

  function newTab(url) {
    const id = ++seq;
    const iframe = document.createElement("iframe");
    iframe.setAttribute("allowfullscreen", "");
    vc.appendChild(iframe);
    const tab = { id, iframe, frame: null, url: "", chip: null, label: null };
    tab.frame = controller.createFrame(iframe, { plugins: makePlugins(tab) });
    const chip = document.createElement("div"); chip.className = "tab";
    const label = document.createElement("span"); label.className = "tl"; label.textContent = "New Tab";
    const x = document.createElement("span"); x.className = "tx"; x.textContent = "×";
    chip.appendChild(label); chip.appendChild(x);
    chip.addEventListener("click", (e) => { if (e.target !== x) activate(id); });
    x.addEventListener("click", (e) => { e.stopPropagation(); closeTab(id); });
    vts.insertBefore(chip, vnt);
    tab.chip = chip; tab.label = label;
    tabs.push(tab);
    activate(id);
    if (url) { if (!/^https?:\/\//i.test(url)) url = "https://" + url; tab.frame.go(url); }
    return tab;
  }

  document.getElementById("vb").addEventListener("click", () => { const c = cur(); if (c) c.frame.back(); });
  document.getElementById("vfwd").addEventListener("click", () => { const c = cur(); if (c) c.frame.forward(); });
  document.getElementById("vr").addEventListener("click", () => { const c = cur(); if (c) c.frame.reload(); });
  vnt.addEventListener("click", () => { newTab(); a.focus(); });
  document.getElementById("vn").addEventListener("submit", (e) => {
    e.preventDefault();
    let u = a.value.trim(); if (!u) return;
    if (!/^https?:\/\//i.test(u)) u = "https://" + u;
    const c = cur(); if (c) c.frame.go(u);
  });

  newTab();
  const g = new URL(location.href).searchParams.get("goto");
  if (g) { history.replaceState(null, "", location.pathname); a.value = g; cur().frame.go(g); }
  a.focus();
}

// Auto-unlock when opened with the code in the URL hash (e.g. from a key file).
// The hash is never sent to the server, so this leaves no server-side trace of
// the code; it's stripped from the address bar the moment the proxy opens.
(async () => {
  try {
    const h = decodeURIComponent((location.hash || "").slice(1));
    if (h.length === L && (await digest(h)) === H) {
      history.replaceState(null, "", location.pathname + location.search);
      reveal();
    }
  } catch {}
})();

// Resume within the same browser session (reloads and the ?goto bounce).
try { if (sessionStorage.getItem("__cf_rl") === "1") reveal(); } catch {}
