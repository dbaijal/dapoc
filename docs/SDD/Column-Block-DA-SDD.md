# Column Block — DA + EDS Solution Design

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
| Block Name | Columns |
| Description | Creates multi-column layouts for side-by-side content presentation. The number of table columns determines the number of rendered columns. Variants control width distribution. |
| Authoring Strategy | Flattened block — each table column maps directly to a rendered column. Rich text content authored directly in each cell. |
| Authoring Source | DA (Document Authoring) |
| Delivery | Edge Delivery Services (EDS) |

---

## 2. Authoring Criteria

**Column content (rich text)** — required (at least one column). Each table column contains the content for that rendered column. Supports:

- Text (paragraphs, headings, bold, italic)
- Images
- Links and lists
- Any inline content that fits in a DA table cell

**Author determines the number of columns by the number of table columns.** A 2-column table renders a 2-column layout. A 3-column table renders a 3-column layout.

**Width distribution** is controlled via variants. If no variant is specified, columns are equal width.

---

## 3. Variants

### 3.1 Two-Column Width Variants

| Variant | DA Block Name | Description | Reference |
|---|---|---|---|
| default | `Columns` | Two equally-sized columns (50/50) | Sustainable Design — Thermo Fisher Scientific |
| 60-40 | `Columns (60-40)` | Left column 60%, right column 40% | Sustainable Design — Thermo Fisher Scientific |
| 40-60 | `Columns (40-60)` | Left column 40%, right column 60% | |
| 30-70 | `Columns (30-70)` | Left column 30%, right column 70% | Protein Assays and Analysis — Thermo Fisher Scientific |
| 70-30 | `Columns (70-30)` | Left column 70%, right column 30% | Protein Assays and Analysis — Thermo Fisher Scientific |

### 3.2 Three-Column Width Variants

| Variant | DA Block Name | Description | Reference |
|---|---|---|---|
| 3 equal columns | `Columns` (with 3 table columns) | Three columns of equal width (33/33/33) | Lab Centrifuges — Thermo Fisher Scientific |
| 25-50-25 | `Columns (25-50-25)` | Middle column 50%, side columns 25% each | |

### 3.3 Visual Treatment Variants

| Variant | DA Block Name | Description | Reference |
|---|---|---|---|
| classic-profile | `Columns (classic-profile)` | Clickable images with gray text underneath | Meet the Innovators — Thermo Fisher Scientific |

Visual treatment variants can be combined with width variants: `Columns (60-40, classic-profile)`.

---

## 4. DA Block Table Contract

### 4.1 Table Structure

The Columns block maps **table columns directly to rendered columns**. Each cell in the table becomes one column in the rendered layout.

**2-column layout:**

| Columns | |
|---|---|
| Left column content | Right column content |

**3-column layout:**

| Columns | | |
|---|---|---|
| Left column content | Middle column content | Right column content |

### 4.2 Block Header and Variants

The first row of the table is the block header. It identifies the block and optionally specifies a width variant.

| Author types in header row | Resulting layout |
|---|---|
| `Columns` | Equal width columns (number determined by table columns) |
| `Columns (60-40)` | Left 60%, right 40% |
| `Columns (40-60)` | Left 40%, right 60% |
| `Columns (70-30)` | Left 70%, right 30% |
| `Columns (30-70)` | Left 30%, right 70% |
| `Columns (25-50-25)` | Left 25%, middle 50%, right 25% |
| `Columns (classic-profile)` | Equal width with profile card styling |

Content row starts from row 2. Each cell in the content row contains the content for that column.

### 4.3 Column Content

Each cell supports rich text content. Authors can place any combination of:

- Headings
- Paragraphs
- Bold, italic, links
- Images
- Lists
- Links that serve as CTAs (using CTA plugin)

### 4.4 Authoring Summary

| Concern | Approach |
|---|---|
| Block type | Flattened block — table columns = rendered columns |
| Number of columns | Determined by number of table columns (2 or 3) |
| Width distribution | Variant in block header (60-40, 70-30, 25-50-25, etc.) |
| Column content | Rich text authored directly in each cell |
| Visual treatment | Variant in block header (classic-profile) |
| Default behaviour | Equal width columns when no width variant specified |

---

## 5. Authoring Examples

### 5.1 Example 1 — Default Two Equal Columns

Two columns of equal width with text and image content.

| Columns | |
|---|---|
| **Our Mission** We are committed to making the world healthier, cleaner, and safer through innovative scientific solutions. | ![lab image](lab-research.jpg) |

**What renders:** Two equally-sized columns side by side. Left column has a heading and paragraph. Right column has an image.

---

### 5.2 Example 2 — 60-40 Layout

Left column takes up more space (60%) with detailed text, right column (40%) has a supporting image.

| Columns (60-40) | |
|---|---|
| **Protein Assays and Analysis** Our comprehensive portfolio of protein assay kits and reagents provides accurate and reproducible protein quantitation across a wide dynamic range. Choose from colorimetric, fluorescent, and chemiluminescent detection methods. | ![protein assay](protein-assay.jpg) |

**What renders:** Two columns — left column wider (60%) with heading and description, right column narrower (40%) with an image.

---

### 5.3 Example 3 — 30-70 Layout

Narrow left column with an image, wider right column with content.

| Columns (30-70) | |
|---|---|
| ![product thumbnail](product-thumb.jpg) | **Applied Biosystems Thermal Cyclers** Advanced thermal cycling technology for PCR applications. Our systems deliver precise temperature control and fast ramp rates for reliable results. [Learn more](/products/thermal-cyclers) |

**What renders:** Two columns — left narrow (30%) with a product image, right wide (70%) with heading, description, and a link.

---

### 5.4 Example 4 — Three Equal Columns

Three columns of equal width.

| Columns | | |
|---|---|---|
| **Life Sciences** Research products for cell analysis and gene expression. | **Applied Sciences** Customized kits and solutions for production settings. | **Clinical** Diagnostics and translational research solutions. |

**What renders:** Three equally-sized columns side by side, each with a heading and short description.

---

### 5.5 Example 5 — 25-50-25 Layout

Three columns with a wider middle column.

| Columns (25-50-25) | | |
|---|---|---|
| ![icon-1](icon-quality.png) | **Quality Assurance** Our rigorous quality control processes ensure every product meets the highest standards of performance and reliability. All products are tested and certified before shipment. | ![icon-2](icon-certified.png) |

**What renders:** Three columns — narrow side columns (25% each) with icons, wide middle column (50%) with heading and detailed text.

---

### 5.6 Example 6 — Classic Profile Variant

Clickable profile images with text underneath.

| Columns (classic-profile) | | |
|---|---|---|
| [![Dr. Smith](profile-smith.jpg)](/team/smith) **Dr. Sarah Smith** Principal Scientist | [![Dr. Jones](profile-jones.jpg)](/team/jones) **Dr. Mark Jones** Research Director | [![Dr. Patel](profile-patel.jpg)](/team/patel) **Dr. Anita Patel** Lab Manager |

**What renders:** Three columns with clickable profile images and gray text underneath each — a team/people grid layout.
