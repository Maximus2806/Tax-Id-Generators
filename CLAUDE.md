# QA Toolbox

Static web app that generates **format-valid (but fake) test data** for QA: tax identification numbers, IBANs, crypto addresses, and names/cities/streets of an exact length — e.g. filling deposit forms during international payment testing or boundary-testing form validations. Every ID passes the real check-digit/checksum algorithm, so it looks valid to validators, but does not belong to a real person or account.

- **Site name:** "QA Toolbox" — used in every page's `.site-header` link and as the `<title>` suffix (`<Generator> — QA Toolbox`). Home heading "Test Data Generators". The domain and repo keep the old `tax-id-generators` name.

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
| Crypto     | EVM, BTC, Solana   | `pages/crypto.html` + `js/crypto.js`     |
| Names      | Name, Surname, Full name, City, Street | `pages/names.html` + `js/names.js` |

## Tech stack & conventions

**Plain static site — no build step, no framework, no npm.** There is no `package.json`, no bundler, no transpiler. Just HTML, one shared CSS file, and one vanilla-JS file per generator. Keep it this way unless we deliberately decide otherwise.

- **No ES modules / imports.** Each `js/*.js` defines plain global functions. HTML wires them up with inline `onclick="..."` / `onchange="..."` attributes.
- **No external runtime dependencies.** The only third-party asset is the `flag-icons` CSS loaded from jsDelivr CDN (`<link>` in the `<head>`). Country flags use `<span class="fi fi-XX">`. The IBAN page (🌐) and Crypto page (🪙) use an emoji instead of a flag and do **not** load flag-icons.
- **DOM access** is always `document.getElementById(...)`; results go into `readonly` `<input>` fields.
- **Randomness** uses `Math.random()` throughout (test data, not cryptographic). Exception: `crypto.js` uses `crypto.getRandomValues()` because it works on byte arrays.
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
- **Crypto** — address only, never a private key (QA just needs to pass address validation). `cryptoFormats` table maps each `<select>` value to `generate()` / `validate(address)`; `generateCrypto()` re-validates before display (max 5 attempts). Random bytes stand in for the pubkey hash, then the real encoding is applied:
  - EVM — 20 bytes hex + **EIP-55** checksum via a hand-written **Keccak-256** (Web Crypto has none; it is *not* SHA3-256).
  - BTC (mainnet only) P2PKH/P2SH — **Base58Check** (double SHA-256); P2WPKH — **Bech32**. Testnet addresses and Taproot (`bc1p`, Bech32m) were deliberately removed: our platform's validation rejects them — don't re-add.
  - Solana — real Ed25519 public key from `crypto.subtle.generateKey` (on-curve), Base58; falls back to random 32 bytes if the browser lacks Ed25519.
  - Functions are `async` and need `crypto.subtle` → secure context (https or `localhost`; `file://` may fail).
  - TRON — 20 random bytes, **Base58Check** with version `0x41` (starts with `T`, 34 chars). **For future use — hidden in the UI**: the `<option>` is commented out in `pages/crypto.html`, the logic in `cryptoFormats.tron` stays active. To enable, uncomment the option and update the home card ("ERC20 · Bitcoin · Solana · TRON", "6 formats").

- **Names** — realistic Name / Surname / Full name / City / Street of an **exact length** (1–1000) for boundary testing of validations. Plan: `Specs/names-generator-plan.md`.
  - Built-in ASCII dictionaries indexed by length; when no word of the needed length exists, a letter-level **order-2 Markov chain** (order-1 backoff) trained on the same dictionaries synthesizes one. Words longer than 14 letters are glued from 4–9 letter chunks.
  - A value is a list of words → hyphen-joined parts (`buildValue`). Words are space-joined when Spaces is on, CamelCase-glued otherwise (`JohnSmith`). Long values grow by ~1 word per 8 chars (`TheodoreFlorenceIsabel`); a single-word field (Name/Surname/City) with Hyphens but no Spaces grows hyphen parts instead (`Mary-Jane-Anna-Rose`). Spaces / Hyphens / Apostrophes mean the symbol is **required**, not just allowed; min length is `1 + 2 × flags` (`minLength`). Apostrophes use real positions only: prefix `O'`/`D'`/`L'` or possessive `'s`, ASCII `'` only.
  - **Any characters** ticks and locks the other three, makes them optional, and swaps 30–60% of letters for Unicode letters (diacritics, Cyrillic, Greek, CJK). Only precomposed BMP characters, so `value.length` equals the visible length.
  - `validateValue` re-checks every value before display (max 5 attempts). Run `selfTestNames()` in the page console after changes — it must return `true`.
  - One page with a shared Generate button; the page is not generated on load (copy icons appear after Generate). Uses the shared multi-field CSS classes (`.card-wide`, `.card-subtitle`, `.field-row`, `.field-options`, `.field-output`, `.icon-btn`, `.field-error`) — reuse them for future multi-field generators.

## Design / theme

Dark theme defined entirely in `css/style.css` (single shared stylesheet). Key tokens:
- Background `#0f1117`, cards `#1c1f2e`, borders `#2e3249`
- Text `#e8eaf0`, muted `#9095a8`
- Accent teal `#62CBC1`; primary buttons use gradient `#82DAD2 → #44ACA3`

Two page layouts: `.page-home` (cards grid) and `.page-generator` (centered `.card` form). `.site-header` is sticky (stays on top while scrolling) on every page. Home card text (`.country`) must fit one line at the ~200px card width (≈24 chars), otherwise the whole row grows taller. New generator pages should reuse `.page-generator` + `.card` + the shared form/button classes — don't introduce per-page CSS.

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

**Manual CLI deploy — confirmed mechanism (2026-06-27).** There is **no** GitHub auto-deploy: pushing or merging to `main` does **not** update production. Vercel deploys from your **local working copy** via the CLI, so always sync `main` first or you'll ship stale code.

```
git checkout main && git pull        # get the merged code locally
vercel --prod                        # deploy local files to production
```

The project is linked locally via the gitignored `.vercel/` folder, so `vercel --prod` targets project `tax-id-generators` and auto-aliases to https://tax-id-generators.vercel.app/. The CLI token expires periodically — if you see "The specified token is not valid", the user must run `vercel login` first (interactive; suggest `! vercel login` in-session).

To verify a deploy, fetch a page and check for the expected content/headers, e.g. `curl -sI https://tax-id-generators.vercel.app/` (look at `Last-Modified`).

## Gotchas

- `.vercel/` is gitignored and machine-local — don't commit it.
- The CURP/RFC homoclave and CURP's trailing 2 digits are randomized, so the same person input yields different valid-looking codes each run — expected for test data.
- Keep flag-icons CDN version pinned (currently `7.2.3`) consistent across pages.
