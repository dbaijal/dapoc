# Content Syndication — Integration with PDP — AEM as Authoring Source (Crosswalk)

**Document Version:** 1.0
**Status:** Draft
**Date:** 2026-06-12
**Author:** Adobe Delivery Team
**Authoring Source:** AEM (Universal Editor / Crosswalk) + Edge Delivery Services

---

## 1. Existing Use Case

### What Are Content Snippet Pods?

Thermo Fisher's Product Family Pages (PFP) and Product Detail Pages (PDP) in the commerce/PDP system embed **content pods** — targeted HTML fragments authored and managed in AEM, delivered into non-AEM commerce pages at runtime.

A single product (identified by a SKU) can have **multiple pods**, each representing a distinct section of content shown on the product page. For example, SKU `CHROMELEON7` has pod-1, pod-2, and pod-3.

**Sample live URLs (current system):**

- `https://www.thermofisher.com/in/en/product-family-syndicated-content.pfpsnippet.html/sku/CHROMELEON7/1`
- `https://www.thermofisher.com/in/en/product-family-syndicated-content.pfpsnippet.html/sku/CHROMELEON7/2`
- `https://www.thermofisher.com/in/en/product-family-syndicated-content.pfpsnippet.html/sku/CHROMELEON7/3`

---

## 2. Current Flow (AEM On-Prem)

### 2.1 URL Anatomy

The current syndication URL is composed of the following parts:

| URL Part | Value (example) | Purpose |
|---|---|---|
| Country/language | `/in/en/` | Locale for content resolution (Country = India, Language = English) |
| AEM page node | `product-family-syndicated-content` | Entry point — acts as the servlet trigger only |
| Selector | `.pfpsnippet` | Sling selector — triggers the syndication servlet |
| Extension | `.html` | Standard AEM HTML extension |
| Suffix | `/sku/CHROMELEON7/3` | type = sku, value = CHROMELEON7, pod = 3 |

### 2.2 Component Architecture in AEM

**Content Snippet Template** (`lifetech/templates/content_snippet`)
- Specialized AEM page template for fragment pages.
- Page component renders via `content-snippet.jsp`.
- On publish, outputs raw HTML with no page shell.
- Uses a custom paragraph system, `SnippetParsys`.

**SnippetParsys** (`lifetech/components/snippetparsys`)
- Custom AEM paragraph system (container).
- Supports column layouts (START / BREAK / END).
- Strips decoration tags on publish for clean HTML output.
- Allowed components: text, text-image, heading, Brightcove video, raw HTML, interactive containers.

**Tag Taxonomy**
- Namespace: `pfp:` (Product Family Page).
- Tag format: `pfp:sku/{SKU-VALUE}/pod_{POD-ID}` (for example, `pfp:sku/CHROMELEON7/pod_3`).
- Authors tag each Content Snippet page with the appropriate tag to register it for a SKU + pod combination.

### 2.3 Servlet — ProductFamilySyndicationServlet

A Java OSGi servlet registered against the `pfpsnippet` selector for HTML GET requests on any resource. It performs the server-side syndication logic.

### 2.4 End-to-End Request Flow (Current)

1. The commerce/PDP system issues an HTTP GET to the syndication URL.
2. AEM Publish resolves the resource and the `pfpsnippet` selector routes the request to the syndication servlet.
3. The servlet parses the URL suffix into type, value (SKU), and pod number.
4. It builds the CQ tag ID (for example, `pfp:sku/CHROMELEON7/pod_3`).
5. It resolves the locale to a JCR base path via the MSM mapping configuration.
6. It performs a tag-based JCR lookup to find the first node tagged with that tag.
7. It clears locale cookies.
8. It forwards the request to the tagged Content Snippet page, which renders via `content-snippet.jsp` and the snippet paragraph system.
9. A raw HTML fragment (no page shell, no CSS, no JS) is returned to the commerce system.

---

## 3. Proposed EDS Architecture — AEM as Authoring Source

### 3.1 Core Principles

The migration replaces the entire AEM On-Prem server-side syndication stack with three elements:

