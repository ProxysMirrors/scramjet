# Scramjet Proxy (serves the LOCAL build)

A single-port, Render-ready Scramjet web proxy that serves **this repo's own
build** — not the npm packages. Your edits to Scramjet's source are what gets
deployed.

The Scramjet client, controller, utils, wasm, and the libcurl transport are
copied into `vendor/` and served from there. Wisp runs on the same port at
`/wisp/`. No npm downloads happen at runtime.

## Update workflow (after editing Scramjet source)

```bash
# 1. rebuild Scramjet at the REPO ROOT (rebuilds dist, incl. Rust wasm if changed)
cd ..
pnpm build            # or: cd packages/core && RELEASE=1 pnpm rewriter:build && pnpm build

# 2. copy the fresh build into app/vendor/
cd app
npm install           # first time only (installs express, wisp-js, libcurl-transport)
npm run sync          # copies dist -> vendor/

# 3. run it
npm start             # http://localhost:3030  (set PORT to override)

# 4. deploy: commit vendor/ and push
git add vendor server.js && git commit -m "update build" && git push
```

`vendor/` is committed on purpose — Render can't rebuild the Rust wasm, so the
built assets ship in the repo. `npm run sync` refreshes them from your local
`pnpm build` output.

## Deploy to Render (free)

- **Blueprint:** the repo-root `render.yaml` builds this folder (`rootDir: app`).
- **Manual Web Service:**
  - **Root Directory:** `app`
  - **Build Command:** `npm install`
  - **Start Command:** `node server.js`
  - **Instance Type:** Free

The server reads Render's `PORT`; HTTPS is automatic on `*.onrender.com`.
Because `vendor/` is committed, Render needs no build step beyond `npm install`
and never touches the Rust toolchain.

## Run on your own laptop, public via a tunnel (Cloudflare)

Host the proxy on your machine instead of Render, exposed through a reverse
tunnel. No port forwarding, your home IP stays hidden, and the public URL is
fronted by Cloudflare — so the fake Cloudflare **521** page is genuinely served
through Cloudflare. The tradeoff: the link is live only while your laptop is on
and both processes are running.

```bash
# one-time: install cloudflared (NOT the out-of-date snap)
#   https://github.com/cloudflare/cloudflared/releases  (download .deb/.rpm, or
#   use the Cloudflare apt/yum repo). Verify: cloudflared --version

# terminal 1 — the proxy
npm start                     # http://localhost:3030  (PORT to override)

# terminal 2 — the public tunnel (same PORT)
npm run tunnel                # prints https://<random>.trycloudflare.com
```

Copy the printed `https://<random>.trycloudflare.com` URL and regenerate the key
against it (the URL changes every run — quick tunnels are ephemeral, no SLA):

```bash
node make-key.mjs https://<random>.trycloudflare.com <code> ../KEYS.html
```

For a **stable** URL, use a named tunnel + your own domain (free Cloudflare
account) instead of the quick tunnel — then the key URL never changes.

- Quick tunnels: free, no account, random URL, dies with the process, no uptime
  guarantee. Fails if a `config.yaml` exists in `~/.cloudflared/`.
- Avoid **ngrok** free tier here — it shows a browser interstitial warning page
  that breaks the stealth illusion.

## Access gate (stealth + obfuscated)

The served page is a **single HTML document** that looks exactly like a
Cloudflare "Web server is down" (521) error. Until the secret code is typed:

- it makes **zero** proxy requests (the only request is the HTML itself),
- registers **no** service worker, and has **no** proxy markup in the DOM,
- so a network filter or admin inspecting it sees only a Cloudflare error page.

Typing the code loads the proxy runtime on the fly and swaps in the browser UI.
The gate script is **obfuscated and inlined** into the HTML (no separate
`/index.js` to spot).

### Editing / rebuilding
Source lives in `src/`; the served file is generated:
```bash
#   src/index.html   -> the Cloudflare facade
#   src/index.js     -> the gate + deferred proxy loader
npm run obfuscate        # -> public/index.html (obfuscated, inlined)
```

### Changing the code
The code is stored only as a SHA-256 hash (`H`) with its length (`L`) in
`src/index.js`. To set your own (recommended — pick a long random one):
```bash
printf '%s' 'yourlongcode' | sha256sum      # copy the hash into H
# set L to the code's length, then:
npm run obfuscate
```

- **This is obscurity, not security.** The code still runs in the browser, so a
  determined person can recover the logic (deobfuscator, debugger). It defeats
  casual inspection and makes the page look innocent — nothing more.
- Don't run `npm run obfuscate` in the pre-push hook: its output is randomized
  each run, so it would always look "changed".

## Files

- `server.js` — serves `vendor/` assets + generates `/sw.js` and
  `/bootstrap-init.js`, runs Wisp on `/wisp/`.
- `sync-build.mjs` — copies the workspace build into `vendor/`.
- `vendor/` — the committed Scramjet build (refreshed by `npm run sync`).
- `public/` — the proxy UI (edit `index.html` to customize).

## Notes

- Free tier sleeps after ~15 min idle (~50 s cold start on next visit).
- The libcurl transport (`vendor/libcurl-client.js`) comes from npm — it isn't
  part of Scramjet, so it's not something you'd modify. `npm run sync` refreshes
  it from the `@mercuryworkshop/libcurl-transport` devDependency.
