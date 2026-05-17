# Hero Block — DA + EDS Solution Design

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
| Block Name | Hero |
| Maps to Existing | Page Heading Hero Component |
| Description | A full-width banner that introduces the page with a background image, heading, and optional call-to-action. |
| Authoring Strategy | Flattened block — key-value pair table. Each row is a named property. Only include rows for fields that are needed. |
| Authoring Source | DA (Document Authoring) |
| Delivery | Edge Delivery Services (EDS) |

---

## 2. Authoring Criteria

**H1 Heading** — derived automatically from page metadata (page title). Authors do **not** author the heading inside the hero block. The block JS reads the page title and renders it as the `<h1>` inside the hero.

**Background image** — optional. The hero background image. Authored by dropping an image into the value cell.

**Foreground image** — optional. A secondary image displayed in front of the background (e.g. product image, logo). Used with the `foreground-image` variant.

**Subtitle** — optional. Secondary text displayed below the heading. Plain text only.

**Description** — optional. Supporting body copy below the subtitle. Supports rich text (bold, italic, links, lists).

**CTA (Call-to-Action)** — optional. 0, 1, or 2 CTA buttons. Each CTA has a text label, link URL, and style (primary or outline).

**Breadcrumb overlay** — optional. When enabled, a breadcrumb trail is displayed overlaid on the hero.

**All fields are optional.** Authors include only the rows they need — omitted rows mean that element is not rendered.

---

## 3. Variants

The Hero block supports multiple variants that can be **combined**. Authors list multiple variants separated by commas in the block header.

### 3.1 Available Variants

| Variant | Description | Reference |
|---|---|---|
| default | Text is black and aligned to the left. No variant name needed. | |
| dark-background | Text is white — used when the background image is dark. | |
| center-align | Text is centered on the hero. | |
| foreground-image | Includes both a background image and a foreground image (e.g. product image, logo). | Environmental — Thermo Fisher Scientific |
| gradient-overlay | Dark gradient overlay on top of background image for better text readability. | |
| image-focal-center | Background image focal point is centered. | Carrier Screening Information — Thermo Fisher Scientific |

### 3.2 Combining Variants

Variants can be combined by listing them with commas in the block header:

| Author types | CSS classes applied |
|---|---|
| `Hero` | `.hero` (default) |
| `Hero (dark-background)` | `.hero.dark-background` |
| `Hero (dark-background, center-align)` | `.hero.dark-background.center-align` |
| `Hero (foreground-image, gradient-overlay)` | `.hero.foreground-image.gradient-overlay` |
| `Hero (dark-background, center-align, gradient-overlay)` | `.hero.dark-background.center-align.gradient-overlay` |

Authors select the combination that matches the desired visual treatment for the page.

---

## 4. DA Block Table Contract

### 4.1 Key-Value Structure

The Hero block uses a **key-value pair** pattern. Each row has a property name in column 1 and its value in column 2. Only include rows for fields that are needed — omit rows for fields that are not applicable.

### 4.2 Available Properties

| Key (Column 1) | Value (Column 2) | Required | Description |
|---|---|---|---|
| `image` | Image (drag and drop) | Optional | Background image for the hero |
| `image-alt` | Text | Optional | Alt text for the background image |
| `foreground-image` | Image (drag and drop) | Optional | Foreground image — used with `foreground-image` variant |
| `foreground-image-alt` | Text | Optional | Alt text for the foreground image |
| `subtitle` | Plain text | Optional | Secondary text below the H1 heading |
| `description` | Rich text | Optional | Supporting body copy — supports bold, italic, links, lists |
| `breadcrumb` | `true` | Optional | Enables breadcrumb trail overlay on the hero |
| `primary-cta` | Link — `[Text](URL)` | Optional | Primary CTA button |
| `outline-cta` | Link — `[Text](URL)` | Optional | Secondary CTA button with outline style |

### 4.3 Block Header and Variants

The first row of the table is the block header. It identifies the block and optionally specifies one or more variants.

| Author types in header row | Resulting CSS classes |
|---|---|
| `Hero` | `.hero` |
| `Hero (dark-background)` | `.hero.dark-background` |
| `Hero (dark-background, center-align)` | `.hero.dark-background.center-align` |
| `Hero (foreground-image, gradient-overlay)` | `.hero.foreground-image.gradient-overlay` |

Content rows (key-value pairs) start from row 2 onward.

### 4.4 How the Block JS Processes the Table