1. **AEM Sites authored in Universal Editor (Crosswalk)** — authors create and manage fragment content in AEM. Content is stored in AEM and published through the Edge Delivery pipeline. This replaces the AEM On-Prem Content Snippet template and Sites editor.
2. **EDS blocks** — define the rendering and styling of content components, replacing the JSP components and the snippet paragraph system.
3. **`aem-embed.js`** — a Web Component that fetches and renders the published fragment inside the commerce page, replacing the Java servlet and `content-snippet.jsp` pipeline.

**Important distinction:** The syndication and delivery mechanism (the Web Component, the published fragment, Shadow DOM isolation, EDS blocks, the URL convention, and the commerce-side integration) operates at the **Edge Delivery layer**. It is independent of how the content is authored — the delivered fragment output is the same block markup regardless of the editing experience. **The authoring and content-management layer is AEM Sites edited in Universal Editor**, with locale variants managed by AEM MSM.

### 3.2 The aem-embed Web Component

Adobe provides an open-source Web Component designed for this pattern.

- Repository: `github.com/adobe/aem-embed`
- Documentation: `aem.live/docs/aem-embed`

`aem-embed.js` is a standards-based custom element (`<aem-embed>`) that:

1. Reads the `url` attribute.
2. Automatically appends `.plain.html` to fetch the published EDS fragment.
3. Creates an isolated Shadow DOM, preventing CSS and JS conflicts with the commerce page.
4. Loads the EDS global styles into the Shadow DOM.
5. Runs the EDS decoration pipeline to convert the delivered markup into block structure.
6. For every block in the fragment, loads that block's dedicated CSS and JS into the Shadow DOM.
7. Renders fully styled, fully functional content, isolated from the commerce page.

### 3.3 How the Commerce System Uses It

- **One-time setup:** the commerce/PDP page template includes the `aem-embed.js` script once in the page head.
- **Per pod:** the commerce system places an `<aem-embed>` tag where each pod should appear, with its `url` attribute pointing to the published fragment for that locale, SKU, and pod.

The commerce system constructs the URL from data it already owns: locale, SKU, and pod number. No server-side lookup is involved.

### 3.4 Authoring in AEM (Universal Editor)

Authors work in **AEM Sites using Universal Editor**. For each pod, a fragment page is created in the AEM content tree at the location that maps to the published delivery URL.

- Content is authored using **structured component dialogs** in Universal Editor (rich text, images, video, headings).
- The set of components available on a fragment page is governed by the block/component model and component filters defined by the development team.
- On publish, the page is delivered by Edge Delivery and made available at its clean URL with the `.plain.html` representation that the Web Component consumes.

The blocks used inside a fragment (text, text-image, video, heading, and so on) are standard EDS blocks. The author selects and fills them through the Universal Editor authoring experience; the delivered output is the same block markup the Web Component renders.

### 3.5 URL / Path Convention

The published delivery URL follows a single convention:

`/{locale}/snippets/sku/{SKU-VALUE}/pod-{POD-NUMBER}`

The author creates the fragment page in AEM at the content location that maps to this delivery path. The **path is the identifier** — there is no separate tagging step and no taxonomy to manage (see Section 7).

**Examples:**

| Content | Delivery Path |
|---|---|
| CHROMELEON7, Pod 1, India English | `/in/en/snippets/sku/CHROMELEON7/pod-1` |
| CHROMELEON7, Pod 2, India English | `/in/en/snippets/sku/CHROMELEON7/pod-2` |
| CHROMELEON7, Pod 1, US English (base) | `/us/en/snippets/sku/CHROMELEON7/pod-1` |
| CHROMELEON7, Pod 1, German | `/de/de/snippets/sku/CHROMELEON7/pod-1` |
| NEWPRODUCT123, Pod 1, US English | `/us/en/snippets/sku/NEWPRODUCT123/pod-1` |

### 3.6 Locale-Specific Content (MSM)

Locale variants are managed using **AEM Multi-Site Management (MSM)** — native AEM live copies and rollout, which TFS already operates today. A base locale (for example, US English) holds the source content, and locale variants are maintained as live copies. This replaces the AEM On-Prem MSM mapping configuration used by the servlet, and keeps locale management within the familiar AEM MSM model.

### 3.7 Locale Coverage via MSM Rollout

In the current system, when the commerce system requested a pod URL, the server-side servlet resolved the locale to a base path and performed a tag search, so a request for a locale that lacked its own pod still resolved to content at the resolved base path. This graceful resolution was a property of the **servlet's runtime lookup**, not of MSM itself.

