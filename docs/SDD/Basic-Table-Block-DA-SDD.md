# Basic Table Block — DA + EDS Solution Design

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
| Block Name | Table |
| Maps to Existing | Text Component (used for table authoring) |
| Description | A configurable data table with styled headers, borders, alignment, sorting, and striping options. Supports merged cells (colspan/rowspan). |
| Authoring Strategy | Flattened block — the block header row provides the block name and styling variants. All subsequent rows are table content (headers + data). |
| Authoring Source | DA (Document Authoring) |
| Delivery | Edge Delivery Services (EDS) |

---

## 2. Authoring Criteria

**Table headers** — optional. The first content row (row 2 of the table) is treated as the table header row. Can be styled via variant (default, dark, none).

**Table data rows** — required. Each row after the header is a data row. Authors type content directly into cells.

**Merged cells** — supported. Authors can merge cells horizontally (colspan) or vertically (rowspan) using DA's native cell merge feature. Merged cells pass through to the rendered table.

**Cell content** — each cell supports rich text (bold, italic, links, lists, images).

**All styling is controlled via variants in the block header.** Authors do not need to configure properties separately — they combine variant names to get the desired table appearance.

---

## 3. Variants

The Table block supports multiple variants that can be combined. Variants cover header styling, borders, alignment, row colours, and special features.

### 3.1 Header Style

| Variant | Description |
|---|---|
| default (no variant needed) | Light gray background header row |
| `dark` | Charcoal background, white text header row |
| `no-header` | No header styling — first row rendered as regular data |

### 3.2 Border Style

| Variant | Description |
|---|---|
| default (no variant needed) | Bordered — cell borders visible |
| `borderless` | No cell borders |

### 3.3 Text Alignment

| Variant | Description |
|---|---|
| default (no variant needed) | Left-aligned text in all body cells |
| `center` | Center-aligned text in all body cells |

### 3.4 Visual Treatment

| Variant | Description | Reference |
|---|---|---|
| default | Standard table | Luminex System Accessories — Thermo Fisher Scientific |
| `striped` | Alternate row background colours | Air-Drying and Lyophilization — Thermo Fisher Scientific |
| `first-column-colour` | First column has grey background colour | SuperScript III — Thermo Fisher Scientific |
| `sortable-table` | Column headers are clickable for sorting | Cell Viability, Proliferation and Cell Cycle — Thermo Fisher Scientific |
| `elisa-kit` | Custom green + blue design | ELISA Kits and ELISA Components — Thermo Fisher Scientific |

Additional variants will be incorporated during implementation as encountered across the site.

### 3.5 Combining Variants

Authors combine variants with commas in the block header:

| Author types | Result |
|---|---|
| `Table` | Default — light gray header, bordered, left-aligned |
| `Table (dark)` | Dark header, bordered, left-aligned |
| `Table (striped, bordered)` | Striped rows, bordered cells |
| `Table (dark, borderless, center)` | Dark header, no borders, centered text |
| `Table (striped, first-column-colour)` | Striped rows with highlighted first column |
| `Table (sortable-table, dark)` | Sortable columns with dark header |

---

## 4. DA Block Table Contract

### 4.1 Table Structure

The Table block uses the block table itself as the content. The structure is:

- **Row 1** — Block header (block name + variants). Not rendered as table content.
- **Row 2** — Table column headers. Rendered as `<thead>` with styling from header variant.
- **Row 3+** — Table data rows. Rendered as `<tbody>` rows.

| Row | Role |
|---|---|
| Row 1 | Block header — `Table (variants)` |
| Row 2 | Column headers |
| Row 3 onward | Data rows |

### 4.2 Block Header

The first row identifies the block and specifies all styling via variants.

**Format:** `Table (variant, variant, variant)`

All configuration is in the block header — no separate key-value configuration rows needed.

### 4.3 Merged Cells

DA supports merging cells natively. Authors select cells and use the merge option in the DA editor.

- **Horizontal merge (colspan)** — merges cells across columns in the same row
- **Vertical merge (rowspan)** — merges cells across rows in the same column

Merged cells are preserved in the rendered HTML output. The block JS does not alter merge attributes.

