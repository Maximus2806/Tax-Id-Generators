# Tax ID & IBAN Generators

Static web app that generates **format-valid (but fake) tax identification numbers and IBANs** for QA/testing — e.g. filling deposit forms during international payment testing. Every value passes the real check-digit/checksum algorithm for its country, so it looks valid to validators, but does not belong to a real person or account.

- **Live:** https://tax-id-generators.vercel.app/
- **Repo:** https://github.com/Maximus2806/Tax-Id-Generators (branch `main`)
- **Hosting:** Vercel project `tax-id-generators`

## What it does

A home page (`index.html`) with a grid of cards, one per generator. Each card links to a dedicated page under `pages/`. Current generators:

| ID         | Country            | File pair                                |
|------------|--------------------|------------------------------------------|
| CPF        | Brazil (BRL)       | `pages/cpf.html` + `js/cpf.js`           |
| CUIT       | Argentina (ARS)    | `pages/cuit.html` + `js/cuit.js`         |
| CURP & RFC | Mexico (MXN)       | `pages/curp-rfc.html` + `js/curp-rfc.js` |
| RUT        | Chile (CLP)        | `pages/rut.html` + `js/rut.js`           |
| IBAN       | 29 countries       | `pages/iban.html` + `js/iban.js`         |

## Tech stack & conventions

**Plain static site — no build step, no framework, no npm.** There is no `package.json`, no bundler, no transpiler. Just HTML, one shared CSS file, and one vanilla-JS file per generator. Keep it this way unless we deliberately decide otherwise.

- **No ES modules / imports.** Each `js/*.js` defines plain global functions. HTML wires them up with inline `onclick="..."` / `onchange="..."` attributes.
- **No external runtime dependencies.** The only third-party asset is the `flag-icons` CSS loaded from jsDelivr CDN (`<link>` in the `<head>`). Country flags use `<span class="fi fi-XX">`. The IBAN page uses a 🌐 emoji instead of a flag and does **not** load flag-icons.
- **DOM access** is always `document.getElementById(...)`; results go into `readonly` `<input>` fields.
- **Randomness** uses `Math.random()` throughout (test data, not cryptographic).
- **Language:** UI text is English. Keep new UI English unless asked.

### Per-generator file conventions
A generator's `js/<name>.js` typically exposes:
- `generate...()` — produces a value (passing the country's check-digit algorithm) and writes it to the output input.
- `copy...()` — copies the output to clipboard via `navigator.clipboard.writeText(...)`, then flips the button label to `Copied!` for 1500ms before restoring it. IBAN strips spaces before copying.
- Element id convention: output field `<name>Number` (or `...Output`), copy button `<name>CopyBtn`.

Algorithms are country-specific and intentionally faithful:
- **CPF** — two mod-11 check digits; rejects repeated-digit numbers (`isBlacklistedCPF`).
- **CUIT** — mod-11 check digit with fixed weights `[5,4,3,2,7,6,5,4,3,2]`; retries when the check resolves to 10 (invalid).
- **RUT** — mod-11 DV with cycling 2→7 multiplier; DV can be `K` or `0`.
- **CURP/RFC** — builds the code from name/surname letters + birth date + gender + state code (`mexicanStates` map); `cleanString` strips accents. CURP adds state + consonants + 2 random digits; RFC adds a 3-letter random homoclave. `curp-rfc.js` also has `fillRandom()` to populate the form with random sample data.
- **IBAN** — `bbanFormats` table holds each country's BBAN segment layout (`{ t: 'n'|'a', l: length, codes?: [...] }`); `codes` lists realistic bank identifiers to pick from. Check digits via the standard **mod-97** algorithm (`computeCheckDigits`), then `validateIBAN` confirms `mod97 === 1` before display. Output is grouped in blocks of 4.

## Design / theme

Dark theme defined entirely in `css/style.css` (single shared stylesheet). Key tokens:
- Background `#0f1117`, cards `#1c1f2e`, borders `#2e3249`
- Text `#e8eaf0`, muted `#9095a8`
- Accent teal `#62CBC1`; primary buttons use gradient `#82DAD2 → #44ACA3`

Two page layouts: `.page-home` (cards grid) and `.page-generator` (centered `.card` form). New generator pages should reuse `.page-generator` + `.card` + the shared form/button classes — don't introduce per-page CSS.

## Adding a new generator (common task)

1. **`js/<name>.js`** — add `generate...()` and `copy...()` following the conventions above.
2. **`pages/<name>.html`** — copy an existing page (e.g. `pages/cpf.html`) as the template: same `<head>` links (`../css/style.css`, favicon, flag-icons CDN if a flag is used), `.site-header` with a breadcrumb, a `.card` with inputs/buttons wired via inline `onclick`, and `<script src="../js/<name>.js"></script>` at the end.
3. **`index.html`** — add a `.gen-card` to `.cards-grid` (flag span, `<h3>`, country, currency badge, "Open Generator" link to the new page).

Path note: pages live in `pages/` and reference `../css/`, `../js/`, `../favicon.svg`, and `../index.html`. The home page uses non-`../` paths.

## Run locally

No build. Open `index.html` directly in a browser, or serve the folder statically, e.g.:

```
python -m http.server 8000
```

then visit http://localhost:8000/ (using a server avoids any `file://` clipboard/CORS quirks).

## Deploy

> ⚠️ **Verify the exact mechanism** in Vercel Dashboard → project `tax-id-generators` → **Settings → Git**. If the GitHub repo is connected there, deploys are automatic on push (option A). If not, use the manual CLI (option B). Update this section once confirmed.

**A. Auto-deploy from GitHub (standard, assumed default):** commit and push to `main` — Vercel builds and deploys automatically.

```
git add -A && git commit -m "..." && git push origin main
```

**B. Manual CLI deploy:** the project is linked locally (`.vercel/` folder, gitignored). Requires being logged in (`vercel login`):

```
vercel --prod
```

The CLI token can expire — if you see "The specified token is not valid", run `vercel login` first.

## Gotchas

- `.vercel/` is gitignored and machine-local — don't commit it.
- The CURP/RFC homoclave and CURP's trailing 2 digits are randomized, so the same person input yields different valid-looking codes each run — expected for test data.
- Keep flag-icons CDN version pinned (currently `7.2.3`) consistent across pages.
