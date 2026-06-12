# Dynamic Merchandising Offer Block — AEM as Authoring Source (Crosswalk)

**Document Version:** 1.0
**Status:** Draft
**Date:** 2026-06-12
**Author:** Adobe Delivery Team
**Authoring Source:** AEM (Universal Editor / Crosswalk) + Edge Delivery Services

---

## 1. Overview

The offer system delivers personalized promotional content via Adobe Target / AEP Edge Network, with fallback to default offer content when a personalized offer is unavailable.

The Edge Delivery Services implementation consists of two authored components, both authored in AEM using Universal Editor:

| Component | Purpose |
|---|---|
| **Default Offer** | Embeds the raw HTML of a fallback offer. Authored inside a fragment page. Used when Target does not return a personalized offer. |
| **Dynamic Merchandising Offer block** | Smart container placed on a content page. Carries one placement code and one default offer fragment path. At runtime, the placement receives a personalized offer from Target or falls back to its default. One block represents one offer placement. |

**Key principle:** The Marketing team continues authoring offers in their Marketing AEM instance. No migration of offer authoring is required. Only the default offer content from the TFS On-Prem instance is migrated to EDS fragment pages.

---

## 2. Current AEM Flow

### 2.1 Authoring and Setup (Pre-Runtime)

| Step | Action | System |
|---|---|---|
| 1 | Marketing team creates and manages default offer content as Experience Fragments | Marketing AEM Author (Cloud) |
| 2 | Raw HTML of the default offer is copied from the publish instance | Marketing AEM Publish (Cloud) |
| 3 | An Experience Fragment is created with a Raw HTML component; the copied HTML is pasted into it | TFS AEM Author (On-Prem) |
| 4 | The Dynamic Offer component is authored on the page, configured with a placement code (for example `mk_fp_01`) and a default snippet path pointing to the Experience Fragment | TFS AEM Author (On-Prem) |

### 2.2 Runtime Behavior

1. User accesses the page.
2. Page HTML is served with offer placement containers (for example, a container with the ID `tf-cq-mk_fp_01`).
3. Adobe Launch loads and initializes the Alloy SDK (AEP Web SDK).
4. Alloy makes a call to the AEP Edge interact endpoint.
5. AEP Edge routes the request to Adobe Target for offer decisioning.
6. If Target returns an offer, the Alloy SDK processes the response and injects the offer HTML into the matching container.
7. If Target returns no offer, the default offer is displayed.

### 2.3 Key Technical Findings

The offer HTML delivered for injection is clean and lightweight:

- Contains no scripts, no stylesheets, and no iframes.
- Composed entirely of divs, images, links, text, and hidden inputs.
- Can be safely injected into an EDS page at runtime.

Offer styling and fallback behavior are provided by `dm-offer-style.css` and `preload.min.js`, loaded globally. Any performance impact is primarily from offer images served by Dynamic Media (`dmimages.thermofisher.com`).

---

## 3. Assumptions

| # | Assumption |
|---|---|
| 1 | Offers are authored on the Marketing Cloud instance and pushed to Target / AEP from the Marketing environment. |
| 2 | The Marketing Cloud instance and the TFS AEM instance maintain separate code repositories — no shared codebase. |
| 3 | Offer styling and fallback assets (`dm-offer-style.css`, `preload.min.js`) are loaded via the EDS global header/footer or `delayed.js`. |
| 4 | The Adobe cloud pipeline (Marketing AEM → Target → AEP Edge → Alloy SDK → DOM injection) remains unchanged. Only the page-side implementation changes for EDS. |
| 5 | Placement codes are a known, finite set managed centrally (for example `mk_fp_01`, `mk_fp_02`, `hb`, `lb`, `pc`, `fad_s_1`). |
| 6 | Default offers are not region or language specific — they are stored under a common centralized path. |
| 7 | PDP, Commerce (cart), Search, and other systems consume offers directly from AEP / Target. No offers are created for them in the TFS AEM instance, and they are not affected by this design. |
| 8 | No offers are authored directly in the TFS AEM instance — only default offer HTML is stored there. |
| 9 | Images in offers are served from Dynamic Media (`dmimages.thermofisher.com`). |
| 10 | Offer placement in the header and footer comes from the header/footer HTML — the Dynamic Merchandising Offer block is not used for header/footer offers. |
| 11 | AEP / Target requires country, language, and user type information for decisioning. This data is derived from the EDS page URL structure and browser cookies. |