In the EDS model there is no runtime servlet or tag lookup. The commerce system constructs a direct URL and the Web Component fetches the published fragment at that exact path. Locale coverage is therefore handled at **authoring time using AEM MSM**, so that every locale that serves a pod has a real, published page at its path:

- The base locale (for example, US English) holds the source pod content.
- AEM MSM rolls the base content down to each required locale variant, creating a live copy of every pod for that locale.
- Each locale therefore has its own pod pages, published at the locale-specific path. When the commerce system requests a locale URL, the content **physically exists and is published**, and the Web Component resolves it directly.

Because every required locale and pod is rolled out and published, the commerce request always resolves to real content. There is no runtime fallback to manage — coverage is guaranteed by the MSM rollout, which is part of the standard AEM MSM authoring workflow TFS already operates. When a new locale is introduced, the base content is rolled out to it as part of that workflow, and its pods become available at their paths.

### 3.8 CORS Configuration

Because the commerce system and the EDS content are served from the same origin (`thermofisher.com`), no CORS configuration is required. If the commerce system is hosted on a different origin, the cross-origin headers are configured in the TFS EDS project headers configuration.

### 3.9 End-to-End Request Flow (EDS)

1. The commerce page contains an `<aem-embed>` tag with the `url` attribute for the required locale, SKU, and pod.
2. `aem-embed.js` runs in the commerce page browser, reads the `url` attribute, and appends `.plain.html`.
3. It fetches the published fragment through Akamai Edge from the EDS origin.
4. It creates an isolated Shadow DOM and loads the EDS global styles into it.
5. It runs the EDS decoration pipeline to convert the delivered markup into block structure.
6. For each block, it loads the block's CSS and JS into the Shadow DOM.
7. It renders the styled, functional fragment inside the Shadow DOM — isolated from the commerce page's CSS and JS — and the commerce page displays the content correctly.

---

## 4. Impact Analysis

### 4.1 Commerce / PDP System — Changes Required

| Change | Details |
|---|---|
| Add the `aem-embed.js` script | One script reference in the page head |
| Replace servlet HTTP calls with `<aem-embed>` tags | Replace existing GET calls to the `.pfpsnippet.html/sku/X/N` URLs with `<aem-embed>` tags |
| URL construction logic | Build the EDS URL from existing data: `/{locale}/snippets/sku/{SKU}/pod-{N}` |
| CSS updates | Commerce page CSS may need review where global styles previously targeted the injected AEM HTML structure, now that content renders inside a Shadow DOM boundary |

### 4.2 TFS AEM On-Prem — What Is Decommissioned

| AEM On-Prem Artifact | Status |
|---|---|
| `ProductFamilySyndicationServlet.java` | Decommissioned |
| `MsmMappingConfiguration.java` | Decommissioned |
| `content-snippet.jsp` | Decommissioned |
| `snippetparsys.jsp` and the `snippetparsys` component | Decommissioned |
| `content_snippet` AEM template | Decommissioned |
| `pfp:` tag namespace and taxonomy | Decommissioned |
| AEM On-Prem MSM live copies for snippet pages | Replaced by AEM MSM in the new authoring instance |
| All Content Snippet pages in AEM On-Prem Sites | Re-authored in AEM Sites (Universal Editor) and delivered via EDS |

---

## 5. Runtime Ownership

### 5.1 Adobe Development Team

| Responsibility | Task |
|---|---|
| EDS repo setup | Initialise the TFS EDS project with the standard scripts and global styles |
| Copy `aem-embed.js` | Copy from `github.com/adobe/aem-embed` into the project scripts |
| Build EDS blocks | Develop the text, text-image, video, and heading blocks (JS + CSS) |
| Universal Editor models | Define the block/component models and filters that govern fragment authoring |
| CORS configuration | Add cross-origin headers to the EDS headers configuration if the commerce origin differs |
| AEM MSM setup | Configure base and locale-variant site relationships using AEM MSM |
| URL convention definition | Define and document the `/snippets/sku/{SKU}/pod-{N}` path convention and the content-tree mapping |

### 5.2 TFS Content Team (Authors)

