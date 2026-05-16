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
4. [Sample URLs](#4-sample-urls)
5. [DA Block Table Contract](#5-da-block-table-contract)
6. [Authoring Patterns](#6-authoring-patterns)
7. [Fragment Authoring](#7-fragment-authoring)
8. [Block JS Rendering Logic](#8-block-js-rendering-logic)
9. [Relationship to AEM 6.4](#9-relationship-to-aem-64)

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

**Panel title** — required. The clickable header for each panel.

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

| Variant | DA Block Name | CSS Classes | Description |
|---|---|---|---|
| default | `Accordion` | `.accordion` | Standard style. Expand/collapse icon on the right. |
| icon-left | `Accordion (icon-left)` | `.accordion.icon-left` | Plus/minus icon on the left of the heading. |
| classic-small | `Accordion (classic-small)` | `.accordion.classic-small` | Alternate smaller style. |
| classic-gray | `Accordion (classic-gray)` | `.accordion.classic-gray` | Gray background with blue text. Typically used with a single accordion item. |

Authors select variants by including the variant name in parentheses in the block table header row.

---

## 4. Sample URLs

Live site references showcasing content types inside accordion panels:

| Content Pattern | Reference URL |
|---|---|
| Rich text + links | Reducing Hazardous Materials and Waste — Thermo Fisher Scientific |
| Product list inside panel | Attune Flow Cytometer Features — Thermo Fisher Scientific |
| Mixed content | Advancing Neuronal Research — Thermo Fisher Scientific |
| classic-small variant | Aspire Member Program — Thermo Fisher Scientific |
| classic-gray variant | OEM Solutions: Custom Commercial Solutions — Thermo Fisher Scientific |

---

## 5. DA Block Table Contract

### 5.1 Table Structure

The accordion is authored as a **single block table** in the DA document. Each row represents one collapsible panel.

| Column | Role | Content |
|---|---|---|
| Column 1 | Panel Title | The clickable header text for the collapsible panel |
| Column 2 | Panel Body | Rich text content directly, OR a link to a fragment page |

### 5.2 Example — Simple Content (FAQ-style)

| Accordion | |
|---|---|
| What is Western Blotting? | Western blotting is a technique used to detect specific proteins in a sample. It involves separating proteins by gel electrophoresis. |
| How does it work? | The process involves three steps: **separation**, **transfer**, and **detection**. |
| What equipment do I need? | You will need a gel electrophoresis system, transfer apparatus, and detection reagents. See our [product guide](/products/western-blot). |

### 5.3 Example — Fragment Content (Complex panels)

| Accordion | |
|---|---|
| Product Specifications | [/fragments/accordion/product-specs](/fragments/accordion/product-specs) |
| Technical Details | [/fragments/accordion/tech-details](/fragments/accordion/tech-details) |

### 5.4 Example — Mixed (Simple + Fragment)

| Accordion (icon-left) | |
|---|---|
| What is it? | A simple text explanation with **formatting** and [links](/learn-more). |
| Product Specifications | [/fragments/accordion/product-specs](/fragments/accordion/product-specs) |
| Frequently Asked Questions | Visit our [FAQ page](/support/faq) or contact [support](/contact). |

### 5.5 Authoring Strategy Summary

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

## 6. Authoring Patterns

### 6.1 Pattern 1 — Simple Content (Rich Text)

**When to use:** Panel body contains text, links, images, or lists — content that fits naturally in a DA table cell.

**How to author:** Type or paste content directly into column 2 of the block table. DA supports rich text formatting within table cells including bold, italic, links, lists, and inline images.

**Suitable for:** FAQ pages, text-only explanations, simple content with links.

### 6.2 Pattern 2 — Complex Content (Fragment Reference)

**When to use:** Panel body requires content that cannot be represented in a single table cell — such as multi-column layouts, embedded videos, product lists, forms, or combinations of multiple blocks.

**How to author:**

1. Create a new DA page at a logical fragment path (e.g. `/fragments/accordion/product-specs`)
2. Author the complex content on that page using any blocks — Columns, Video, Product List, etc.
3. In the accordion table, place a link to this fragment page in column 2

**How the block identifies a fragment reference:**

The block JS checks column 2 for all three of these conditions:

- The cell contains only a single link element
- The link points to an internal path (starts with `/`)
- No other text or elements are present in the cell

If all three are met → the block treats it as a fragment reference and fetches the content at render time. Otherwise → the cell content is rendered directly as the panel body.

**Suitable for:** Product specifications, comparison tables, video content, multi-column layouts inside a panel.

### 6.3 Pattern 3 — Mixed

A single accordion block can contain both simple and fragment panels. There is no restriction — each row is evaluated independently. Authors choose the appropriate pattern per panel based on content complexity.

---

## 7. Fragment Authoring

### 7.1 How Fragments Work in DA

Fragments are regular DA pages. There is no special fragment content type or template. Any DA page can be referenced as a fragment.

| Step | Author Action |
|---|---|
| 1. Create fragment page | Create a new page in DA under a dedicated fragments folder (e.g. `/fragments/accordion/`) |
| 2. Author content | Add any blocks — Columns, Video, Product List, Tables — as needed |
| 3. Reference from accordion | Place a link to the fragment page path in the accordion table cell |
| 4. Preview | Preview the accordion page — the fragment content renders inside the panel |

### 7.2 Fragment Folder Convention

A recommended folder structure for fragment pages:

```
/fragments/
  /accordion/
    product-specs
    tech-details
    comparison-table
  /shared/
    contact-info
    disclaimer
```

This keeps fragment pages organized and separate from main site pages. The folder structure is a convention — not enforced by the system.

### 7.3 Fragment Reuse

A single fragment page can be referenced from multiple accordion panels across different pages. If the fragment content is updated, all pages referencing it will reflect the change on next publish.

### 7.4 Comparison with AEM Approach

| Aspect | AEM (UE) Approach | DA Approach |
|---|---|---|
| Fragment creation | Author creates an AEM page, authors content in UE | Author creates a DA page, authors content in DA editor |
| Fragment reference | `fragmentPath` field with AEM content picker (path browser) | Link to the fragment page path in the table cell |
| Fragment rendering | Block JS fetches `.plain.html` and renders inline | Same — block JS fetches `.plain.html` and renders inline |
| Content types supported | Any blocks supported in UE | Any blocks supported in DA |
| Discovery | Content picker browses AEM content tree | Author types or pastes the path |

The runtime rendering behavior is identical — only the authoring experience for referencing fragments differs.

---

## 8. Block JS Rendering Logic

### 8.1 Overview

The accordion block JS (`accordion.js`) processes the block table during EDS page decoration.

### 8.2 Rendering Steps

```
For each row in the accordion block table:

1. Read column 1 → Panel title
   → Render as <details><summary> (clickable header)

2. Read column 2 → Determine content type:

   a. If cell contains ONLY a single internal link (fragment reference):
      → Fetch the fragment page's .plain.html
      → Render fragment content inside the panel body
      → Decorate any blocks within the fragment (so nested blocks work)

   b. Otherwise (rich text content):
      → Render cell content directly as the panel body

3. Wrap each panel in a <details> element

4. Apply variant-specific CSS classes from the block name
```

### 8.3 HTML Output Structure

```html
<div class="accordion icon-left">
  <details>
    <summary>Panel Title 1</summary>
    <div class="accordion-body">
      <!-- rich text content or fetched fragment content -->
    </div>
  </details>
  <details>
    <summary>Panel Title 2</summary>
    <div class="accordion-body">
      <!-- content -->
    </div>
  </details>
</div>
```

The `<details>/<summary>` pattern provides native browser expand/collapse behavior with accessibility and keyboard navigation support.

---

## 9. Relationship to AEM 6.4

This section maps AEM 6.4 concepts to their DA/EDS equivalents for migration reference.

| AEM 6.4 Concept | DA/EDS Equivalent |
|---|---|
| Nested components inside accordion items (parsys per item) | Fragment reference pattern — complex content authored in fragment pages, referenced via link in table cell |
| FAQ List with FAQ Items (v1) | Same structure — accordion table with one row per panel |
| Style System options per template | Variant name in block table header: `Accordion (variant)` |
| Experience Fragment inclusion | Fragment page link in table cell — block JS fetches and renders inline |
| Component dialog fields (summary, text, fragmentPath) | Table columns — column 1 = title, column 2 = body or fragment link |
| `component-filters.json` restricting child types | Not needed — flattened block, no parent-child model |
| `component-definition.json` with model IDs | Optional — simplified field definitions for DA library dialog |
| Server-side rendering via Sling Models | Client-side rendering via block JS `decorate()` function |