---

## 4. EDS Solution — AEM as Authoring Source

The EDS offer system consists of two authored components, both edited in Universal Editor:

| Component | Where authored | Role |
|---|---|---|
| **Default Offer** | Inside a fragment page | Embeds the raw fallback offer HTML, preserved as-is. |
| **Dynamic Merchandising Offer block** | On a content page | Defines one offer placement and its default offer fragment path; renders the placement container and handles fallback. |

### 4.1 Default Offer Component (Embed)

For each default offer, a fragment page is created containing a **Default Offer** component that holds the raw HTML from Marketing AEM.

The default offer HTML contains inline styles, specific CSS classes, nested divs, hidden inputs, and data attributes. This raw HTML cannot be authored as standard structured content — it must be stored and rendered exactly as supplied. The Default Offer component serves this purpose by embedding the HTML without transformation.

**Fragment storage structure:** default offer fragments are organized under a single centralized path, one fragment per placement code (for example, a fragment for Feature Panel Left, one for Feature Panel Right, one for Header Banner, and so on).

**Authoring workflow:**

1. Marketing team creates or updates the offer in Marketing AEM Author (Cloud) — unchanged.
2. Raw HTML is copied from Marketing AEM Publish — unchanged.
3. Author opens the corresponding fragment page in Universal Editor.
4. Author pastes the raw HTML into the Default Offer component.
5. Author publishes the fragment.

The raw HTML is preserved as-is and served via the fragment's plain HTML representation. When the Dynamic Merchandising Offer block fetches this fragment on fallback, the HTML is injected into the page exactly as stored — maintaining visual parity with Target-delivered offers, which are styled by the same offer stylesheet.

### 4.2 Dynamic Merchandising Offer Block (On Page)

The Dynamic Merchandising Offer block is the smart container placed on content pages. **One block represents one offer placement.** It carries two values:

- a **placement code** — identifies the offer position and determines the container ID, and
- a **default offer fragment** — a reference to the fragment page that holds the fallback HTML.

The block is modeled as a **flat component** with two fields — there is no parent-child or repeatable-item structure. Each placement on a page is a separate block instance.

#### Block Fields

| Field | Editor control | Required | Purpose |
|---|---|---|---|
| Placement Code | Dropdown (select) | Yes | Selects the offer position from the centrally managed list of placement codes. Determines the container ID used by the Alloy SDK for Target injection. |
| Default Offer Fragment | Content reference (path browser) | Yes | References the fragment page that holds the fallback offer HTML. The author browses to and selects the fragment rather than typing a path. |

The **content reference** control opens a browser to select the fragment from the repository, removing the need to manually type or paste a path and reducing the chance of broken references.

### 4.3 Multiple Offers on a Page

When more than one offer needs to be shown — for example, a left and right feature panel side by side — the author places **multiple Dynamic Merchandising Offer blocks** within the same section. Each block is an independent placement with its own placement code and default offer fragment.

The visual arrangement (side by side, grid, stacked) is controlled by **section-level layout styling**, not by the block itself. The specific section layout options are defined during development grooming.

Each block operates independently — its own placement container, its own Target call, and its own fallback.

### 4.4 Placement Code Source

Placement codes are defined as **static options in the block's component model**. The set of codes (value and friendly name) is maintained in the component model definition by the development team.

This approach has no external dependencies and works reliably out of the box. When new placement codes are introduced, the development team updates the component model and deploys the change. (If self-service management of placement codes by the Marketing team becomes a priority in the future, a spreadsheet-backed data source can be introduced; this is noted as a future enhancement and is out of scope for the current design.)

#### Placement Codes

| Placement Code | Friendly Name | Description |
|---|---|---|
| `mk_fp_01` | Feature Panel Left | Left feature panel on content pages |
| `mk_fp_02` | Feature Panel Right | Right feature panel on content pages |
| `hb` | Header Banner | Full-width header banner |
| `lb` | Lightbox | Lightbox popup offer |
| `pc` | Promo Cards | Promotional cards section |
| `fad_s_1` | Find A Distributor | Find a Distributor section offer |

### 4.5 Container ID Derivation