| Responsibility | Task |
|---|---|
| Authoring | Create and edit fragment pages in AEM Sites using Universal Editor |
| Path convention adherence | Create each fragment page at the content location that maps to `/{locale}/snippets/sku/{SKU}/pod-{N}` — the path is the identifier |
| No tagging required | Tags are eliminated — authors do not manage any tag taxonomy |

### 5.3 Commerce / PDP Team

| Responsibility | Task |
|---|---|
| Script integration | Add the `aem-embed.js` script reference to the commerce page template |
| Tag integration | Replace existing servlet HTTP calls with `<aem-embed>` tags |
| URL construction | Build the EDS URL from the locale, SKU, and pod data available in the commerce system |
| CSS review | Review and update any commerce-side CSS that targeted the AEM-specific HTML structure |

---

## 6. Parity Check

### 6.1 Functional Parity

| Capability | AEM On-Prem (Current) | EDS + AEM Authoring (Target) | Parity |
|---|---|---|---|
| Rich content authoring (text, images, video) | AEM Sites — drag-and-drop components | AEM Sites — Universal Editor block authoring | Equivalent |
| Raw HTML fragment delivery | `content-snippet.jsp` strips the page shell | The published `.plain.html` returns the content only | Equivalent |
| Styled content delivery | Commerce page CSS styles the AEM HTML | `aem-embed.js` loads block CSS into the Shadow DOM | Improved — TFS owns styling, isolated from commerce |
| Locale-specific content | AEM On-Prem MSM live copies per locale | AEM MSM live copies per locale | Equivalent |
| Multiple pods per SKU | Multiple tagged pages per SKU | Multiple fragment pages per path convention | Equivalent |

### 6.2 Technical Parity

| Technical Concern | AEM On-Prem (Current) | EDS + AEM Authoring (Target) |
|---|---|---|
| Servlet / entry point | `ProductFamilySyndicationServlet.java` (Java OSGi) | `aem-embed.js` (Web Component, browser-side) |
| Content lookup mechanism | Tag-based JCR search | URL path convention — direct resolution, no lookup |
| Locale resolution | `MsmMappingConfiguration.java` (server-side Java) | AEM MSM, delivered via the EDS URL |
| Rendering pipeline | `content-snippet.jsp` and the snippet paragraph system | EDS decoration pipeline and block decoration |
| Block JS initialisation (video players, etc.) | AEM clientlibs per component | `aem-embed.js` loads block JS per block |
| CSS isolation from commerce page | No isolation — commerce CSS must avoid conflicts | Full Shadow DOM isolation |
| Maintenance | Java OSGi bundle — requires AEM developer | Standard JS/CSS — any front-end developer |

---

## 7. Tag Removal and URL Simplification

### 7.1 URL Convention Replaces Tags

In the EDS model, the published path is the identifier. There is no separate tagging step and no taxonomy to manage.

AEM natively supports tags, and pods could still be tagged for other purposes. However, the syndication lookup no longer depends on tags. In the current system a server-side servlet performs a live JCR tag search (`TagManager.find()`) to locate the right content. Edge Delivery serves published static content at the edge and does not run the Sling/JCR servlet or a runtime tag-query engine, so a tag-based lookup cannot execute at delivery time. Instead, the Web Component resolves content directly by URL. The commerce system already holds the locale, SKU, and pod, so it constructs the delivery URL itself — no lookup and no tag taxonomy are required at runtime.

The rule is: `/{locale}/snippets/sku/{SKU-VALUE}/pod-{POD-NUMBER}`

### 7.2 URL Format Comparison

| | AEM On-Prem (Current) | EDS + AEM Authoring (Target) |
|---|---|---|
| Commerce call | `/{locale}/product-family-syndicated-content.pfpsnippet.html/sku/{SKU}/{POD}` | `<aem-embed url="/{locale}/snippets/sku/{SKU}/pod-{N}">` |
| Example | `/in/en/product-family-syndicated-content.pfpsnippet.html/sku/CHROMELEON7/3` | `/in/en/snippets/sku/CHROMELEON7/pod-3` |
| Content identifier | Tag: `pfp:sku/CHROMELEON7/pod_3` | Path: `/in/en/snippets/sku/CHROMELEON7/pod-3` |
| Lookup mechanism | JCR tag search | Direct URL resolution |
| Human readable | No | Yes |

---
