# CTA Block — DA + EDS Solution Design

**Document Version:** 2.0 (DA)
**Status:** Draft
**Date:** 2026-05-17
**Previous Version:** 1.0 (UE + AEM Authoring Source)
**Author:** Adobe Delivery Team

---

## Table of Contents

1. [Block Overview](#1-block-overview)
2. [CTA Properties](#2-cta-properties)
3. [CTA Style Variants](#3-cta-style-variants)
4. [CTA Icons](#4-cta-icons)
5. [DA Authoring — Standalone CTA](#5-da-authoring--standalone-cta)
6. [DA Authoring — CTA Inside Other Blocks](#6-da-authoring--cta-inside-other-blocks)
7. [CTA Plugin](#7-cta-plugin)
8. [Authoring Examples](#8-authoring-examples)

---

## 1. Block Overview

| Property | Value |
|---|---|
| Block Name | CTA |
| Maps to Existing | CTA / Button Component |
| Description | A reusable call-to-action button supporting multiple visual styles and icons. Used both as a standalone block and inside other blocks (Cards, Hero, etc.). |
| Authoring Strategy | Flattened block (standalone) / Inline content (inside other blocks). Authored via the CTA plugin in both cases. |
| Authoring Source | DA (Document Authoring) |
| Delivery | Edge Delivery Services (EDS) |

### Reusability

The CTA is designed as a **standardized component** used across the site:

- **Standalone** — CTA block placed directly on the page for inline actions, section-level actions, or independent call-to-actions
- **Inside other blocks** — CTA authored within Cards (column 3), Hero (`primary-cta` / `outline-cta` rows), and any other block that requires a call-to-action

The CTA plugin writes the same structured content format in all cases. This ensures consistent styling and behaviour across the entire site — regardless of where the CTA appears.

---

## 2. CTA Properties

Every CTA — whether standalone or inside another block — is defined by the same set of properties:

| Property | Description | Required | Default |
|---|---|---|---|
| Label | The text displayed on the button (e.g. "Learn more") | Yes | — |
| Link | The destination URL or content path | Yes | — |
| Style | Visual style of the button (see Section 3) | Yes | Primary |
| Icon | Icon displayed alongside the label (see Section 4) | No | None |
| Open in new window | Whether the link opens in a new browser tab | No | No (same window) |

---

## 3. CTA Style Variants

The Style property controls the visual appearance of the CTA button.

| Style | Value | Description |
|---|---|---|
| Primary | `primary` | Solid filled button — brand color background, white text. The most prominent action on the page. |
| Outline | `outline` | Border-only button — transparent background, brand color border and text. Secondary emphasis. |
| Link | `link` | Text link style with optional icon — no background, no border. Least prominent. |

Additional styles (e.g. Secondary, Video) will be added during implementation as encountered across the site.

---

## 4. CTA Icons

The Icon property adds a visual indicator alongside the button label.

| Icon | Value | Description |
|---|---|---|
| None | (empty) | No icon — label only |
| Arrow | `arrow` | Right-pointing arrow — used for navigation actions |
| Document | `document` | Document icon — used for document/resource links |
| Download | `download` | Download icon — used for downloadable assets |
| Print | `print` | Print icon — used for print actions |

Additional icons will be added during implementation as encountered across the site.

**Note:** Per design direction, the blue play button (to the left of text) should be used — not the red classic right-arrow style.

---

## 5. DA Authoring — Standalone CTA

### 5.1 When to Use

Use the standalone CTA block when a call-to-action button is needed on its own — not inside a Cards, Hero, or other block. Common scenarios:

- Inline CTA within a content section
- Section-level action (e.g. "Contact Us" button after a content block)
- Independent call-to-action on the page

### 5.2 Block Table Structure

The standalone CTA is a **single-column block table** with one row. The CTA plugin writes structured content into the cell — the same content format used when CTA is authored inside other blocks (Cards, Hero, etc.).

| CTA |
|---|
| (CTA plugin inserts content here) |

The plugin writes label, link, style, icon, and external metadata as structured content inside the single cell. The content format is identical whether the CTA is standalone or inside another block.

### 5.3 How to Author

1. Add a **CTA block table** to the DA document (via library panel → Blocks → CTA)
2. Place cursor in the **content cell** of the table
3. Open the **CTA plugin** from the DA library panel
4. Fill in: Label, Link, Style, Icon, Open in new window
5. Click **Add** — the plugin inserts the CTA content into the cell

### 5.4 Which JS Decorates

The standalone CTA block table is decorated by **`cta.js`** (the CTA block's own JavaScript). It reads the CTA content from the cell and renders the appropriate button with the correct style, icon, and link behaviour.

`cta.js` uses the same parsing logic that other block JS files (Cards, Hero) use to read CTA content — because the content format is the same everywhere.

---

## 6. DA Authoring — CTA Inside Other Blocks

### 6.1 When to Use

When a CTA is part of another block's content — such as a button on a card, or a call-to-action in a hero banner.

### 6.2 How It Works

The author places the cursor inside the **parent block's table cell** where the CTA belongs, then uses the CTA plugin to insert CTA content into that cell.

| Parent Block | Where CTA goes | How to author |
|---|---|---|
| **Cards** | Column 3 of a card row | Place cursor in column 3 → use CTA plugin |
| **Hero** | Value cell of `primary-cta` or `outline-cta` row | Place cursor in value cell → use CTA plugin |
| **Any future block** | The designated CTA cell/row | Place cursor → use CTA plugin |

### 6.3 Which JS Decorates

When the CTA is inside another block, the **parent block's JS** handles the rendering — not `cta.js`.

| CTA location | Decorated by |
|---|---|
| Standalone CTA block table | `cta.js` |
| Inside Cards block | `cards.js` |
| Inside Hero block | `hero.js` |
| Inside any other block | That block's JS |

There is no conflict because EDS block decoration is scoped — each block's JS only processes its own block element.

### 6.4 Consistent Content Format

The CTA plugin writes the **same structured content format** regardless of where the CTA is placed. This means:

- Every block's JS reads CTA content using the same parsing logic
- CTA styling and behaviour is consistent across the site
- Adding a new CTA style or icon option benefits all blocks immediately

This replaces the UE partials architecture (`_cta-fields.json`, `_dual-cta-fields.json`, `_button-types.json`, `_button-icons.json`) with a single plugin that serves all blocks.

---

## 7. CTA Plugin

### 7.1 Overview

The CTA plugin is a DA library panel tool that provides a guided authoring experience for creating CTA buttons. It replaces the AEM CTA Item dialog and the UE properties panel with a lightweight, consistent interface.

### 7.2 Plugin UI

When the author opens the CTA plugin, it presents the following dialog:

```
┌──────────────────────────────────────────────────┐
│  CTA                                      Close  │
│                                                  │
│  Label *                                         │
│  ┌──────────────────────────────────────────┐    │
│  │ Learn more                               │    │
│  └──────────────────────────────────────────┘    │
│                                                  │
│  Link *                                          │
│  ┌──────────────────────────────────────────┐    │
│  │ /products/overview                       │    │
│  └──────────────────────────────────────────┘    │
│                                                  │
│  Style *                                         │
│  ┌──────────────────────────────────────────┐    │
│  │ Primary                              ▼   │    │
│  └──────────────────────────────────────────┘    │
│                                                  │
│  Icon                                            │
│  ┌──────────────────────────────────────────┐    │
│  │ Arrow                                ▼   │    │
│  └──────────────────────────────────────────┘    │
│                                                  │
│  ☐ Open in new window                            │
│                                                  │
│  ┌──────────────────────────────────────────┐    │
│  │            Add to Page                   │    │
│  └──────────────────────────────────────────┘    │
│                                                  │
│  Cancel                                          │
│                                                  │
└──────────────────────────────────────────────────┘
```

### 7.3 Plugin Fields

| Field | Type | Required | Options |
|---|---|---|---|
| Label | Text input | Yes | — |
| Link | Text input | Yes | — |
| Style | Dropdown | Yes | Primary, Outline, Link |
| Icon | Dropdown | No | None, Arrow, Document, Download, Print |
| Open in new window | Checkbox | No | — |

### 7.4 Plugin Behaviour

The plugin adapts its output based on cursor context:

| Cursor position | Plugin action |
|---|---|
| Inside a table cell (e.g. Cards column 3, Hero value cell) | Inserts CTA content **into the cell** — inline content at cursor position |
| Outside any table (plain document area) | Creates a **standalone CTA block table** with key-value rows |

The author does not need to choose — the plugin detects the context automatically.

### 7.5 Edit Existing CTA

When the author selects an existing CTA (in any block) and opens the CTA plugin, the plugin reads the existing CTA content and pre-populates the dialog. The author can modify any property and click **Update** to apply changes.

---

## 8. Authoring Examples

### 8.1 Example 1 — Standalone Primary CTA with Arrow

A prominent call-to-action placed directly on the page. Author adds a CTA block table and uses the CTA plugin with: Label = "Explore Solutions", Link = "/products/overview", Style = Primary, Icon = Arrow.

| CTA |
|---|
| (CTA plugin content: "Explore Solutions" / primary / arrow → /products/overview) |

**What renders:** A solid filled button with "Explore Solutions" text and a right-pointing arrow icon. Clicking navigates to `/products/overview` in the same window.

---

### 8.2 Example 2 — Standalone Outline CTA (No Icon)

A secondary action with outline style. CTA plugin with: Label = "Contact Sales", Link = "/contact", Style = Outline, Icon = None.

| CTA |
|---|
| (CTA plugin content: "Contact Sales" / outline → /contact) |

**What renders:** A border-only button with "Contact Sales" text. No icon. Opens in the same window.

---

### 8.3 Example 3 — Standalone Download CTA (New Window)

A download action that opens in a new tab. CTA plugin with: Label = "Download Datasheet", Link = "/resources/datasheet.pdf", Style = Primary, Icon = Download, Open in new window = Yes.

| CTA |
|---|
| (CTA plugin content: "Download Datasheet" / primary / download / external → /resources/datasheet.pdf) |

**What renders:** A solid filled button with "Download Datasheet" text and a download icon. Clicking opens the PDF in a new browser tab.

---

### 8.4 Example 4 — Link Style CTA with Arrow

A subtle text-link style action. CTA plugin with: Label = "Learn more", Link = "/products/details", Style = Link, Icon = Arrow.

| CTA |
|---|
| (CTA plugin content: "Learn more" / link / arrow → /products/details) |

**What renders:** A text link (no background, no border) with "Learn more" text and a right-pointing arrow icon. This is the most common CTA style seen across the site — the blue text with arrow as shown on the existing pages.

---

### 8.5 Example 5 — CTA Inside a Cards Block

The same CTA plugin is used to author a CTA inside a Cards block. The author places cursor in column 3 and uses the plugin.

| Cards (img-left) | | |
|---|---|---|
| ![product](img.jpg) | **Building blocks for organic synthesis** Chemical synthesis reagents are essential... | (CTA plugin content: "Learn more" / primary / arrow) |

**What renders:** A card with image on the left, text content in the middle, and a primary CTA button with arrow icon on the right. The CTA styling and behaviour is identical to the standalone CTA.

---

### 8.6 Example 6 — CTA Inside a Hero Block

The CTA plugin is used to author CTAs inside the Hero block's `primary-cta` and `outline-cta` rows.

| Hero (dark-background) | |
|---|---|
| image | ![hero banner](hero-bg.jpg) |
| subtitle | Protecting Sample Integrity |
| primary-cta | (CTA plugin content: "Download Guide" / primary / download) |
| outline-cta | (CTA plugin content: "Contact Sales" / outline / arrow) |

**What renders:** A hero banner with two CTA buttons — a primary "Download Guide" button with download icon, and an outline "Contact Sales" button with arrow icon. Both rendered consistently with the site-wide CTA styling.