The block renders a placement container whose ID is derived from the placement code, matching the convention used today (for example, placement code `mk_fp_01` produces the container ID `tf-cq-mk_fp_01`). Preserving this convention ensures the Alloy SDK and Target decisioning continue to target the correct containers without any change to the cloud pipeline.

### 4.6 EDS Runtime Flow

1. The page loads and the Dynamic Merchandising Offer block renders a placement container, using the container ID derived from its placement code.
2. The Alloy SDK (loaded globally) detects the placement container.
3. The Alloy SDK calls AEP Edge → Target for offer decisioning.
4. If Target returns a personalized offer, the Alloy SDK injects the offer HTML into the container.
5. If Target returns nothing within the expected window, the block fetches the referenced default offer fragment and injects its stored HTML as the fallback.

---

## 5. What Changes, What Stays, What Migrates

### 5.1 What Changes for EDS

| Concern | Current (AEM On-Prem) | EDS (AEM as Authoring Source) |
|---|---|---|
| Offer authoring | Marketing AEM instance | Marketing AEM instance — no change |
| Offer delivery | Target → Alloy SDK → DOM injection | Target → Alloy SDK → DOM injection — no change |
| Default offer storage | Experience Fragment with Raw HTML component in TFS AEM On-Prem | Default Offer (embed) component inside an EDS fragment page |
| Page-level component | Dynamic Offer component (dialog-configured) | Dynamic Merchandising Offer block (flat two-field block, one per placement, authored in Universal Editor) |
| Placement container | Container with ID such as `tf-cq-mk_fp_01` | Block renders the same container ID |
| Styling | Offer stylesheet loaded via global header | Same stylesheet loaded via EDS global header/footer or `delayed.js` |

### 5.2 What Does NOT Change

- Marketing team offer authoring workflow.
- AEP / Target pipeline and decisioning.
- Alloy SDK client-side behavior.
- Offer HTML content structure.
- Other systems (PDP, Commerce, Search) that consume offers from AEP / Target.

### 5.3 What Needs Migration

Only the default offer content from TFS AEM On-Prem is migrated to EDS fragment pages:

- Each existing default offer Experience Fragment becomes a Default Offer fragment page in EDS, with the raw HTML embedded in the Default Offer component.
- Fragments are organized under a single centralized path, one fragment per placement code.

---

## 6. Authoring Examples

### 6.1 Single Offer (Feature Panel)

The author places one Dynamic Merchandising Offer block on the page and configures it:

- Placement Code: Feature Panel Left (`mk_fp_01`)
- Default Offer Fragment: the Feature Panel Left default offer fragment

**At runtime:** the block renders a container with the ID `tf-cq-mk_fp_01`. Target delivers a personalized offer into it. If Target returns nothing, the block fetches the referenced default offer fragment and displays it.

### 6.2 Two Offers Side by Side

The author places two Dynamic Merchandising Offer blocks within the same section:

- Block 1 — Placement Code: Feature Panel Left (`mk_fp_01`); Default Offer Fragment: Feature Panel Left default
- Block 2 — Placement Code: Feature Panel Right (`mk_fp_02`); Default Offer Fragment: Feature Panel Right default

The section's layout styling arranges the two blocks side by side. Each block renders its own placement container, makes its own Target call, and falls back to its own default independently.

### 6.3 Default Offer Fragment (Author View)

The author opens a default offer fragment page in Universal Editor and embeds the raw HTML supplied from Marketing AEM into the Default Offer component. The HTML — including inline styles, classes, data attributes, and nested structure — is preserved as-is and served via the fragment's plain HTML representation when the block needs fallback content.

---

## 7. Open Questions

| # | Question | Owner |
|---|---|---|
| 1 | What page-level data is required on EDS pages for Target decisioning beyond country, language, and user type? | TFS to confirm |
| 2 | Is Interact Client Context still needed on EDS pages, or is it legacy? | TFS to confirm |
| 3 | Is `offers.min.js` still required in EDS? | TFS to confirm |
| 4 | Should the default offer fallback be managed by the global offer preload script or by the EDS offer block? | TFS to confirm |
| 5 | Confirm how the default offer is shown today — is it managed by the preload script? | TFS to confirm |
| 6 | Confirm with the PDP team whether dynamic offers shown on PDP pages come from AEM or from AEP / Target. | TFS / PDP team to confirm |
