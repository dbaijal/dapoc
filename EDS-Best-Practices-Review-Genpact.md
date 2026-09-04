# EDS Best-Practices Review — Genpact-EDS

**Repository:** `Genpact-Martech-Web/Genpact-EDS`
**Branch reviewed:** `develop`
**Project type:** AEM Edge Delivery Services — **Crosswalk (Universal Editor authoring, repoless)**
**Review date:** 2026-09-02
**Reviewer:** AEM assistant (automated best-practices review)

---

## 1. Scope & Method

This review assesses the codebase against Adobe EDS / Crosswalk best practices across five dimensions:

1. **Authoring & content-model layer** — Universal Editor field models (the core for a repoless Crosswalk project)
2. **Crosswalk structural correctness** — block model JSON, definitions, filters, field hinting
3. **Block implementation** — decoration JS/CSS conventions
4. **Code quality, security & performance**
5. **Governance & upstream hygiene**

**Important framing note (Crosswalk):** In Universal Editor / Crosswalk, block *variants* are expressed as **`select`/`multiselect` fields that map to CSS classes** (typically via the `classes_*` prefix group). Style dropdowns are therefore the **correct, intended pattern** — not a "configuration anti-pattern." Findings below reflect this; style dropdowns are treated as legitimate, and only genuine issues (redundancy, inconsistency, accessibility) are flagged.

Because this is a **repoless** project, content-source config files (`fstab.yaml`, `helix-query.yaml`, `helix-sitemap.yaml`, sidekick config) are expected to be **absent from the repo** (mounted/configured in AEM Cloud). Their absence is **not** a finding.

---

## 2. Executive Summary

**Overall: a well-built, disciplined Crosswalk project.** The code is clearly hand-crafted by developers who understand EDS conventions. Lint passes cleanly, the EDS core is untouched, models are consistently structured, accessibility discipline is above average, and the model→artifact build pipeline is correctly wired.

Findings are **refinements, not fundamental defects.** No critical/blocking issues were found.

| Severity | Count | Themes |
|---|---|---|
| 🔴 High | 0 | — |
| 🟠 Medium | 4 | Missing UE instrumentation on rebuilt blocks; margin (padding) compounding; `rootPath` inconsistency; no automated tests |
| 🟡 Low | 5 | Free heading-level choice; manual alt-text vs DAM metadata; `gp-hero-overlay` field density; branch sprawl; stale package identity |
| ✅ Strengths | 8 | See §3 |

---

## 3. Strengths (Confirmed)

| # | Strength | Evidence |
|---|---|---|
| S1 | **Lint gate is green** — ESLint (airbnb-base) + Stylelint pass with zero errors | `npm run lint` clean |
| S2 | **EDS core untouched** — `scripts/aem.js` is byte-identical to upstream boilerplate; customizations isolated to `scripts/scripts.js` + blocks | `git diff upstream/main -- scripts/aem.js` empty |
| S3 | **Automated dependency monitoring** — Renovate configured (auto-merge devDeps, ESLint pinned to v8) + Dependabot branches active | `.renovaterc.json`; remote branches |
| S4 | **Model→artifact pipeline correct** — per-block `_*.json` partials merged into root `component-*.json` via build step, enforced by Husky pre-commit; committed artifacts in sync | `.husky/pre-commit.mjs`, `package.json` scripts; rebuild produced no diff |
| S5 | **All blocks correctly registered** — every block has matching definition + model + filter; no orphans/gaps | `component-definition.json` / `component-filters.json` cross-check |
| S6 | **Strong accessibility discipline** — aria-labels, alt fields, "opens in new tab" SR spans, `rel="noopener noreferrer"` on `_blank`, dedicated Accessibility tabs | `gp-button.js`, `gp-title.js`, `gp-hero-overlay.js`, `gp-card-overlay.js` |
| S7 | **Conditional fields** — `gp-card-overlay` uses JSON-logic `condition` to reveal carousel-only options only when relevant | `blocks/gp-card-overlay/_gp-card-overlay.json` |
| S8 | **Performance-aware decoration** — LCP-scoped eager loading; `createOptimizedPicture` for responsive images; CLS-prevention via width/height copy in quote-teaser | `scripts/scripts.js` (loadEager); `gp-quote-teaser.js` |

