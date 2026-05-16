# Document Authoring (DA) — Authoring Model

**Document Version:** 1.0
**Status:** Draft
**Date:** 2026-05-16
**Author:** Adobe Delivery Team

---

## Table of Contents

1. [Introduction to DA Authoring](#1-introduction-to-da-authoring)
2. [DA Authoring Model](#2-da-authoring-model)
3. [Variants and Configuration](#3-variants-and-configuration)
4. [Common Authoring Concepts](#4-common-authoring-concepts)
5. [Comparison with Traditional AEM Authoring](#5-comparison-with-traditional-aem-authoring)
6. [Authoring Experience and Governance](#6-authoring-experience-and-governance)

---

## 1. Introduction to DA Authoring

### 1.1 What is Document Authoring (DA)?

Document Authoring (DA) is a web-based content authoring environment provided by Adobe at **da.live**. It replaces the traditional AEM Author environment (Sites Editor, Touch UI) as the primary content editing interface for Edge Delivery Services (EDS) projects.

In DA, authors work in a document-style editor that resembles a simplified word processor. Content is authored as structured text, tables, images, and links — which EDS transforms into fully rendered web pages at delivery time.

### 1.2 How Authoring Differs from Traditional AEM

| Aspect | Traditional AEM (6.x) | Document Authoring (DA) |
|---|---|---|
| Editor | AEM Sites Editor (Touch UI) with component dialogs | Web-based document editor at da.live |
| Content storage | JCR (Java Content Repository) with structured node trees | HTML documents |
| Component authoring | Drag component onto page, fill dialog fields, save to JCR | Type content and build tables in a document |
| Preview | AEM Preview mode or Publisher | EDS preview via `.page` URLs |
| Learning curve | Requires AEM-specific training | Familiar document editing experience |

### 1.3 Authoring Philosophy

The DA/EDS authoring philosophy centers on three principles:

1. **Content over configuration** — Authors focus on writing content, not configuring component properties. The content structure itself drives the rendering.

2. **Tables as the universal contract** — Every block (component) is represented as a table in the document. The table header names the block, and the rows contain the content. This is the single pattern authors need to learn.

3. **Simplicity by design** — Complex component dialogs with dozens of fields are replaced by intuitive table structures. Configuration that was previously spread across dialog tabs is either simplified, moved to styling conventions, or handled by the block's JavaScript at delivery time.

---

## 2. DA Authoring Model

### 2.1 Page Structure

A DA page is composed of **sections** separated by horizontal rules (`---`). Each section can contain:

- **Default content** — Text, headings, images, and links authored directly (not inside a table). This renders as standard HTML content.
- **Blocks** — Structured content authored as tables. Each table represents a block (component) that EDS processes and renders.

```
[Section 1]
  Heading, paragraph, image         ← default content
  ---                               ← section separator
[Section 2]
  Block table (e.g. Accordion)      ← block content
  ---
[Section 3]
  Default content + Block table     ← sections can contain both
```

### 2.2 How Blocks Are Represented

Every block is a **table** in the DA document. The structure follows a consistent pattern:

- **Row 1 (header):** Block name — identifies which block this is
- **Rows 2+:** Content rows — each row provides data for the block

**Example — a simple block:**

| Columns |  |
|---|---|
| Left column content | Right column content |

**Example — a block with key-value configuration:**

| Hero |  |
|---|---|
| image | `/media/hero-banner.jpg` |
| title | Accelerating Scientific Discovery |
| subtitle | Explore our portfolio of solutions |
| cta-text | Learn More |
| cta-link | `/products/overview` |

### 2.3 How Rows and Columns Map to Content

The meaning of rows and columns depends on the block's design:

**Pattern A: Each row is a repeatable item**
Used when a block contains a list of similar items (e.g. accordion panels, cards, carousel slides).

| Accordion |  |
|---|---|
| Panel 1 Title | Panel 1 body content |
| Panel 2 Title | Panel 2 body content |
| Panel 3 Title | Panel 3 body content |

Each row = one item. Column position determines the role (column 1 = title, column 2 = body).

**Pattern B: Each row is a named property**
Used when a block has distinct configuration fields (e.g. hero, form container, embed).

| Form Container |  |
|---|---|
| action | `/api/submit` |
| method | POST |
| thankyou | `/thank-you` |

Each row = one property. Column 1 = property name, column 2 = value.

**Pattern C: Grid or multi-column layout**
Used when content needs to be arranged in columns.

| Columns (3) |  |  |
|---|---|---|
| Column 1 content | Column 2 content | Column 3 content |

Number of columns in the table = number of rendered columns.

### 2.4 How DA Content Becomes an EDS Page

```
Author creates content in DA
         |
         v
DA stores the document as HTML
         |
         v
EDS reads the HTML and applies block definitions
         |
         v
Block tables → converted to <div> structures with CSS classes
Default content → rendered as standard semantic HTML
         |
         v
Block JS (decorate function) transforms the div structure
into the final interactive component
         |
         v
Page is served to the end user
```

The block's JavaScript `decorate()` function is responsible for reading the table-derived DOM structure and transforming it into the final rendered component (e.g. turning table rows into `<details>/<summary>` elements for an accordion).

---

## 3. Variants and Configuration

### 3.1 How Variants Work

In traditional AEM, component variants are selected via a **Style System dropdown** or dialog field that writes a class to JCR. In DA, variants are authored directly in the **block name** using parentheses.

**Syntax:**

```
Block Name (variant)
```

**Examples:**

| Author types | CSS classes applied | Rendered as |
|---|---|---|
| `Accordion` | `.accordion` | Default style |
| `Accordion (icon-left)` | `.accordion.icon-left` | Icon on the left |
| `Accordion (classic-gray)` | `.accordion.classic-gray` | Gray background variant |
| `Hero (large)` | `.hero.large` | Large hero variant |
| `Cards (horizontal)` | `.cards.horizontal` | Horizontal card layout |

Multiple variants can be combined:

| `Cards (horizontal, bordered)` | `.cards.horizontal.bordered` |
|---|---|

### 3.2 Section-Level Styling

Sections themselves can have metadata that controls their styling. A **Section Metadata** table at the end of a section applies configuration to the entire section:

| Section Metadata |  |
|---|---|
| style | dark-background |

This adds the class `dark-background` to the section's `<div>`, allowing CSS to style the entire section (background color, text color, spacing, etc.).

### 3.3 Configuration Patterns

For blocks that require configuration beyond just content, there are two patterns:

**Inline configuration — properties as rows in the same block table:**

| Hero |  |
|---|---|
| image | `/media/banner.jpg` |
| title | Welcome |
| autoplay | true |

**Companion block — a separate configuration block:**

Used when configuration is complex or shared. For example, the form system uses a separate `tfs-form-rules` block alongside the main `tfs-form` block.

| tfs-form |  |
|---|---|
| action | `/api/submit` |

| tfs-form-rules |  |
|---|---|
| 1-target | state |
| 1-action | show |
| 1-cond-1 | `country~contains~IN` |

---

## 4. Common Authoring Concepts

### 4.1 Blocks (Components)

Every AEM component maps to an EDS **block**. A block is:

- Authored as a **table** in the DA document
- Identified by the **table header** (block name)
- Rendered by a **JavaScript file** (`block-name.js`) and **CSS file** (`block-name.css`)

| AEM Concept | DA/EDS Equivalent |
|---|---|
| Component | Block |
| Component dialog | Table structure (or Plugin UI for complex blocks) |
| `cq:Component` resource type | Block folder name |
| Component HTL/JSP | Block `decorate()` function in JS |
| Component clientlib CSS | Block CSS file |

### 4.2 Variants

See Section 3.1. Variants replace the AEM Style System. Instead of a dropdown in a dialog, the variant name is part of the block header. This is visible and explicit — authors always know which variant is in use.

### 4.3 Nested and Complex Content

DA tables support rich content within cells — including formatted text, images, links, and lists. For content that cannot be represented within a table cell (multi-column layouts, videos, other blocks), the **fragment reference pattern** is used:

1. Author creates the complex content as a separate DA page (a fragment)
2. In the parent block's table cell, author places a **link** to the fragment page
3. At render time, the block JS fetches the fragment's content and renders it inline

This is the DA equivalent of AEM's Experience Fragment or Content Fragment inclusion, without requiring a dedicated content picker dialog.

### 4.4 References, Links, and Assets

| Content Type | How to Author in DA |
|---|---|
| Internal page link | Type or paste the page path as a link |
| External URL | Type or paste the full URL as a link |
| Image | Drag and drop or paste into the document/cell |
| PDF or document | Upload via DA and link to the asset |
| Fragment reference | Link to the fragment page path in a table cell |

Assets are managed directly in DA's file browser — no separate DAM interface.

### 4.5 Multi-Column and Structured Layouts

Multi-column layouts are authored using the **Columns** block:

| Columns |  |  |
|---|---|---|
| Content for column 1 | Content for column 2 | Content for column 3 |

The number of table columns determines the layout columns. Each cell can contain rich content.

### 4.6 Reusable Content

Reusable content patterns in DA:

| AEM Pattern | DA Equivalent |
|---|---|
| Experience Fragment | Fragment page — a DA page referenced by link from other pages/blocks |
| Content Fragment | Spreadsheet (`.json`) — structured data served as JSON via EDS |
| Editable Template | Page template defined via metadata and section structure |
| Shared component configurations | Spreadsheet-based configuration (e.g. `/data/countries.json`) |

---

## 5. Comparison with Traditional AEM Authoring

### 5.1 Side-by-Side Comparison

| Aspect | AEM 6.x Authoring | DA/EDS Authoring |
|---|---|---|
| **Editor** | AEM Sites Editor (Touch UI) | Web document editor (da.live) |
| **Component placement** | Drag from side panel onto parsys | Type content or build tables in document |
| **Component configuration** | Open dialog, fill fields across tabs | Content is the configuration — structured via table rows/columns |
| **Variant selection** | Style System dropdown in dialog | Variant name in block table header: `Block (variant)` |
| **Nested components** | Drag child components into parent parsys | Fragment reference pattern — link to fragment page |
| **Content model** | JCR nodes with typed properties | HTML tables with named rows/columns |
| **Preview** | AEM Preview mode | EDS preview URL |
| **Publish** | Replication to AEM Publisher | Publish via DA → live via EDS CDN |
| **Permissions** | AEM user/group ACLs | DA-level access control |
| **Workflow** | AEM Workflow engine | Simplified publish/unpublish |

### 5.2 What Authors Should Expect

**Simpler day-to-day experience:**
- No component dialogs with multiple tabs
- No drag-and-drop from a component side panel
- Content editing feels like editing a document

**Different mental model:**
- Components = tables. The table header is the component name.
- Configuration = rows in the table, not dialog fields
- Variants = part of the block name, not a separate dropdown
- No parsys concept — content flows naturally in the document

**Familiar patterns retained:**
- Rich text editing (bold, italic, links, lists, headings)
- Image insertion via drag and drop
- Preview before publish
- Page-level metadata

### 5.3 Complexity Comparison

| Block Complexity | AEM Approach | DA Approach |
|---|---|---|
| **Simple** (text + image) | Component dialog: 2-3 fields | Table: 2-3 rows. Comparable effort |
| **Medium** (accordion, tabs) | Container component + child items, filters, model definitions | Single table with rows per item. Simpler |
| **Complex** (forms) | Multiple components, dialogs, server-side logic | Block tables + Plugin UI for guided authoring. Similar effort, different tooling |

---

## 6. Authoring Experience and Governance

### 6.1 What Authors Control

Authors have direct control over:

- Page content — text, images, links, lists, headings
- Block selection — which blocks to use (by creating the appropriate table)
- Block variants — by specifying the variant in the block name
- Content order — by arranging blocks and content within sections
- Section structure — by using horizontal rules to define section boundaries
- Section styling — via Section Metadata block
- Page metadata — via Metadata block at the end of the document

### 6.2 What Is Controlled by Block Definitions

The following are governed by the development team, not by authors:

| Governed by | Examples |
|---|---|
| Block JS (`decorate`) | How table content is transformed into rendered HTML, interactive behaviour, fragment fetching |
| Block CSS | Visual styling, spacing, colors, responsive behaviour per variant |
| Page-level scripts/styles | Global styles, fonts, navigation, footer |
| Spreadsheet data | Datasource options (countries, states), shared configuration |

Authors cannot change how a block renders — only what content it renders. This ensures visual and behavioural consistency across the site.

### 6.3 How Consistency Is Maintained

| Concern | Governance Mechanism |
|---|---|
| Visual consistency | Block CSS enforces design tokens (colors, typography, spacing) |
| Block usage guidance | DA Library panel shows available blocks with descriptions |
| Valid variants | Only variants with matching CSS render differently — unknown variants are harmless (no visual change) |
| Content structure | Block JS expects a specific table structure — incorrect tables degrade gracefully |
| Reusable patterns | Fragment pages provide shared content without duplication |
| Configuration data | Spreadsheets (JSON) centralize options and settings |

### 6.4 Plugin-Assisted Authoring

For blocks with complex authoring requirements (e.g. forms with validation rules, field types, and conditional logic), a **DA Plugin** can provide a guided authoring experience:

- Author clicks the block in the DA Library panel
- A plugin UI presents a structured form/dialog
- Author fills in fields, selects options, configures behavior
- Plugin writes the correctly structured block table into the document

This provides the guided authoring experience of AEM component dialogs while maintaining the table-based content model. The plugin is an authoring convenience — the block table remains the source of truth.

### 6.5 Universal Editor (UE) Overlay

DA supports an optional Universal Editor (UE) overlay that provides dialog-based editing on top of the DA document:

- A `component-definition.json` file defines fields for each block
- When an author interacts with a block, UE presents a structured dialog
- The dialog reads from and writes to the same DA table structure

This does not change the authoring model — the block table format remains identical. The UE overlay is a UI enhancement, not a structural change. Blocks authored via raw table editing, Plugin UI, or UE overlay all produce the same output.