1. Reads the block header to determine variants
2. Iterates through each row — reads the key from column 1 and the value from column 2
3. Builds the hero HTML: background image as the hero backdrop, H1 from page metadata, subtitle, description, CTA buttons, and optional breadcrumb
4. If a key is not present, that element is simply not rendered

---

## 5. CTA Authoring

### 5.1 How CTAs Work

CTAs are authored as links in the value cell. The key name determines the button style.

| Key | Button Style | Visual |
|---|---|---|
| `primary-cta` | Filled/solid button | Prominent, high-contrast action button |
| `outline-cta` | Outlined/bordered button | Secondary, less prominent action button |

### 5.2 How to Author a CTA

The value cell contains a standard DA link — the link text becomes the button label and the URL becomes the button destination.

| Key | What to type in value cell |
|---|---|
| `primary-cta` | Select text, add link → `[Learn More](/products)` |
| `outline-cta` | Select text, add link → `[Watch Video](/video)` |

### 5.3 CTA Combinations

Authors can include 0, 1, or 2 CTAs:

**No CTA:**
Simply omit both `primary-cta` and `outline-cta` rows.

**One CTA (primary only):**

| primary-cta | [Learn More](/products) |
|---|---|

**One CTA (outline only):**

| outline-cta | [Watch Video](/video) |
|---|---|

**Two CTAs:**

| primary-cta | [Learn More](/products) |
|---|---|
| outline-cta | [Watch Video](/video) |

The primary CTA renders first (left), the outline CTA renders second (right).

---

## 6. Authoring Examples

### 6.1 Example 1 — Standard Hero with Dark Background

A common hero with a dark background image, subtitle, description, and a single CTA.

**Reference:** Standard product landing page hero with white text over a dark image.

| Hero (dark-background) | |
|---|---|
| image | ![hero banner](/media/hero-dark-bg.jpg) |
| image-alt | Laboratory researcher using microscope |
| subtitle | Accelerating Scientific Discovery |
| description | Explore our portfolio of life science research solutions designed to advance your work. |
| primary-cta | [Explore Solutions](/products) |

**What renders:**
- Full-width dark background image
- H1 heading pulled from page title (white text due to `dark-background` variant)
- Subtitle below heading
- Description paragraph
- One primary CTA button

---

### 6.2 Example 2 — Centered Hero with Dual CTA and Breadcrumb

A centered hero with gradient overlay, two CTA buttons, and breadcrumb navigation.

**Reference:** Campaign landing page with centered text, gradient for readability, and dual action buttons.

| Hero (dark-background, center-align, gradient-overlay) | |
|---|---|
| image | ![campaign hero](/media/campaign-bg.jpg) |
| image-alt | Scientists collaborating in laboratory |
| subtitle | Protecting Sample Integrity |
| description | Learn how proper sample storage and handling can improve your research outcomes. |
| breadcrumb | true |
| primary-cta | [Download Guide](/resources/guide) |
| outline-cta | [Contact Sales](/contact) |

**What renders:**
- Full-width background image with dark gradient overlay
- Breadcrumb trail at the top of the hero
- H1 heading centered (from page title)
- Subtitle and description centered
- Two CTA buttons side by side — primary (filled) and outline (bordered)

---

### 6.3 Example 3 — Hero with Foreground Image

A hero with both a background and a foreground product image.

**Reference:** Product showcase page (e.g. 3D SEM Volumescope) with product image overlaid on the hero background.

| Hero (foreground-image, dark-background) | |
|---|---|
| image | ![background](/media/hero-gradient-bg.jpg) |
| image-alt | Abstract blue gradient background |
| foreground-image | ![product](/media/volumescope-product.png) |
| foreground-image-alt | Thermo Scientific Volumescope 2 SEM |
| subtitle | 3D SEM Volumescope 2 |
| description | Explore the next generation of scanning electron microscopy. |
| primary-cta | [Request a Demo](/contact/demo) |

**What renders:**
- Full-width background image
- Foreground product image positioned prominently (typically right-aligned)
- H1 heading from page title with white text
- Subtitle, description, and one primary CTA on the left

---

### 6.4 Example 4 — Minimal Hero (Image Only)

A simple hero with just a background image — no subtitle, no description, no CTA.

| Hero | |
|---|---|
| image | ![banner](/media/simple-banner.jpg) |
| image-alt | Thermo Fisher Scientific laboratory |

**What renders:**
- Full-width background image
- H1 heading from page title (black text, left-aligned — default variant)
- No subtitle, no description, no CTA buttons