---

## 4. Findings & Recommendations

### 🟠 M1 — Rebuilt blocks drop Universal Editor instrumentation

**Best practice:** In Crosswalk, when decoration code rebuilds a block's DOM, it must carry over `data-aue-*` / `data-richtext-*` attributes using `moveInstrumentation()` (exported from `scripts/scripts.js`) so authors can still select/edit the element in Universal Editor.

**Observation:** Only 4 of the DOM-rebuilding blocks call `moveInstrumentation`:
- ✅ Uses it: `cards.js`, `partner-logo-grid.js`, `gp-card-overlay.js`, `gp-hero-overlay.js`
- ⚠️ Rebuilds DOM **without** it: `gp-title.js`, `gp-button.js`, `gp-image.js`, `gp-text.js`, `gp-quote-teaser.js`, `gp-logo.js`

For single-instance blocks whose fields map to the block root this is often tolerable (the block wrapper keeps its own resource), but where inner elements are recreated, in-context editing/selection of those elements can be lost.

**Impact:** Authors may lose click-to-edit affordance on rebuilt inner elements in Universal Editor.

**Files:**
- `blocks/gp-title/gp-title.js` (rebuilds heading + container, `block.textContent=''`)
- `blocks/gp-button/gp-button.js` (`block.replaceChildren(innerWrapper)`)
- `blocks/gp-image/gp-image.js` (`block.replaceChildren(container)`)
- `blocks/gp-text/gp-text.js` (`block.replaceChildren(richTextContainer)`)
- `blocks/gp-quote-teaser/gp-quote-teaser.js` (`block.replaceChildren(figure)`)
- `blocks/gp-logo/gp-logo.js` (`cols.forEach(col => col.remove())`)

**Recommendation:** Audit each rebuilt block in the Universal Editor. Where inner fields are individually authorable, call `moveInstrumentation(sourceCell, newElement)` when constructing the replacement element (as `gp-card-overlay.js` already does correctly).

---

### 🟠 M2 — Block-level spacing can compound with section-level spacing

**Best practice:** Own vertical spacing at one level to avoid unpredictable stacking. Adobe's section model already provides spacing controls.

**Observation:** The **section** model exposes `styleMarginTop` / `styleMarginBottom`, and several blocks *also* expose their own `classes_marginTop` / `classes_marginBottom`. Both resolve to the **same** utility classes (`mt-*` / `mb-*`). Those utilities apply **`padding`** (not margin), so they do **not** collapse — a section with `mt-l` and a child block with `mt-l` will **add together**.

**Impact:** Inconsistent/doubled vertical rhythm that authors can't easily diagnose; the same 8-option list is duplicated across ~6 models (maintenance cost).

**Files:**
- Section: `models/_section.json` (`styleMarginTop`/`styleMarginBottom`)
- Block-level duplicates: `blocks/gp-button/_gp-button.json`, `blocks/gp-text/_gp-text.json`, `blocks/gp-title/_gp-title.json`, `blocks/gp-quote-teaser/_gp-quote-teaser.json`, `blocks/gp-hero-overlay/_gp-hero-overlay.json`
- Utility definitions (padding, not margin): `styles/styles.css:726-791`

**Recommendation:** Prefer section-level spacing as the single source of truth; remove per-block margin selects where the section control suffices. If block-level spacing must stay, rename utilities to reflect they are padding and document that section + block spacing add up. Confirm intended behaviour with the design team.

---

### 🟠 M3 — Inconsistent link-picker root scoping (`rootPath`)

**Best practice:** `aem-content` link fields should offer authors a consistent browse root across blocks.

**Observation:** `rootPath: "/content/genpact"` is set on some link fields but not others.
- ✅ Scoped: `gp-title` (`_gp-title.json:73`), `partner-logo` (`_partner-logo-grid.json:61`)
- ⚠️ Not scoped: `gp-button`, `gp-image`, `gp-logo`, `gp-fragment`, `gp-hero-overlay` (both hero + caption links), `gp-card-overlay-item`

