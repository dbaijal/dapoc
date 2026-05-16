# Accordion Block — DA + EDS Solution Design

**Document Version:** 2.0 (DA)
**Status:** Draft
**Date:** 2026-05-16
**Previous Version:** 1.0 (UE + AEM Authoring Source)
**Author:** Adobe Delivery Team

---

## Table of Contents

1. [Block Overview](#1-block-overview)
2. [Authoring Criteria](#2-authoring-criteria)
3. [Variants](#3-variants)
4. [DA Block Table Contract](#4-da-block-table-contract)
5. [Authoring Patterns](#5-authoring-patterns)

---

## 1. Block Overview

| Property | Value |
|---|---|
| Block Name | Accordion |
| Maps to Existing | FAQ List (v1), FAQ Items, Accordion, Accordion Item |
| Description | A vertically stacked list of collapsible panels. Each panel is a title + body pair that expands and collapses on click. |
| Authoring Strategy | Flattened block — single table, each row is one collapsible panel |
| Authoring Source | DA (Document Authoring) |
| Delivery | Edge Delivery Services (EDS) |

---

## 2. Authoring Criteria

**Panel title** — required. The clickable header for each panel. Plain text only — rich text formatting (bold, italic, links) is not supported in titles.

**Panel body** — required. The content revealed when the panel is expanded. Authored either as rich text directly in the table cell, or as a link to a fragment page for complex content.

**Author can add as many title + body pairs as needed.** Each pair renders as one collapsible panel.

The accordion block must support the following content types within panel bodies:

- Rich text (paragraphs, headings, bold, italic, links, lists)
- Images
- Columns
- Tables
- Videos
- Forms
- Product List

Simple content (rich text, images) is authored directly in the table cell. Complex content (columns, videos, forms, product list) is authored as a separate fragment page and referenced via a link.

---

## 3. Variants

| Variant | DA Block Name | CSS Classes | Description | Reference |
|---|---|---|---|---|
| default | `Accordion` | `.accordion` | Standard style. Expand/collapse icon on the right. | |
| icon-left | `Accordion (icon-left)` | `.accordion.icon-left` | Plus sign to the left of the accordion heading. | |
| classic-small | `Accordion (classic-small)` | `.accordion.classic-small` | Alternate smaller style. | Aspire Member Program — Thermo Fisher Scientific |
| classic-gray | `Accordion (classic-gray)` | `.accordion.classic-gray` | Gray background with blue text. Normally occurs with a single accordion item. | OEM Solutions: Custom Commercial Solutions — Thermo Fisher Scientific |

Authors select variants by including the variant name in parentheses in the block table header row.

**Sample URLs showcasing content variants that can be included inside an accordion panel:**

| Content Pattern | Reference URL |
|---|---|
| Rich text + links | Reducing Hazardous Materials and Waste — Thermo Fisher Scientific |
| Product list inside panel | Attune Flow Cytometer Features — Thermo Fisher Scientific |
| Mixed content | Advancing Neuronal Research — Thermo Fisher Scientific |

---

## 4. DA Block Table Contract

### 4.1 Table Structure

The accordion is authored as a **single block table** in the DA document. Each row represents one collapsible panel.

| Column | Role | Content |
|---|---|---|
| Column 1 | Panel Title | The clickable header text for the collapsible panel |
| Column 2 | Panel Body | Rich text content directly, OR a link to a fragment page |

### 4.2 Block Header and Variants

The first row of the table is the **block header** — it identifies the block and optionally specifies a variant. This row is not rendered as a panel.

| Author types in header row | Resulting CSS classes | Variant applied |
|---|---|---|
| `Accordion` | `.accordion` | Default |
| `Accordion (icon-left)` | `.accordion.icon-left` | Icon left |
| `Accordion (classic-small)` | `.accordion.classic-small` | Classic small |
| `Accordion (classic-gray)` | `.accordion.classic-gray` | Classic gray |

Content rows start from row 2 onward. Each content row is one collapsible panel.

### 4.3 Example — Simple Content (FAQ-style)


| Accordion | |
|---|---|
| What is Western Blotting? | Western blotting is a technique used to detect specific proteins in a sample. It involves separating proteins by gel electrophoresis. |
| How does it work? | The process involves three steps: **separation**, **transfer**, and **detection**. |
| What equipment do I need? | You will need a gel electrophoresis system, transfer apparatus, and detection reagents. See our [product guide](/products/western-blot). |

### 4.4 Example — Fragment Content (Complex panels)

| Accordion | |
|---|---|
| Product Specifications | [/fragments/accordion/product-specs](/fragments/accordion/product-specs) |
| Technical Details | [/fragments/accordion/tech-details](/fragments/accordion/tech-details) |

### 4.5 Example — Mixed (Simple + Fragment)

| Accordion (icon-left) | |
|---|---|
| What is it? | A simple text explanation with **formatting** and [links](/learn-more). |
| Product Specifications | [/fragments/accordion/product-specs](/fragments/accordion/product-specs) |
| Frequently Asked Questions | Visit our [FAQ page](/support/faq) or contact [support](/contact). |

### 4.6 Authoring Summary

| Concern | Approach |
|---|---|
| Block type | Flattened block — single table |
| Adding a panel | Author adds a row to the table |
| Removing a panel | Author deletes a row |
| Reordering panels | Author moves rows up/down |
| Simple content | Rich text authored directly in column 2 |
| Complex content | Link to a fragment page in column 2 |
| Variant selection | Variant name in block table header: `Accordion (variant)` |

---

## 5. Authoring Patterns

### 5.1 Pattern 1 — Simple Content (Rich Text)

**When to use:** Panel body contains text, links, images, or lists — content that fits naturally in a DA table cell.

**How to author:** Type or paste content directly into column 2 of the block table. DA supports rich text formatting within table cells including bold, italic, links, lists, and inline images.

**Suitable for:** FAQ pages, text-only explanations, simple content with links.

### 5.2 Pattern 2 — Complex Content (Fragment Reference)

**When to use:** Panel body requires content that cannot be represented in a single table cell — such as multi-column layouts, embedded videos, product lists, forms, or combinations of multiple blocks.

**How to author:**

1. Create a new DA page to hold the complex content (e.g. `/fragments/accordion/product-specs`)
2. Author the complex content on that page using any blocks — Columns, Video, Product List, etc.
3. In the accordion table, place a link to this fragment page in column 2

**How the block identifies a fragment reference:**

The block checks column 2 for all three of these conditions:

- The cell contains only a single link element
- The link points to an internal path (starts with `/`)
- No other text or elements are present in the cell

If all three are met → the block treats it as a fragment reference and fetches the content at render time. Otherwise → the cell content is rendered directly as the panel body.

**Suitable for:** Product specifications, comparison tables, video content, multi-column layouts inside a panel.

### 5.3 Pattern 3 — Mixed

A single accordion block can contain both simple and fragment panels. There is no restriction — each row is evaluated independently. Authors choose the appropriate pattern per panel based on content complexity.

A fragment page can also be referenced from multiple accordion panels across different pages. If the fragment content is updated, all pages referencing it reflect the change on next publish.