### 4.4 Sortable Table Behaviour

When the `sortable-table` variant is used:

- Column headers become clickable
- Clicking a header sorts the table rows by that column
- Clicking again reverses the sort direction
- Sorting is handled client-side by the block JS

### 4.5 Authoring Summary

| Concern | Approach |
|---|---|
| Block type | Flattened block — block header + table content rows |
| Header style | Variant in block header (default, dark, no-header) |
| Borders | Variant in block header (default bordered, borderless) |
| Text alignment | Variant in block header (default left, center) |
| Row striping | Variant in block header (striped) |
| Sorting | Variant in block header (sortable-table) |
| Merged cells | DA native merge — colspan and rowspan supported |
| Adding rows/columns | Author edits the table directly in DA |
| Cell content | Rich text — bold, italic, links, lists, images |

---

## 5. Authoring Examples

### 5.1 Example 1 — Default Table

A standard table with light gray header and bordered cells.

| Table | | | |
|---|---|---|---|
| Feature | Model A | Model B | Model C |
| Weight | 2.5 kg | 3.0 kg | 1.8 kg |
| Capacity | 100 ml | 250 ml | 50 ml |
| Temperature Range | -20°C to 60°C | -40°C to 80°C | -10°C to 40°C |

**What renders:** A standard bordered table with light gray header row containing "Feature", "Model A", "Model B", "Model C". Data rows below with left-aligned text.

---

### 5.2 Example 2 — Dark Header, Striped Rows

A table with dark header styling and alternating row colours.

| Table (dark, striped) | | | |
|---|---|---|---|
| Product | Cat. No. | Size | Price |
| TaqMan Assay | 4331182 | 100 rxns | $299 |
| SYBR Green Master Mix | 4367659 | 200 rxns | $199 |
| PowerUp SYBR Green | 4368577 | 500 rxns | $449 |

**What renders:** Dark charcoal header with white text. Body rows alternate between white and light gray backgrounds for easier reading.

---

### 5.3 Example 3 — Borderless, Centered

A clean table with no borders and centered text.

| Table (borderless, center) | | |
|---|---|---|
| Specification | Value | Unit |
| Voltage | 220 | V |
| Current | 15 | A |
| Power | 3300 | W |

**What renders:** A table with no cell borders, centered text in all cells. Clean minimal appearance.

---

### 5.4 Example 4 — Sortable Table

A data table with clickable column headers for sorting.

| Table (sortable-table, striped) | | | |
|---|---|---|---|
| Event | Date | Location | Type |
| SLAS 2026 | 2026-02-07 | Boston, MA | Tradeshow |
| Bio Europe | 2026-03-15 | Berlin | Conference |
| Lab Summit | 2026-04-22 | San Francisco | Workshop |

**What renders:** A striped table with sort controls on each column header. Clicking "Date" sorts rows chronologically. Clicking "Type" sorts alphabetically.

---

### 5.5 Example 5 — First Column Highlighted

A table with the first column having a grey background for emphasis.

| Table (first-column-colour) | | | |
|---|---|---|---|
| Step | Action | Duration | Notes |
| 1 | Denaturation | 95°C, 30s | Initial step |
| 2 | Annealing | 60°C, 30s | Primer binding |
| 3 | Extension | 72°C, 60s | DNA synthesis |

**What renders:** Standard bordered table where the first column ("Step") has a grey background, making it visually distinct as a row label column.

---

### 5.6 Example 6 — Table with Merged Cells

A table demonstrating merged header cells (colspan).

| Table (dark) | | | | |
|---|---|---|---|---|
| Product Specifications | | | | |
| | Model A | Model B | Model C | Model D |
| Weight | 2.5 kg | 3.0 kg | 1.8 kg | 4.2 kg |
| Dimensions | 30×20×15 cm | 40×25×20 cm | 25×15×10 cm | 50×30×25 cm |

In this example, "Product Specifications" is authored as a merged cell spanning all 5 columns (the author selects the cells and merges them in DA). The block renders it as a full-width header spanning the table.

**What renders:** A dark-header table with a merged title row "Product Specifications" spanning all columns, followed by the sub-header row and data rows.