**Impact:** Authors get a different link-picker starting point depending on the block — inconsistent UX, easier to link to wrong roots.

**Recommendation:** Standardize — add the same `rootPath` to all `aem-content` fields (or deliberately none). Consider centralizing the value so it's maintained in one place.

---

### 🟠 M4 — No automated tests

**Best practice:** EDS projects should maintain at least unit tests for utility logic and a performance/PSI budget gate in CI.

**Observation:** No test files anywhere in the repo (`*.test.js` / `*.spec.js` / `*.cy.js` — none found), despite ~1,300 lines of custom block JS, some complex (`gp-card-overlay.js` 335 lines with carousel/scroll math; `gp-hero-overlay.js` 212 lines). CI (`.github/workflows/main.yaml`) runs lint only.

**Impact:** Regressions in carousel logic, link/target parsing, or breadcrumb building can ship undetected.

**Recommendation:** Add unit tests for pure logic (e.g. carousel index/snap math, target/aria parsing) and a Lighthouse/PSI budget check to CI. See the `testing-blocks` guidance for the recommended EDS setup.

---

### 🟡 L1 — Authors can freely choose heading level (h1–h6)

**Observation:** `gp-title` (`titleType`) and `gp-hero-overlay` (`hero_titleType`) let authors pick any heading level h1–h6.
**Impact:** Risk of multiple H1s or skipped levels → broken heading hierarchy / accessibility.
**Files:** `blocks/gp-title/_gp-title.json`, `blocks/gp-hero-overlay/_gp-hero-overlay.json`
**Recommendation:** Constrain the options (e.g. h2–h4) or derive level from page context; document guidance for authors.

---

### 🟡 L2 — Manual alt-text fields alongside asset pickers

**Observation:** Most image blocks require a separate free-text alt field next to the `reference` asset picker (`gp-image`, `hero`, `gp-card-overlay-item`, `gp-hero-overlay`, `partner-logo`, `gp-logo`, `gp-quote-teaser`).
**Impact:** DAM assets already carry alt/description metadata; re-typing is redundant input and can drift.
**Recommendation:** Decide deliberately — contextual alt is a valid reason to keep the field, but consider defaulting from DAM metadata where possible.

---

### 🟡 L3 — `gp-hero-overlay` is very field-heavy (~20 fields)

**Observation:** One block mixes hero content, an overlay/caption, a button-style system, and layout modifiers across 3 tabs.
**Impact:** Cognitive load for authors; positional paragraph parsing in the JS (`rightParagraphs[3]`, `[4]`) is fragile.
**File:** `blocks/gp-hero-overlay/_gp-hero-overlay.json`, `blocks/gp-hero-overlay/gp-hero-overlay.js`
**Recommendation:** Consider splitting the overlay caption into a nested collection item, or splitting into two blocks. At minimum, harden the positional paragraph parsing.

---

### 🟡 L4 — Branch sprawl (governance)

**Observation:** ~38 remote branches, many stale `feature-*` / `bugfix-*`.
**Recommendation:** Adopt a branch lifecycle policy (delete on merge); enable auto-delete of merged branches; enforce branch protection on `main`/`develop`.

---

### 🟡 L5 — Stale package identity

**Observation:** `package.json` still identifies as `@adobe/aem-boilerplate` with Adobe's `repository`/`homepage`/`bugs` URLs. CI step labelled "Use Node.js 20" actually sets `node-version: 24`.
**Files:** `package.json`, `.github/workflows/main.yaml`
**Recommendation:** Update project identity; align Node version label/config/README (`README.md` says "nodejs 20 or newer").

---

## 5. Security Review

