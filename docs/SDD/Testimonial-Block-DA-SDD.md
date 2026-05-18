# Testimonial Block — DA + EDS Solution Design

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
5. [CTA Authoring](#5-cta-authoring)
6. [Authoring Examples](#6-authoring-examples)

---

## 1. Block Overview

| Property | Value |
|---|---|
| Block Name | Testimonial |
| Description | Displays customer quotes with attribution. Adapts layout based on what content the author provides. |
| Authoring Strategy | Flattened block — key-value pair table. Each row is a named property. Only include rows for fields that are needed. |
| Authoring Source | DA (Document Authoring) |
| Delivery | Edge Delivery Services (EDS) |

---

## 2. Authoring Criteria

**Quote (rich text)** — required. The testimonial quote and any supporting description. Supports bold, italic, and links.

**Author attribution (rich text)** — required. Name, title, and organization of the person being quoted.

**Author image** — optional. A small headshot displayed inline next to the author name. If omitted, the testimonial renders without an image.

**CTA link** — optional. A link to the full customer story or video. Authored using the CTA plugin for consistent styling and icons.

**Note:** CTA should use only standard CTA icons. Legacy red icons from Classic are not supported.

---

## 3. Variants

| Variant | DA Block Name | CSS Classes | Description | Reference |
|---|---|---|---|---|
| default | `Testimonial` | `.testimonial` | Standard testimonial layout | Attune Flow Cytometer Features — Thermo Fisher Scientific |

The block adapts its layout based on which optional fields are present:

- Quote + attribution only → compact text-only layout
- Quote + attribution + image → image appears alongside attribution
- Quote + attribution + image + CTA → full testimonial with action link

No separate variants needed for these layouts — the block JS adapts automatically.

---

## 4. DA Block Table Contract

### 4.1 Table Structure

The Testimonial block uses a **key-value pair** pattern. Each row has a property name in column 1 and its value in column 2. Only include rows for fields that are needed.

| Column | Role | Content |
|---|---|---|
| Column 1 | Key | Property name |
| Column 2 | Value | Property value |

### 4.2 Available Properties

| Key (Column 1) | Value (Column 2) | Required | Description |
|---|---|---|---|
| `quote` | Rich text | Yes | The testimonial quote — supports bold, italic, links |
| `attribution` | Rich text | Yes | Author name, title, and organization |
| `image` | Image (drag and drop) | No | Author headshot — small image displayed next to attribution |
| `cta` | CTA content (via CTA plugin) | No | Link to full customer story or video |

### 4.3 Block Header

The first row is the block header. Only one variant exists (default), so the header is simply:

| Testimonial | |
|---|---|

### 4.4 How the Block Adapts

The block JS renders different layouts based on which fields are present:

| Fields provided | Layout |
|---|---|
| quote + attribution | Text-only testimonial — quote with attribution below |
| quote + attribution + image | Testimonial with author headshot next to attribution |
| quote + attribution + cta | Testimonial with action link at the bottom |
| quote + attribution + image + cta | Full testimonial — quote, author image, attribution, and CTA |

No variant selection needed — the block adapts automatically.

### 4.5 Authoring Summary

| Concern | Approach |
|---|---|
| Block type | Flattened block — key-value table |
| Quote | Rich text in `quote` row |
| Attribution | Rich text in `attribution` row |
| Author image | Drag and drop into `image` row value cell |
| CTA | Authored using CTA plugin in `cta` row value cell |
| Optional fields | Omit rows that are not needed — block adapts layout |
| Variant | Default only — layout adapts based on content |

---

## 5. CTA Authoring

The testimonial CTA follows the same pattern as all other blocks. The author places cursor in the `cta` value cell and uses the **CTA plugin** to add the call-to-action.

The CTA plugin provides:
- Label (e.g. "Read full story", "Watch video")
- Link (URL to customer story or video)
- Style (Primary, Outline, Link)
- Icon (Arrow, Document, Download, etc.)
- Open in new window

The CTA content format is identical to CTA used in Cards, Hero, and standalone CTA blocks.

---

## 6. Authoring Examples

### 6.1 Example 1 — Full Testimonial (All Fields)

A complete testimonial with quote, attribution, headshot, and CTA.

| Testimonial | |
|---|---|
| quote | "The Attune NxT Flow Cytometer has dramatically improved our throughput. We can now process samples in half the time with better data quality." |
| attribution | **Dr. Sarah Chen**, Senior Research Scientist, Stanford University |
| image | ![Dr. Chen](headshot-chen.jpg) |
| cta | (CTA plugin content: "Read full story" / link / arrow) |

**What renders:** A testimonial card with the quote in large italic text, Dr. Chen's headshot next to her name and title, and a "Read full story" link with arrow icon at the bottom.

---

### 6.2 Example 2 — Testimonial without Image

A text-only testimonial — no headshot.

| Testimonial | |
|---|---|
| quote | "Switching to Thermo Fisher's reagents reduced our assay variability by 40%. The consistency is remarkable." |
| attribution | **Mark Johnson**, Lab Director, BioPharm Inc. |
| cta | (CTA plugin content: "Watch video" / link / arrow) |

**What renders:** A testimonial with quote and attribution text. No image. "Watch video" link at the bottom.

---

### 6.3 Example 3 — Minimal Testimonial (Quote + Attribution Only)

The simplest testimonial — just a quote and who said it.

| Testimonial | |
|---|---|
| quote | "Best-in-class thermal cycling performance." |
| attribution | **Dr. Anita Patel**, Harvard Medical School |

**What renders:** A compact text testimonial — quote followed by the attribution. No image, no CTA.

---

### 6.4 Example 4 — Testimonial with Video CTA

A testimonial linking to a customer video.

| Testimonial | |
|---|---|
| quote | "The Ion Torrent platform gave us the sequencing power we needed at a fraction of the cost. It changed how we approach genomics research." |
| attribution | **Prof. David Kim**, Director of Genomics, Seoul National University |
| image | ![Prof. Kim](headshot-kim.jpg) |
| cta | (CTA plugin content: "Watch customer story" / primary / arrow) |

**What renders:** Full testimonial card with quote, author headshot, attribution, and a primary CTA button linking to the video.
