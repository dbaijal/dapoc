# Text and Image Block (Cards) — DA + EDS Solution Design

**Document Version:** 2.0 (DA)
**Status:** Draft
**Date:** 2026-05-17
**Previous Version:** 1.0 (UE + AEM Authoring Source)
**Author:** Adobe Delivery Team

---

## Table of Contents

1. [Block Overview](#1-block-overview)
2. [Authoring Criteria](#2-authoring-criteria)
3. [Variants](#3-variants)
4. [DA Block Table Contract](#4-da-block-table-contract)
5. [CTA Authoring](#5-cta-authoring)
6. [Authoring Examples](#6-authoring-examples)

---

## 1. Block Overview

| Property | Value |
|---|---|
| Block Name | Cards |
| Maps to Existing | Text and Image Component |
| Description | A repeatable content block that displays cards in a configurable grid. Each card can contain an image, title, subtitle, description, and a call-to-action. Supports multiple layout and visual treatment variants. |
| Authoring Strategy | Flattened block — 3-column table. Each row is one card. |
| Authoring Source | DA (Document Authoring) |
| Delivery | Edge Delivery Services (EDS) |

---

## 2. Authoring Criteria

**Image** — optional. A visual associated with the card. Authored by dragging and dropping an image into column 1.

**Title (H2)** — optional. The card heading. Authored as bold text or heading in column 2.

**Subtitle (H3)** — optional. Secondary text below the title. Authored as text in column 2.

**Description (rich text)** — optional. Supporting body copy. Supports bold, italic, links, and lists. Authored in column 2.

**CTA** — optional. A call-to-action button with label, link, style, icon, and open-in-new-window option. Authored in column 3 using the CTA plugin.

**Author can add as many cards as needed.** Each row in the table renders as one card.

**All fields are optional.** If a column is left empty, that element is not rendered. For example, a card with only an image and CTA (no text) will render as a clickable image card.

### Adaptive Card Behaviour

When a card contains only an image and a CTA link (no title or description), the block wraps the image in the CTA link, making the entire card clickable. No separate variant is needed — the block adapts based on which fields are present.

### Background Color

The cards block supports configurable background colors applied to the entire block instance. Background color is authored as a variant in the block header.

| Color | Variant name | Description |
|---|---|---|
| White | (default — no variant needed) | White/transparent background |
| Light Grey | `light-grey` | Light grey background (#f5f5f5) |
| Blue | `blue` | Brand blue background |
| Dark | `dark` | Dark background with light text |

### Mobile Behaviour

On mobile devices, cards stack vertically into a single-column layout regardless of the desktop grid variant.

---

## 3. Variants

The Cards block supports multiple variants organized in two categories: **Layout** and **Visual Treatment**. Authors combine one layout variant with one or more visual treatment variants in the block header.

*Variant screenshots and reference URLs will be added in the final version of this document.*

---

## 4. DA Block Table Contract

### 4.1 Table Structure

The Cards block is authored as a **3-column table** in the DA document. Each row represents one card.

| Column | Role | Content |
|---|---|---|
| Column 1 | Image | Card image — drag and drop into cell |
| Column 2 | Text Content | Title (bold or heading), subtitle, description — rich text |
| Column 3 | CTA | Call-to-action — authored using the CTA plugin |

### 4.2 Block Header and Variants

The first row of the table is the **block header** — it identifies the block and specifies variants. This row is not rendered as a card.

Authors combine variants by listing them with commas. Select **one layout variant** and **one or more visual treatment variants** as needed.

**Format:** `Cards (layout-variant, visual-variant, background-color)`

**Examples:**

| Author types in header row | Result |
|---|---|
| `Cards` | Default — 3-col, image top, gray border |
| `Cards (4-col)` | 4 cards per row |
| `Cards (4-col, feature-card)` | 4 cards per row with feature card look |
| `Cards (2-col, img-left, without-border)` | 2-col, image left, no borders |
| `Cards (overlay, overlay-light-text)` | Image background with white text overlay |
| `Cards (feature-card, blue)` | Feature cards on brand blue background |
| `Cards (fullwidth, img-left)` | Full-width card, image on the left |
| `Cards (4-col, clickable, dark)` | 4-col clickable cards on dark background |

Content rows (cards) start from row 2 onward.

### 4.3 Layout Variants

Layout variants control the **grid structure** — how many cards per row. Select one layout variant. If none is selected, the default 3-column grid applies.

| Variant | Value | Description |
|---|---|---|
| Default (3 col) | (none — baseline) | 3-column grid |
| 2 Column | `2-col` | 2-column grid |
| 4 Column | `4-col` | 4-column grid |
| Full Width | `fullwidth` | 1 card per row — full width |

### 4.4 Visual Treatment Variants

Visual treatment variants control the **appearance** of each card — including image position, borders, overlay, and card style. These can be combined with a layout variant and with each other.

**Image Position:**

| Variant | Value | Description |
|---|---|---|
| Default | (none — baseline) | Image at the top of the card |
| Image Left | `img-left` | Image positioned to the left, text to the right |
| Image Right | `img-right` | Image positioned to the right, text to the left |

**Card Style:**

| Variant | Value | Description |
|---|---|---|
| Without Border | `without-border` | No borders or shadows on cards |
| Clickable | `clickable` | Entire card wrapped in CTA link — card is fully clickable |
| Overlay | `overlay` | Image as full-card background, text + CTA overlaid |
| Overlay Light Text | `overlay-light-text` | White text on overlay variant |
| Overlay Dark Text | `overlay-dark-text` | Black text on overlay variant |
| Feature Card | `feature-card` | Product image in upper right corner, text prominent |
| Card Resource | `card-resource` | Blue background, feature product style |
| Title Over Image | `title-over-img` | Title text overlaid on the image |
| Classic Small | `classic-small` | Compact/alternate style |
| Classic Gray | `classic-gray` | Gray background with blue text, typically single item |

### 4.5 How Layout and Visual Treatment Combine

Layout and visual treatment are **independent** — layout controls the grid, visual treatment controls the card appearance. They do not conflict.

| What author wants | Layout | Visual | Block header |
|---|---|---|---|
| 3-col standard cards | default | default | `Cards` |
| 4-col feature cards | 4-col | feature-card | `Cards (4-col, feature-card)` |
| 3-col overlay with white text | default | overlay + overlay-light-text | `Cards (overlay, overlay-light-text)` |
| Full-width, image left, clickable, no borders | fullwidth | img-left + clickable + without-border | `Cards (fullwidth, img-left, clickable, without-border)` |
| 2-col image left, blue background | 2-col | img-left + blue | `Cards (2-col, img-left, blue)` |
| Full-width image right, dark background | fullwidth | img-right + dark | `Cards (fullwidth, img-right, dark)` |

### 4.6 Authoring Summary

| Concern | Approach |
|---|---|
| Block type | Flattened block — 3-column table |
| Adding a card | Author adds a row to the table |
| Removing a card | Author deletes a row |
| Reordering cards | Author moves rows up/down |
| Card image | Drag and drop into column 1 |
| Card text | Rich text in column 2 — title (bold/heading), subtitle, description |
| Card CTA | Authored in column 3 using CTA plugin |
| Layout selection | Layout variant in block header |
| Visual treatment | Visual variant(s) in block header |
| Background color | Color variant in block header (light-grey, blue, dark) |
| Optional fields | Omit content in any column — that element is not rendered |

---

## 5. CTA Authoring

### 5.1 Overview

Each card can have one CTA (call-to-action) button authored in column 3. The CTA is authored using the **CTA plugin** available in the DA library panel.

### 5.2 CTA Properties

The CTA plugin supports the following properties:

| Property | Description | Required |
|---|---|---|
| Label | The text displayed on the button (e.g. "Learn more") | Yes |
| Link | The destination URL | Yes |
| Style | Button style — Primary, Outline, Link | Yes |
| Icon | Icon displayed alongside the label (e.g. arrow, download, document, print) | Optional |
| Open in new window | Whether the link opens in a new browser tab | Optional |

### 5.3 How to Author a CTA

1. Place cursor in **column 3** of the card row
2. Open the **CTA plugin** from the DA library panel
3. Fill in the CTA properties: label, link, style, icon, open-in-new-window
4. Click **Add** — the plugin inserts the CTA content into the cell

The CTA plugin writes structured content into the cell that the block JS reads at delivery time to render the appropriate button with the correct style and icon.

### 5.4 CTA is Optional

If a card does not need a CTA, leave column 3 empty. The card will render without a button.

### 5.5 CTA Plugin — Standalone Use

The same CTA plugin can also be used outside the Cards block to create a standalone CTA button anywhere on the page. When used outside a table cell, the plugin creates a CTA block table instead of inserting inline content.

---

## 6. Authoring Examples

### 6.1 Example 1 — Default 3-Column Cards

Standard 3-column card layout with image, text, and CTA.

| Cards | | |
|---|---|---|
| ![organic synthesis](img-1.jpg) | **Building blocks for organic synthesis** Chemical synthesis reagents are essential to transform building blocks into target molecules quickly, safely, and cleanly. | [Learn more →](/chemicals/organic-synthesis) |
| ![protein biology](img-2.jpg) | **Protein biology** Explore our portfolio of protein biology products for expression, purification, and analysis. | [Learn more →](/protein-biology) |
| ![cell analysis](img-3.jpg) | **Cell analysis** Advanced tools and reagents for cell analysis workflows. | [Learn more →](/cell-analysis) |

**What renders:** 3 cards side by side, each with image on top, title, description, and a CTA button at the bottom.

---

### 6.2 Example 2 — 4-Column Feature Cards with Blue Background

Feature cards in a 4-column grid on a blue background.

| Cards (4-col, feature-card, blue) | | |
|---|---|---|
| ![product-a](product-a.png) | **Applied Biosystems** Genetic analysis solutions | [Explore →](/applied-biosystems) |
| ![product-b](product-b.png) | **Invitrogen** Cell biology reagents | [Explore →](/invitrogen) |
| ![product-c](product-c.png) | **Gibco** Cell culture media | [Explore →](/gibco) |
| ![product-d](product-d.png) | **Ion Torrent** Next-gen sequencing | [Explore →](/ion-torrent) |

**What renders:** 4 feature cards per row with product images in the upper right corner, text prominent, on a blue background with white text.

---

### 6.3 Example 3 — Full Width Image Left

Single card per row with image on the left and text on the right.

| Cards (fullwidth, img-left) | | |
|---|---|---|
| ![lab chemicals](lab-chemicals.jpg) | **Lab Chemicals** The Thermo Scientific portfolio includes over 5,000 organic synthesis reagents, including reducing and oxidizing reagents, organometallics, commonly used functional reagents, and specialty reagents for specific reactions. | [Learn more →](/chemicals) |

**What renders:** Full-width card with image on the left side and title, description, CTA on the right side.

---

### 6.4 Example 4 — Image-Only Clickable Cards (No Text)

Cards with only images and CTA links — no title or description. The entire card becomes clickable.

| Cards (4-col, clickable, without-border) | | |
|---|---|---|
| ![brand-1](brand-1.jpg) | | [](/brands/thermo-scientific) |
| ![brand-2](brand-2.jpg) | | [](/brands/applied-biosystems) |
| ![brand-3](brand-3.jpg) | | [](/brands/invitrogen) |
| ![brand-4](brand-4.jpg) | | [](/brands/gibco) |

**What renders:** 4 clickable image cards per row. No text, no borders. Clicking the card navigates to the brand page. The block automatically wraps the image in the CTA link.

---

### 6.5 Example 5 — Overlay Cards with Light Text

Cards with image as full background and text overlaid.

| Cards (overlay, overlay-light-text) | | |
|---|---|---|
| ![research](research-bg.jpg) | **Life Sciences** Research products for cell analysis, gene expression, and more. | [Explore →](/life-science) |
| ![industrial](industrial-bg.jpg) | **Applied Sciences** Customized kits and solutions for production settings. | [Explore →](/industrial) |
| ![clinical](clinical-bg.jpg) | **Clinical** Diagnostics and translational research solutions. | [Explore →](/clinical) |

**What renders:** 3 cards with full-bleed background images. Title, description, and CTA are overlaid on the image with white text.