| Area | Assessment |
|---|---|
| **CSP** | ✅ Present in `head.html` (`script-src 'nonce-aem' 'strict-dynamic' …; object-src 'none'`). Good baseline. |
| **Editor content injection** | ✅ **Correctly sanitized** — `scripts/editor-support.js:31-34` loads DOMPurify and sanitizes authored content before DOM insertion. |
| **`gp-fragment.js` innerHTML** | 🟡 `main.innerHTML = await resp.text()` (`blocks/gp-fragment/gp-fragment.js:28`) is **not** DOMPurify-sanitized. Mitigated by same-origin guard (`path.startsWith('/') && !path.startsWith('//')`), so risk is low, but inconsistent with the editor path. Recommend sanitizing for defense-in-depth. |
| **`header.js` innerHTML** | ✅ Static string literal (`blocks/header/header.js:157`) — no injection risk. |
| **`gp-breadcrumb.js` regex HTML parse** | 🟡 Fetches internal pages and regex-extracts `og:title`/`<title>` (`blocks/gp-breadcrumb/gp-breadcrumb.js:3-9`). Values are set via `textContent` (safe from XSS), but regex HTML parsing is fragile — a `DOMParser` approach would be more robust. Low priority. |
| **External links** | ✅ `rel="noopener noreferrer"` consistently applied to `target="_blank"` across all blocks. |

**Net:** No high-severity security issues. One defense-in-depth improvement (sanitize fragment HTML).

---

## 6. Governance & Upstream Maintenance (Crosswalk)

Confirmed already in place:
- ✅ Renovate + Dependabot (dependency monitoring — partly automated, not fully manual)
- ✅ EDS core untouched (safe upstream upgrades)
- ✅ Husky pre-commit rebuilds merged JSON artifacts

Recommended additions:
- Add `upstream` remote to `adobe-rnd/aem-boilerplate-xwalk`; review its releases on a monthly cadence and adopt selectively (pull-based, value-driven — not "always latest").
- Branch protection + CODEOWNERS on `component-*.json`, `models/`, `scripts/` (UE authoring contract + core).
- Document intentional deviations from boilerplate in an `UPSTREAM.md`.

---

## 7. Prioritized Action List

| Priority | Action | Refs |
|---|---|---|
| 🟠 M1 | Add `moveInstrumentation` to rebuilt blocks where inner fields are authorable | `gp-title.js`, `gp-button.js`, `gp-image.js`, `gp-text.js`, `gp-quote-teaser.js`, `gp-logo.js` |
| 🟠 M2 | Consolidate spacing at section level; resolve padding compounding | `models/_section.json`, block margin selects, `styles/styles.css:726-791` |
| 🟠 M3 | Standardize `aem-content` `rootPath` across all link fields | all block models with `aem-content` |
| 🟠 M4 | Add unit tests + PSI budget gate to CI | `.github/workflows/main.yaml` |
| 🟡 L1 | Constrain heading-level options | `_gp-title.json`, `_gp-hero-overlay.json` |
| 🟡 L2 | Reconsider manual alt vs DAM metadata | image blocks |
| 🟡 L3 | Simplify / harden `gp-hero-overlay` | `_gp-hero-overlay.json`, `gp-hero-overlay.js` |
| 🟡 L4 | Branch lifecycle policy + protection | repo settings |
| 🟡 L5 | Fix package identity + Node version labels | `package.json`, `main.yaml`, `README.md` |
| 🟡 Sec | Sanitize fragment HTML (defense-in-depth) | `gp-fragment.js:28` |

---

## 8. What Was Checked (Traceability)

| Check | Method | Result |
|---|---|---|
| Lint (JS+CSS) | `npm run lint` | ✅ pass |
| Model JSON validity | `JSON.parse` all `_*.json` | ✅ 23/23 valid |
| Merged artifact sync | `npm run build:json` + `git diff` | ✅ in sync |
| Block registration completeness | definition/filter cross-check | ✅ complete |
| UE instrumentation | `grep moveInstrumentation` vs DOM-rebuild | ⚠️ M1 |
| Content model review | `content-modeling` best practices | ✅ + findings |
| Upstream drift | `git diff upstream/main` | ✅ core clean |
| Security | CSP, innerHTML, fetch paths, rel attrs | ✅ + 1 DiD item |
| Governance | Renovate/Dependabot, branches, CI | ✅ + L4/L5 |

**Blocks reviewed (17):** cards, columns, footer, gp-breadcrumb, gp-button, gp-card-overlay, gp-fragment, gp-hero-overlay, gp-image, gp-logo, gp-quote-teaser, gp-separator, gp-text, gp-title, header, hero, partner-logo-grid.

---

*End of report.*
