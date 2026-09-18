# Day 01: Building a Web Server with Express

## Core Concepts

**Express** is a minimal Node.js web framework built around **middleware** — functions with access to `req`, `res`, and `next`, run in the order they're registered.

```js
function middleware(req, res, next) {
  // read/modify req or res
  next() // pass control onward (or res.send()/res.json() to end the cycle)
}
```

- **`app.use(path, fn)`** — matches by **prefix**. Runs for the path and everything under it.
- **`app.get/post/etc(path, fn)`** — matches the **exact** route (plus params like `/:id`).
- Order matters — middleware/routes are checked top-to-bottom; first match wins.

**Types of middleware:**
| Type | Example |
|---|---|
| Built-in | `express.json()`, `express.static()` |
| Third-party | `cors()`, `morgan()` |
| Custom | auth checks, loggers |
| Error-handling | `(err, req, res, next) => {...}` (4 args, defined last) |

**Static file serving:** `express.static(dir)` maps a folder on disk to a URL prefix defined by the `app.use()` call — the folder path and URL path are independent of each other:
```js
app.use('/scripts', express.static('./public/scripts'))
// disk: ./public/scripts/header.js  →  URL: /scripts/header.js
```

**`express.Router()`** — lets you group related routes into their own module, then mount them under a prefix in the main app (`app.use('/gifts', giftsRouter)`). Keeps `server.js` thin and routes organized by resource.

**ESM vs CommonJS gotcha:** with `"type": "module"` in `package.json`, Node doesn't give you the usual `__dirname`/`__filename` globals. Recreate them when you need to resolve file paths (e.g., for `res.sendFile()`):
```js
import { fileURLToPath } from 'url'
import path from 'path'
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
```

**REST-ish resource pattern:** `GET /resource` (list/collection) + `GET /resource/:id` (single item) is the standard shape for exposing a resource, even without a database.

---

## Lab: UnEarthed — Architecture

Two separate npm projects, one repo:
- **`client/`** — Vite, vanilla JS/HTML/CSS (no framework)
- **`server/`** — Express API + static file host

**Dev mode:** two servers run side by side.
- Vite dev server (`:5173`) serves the frontend with hot reload.
- Express (`:3000`) serves the API.
- Vite's `server.proxy` config forwards specific paths (e.g. `/gifts`) from `5173` → `3000`, so client code can just `fetch('/gifts')` with no hardcoded host and no CORS issues.

**Build mode:** `vite.config.js` sets `build.outDir: '../server/public'` — running `vite build` outputs the compiled frontend directly into the folder Express already serves statically. Result: **one Express server** can serve both the API and the built frontend in production; no proxy needed.

### Server (`server/`)
- `server.js` — mounts static middleware (`/public`, `/scripts`) and the gifts router (`/gifts`); has a placeholder `GET /`.
- `routes/gifts.js` — `express.Router()` with:
  - `GET /` → `res.json(giftData)` (the list, as JSON)
  - `GET /:giftId` → `res.sendFile(gift.html)` (serves the detail page's HTML shell; the actual gift data is fetched client-side by JS on that page)
- `data/gifts.js` — in-memory array of gift objects (`id, name, pricePoint, audience, image, description, submittedBy, submittedOn`), `export default` — stand-in for a real database.

### Client (`client/`)
- `index.html` — home page; loads `header.js` + `gifts.js`, has `<main id="main-content">`.
- `public/scripts/header.js` — builds the nav bar via DOM APIs (`createElement`, `appendChild`); "Home" button does `window.location = '/'`.
- `public/scripts/gifts.js`:
  - `renderGifts()` — fetches `/gifts`, builds a card per item into `#main-content`, each card links to `/gifts/:id`.
  - `renderGift()` — reads the id from the URL (`window.location.href.split('/').pop()`), fetches `/gifts` (the full list — there's no single-item JSON endpoint), finds the matching gift with `.find()`, and populates the detail page's fields by `id`.

---

## Gotchas Worth Remembering

1. **Vite proxy target must match the backend's actual port.** A mismatch (proxy pointing at `3001` while Express listens on `3000`) causes `ECONNREFUSED` — the proxy has nowhere to forward requests. Always double check `vite.config.js` proxy `target` against your server's actual `PORT`.

2. **Relative asset paths break on nested routes.** `<script src="./scripts/x.js">` resolves against the **current URL**, not the file's location on disk. A page served at `/gifts/3` resolves `./scripts/x.js` to `/gifts/scripts/x.js` — which 404s. **Always use root-absolute paths** (`/scripts/x.js`) for assets shared across pages that might be served under different route depths.

3. **String-splitting a URL is a fragile way to detect "which page am I on."** `window.location.href.split('/').pop()` returns the last path segment — but that's truthy on *both* `/gifts/3` (a real id) and any other non-root path, so it can't reliably distinguish "home page" from "detail page" (worth knowing `window.location.pathname` exists specifically for this, and that route detection logic deserves an explicit check rather than an inferred one).

---

## Interview Cheat-Sheet

- **Middleware** = `(req, res, next) => {}`; must call `next()` or send a response, or the request hangs.
- **`app.use` vs `app.get`**: prefix match vs exact match.
- **`express.static(dir)`**: serves files from `dir`, URL prefix set independently via `app.use(prefix, ...)`.
- **Why a dev proxy?** Lets frontend code use relative URLs (`fetch('/api')`) against a separate dev server without hitting CORS, while mimicking same-origin production behavior.
- **Why no CORS in production here?** One server serves both static frontend and API from the same origin.
- **`Router()`**: modular, mountable route groups — keeps `app.js`/`server.js` clean.
- **ESM has no `__dirname`**: reconstruct with `fileURLToPath(import.meta.url)` + `path.dirname()`.
