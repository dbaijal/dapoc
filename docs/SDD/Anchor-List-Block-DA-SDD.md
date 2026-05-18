# Anchor List Block — DA + EDS Solution Design

**Document Version:** 2.0 (DA)
**Status:** Draft
**Date:** 2026-05-18
**Previous Version:** 1.0 (UE + AEM Authoring Source)
**Author:** Adobe Delivery Team

---

## Table of Contents

1. [Block Overview](#1-block-overview)
2. [Authoring Criteria](#2-authoring-criteria)
3. [Variants](#3-variants)
4. [DA Block Table Contract](#4-da-block-table-contract)
5. [Authoring Examples](#5-authoring-examples)

---

## 1. Block Overview

| Property | Value |
|---|---|
| Block Name | Anchor List |
| Maps to Existing | Anchor List Block Component |
| Description | An auto-generated navigation list that links to sections within the current page. The block scans the page for H2 headings and generates anchor links automatically. |
| Authoring Strategy | Flattened block — minimal table. Block content is auto-generated at delivery time. Author only provides an optional title. |
| Authoring Source | DA (Document Authoring) |
| Delivery | Edge Delivery Services (EDS) |

---

## 2. Authoring Criteria

**Title** — optional. A heading displayed above the anchor list (e.g. "On this page"). If omitted, the anchor list renders without a heading.

**Anchor links are generated automatically.** The block JS scans the page for all H2 headings at delivery time and builds a navigation list with one link per heading. No manual entry of links is required.

**Authors do not need to create or maintain the link list.** When H2 headings are added, removed, or reordered on the page, the anchor list updates automatically on next page load.

---

## 3. Variants

| Variant | DA Block Name | CSS Classes | Description | Reference |
|---|---|---|---|---|
| default | `Anchor List` | `.anchor-list` | Vertical anchor list — links stacked vertically. | Services — Thermo Fisher Scientific |
| classic-horizontal | `Anchor List (classic-horizontal)` | `.anchor-list.classic-horizontal` | Horizontal layout — links displayed in a horizontal row. | Cell & Gene Therapy Solutions — Thermo Fisher Scientific |

Authors select variants by including the variant name in parentheses in the block table header row.

---

## 4. DA Block Table Contract

### 4.1 Table Structure

The Anchor List block is a **minimal table**. The block only needs a header row to identify itself. An optional title row can be added.

| Column | Role | Content |
|---|---|---|
| Column 1 | Key | Property name (`title`) |
| Column 2 | Value | Property value |

### 4.2 Block Header and Variants

The first row of the table is the block header.

| Author types in header row | Resulting CSS classes |
|---|---|
| `Anchor List` | `.anchor-list` (default — vertical) |
| `Anchor List (classic-horizontal)` | `.anchor-list.classic-horizontal` |

### 4.3 How the Block Works at Delivery Time

1. Block JS scans the page for all H2 headings
2. For each H2, generates an anchor ID (based on the heading text) and creates a link
3. Renders the list of links inside the block — either vertically (default) or horizontally (classic-horizontal)
4. Clicking a link smooth-scrolls to the corresponding H2 section on the page

The author does not manage this list. It is fully automatic.

### 4.4 Authoring Summary

| Concern | Approach |
|---|---|
| Block type | Flattened block — minimal table |
| Anchor links | Auto-generated from H2 headings — no manual authoring |
| Title | Optional — add a `title` row if a heading above the list is needed |
| Variant selection | Variant name in block header: `Anchor List (variant)` |
| Link maintenance | None — list updates automatically when H2 headings change |

---

## 5. Authoring Examples

### 5.1 Example 1 — Default Anchor List with Title

A vertical anchor list with a "On this page" heading.

| Anchor List | |
|---|---|
| title | On this page |

**Page has these H2 headings:**
- Overview
- Features
- Specifications
- Resources

**What renders:** A vertical list with heading "On this page" followed by four anchor links:

```
On this page
  • Overview
  • Features
  • Specifications
  • Resources
```

Each link scrolls to the corresponding section on the page.

---

### 5.2 Example 2 — Horizontal Anchor List with Title

A horizontal anchor list for in-page navigation.

| Anchor List (classic-horizontal) | |
|---|---|
| title | Jump to |

**What renders:** A horizontal row of anchor links with heading "Jump to":

```
Jump to:   Overview  |  Features  |  Specifications  |  Resources
```

---

### 5.3 Example 3 — Anchor List without Title

A minimal anchor list — no heading, just the links.

| Anchor List | |
|---|---|

**What renders:** An anchor link list with no heading. The links are generated from H2 headings on the page.

---

### 5.4 Example 4 — Anchor List on a Long-Form Page

A typical usage on a product or services page with multiple content sections.

**Page structure in DA:**

```
[Section 1]
  | Anchor List |            ← block auto-generates links from H2s below
  | title | On this page |
  ---
[Section 2]
  ## Overview                ← H2 — becomes anchor link
  Content...
  ---
[Section 3]
  ## Key Features            ← H2 — becomes anchor link
  Content...
  ---
[Section 4]
  ## Technical Specs         ← H2 — becomes anchor link
  Content...
  ---
[Section 5]
  ## Downloads & Resources   ← H2 — becomes anchor link
  Content...
```

**What renders:** The Anchor List at the top of the page displays four links — Overview, Key Features, Technical Specs, Downloads & Resources. Clicking any link scrolls to that section.
