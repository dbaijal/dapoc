# Dynamic Merchandising Offer Block — DA + EDS Solution Design

**Document Version:** 2.0 (DA)
**Status:** Draft
**Date:** 2026-05-18
**Author:** Adobe Delivery Team

---

## Table of Contents

1. [Overview](#1-overview)
2. [Assumptions](#2-assumptions)
3. [Current State Architecture](#3-current-state-architecture)
4. [EDS Solution — Recommended Approach](#4-eds-solution--recommended-approach)
5. [Block Definitions](#5-block-definitions)
6. [DA Block Table Contract — Dynamic Offer](#6-da-block-table-contract--dynamic-offer)
7. [DA Block Table Contract — Default Offer](#7-da-block-table-contract--default-offer)
8. [Placement Code Plugin](#8-placement-code-plugin)
9. [Multi-Offer Layout](#9-multi-offer-layout)
10. [Authoring Examples](#10-authoring-examples)
11. [Open Questions](#11-open-questions)

---

## 1. Overview

The offer system delivers personalized promotional content via Adobe Target / AEP Edge Network, with fallback to default offer content when personalized offers are unavailable.

The EDS implementation consists of two blocks:

| Block | Purpose |
|---|---|
| **Dynamic Offer** | Smart container on content pages — holds one placement code and a default offer path. At runtime, receives personalized offer from Target or falls back to default. |
| **Default Offer** | Fragment page that stores the raw HTML of the fallback offer. Used when Target does not return a personalized offer. |

**Key principle:** Marketing team continues authoring offers in their Marketing AEM instance. No migration of offer authoring is required. Only the default offer Experience Fragments from the TFS On-Prem instance need to be migrated to EDS fragment pages.

---

## 2. Assumptions

| # | Assumption |
|---|---|
| 1 | Offers are authored on the Marketing Cloud instance and pushed to Target/AEP from the Marketing environment. |
| 2 | The Marketing Cloud instance and the TFS AEM instance maintain separate code repositories — no shared codebase. |
| 3 | Offer HTML is delivered as Experience Fragment HTML. Styling is applied through CSS and JS loaded from the global header (`dm-offers/dm-offer-style.css` and `dm-offers/preload.min.js`). |
| 4 | `dm-offer-style.css` and `preload.min.js` will be loaded via the EDS global header/footer or via `delayed.js`. These are responsible for offer styling and fallback behaviour. |
| 5 | The Adobe cloud pipeline (Marketing AEM → Target → AEP Edge → Alloy SDK → DOM injection) remains unchanged. Only the page-side implementation changes for EDS. |
| 6 | Placement codes are a known, finite set managed centrally (e.g. `mk_fp_01`, `mk_fp_02`, `hb`, `lb`, `pc`, `fad_s_1`). |
| 7 | Default offers are not region/language specific — stored under a common path. In EDS, default offer fragments will follow a centralized structure at `/fragments/default-offers/`. |
| 8 | PDP, Commerce (cart), Search, and other systems consume offers directly from AEP/Target. No offers are created for them in the TFS AEM instance. No impact on these systems. |
| 9 | No offers are authored directly in the TFS AEM instance — only default XF-based offer HTML is stored there. |
| 10 | Images in offers are served from Dynamic Media (dm-images.thermofisher.com). |
| 11 | Offer placement in the Header and Footer comes from the Header/Footer HTML — the Dynamic Offer block is not used for header/footer offers. |
| 12 | AEP/Target requires country, language, and user type information for decisioning. This data is derived from the EDS page URL structure and browser cookies. |

---

## 3. Current State Architecture

### Flow

1. Marketing team creates and manages offer content as Experience Fragments in Marketing AEM (Cloud)
2. Raw HTML of the default offer is copied from Marketing AEM Publish to TFS AEM On-Prem as an Experience Fragment
3. The Dynamic Merchandising Offer component is authored on the page — configured with a Placement Code and Default Offer XF path
4. On page load, Alloy SDK (AEP Web SDK) makes a client-side call to `edge.adobedc.net/ee/v1/interact`
5. AEP Edge routes the request to Adobe Target for offer decisioning
6. If Target returns a personalized offer → Alloy SDK injects the Experience Fragment HTML into the placement container
7. If Target returns no offer → Default offer is displayed

### Key Technical Finding

The injected Experience Fragment HTML is clean and lightweight:
- Zero scripts, zero stylesheets, zero iframes
- Composed entirely of divs, images, links, text, and hidden inputs
- Not problematic for EDS pages — can be safely injected at runtime

---

## 4. EDS Solution — Recommended Approach

### Consume Offers from Marketing Team

```
1. Marketing team continues authoring XFs in their AEM instance
2. Automation pushes offer HTML from Marketing AEM to AEP
3. AEP stores offer as HTML payload (current method — no change)
4. Target returns full HTML in AEP response
5. EDS page renders the returned HTML string
```

### What Changes for EDS

| Concern | Current (AEM) | EDS |
|---|---|---|
| Offer authoring | Marketing AEM instance | Marketing AEM instance — **no change** |
| Offer delivery | Target → Alloy SDK → DOM injection | Target → Alloy SDK → DOM injection — **no change** |
| Default offer storage | XF in TFS AEM On-Prem | Default Offer fragment in DA |
| Page-level block | Dynamic Merchandising Offer component | Dynamic Offer block (DA table) |
| Placement container | `<div id="tf-cq-mk_fp_01">` | Block renders same container ID |
| Styling | dm-offer-style.css via global header | Same CSS loaded via EDS delayed.js |

### What Does NOT Change

- Marketing team offer authoring workflow
- AEP/Target pipeline and decisioning
- Alloy SDK client-side behaviour
- Offer HTML content structure
- Other systems (PDP, Commerce, Search) that consume from AEP/Target

### What Needs Migration

Only the default offer Experience Fragments from TFS AEM On-Prem need to be migrated to EDS fragment pages:
- Path: `/content/experience-fragments/tfsite/us/en/site/dm-offers/`
- Each XF becomes a Default Offer fragment page in DA

---

## 5. Block Definitions

### 5.1 Dynamic Offer Block

| Property | Value |
|---|---|
| Block Name | Dynamic Offer |
| Purpose | Smart container on content pages. Holds one placement code and default offer path. At runtime, receives Target offer or shows default. |
| Authoring Strategy | Flattened block — key-value table. One block per offer placement. |
| Instance per page | Multiple — one per placement position needed on the page |

### 5.2 Default Offer Block

| Property | Value |
|---|---|
| Block Name | Default Offer |
| Purpose | Stores raw HTML of the fallback offer content. Used when Target does not return a personalized offer. |
| Authoring Strategy | Embed-style block — author pastes raw HTML from Marketing AEM into the block. HTML is preserved as-is. |
| Location | Fragment pages at `/fragments/default-offers/` |
| Instance per fragment | One per fragment page |

---

## 6. DA Block Table Contract — Dynamic Offer

### 6.1 Table Structure

The Dynamic Offer block uses a **key-value pair** pattern. Each block represents **one offer placement**.

| Column | Role | Content |
|---|---|---|
| Column 1 | Key | Property name |
| Column 2 | Value | Property value |

### 6.2 Available Properties

| Key | Value | Required | Description |
|---|---|---|---|
| `placement-code` | Placement code string | Yes | Identifies the offer position. Selected via plugin dropdown. Determines the container ID used by Alloy SDK for Target injection. |
| `default-offer` | Link to default offer fragment | Yes | Path to the Default Offer fragment page that holds the fallback HTML. |

### 6.3 Placement Codes

| Placement Code | Friendly Name | Description |
|---|---|---|
| `mk_fp_01` | Feature Panel Left | Left feature panel on content pages |
| `mk_fp_02` | Feature Panel Right | Right feature panel on content pages |
| `hb` | Header Banner | Full-width header banner |
| `lb` | Lightbox | Lightbox popup offer |
| `pc` | Promo Cards | Promotional cards section |
| `fad_s_1` | Find A Distributor | Find a Distributor section offer |

### 6.4 Runtime Flow

1. Page loads → Dynamic Offer block JS creates a container `<div>` with ID derived from placement code (e.g. `tf-cq-mk_fp_01`)
2. Alloy SDK (loaded via global header) detects the container
3. Alloy SDK calls AEP Edge → Target for offer decisioning
4. If Target returns personalized offer HTML → Alloy SDK injects it into the container
5. If Target returns nothing within timeout → block JS fetches the default offer fragment's `.plain.html` and injects it as fallback

### 6.5 Authoring Summary

| Concern | Approach |
|---|---|
| Block type | Flattened block — key-value table |
| One block per placement | Yes — each Dynamic Offer block handles one placement code |
| Placement code | Selected via plugin dropdown (inserts value into cell) |
| Default offer | Link to default offer fragment page |
| Personalized offer | Delivered by Target at runtime — no authoring needed |
| Multi-offer layout | Use Section Metadata for grid (see Section 9) |

---

## 7. DA Block Table Contract — Default Offer

### 7.1 Purpose

The Default Offer block stores raw HTML content from Marketing AEM. This HTML includes inline styles, CSS classes, nested divs, hidden inputs, and data attributes. It cannot be authored as standard DA content — it must be stored and rendered as-is.

### 7.2 Fragment Location

Default Offer fragments are stored at:

```
/fragments/default-offers/
  mk-fp-01        ← Default for Feature Panel Left
  mk-fp-02        ← Default for Feature Panel Right
  hb              ← Default for Header Banner
  lb              ← Default for Lightbox
  pc              ← Default for Promo Cards
  fad-s-1         ← Default for Find A Distributor
```

### 7.3 Block Structure

The Default Offer block on the fragment page holds the raw HTML:

| Default Offer | |
|---|---|
| (raw HTML pasted from Marketing AEM) | |

The HTML is preserved as-is — including inline styles, CSS classes, data attributes, and nested div structures. The fragment's `.plain.html` serves this content unchanged.

### 7.4 Authoring Workflow

1. Marketing team creates/updates offer in Marketing AEM Author (Cloud) — **unchanged**
2. Raw HTML is copied from Marketing AEM Publish — **unchanged**
3. Author opens the corresponding Default Offer fragment page in DA (e.g. `/fragments/default-offers/mk-fp-01`)
4. Pastes the raw HTML into the Default Offer block
5. Saves and publishes the fragment

### 7.5 Why Raw HTML

The default offer HTML from Marketing AEM contains:
- Inline styles specific to offer styling
- CSS classes consumed by `dm-offer-style.css`
- Nested div structures matching Target-delivered offers
- Hidden inputs and data attributes for tracking
- Dynamic Media image URLs

This HTML must render identically to Target-delivered offers (styled by the same CSS). Converting it to standard DA content would break visual parity.

---

## 8. Placement Code Plugin

### 8.1 Purpose

A small plugin that provides a dropdown for placement code selection. Prevents authors from mistyping placement codes.

### 8.2 How It Works

1. Author places cursor in the value cell of the `placement-code` row
2. Opens the **Placement Code plugin** from the DA library panel
3. Plugin shows a dropdown with friendly names:
   - Feature Panel Left
   - Feature Panel Right
   - Header Banner
   - Lightbox
   - Promo Cards
   - Find A Distributor
4. Author selects → plugin inserts the placement code value (e.g. `mk_fp_01`) into the cell

### 8.3 Plugin Dialog

```
┌──────────────────────────────────────────────────┐
│  Offer Placement                          Close  │
│                                                  │
│  Select Placement *                              │
│  ┌──────────────────────────────────────────┐    │
│  │ Feature Panel Left                   ▼   │    │
│  └──────────────────────────────────────────┘    │
│                                                  │
│  ┌──────────────────────────────────────────┐    │
│  │              Add                         │    │
│  └──────────────────────────────────────────┘    │
│                                                  │
└──────────────────────────────────────────────────┘
```

### 8.4 Scope

The plugin only inserts the placement code value — nothing else. Default offer path is authored manually by the author (adding a link to the fragment page).

---

## 9. Multi-Offer Layout

When multiple offers need to be displayed side by side (e.g. Feature Panel Left + Feature Panel Right in a 2-column layout), authors use **Section Metadata** to apply a grid style.

### 9.1 Example — Two Offers Side by Side

```
| Dynamic Offer | |
| placement-code | mk_fp_01 |
| default-offer | [/fragments/default-offers/mk-fp-01](/fragments/default-offers/mk-fp-01) |

| Dynamic Offer | |
| placement-code | mk_fp_02 |
| default-offer | [/fragments/default-offers/mk-fp-02](/fragments/default-offers/mk-fp-02) |

| Section Metadata | |
| style | 2-col |
```

**What renders:** Two offer containers side by side. Each receives its own personalized offer from Target independently, or falls back to its own default.

### 9.2 Section Grid Styles

| Section Metadata style | Layout |
|---|---|
| `2-col` | 2 offers side by side |
| `3-col` | 3 offers in a row |
| `4-col` | 4 offers in a row |

Each Dynamic Offer block operates independently — its own Target call, its own fallback. Section CSS handles the visual arrangement.

---

## 10. Authoring Examples

### 10.1 Example 1 — Single Offer (Feature Panel)

| Dynamic Offer | |
|---|---|
| placement-code | mk_fp_01 |
| default-offer | [/fragments/default-offers/mk-fp-01](/fragments/default-offers/mk-fp-01) |

**What happens at runtime:** Block creates container with ID `tf-cq-mk_fp_01`. Target delivers a personalized offer into it. If Target returns nothing, block fetches the default offer fragment and displays it.

---

### 10.2 Example 2 — Two Offers Side by Side

```
| Dynamic Offer | |
| placement-code | mk_fp_01 |
| default-offer | [/fragments/default-offers/mk-fp-01](/fragments/default-offers/mk-fp-01) |

| Dynamic Offer | |
| placement-code | mk_fp_02 |
| default-offer | [/fragments/default-offers/mk-fp-02](/fragments/default-offers/mk-fp-02) |

| Section Metadata | |
| style | 2-col |
```

**What renders:** Two offer panels displayed in a 2-column grid. Each operates independently with its own placement code and fallback.

---

### 10.3 Example 3 — Default Offer Fragment (Author View)

The Default Offer fragment page at `/fragments/default-offers/mk-fp-01`:

| Default Offer | |
|---|---|
| `<div class="dm-offer-feature-panel">` `<a href="/promotions/summer">` `<img src="https://dm-images.thermofisher.com/...">` `<div class="dm-offer-text">Summer Sale - 20% Off</div>` `</a>` `</div>` | |

**What this is:** The raw HTML from Marketing AEM, pasted as-is. Preserved with all inline styles, classes, and structure. Served via `.plain.html` when the block needs fallback content.

---

## 11. Open Questions

| # | Question | Owner |
|---|---|---|
| 1 | Is Interact Client Context still needed on EDS pages, or is it part of legacy? | TFS to confirm |
| 2 | What page-level data is required on EDS pages for Target decisioning beyond country, language, and user type? | TFS to confirm |
| 3 | Is `offers.min.js` still required in EDS, or is Alloy SDK sufficient? | TFS to confirm |
| 4 | Should default offer fallback be managed by `dm-offers/preload.min.js` or by the Dynamic Offer block JS? | Joint decision |
| 5 | Confirm that dynamic offers shown on PDP pages are coming from AEP/Target and not from AEM. | TFS to confirm |
| 6 | Confirm if any additional data or context needs to be passed to AEP/Target from EDS pages for correct offer decisioning. | TFS to confirm |
