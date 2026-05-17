# Tabs Block — DA + EDS Solution Design

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
4. [DA Authoring Contract](#4-da-authoring-contract)
5. [Authoring Patterns](#5-authoring-patterns)

---

## 1. Block Overview

| Property | Value |
|---|---|
| Block Name | Tab List |
| Description | A tabbed container that organizes content into switchable panels. Each tab is a title + body pair. Clicking a tab reveals its panel and hides the others. |
| Authoring Strategy | Section-based — each tab panel is a DA section with `tab-label` metadata. A Tab List block acts as the controller. |
| Authoring Source | DA (Document Authoring) |
| Delivery | Edge Delivery Services (EDS) |

---

## 2. Authoring Criteria

**Tab label** — required. The text displayed on the tab button. Authored as `tab-label` in the Section Metadata of each tab panel section. Plain text only.

**Tab body** — required. The content displayed when the tab is active. Authored directly in the tab panel section using any blocks — cards, tables, columns, videos, product lists, images, text.

**Author can add as many tab panel sections as needed.** Each section with a `tab-label` renders as one tab.

The tabs block must support the following content types within tab panels:

- Cards
- Tables
- Columns
- Videos
- Product Lists
- Images and rich text

Each content type is authored as a block directly inside the tab panel section — the same way blocks are authored in any regular section. No fragment pages are needed.

**Mobile behaviour:** On mobile devices, the tabbed interface collapses into an accordion layout for better usability.

---

## 3. Variants

| Variant | DA Block Name | CSS Classes | Description | Reference |
|---|---|---|---|---|
| default | `Tab List` | `.tab-list` | Standard horizontal tabs. | OEM Solutions: Custom Commercial Solutions — Thermo Fisher Scientific |
| classic-workflow | `Tab List (classic-workflow)` | `.tab-list.classic-workflow` | Step-by-step workflow style with numbered step indicators. | Molecular Cloning Essentials — Thermo Fisher Scientific |

Authors select variants by including the variant name in parentheses in the Tab List block table header row.

### Show All Option

The Tab List block supports an optional "Show All" feature. When enabled, a "Show All" button is prepended to the tab bar. Clicking it displays all tab panels simultaneously.

This is authored as a row in the Tab List block table:

| Tab List | |
|---|---|
| show-all | true |

---

## 4. DA Authoring Contract

### 4.1 Section-Based Pattern

Unlike flattened blocks (such as Accordion), the Tabs block uses a **section-based pattern**. This is because tab panels need to contain full blocks (cards, tables, product lists, videos) — content that cannot be represented in a table cell.

Two components work together:

| Component | What It Is | What It Does |
|---|---|---|
| **Tab List** | A block placed inside a regular section | The controller — its JS discovers tab panel sections, generates horizontal tab buttons, and manages show/hide behaviour |
| **Tab Panel** | A regular DA section with `tab-label` in Section Metadata | The content — holds any blocks and provides the tab label |

### 4.2 Page Structure

A tabs group in DA is structured as follows:

```
┌─ Regular Section ──────────────────────────────┐
│                                                │
│   | Tab List |                                 │  ← controller block
│   |----------|                                 │
│                                                │
└────────────────────────────────────────────────┘
  ---  (section separator)
┌─ Tab Panel Section ────────────────────────────┐
│                                                │
│   [Any blocks — cards, tables, video, etc.]    │  ← first tab content
│                                                │
│   | Section Metadata |                  |      │
│   |------------------|------------------|      │
│   | tab-label        | Products         |      │
│                                                │
└────────────────────────────────────────────────┘
  ---  (section separator)
┌─ Tab Panel Section ────────────────────────────┐
│                                                │
│   [Any blocks]                                 │  ← second tab content
│                                                │
│   | Section Metadata |                  |      │
│   |------------------|------------------|      │
│   | tab-label        | Specifications   |      │
│                                                │
└────────────────────────────────────────────────┘
  ---  (section separator)
┌─ Tab Panel Section ────────────────────────────┐
│                                                │
│   [Any blocks]                                 │  ← third tab content
│                                                │
│   | Section Metadata |                  |      │
│   |------------------|------------------|      │
│   | tab-label        | Videos           |      │
│                                                │
└────────────────────────────────────────────────┘
  ---  (section separator)
┌─ Regular Section (no tab-label) ───────────────┐
│                                                │
│   [Other page content]                         │  ← tabs group ends here
│                                                │
└────────────────────────────────────────────────┘
```

**Key rules:**

- The Tab List block must be in a section **before** the tab panel sections
- Each tab panel section must have a `tab-label` in its Section Metadata
- Consecutive sections with `tab-label` are grouped as tabs belonging to the Tab List above them
- A section without `tab-label` (or the end of the page) terminates the tabs group

### 4.3 Tab List Block Table

The Tab List block itself is a simple block table placed in the section before the tab panels. It acts as the controller and optionally holds configuration.

**Minimal (no configuration):**

| Tab List | |
|---|---|

**With variant:**

| Tab List (classic-workflow) | |
|---|---|

**With Show All option:**

| Tab List | |
|---|---|
| show-all | true |

**With variant and Show All:**

| Tab List (classic-workflow) | |
|---|---|
| show-all | true |

### 4.4 Tab Panel Section Metadata

Each tab panel section uses the standard **Section Metadata** block to define the tab label. The Section Metadata table is placed at the end of the section (DA convention).

| Section Metadata | |
|---|---|
| tab-label | Products |

The `tab-label` value becomes the text on the tab button.

### 4.5 Complete Authoring Example

Below is a complete example of a 3-tab interface authored in DA — showing the full document structure as an author would see it.

**Section 1 — Tab List controller:**

| Tab List | |
|---|---|

---

**Section 2 — First tab panel (Products):**

| Cards | |
|---|---|
| Product A image | Product A description |
| Product B image | Product B description |
| Product C image | Product C description |

| Section Metadata | |
|---|---|
| tab-label | Products |

---

**Section 3 — Second tab panel (Specifications):**

| Table | |
|---|---|
| Specification | Value |
| Size | 100ml |
| Weight | 250g |

| Section Metadata | |
|---|---|
| tab-label | Specifications |

---

**Section 4 — Third tab panel (Videos):**

| Video | |
|---|---|
| source | https://www.youtube.com/watch?v=example |

| Section Metadata | |
|---|---|
| tab-label | Videos |

---

**Section 5 — Regular page content (tabs group ends):**

Any content here is outside the tabs.

### 4.6 How the Tab List Block Discovers Tab Panels

At delivery time, the Tab List block JS:

1. Looks at sibling sections that follow the Tab List section
2. Identifies sections that have `tab-label` in their metadata (rendered as `data-tab-label` attribute on the section `<div>`)
3. Collects all consecutive tab-label sections as panels belonging to this Tab List
4. Stops when it encounters a section without `tab-label` or reaches the end of the page
5. Generates a horizontal tab bar with one button per panel, using the `tab-label` values as button text
6. Shows the first tab panel and hides the rest
7. Manages click and keyboard navigation to switch panels

The author does not need to wire anything — the discovery is automatic based on section position and metadata.

### 4.7 Authoring Summary

| Concern | Approach |
|---|---|
| Block type | Section-based — Tab List controller + Tab Panel sections |
| Adding a tab | Author adds a new section with `tab-label` in Section Metadata |
| Removing a tab | Author deletes the tab panel section |
| Reordering tabs | Author moves sections up/down — tab order matches section order |
| Tab label | `tab-label` value in Section Metadata of each tab panel section |
| Tab content | Any blocks authored directly in the tab panel section |
| Variant selection | Variant name in Tab List block header: `Tab List (variant)` |
| Show All option | `show-all: true` row in Tab List block table |

---

## 5. Authoring Patterns

### 5.1 Pattern 1 — Simple Tabs (Text and Images)

**When to use:** Each tab panel contains basic content — text, headings, images, or lists.

**How to author:** Add blocks or default content directly in each tab panel section. No special blocks needed — just type content or add images.

**Suitable for:** Product information tabs, FAQ tabs, overview pages.

### 5.2 Pattern 2 — Complex Tabs (Blocks Inside Panels)

**When to use:** Each tab panel contains structured block content — cards, data tables, videos, product lists, columns, or combinations.

**How to author:** Add any blocks inside the tab panel section, the same way you would add blocks to any regular page section. Each tab panel is a full section — all blocks are supported.

**Suitable for:** Product pages with tabs for specifications/videos/reviews, workflow pages with step-by-step content.

### 5.3 Pattern 3 — Mixed Tabs

A single tabs group can contain panels with different content types. One tab may have a Cards block, another may have a Table, and a third may have plain text. There is no restriction — each tab panel section is independent.

### 5.4 Workflow Tabs (classic-workflow variant)

**When to use:** Content represents a sequential workflow or process with numbered steps.

**How to author:** Use `Tab List (classic-workflow)` in the block header. Each tab panel represents one step in the workflow. The tab buttons render with numbered step indicators instead of plain text tabs.

**Suitable for:** Step-by-step guides, onboarding flows, experimental protocols.

### 5.5 Authoring Experience — What the Author Sees

**At authoring time:** The author sees vertically stacked sections in the DA document. The sections do not look like tabs — they appear as regular content sections one after another.

**At delivery time:** The Tab List block JS transforms these sections into a tabbed interface — generating horizontal tab buttons, hiding all panels except the active one, and managing click/keyboard navigation.

This is expected behaviour. The DA editor shows the content structure; the EDS delivery layer transforms it into the interactive tabbed component.
