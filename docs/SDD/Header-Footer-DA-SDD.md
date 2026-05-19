# Header and Footer — Solution Design

**Document Version:** 2.0 (DA)
**Status:** Draft
**Date:** 2026-05-19
**Author:** Adobe Delivery Team

---

## Table of Contents

1. [Summary](#1-summary)
2. [Current State Architecture](#2-current-state-architecture)
3. [EDS Integration — Recommended Approach](#3-eds-integration--recommended-approach)
4. [Recommendation — Lighter Header for EDS](#4-recommendation--lighter-header-for-eds)
5. [TFS Separation Plan — Confirmed in Discovery](#5-tfs-separation-plan--confirmed-in-discovery)
6. [Cache Strategy](#6-cache-strategy)
7. [Assumptions](#7-assumptions)
8. [Ownership and Boundaries](#8-ownership-and-boundaries)
9. [Open Questions](#9-open-questions)

---

## 1. Summary

### Our Approach

**EDS will use an Edge Worker to integrate the TFS header/footer microservice.** The Edge Worker fetches the header and footer HTML from the existing TFS microservice endpoints and stitches them into the EDS page response — the same architectural pattern as the current Apache SSI approach. No authoring of header/footer content is required in EDS.

### Adobe Recommendation

**Adobe recommends that the TFS header/footer microservice provides a lightweight response to EDS — containing only what is needed for header/footer functionality.** Analytics (Adobe Launch), consent management (TrustArc), and fonts should NOT be part of the header response consumed by EDS.

This recommendation is critical to achieving target Lighthouse performance scores. The current header response (~500KB) bundles analytics, consent, and fonts alongside the actual header functionality — causing unnecessary page weight, Total Blocking Time, and degraded Core Web Vitals on every page.

**TFS confirmed in discovery sessions that they are actively working to separate Adobe Launch, TrustArc, and fonts from the header into independent includes.** This separation directly enables EDS to achieve its performance targets.

### Key Facts

- **Integration:** Edge Worker injects header/footer — no client-side fetch, no CLS.
- **Header UX and Styling:** Owned entirely by TFS. Header CSS and JS come from the microservice. No UX styling is done in EDS for header/footer.
- **Offers in header:** Target/AEP delivers offers into the header promo bar container. `offers.min.js` (included by the header) handles this.
- **Content management:** Header/footer content (navigation links, menus, footer links) is managed as JSON metadata files in the TFS microservice repo — not authored in EDS.
- **Analytics/Consent/Fonts:** Must be loaded separately from the header in EDS, following EDS best practices (delayed phase loading).

---

## 2. Current State Architecture

### 2.1 How It Works Today

The current AEM production architecture uses Apache SSI (Server-Side Includes) to inject the header and footer into every page.

```
Apache receives page request
  ↓
SSI directive in page template triggers
  ↓
Apache fetches header/footer HTML from microservice endpoint
  ↓
Microservice responds with fully rendered HTML (including CSS, JS, data)
  ↓
Apache stitches header + page content + footer into final response
  ↓
Browser receives complete page
```

### 2.2 Microservice Endpoints

| Endpoint | URL Pattern | Used By |
|---|---|---|
| Public (header) | `https://www.thermofisher.com/global-header-footer/header/nojquery` | Apache SSI (production) |
| Public (footer) | `https://www.thermofisher.com/global-header-footer/footer/nojquery` | Apache SSI (production) |
| Internal | `{gateway}/tf/header/{userType}/{lang}/{country}/noTrustArc.nojquery.shtml` | Author/Preview only |

### 2.3 Current Response Composition (~500KB Total)

| Component | Approximate Size | Needed for EDS? |
|---|---|---|
| Inline CSS (header/footer styling) | ~200KB | Yes — centralized UX styling |
| HTML (navigation, menus, footer) | ~50KB | Yes — the actual header/footer content |
| Inline JS (search, cart, locale, auth) | ~150KB | Yes — functional JS for header features |
| Country data | ~100KB | Yes — used for locale dropdown |
| Adobe Launch / Analytics | External load | **No — should be loaded separately in EDS** |
| TrustArc / Consent | ~50KB | **No — should be loaded separately in EDS** |

**Current full load time: ~750-800ms.** With analytics and TrustArc excluded: **<500ms.**

### 2.4 What Is Currently Encapsulated in the Header

| Feature | Encapsulated? | Should remain in header for EDS? |
|---|---|---|
| Navigation HTML + CSS | Yes | Yes — this IS the header |
| Search | Yes | Yes — core header functionality |
| Sign-in / Auth | Yes | Yes — core header functionality |
| Cart | Yes | Yes — core header functionality |
| Offers promo bar container | Yes | Yes — header provides the container |
| `offers.min.js` | Yes | Yes — populates offers from Target/AEP |
| Adobe Launch / Analytics | Yes | **No — recommend separate loading** |
| TrustArc / Consent | Yes | **No — recommend separate loading** |
| Fonts | Yes | **No — recommend separate loading** |

### 2.5 Optional Selectors

The microservice supports selectors to customize the response:

| Selector | Effect |
|---|---|
| `nojquery` | Excludes jQuery (avoids version conflicts) |
| `noTrustArc` | Excludes TrustArc consent management |
| `nosearch` | Excludes search bar |
| `nocart` | Excludes cart functionality |

Appended to URL path (dot-separated): `/header/nojquery.noTrustArc`

### 2.6 Content Architecture

- **3 JSON metadata files per locale:** header, footer, hamburger menu
- **~36-39 locale versions** (matching regional nodes)
- Microservice (Node.js / EJS) reads JSON, decorates into HTML, includes CSS/JS references
- Content managed directly in the microservice repo — no author UI

### 2.7 Locale Adaptation

Header adapts to locale based on browser cookies — all handled client-side by header's inline JS:

| Cookie | Purpose |
|---|---|
| `CK_ISO_CODE` | Country code (e.g. US, JP, IN) |
| `CK_LANG_CODE` | Language code (e.g. en, ja) |
| `identity_uid` | User type identification |

---

## 3. EDS Integration — Edge Worker Approach

### 3.1 How It Works

EDS will use an **Edge Worker** to inject the header and footer into every page — mirroring the current Apache SSI pattern. The Edge Worker acts as the server-side renderer, fetching the header/footer from the TFS microservice and stitching it into the EDS page before the response reaches the browser.

```
Browser requests page from EDS CDN
  ↓
Edge Worker intercepts response:
  1. Fetch EDS page HTML (from CDN cache or origin)
  2. Fetch header HTML from TFS microservice (from edge cache)
  3. Fetch footer HTML from TFS microservice (from edge cache)
  4. Stitch: inject header + footer into page HTML
  5. Return complete HTML to browser
  ↓
Browser receives FULL page with header + content + footer
  ↓
Header's inline JS executes:
  - Reads cookies (CK_ISO_CODE, CK_LANG_CODE, identity_uid)
  - Adapts locale, user type, cart state
  - Initializes search, sign-in, offers container
  ↓
Page fully interactive
```

### 3.2 Why Edge Worker

- **Zero CLS** — header is in the HTML before the browser parses it. No content shift.
- **SEO-friendly** — search engines receive the complete page with header/footer in the initial response.
- **Mirrors current architecture** — same pattern as Apache SSI, same endpoints, same behaviour.
- **Minimal latency** — Edge Worker adds ~5-20ms to TTFB. Header/footer cached at edge for subsequent requests.

### 3.3 EDS Loading Phases

| Phase | What loads | Header/Footer |
|---|---|---|
| **Eager** | Above-the-fold content, critical CSS | Header/footer injected via Edge Worker (arrives with page HTML) |
| **Lazy** | Below-the-fold content, images | — |
| **Delayed** | Analytics, consent, non-critical scripts | TrustArc, Adobe Launch loaded separately (not from header) |

**Header CSS and JS are centralized** — they come from the microservice. EDS does not apply any UX styling to the header/footer. The header team owns the look, feel, and behaviour.

### 3.4 Language Switch Behaviour in EDS

**Current state (AEM):** The language/locale change in the footer invokes an AEM servlet (`/apps/setlocation?countryCode=jp&langCode=ja`) which updates cookies and response headers, then redirects.

**EDS approach:** The AEM servlet does not exist in EDS. The language switch will be handled **entirely client-side**.

**How it works in EDS:**

1. The header/footer microservice continues to render the language dropdown as-is — no change to the dropdown UI
2. The GO button action invokes a **client-side JavaScript function** (replacing the AEM servlet call)
3. When the user selects a locale and clicks GO, client-side JavaScript:
   - Sets cookies `CK_LANG_CODE` and `CK_ISO_CODE` to the new locale values
   - Constructs the target URL by swapping the locale prefix in the current page path (e.g. `/us/en/home/products` → `/jp/ja/home/products`)
   - Navigates directly to the new URL
4. On the next page load, the Edge Worker fetches header/footer from the microservice — the header's inline JS reads the updated cookies and adapts the display to the new locale automatically

**Fallback:** If the target page does not exist in the selected locale, a CDN-level redirect rule will redirect the user to the target locale's homepage as a fallback. This prevents 404 errors when a page has not been translated.

**What changes:**

| Concern | AEM (current) | EDS |
|---|---|---|
| Language switch trigger | AEM servlet (`/apps/setlocation`) | Client-side JavaScript |
| Cookie update | Servlet sets cookies in response | JS sets cookies directly in browser |
| URL construction | Servlet rebuilds URL | JS swaps locale prefix in path |
| Redirect | Servlet redirects | JS navigates directly |
| Fallback for missing pages | N/A (AEM has all pages) | CDN-level redirect to locale homepage |
| Header adaptation on new page | Header JS reads cookies | Same — header JS reads cookies (no change) |

---

## 4. Adobe Recommendation — Lighter Header and Footer for EDS

### 4.1 Problem

The current header response is **~500KB** and includes Adobe Launch (analytics), TrustArc (consent management), Alloy JS prehiding, and fonts alongside the actual header functionality. This directly impacts EDS page performance:

- **Total Blocking Time (TBT)** — ~150KB of inline JS (including analytics and consent scripts) executes on page load, blocking the main thread
- **Page weight** — ~500KB added to every page before any page content loads
- **Lighthouse score** — heavy bundled scripts degrade performance metrics significantly (estimated 10-20 point reduction)
- **No loading control** — EDS cannot control when analytics/consent load because they're bundled in the header; EDS best practice is to load these in the delayed phase

### 4.2 Adobe Recommendation

**The TFS header/footer microservice must provide a lightweight response to EDS that contains only header/footer functional HTML, CSS, and JS.** Adobe Launch, TrustArc, Alloy prehiding, and fonts must NOT be included in the header response consumed by EDS pages.

EDS will load analytics, consent, and fonts separately — in the appropriate loading phase — following EDS performance best practices. This separation is a prerequisite for achieving target Lighthouse scores.

**What EDS needs from the header:**

| Include | Reason |
|---|---|
| Navigation HTML | Core header content |
| Header/footer CSS | Centralized UX styling — no EDS-side styling needed |
| Header JS (search, cart, sign-in, locale) | Core functional JavaScript |
| Offers container + offers.min.js | Offers promo bar functionality |
| Country data | Locale dropdown support |

**What should NOT be in the header for EDS:**

| Exclude | Reason | How EDS handles it |
|---|---|---|
| Adobe Launch / Analytics | Should load in **delayed** phase for performance | EDS loads separately via `delayed.js` |
| TrustArc / Consent | Should load in **delayed** phase — not blocking render | EDS loads separately via `delayed.js` |
| Fonts | Should be loaded as early as possible via `<link preload>` — not tied to header fetch | EDS loads via `head.html` or global includes |
| jQuery | EDS has no jQuery dependency | Already excluded via `nojquery` selector |

### 4.3 Expected Impact

| Metric | With full header (~500KB) | With lighter header (estimated ~300KB) |
|---|---|---|
| Header response size | ~500KB | ~300KB (est. -40%) |
| Load time (first request) | ~750-800ms | <500ms |
| TBT impact | Higher — analytics + consent JS executing | Lower — only header-functional JS |
| Lighthouse impact | Moderate degradation | Minimal — analytics/consent loaded delayed |
| EDS loading control | None — everything bundled | Full — each piece loaded in appropriate phase |

### 4.4 How to Achieve This

The EDS Edge Worker will call the header endpoint with appropriate selectors:

```
/global-header-footer/header/nojquery.noTrustArc.noLaunch
```

Or — once TFS completes their planned separation — the endpoint will naturally return only header HTML without analytics and consent.

---

## 5. TFS Separation Plan — Confirmed in Discovery

During the discovery session, TFS confirmed they are **actively working on separating** the following from the header into independent services. This aligns directly with our recommendation.

### 5.1 What TFS Confirmed

During discovery sessions, the TFS Header/Footer team confirmed the following:

- Analytics (Adobe Launch) is being migrated to a separate repository and will be served independently from the header/footer
- The target architecture will have three separate server-side includes — one for global includes (fonts, CSS), one for analytics, and one for just the header/footer HTML
- The header/footer endpoint will ultimately return only the functional HTML — without bundled analytics, consent, or font loading
- This work is actively in progress and was approaching QA at the time of the discovery session

### 5.2 Planned Separation

| Being separated | New delivery mechanism | Status (as of discovery) | Benefit for EDS |
|---|---|---|---|
| Adobe Launch / Analytics | Separate SSI / independent include | In progress — close to QA | EDS can load analytics in **delayed** phase for better Lighthouse scores |
| TrustArc / Consent | Separate SSI / independent include | In progress — working with privacy team | EDS can control consent loading timing |
| Fonts / Global CSS | "Global includes" SSI | In progress | EDS pages can load fonts via `<link preload>` without depending on header fetch |

### 5.3 Target State After Separation

Once TFS completes the separation, the architecture becomes:

```
┌─────────────────────────────────────────────┐
│  EDS Page (via Edge Worker)                 │
│                                             │
│  Eager:                                     │
│    • Page content (blocks, sections)        │
│    • Header HTML (navigation, search,       │
│      cart, sign-in, offers container)       │
│    • Footer HTML                            │
│    • Fonts (via global includes)            │
│                                             │
│  Delayed:                                   │
│    • Adobe Launch / Analytics (separate)    │
│    • TrustArc / Consent (separate)          │
│    • Non-critical scripts                   │
│                                             │
└─────────────────────────────────────────────┘
```

This gives EDS full control over loading phases while keeping the header lightweight and focused on its core purpose — navigation, search, cart, and sign-in.

### 5.4 Impact Statement

The separation of TrustArc, analytics, and fonts from the header is a **key enabler** for achieving target Lighthouse scores on EDS pages. Without this separation, the ~500KB header with bundled analytics and consent management will impact:

- Total Blocking Time (TBT) — analytics/consent JS blocking main thread
- First Input Delay (FID) — delayed interactivity
- Lighthouse Performance Score — estimated 10-20 point reduction vs target

**We recommend TFS prioritizes this separation to align with the EDS go-live timeline.**

---

## 6. Cache Strategy

EDS page cache and header/footer cache are **independent**. They do not interfere with each other.

| Cache Layer | What's Cached | TTL | Invalidation |
|---|---|---|---|
| EDS CDN (aem.live) | Page HTML only (blocks, sections, content) — WITHOUT header/footer | Push-based invalidation on publish | Standard EDS publish flow |
| Edge Worker cache | Header HTML + Footer HTML — from microservice | 5–15 minutes (or match existing Apache SSI cache of 1 hour) | TTL expiry |

### Key Points

- All personalization (locale, cart state, sign-in) happens **client-side** via header's inline JS reading cookies
- **No per-user edge caching needed** — same generic HTML served to all users, JS personalizes in browser
- EDS page cache works normally — Edge Worker only adds header/footer around the cached page content
- EDS push-based cache invalidation is **not affected** by header injection

---

## 7. Assumptions

| # | Assumption |
|---|---|
| 1 | All locale adaptation, search, cart, auth, and offers are handled by the header's own inline JavaScript — automatically, after the page loads in the browser. |
| 2 | Header looks for cookies `CK_ISO_CODE`, `CK_LANG_CODE`, `identity_uid` to get country, language, and user type — loads header accordingly. |
| 3 | In EDS, all userType personalization is handled client-side by the header's own JS. No server-side locale parameter is needed in the Edge Worker request. |
| 4 | The header/footer microservice endpoints are public — no authentication required. |
| 5 | The header/footer serves all TFS sites and microsites — shared global component. |
| 6 | Header CSS and JS are centralized and owned by the TFS header/footer team. EDS does not apply any custom styling to the header/footer. |
| 7 | The offers promo bar container is provided by the header. `offers.min.js` (included by the header) populates it with personalized content from Target/AEP at runtime. |
| 8 | TFS is actively separating TrustArc, Adobe Launch, and fonts from the header into independent includes. This was confirmed in discovery sessions and is expected soon. |
| 9 | Once separation is complete, EDS will use the lighter header endpoint and load analytics/consent/fonts independently following EDS best practices (delayed phase). |
| 10 | No header/footer content authoring is done in EDS. All content changes go through the TFS header/footer team. |

---

## 8. Ownership and Boundaries

### 8.1 Ownership Matrix

| Area | Owner | What they own |
|---|---|---|
| **Header/Footer HTML** | TFS (Header/Footer Team) | HTML generation via microservice, JSON metadata, all content (navigation links, menus, footer links, language/country data) |
| **Header/Footer UX & Styling** | TFS (Header/Footer Team) | All CSS — centralized. Look, feel, and visual design of the header/footer. No EDS-side styling is applied. |
| **Header/Footer Functionality** | TFS (Header/Footer Team) | Search, sign-in, cart, locale adaptation, language change — all JS logic owned by TFS |
| **Edge Worker & Integration** | Adobe / Implementation Team | Edge Worker development, fetching header/footer from microservice, stitching into EDS page HTML, edge cache management, performance optimization |
| **EDS Page Content** | Adobe / Implementation Team | Blocks, sections, page content — everything between header and footer |
| **Offers in Header (promo bar)** | TFS (Offers/Marketing Team) | Offer content population via offers.min.js and Target/AEP |
| **Adobe Launch / Analytics** | TFS (Analytics Team) | Being separated from header — once separated, EDS loads in delayed phase |
| **TrustArc / Consent** | TFS (Privacy/Consent Team) | Being separated from header — once separated, EDS loads in delayed phase |
| **Fonts / Global CSS** | TFS (Header/Footer Team) | Being separated to "global includes" — once separated, EDS loads independently |
| **Microservice Endpoint Availability** | TFS (Header/Footer Team) | Ensuring public endpoints are available, performant, and cacheable for Edge Worker consumption |
| **Lighthouse / Performance Targets** | Joint (Adobe + TFS) | Adobe optimizes EDS page and Edge Worker. TFS provides lighter header and completes separation of analytics/consent/fonts. |

### 8.2 Integration Boundary

```
┌───────────────────────────────────────────────────────────────┐
│   ADOBE / IMPLEMENTATION TEAM                                 │
│                                                               │
│   Edge Worker                                                 │
│   • Fetches header/footer from public endpoint                │
│   • Uses selectors to get lighter version (nojquery,          │
│     noTrustArc, noLaunch)                                     │
│   • Caches header/footer HTML at edge (separate from page)    │
│   • Stitches into EDS page response                           │
│                                                               │
│   EDS Page (blocks, sections, content)                        │
│   • Delivered from EDS CDN (aem.live)                         │
│   • Cached independently — EDS cache works normally           │
│   • Analytics/consent loaded in delayed phase                 │
│                                                               │
│   No UX styling for header/footer — centralized with TFS     │
└────────────────────────────┬──────────────────────────────────┘
                             │
           PUBLIC ENDPOINT (no auth required)
        GET /global-header-footer/header/nojquery.noTrustArc
        GET /global-header-footer/footer/nojquery
                             │
┌────────────────────────────▼──────────────────────────────────┐
│   TFS — HEADER/FOOTER TEAM                                    │
│                                                               │
│   Header/Footer Microservice (Node.js / EJS)                  │
│   • Reads JSON metadata (3 files per locale × ~39 locales)    │
│   • Generates HTML with inline CSS + JS                       │
│   • Bundles: search, sign-in, cart, offers container          │
│   • Locale adaptation via inline JS (reads cookies)           │
│   • All personalization client-side                           │
│                                                               │
│   Provides lighter version for EDS:                           │
│   • Without analytics (Adobe Launch)                          │
│   • Without consent (TrustArc)                                │
│   • Without fonts (loaded via global includes)                │
│                                                               │
│   Fully self-contained — no EDS-side logic for header         │
│   behavior                                                    │
└───────────────────────────────────────────────────────────────┘
```

### 8.3 Authentication / Security

No authentication is needed for this integration. Edge Worker calls public endpoints — same URLs currently used by Apache SSI. No API key, no mTLS.

---

## 9. Open Questions

| # | Question | Owner | Priority |
|---|---|---|---|
| 1 | Confirm the exact selector combination for EDS — `nojquery.noTrustArc` or are additional selectors available/needed (e.g. `noLaunch`, `noFonts`)? | TFS Header/Footer Team | High |
| 2 | Confirm that Edge Worker only needs the public endpoint (no userType/language/country in URL) — all locale adaptation handled by header's inline JS reading cookies. | TFS Header/Footer Team | High |
| 3 | Timeline for completing the separation of TrustArc, Analytics, and Fonts from the header — does it align with EDS go-live? | TFS Header/Footer Team | High |
| 4 | Once separated — what are the new endpoints/patterns for loading Analytics, TrustArc, and Fonts independently? | TFS Header/Footer Team | Medium |
| 5 | The offers promo bar — does `offers.min.js` require Adobe Launch/Alloy to be loaded first, or can it function independently? | TFS Offers Team | Medium |
| 6 | For language/locale change — confirm that the CDN-level redirect rules for missing locale pages can be configured per locale (redirect to that locale's homepage). | Adobe / Implementation Team | Medium |
| 7 | Is there a plan to reduce the header response size further (e.g. externalizing CSS to a cacheable file, lazy-loading country data)? | TFS Header/Footer Team | Low |
| 8 | Performance validation: once integrated with EDS, joint testing needed to measure actual TBT/LCP/CLS impact and confirm Lighthouse targets are met. | Joint — Adobe + TFS | High (during implementation) |
