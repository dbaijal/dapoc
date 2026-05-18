# Breadcrumb Block — DA + EDS Solution Design

**Document Version:** 2.0 (DA)
**Status:** Draft
**Date:** 2026-05-18
**Previous Version:** 1.0 (UE + AEM Authoring Source)
**Author:** Adobe Delivery Team

---

## Table of Contents

1. [Block Overview](#1-block-overview)
2. [Authoring Criteria](#2-authoring-criteria)
3. [DA Authoring Contract](#3-da-authoring-contract)
4. [Authoring Examples](#4-authoring-examples)

---

## 1. Block Overview

| Property | Value |
|---|---|
| Block Name | Breadcrumb |
| Maps to Existing | Breadcrumb Component |
| Description | A navigational trail showing the current page's position within the site hierarchy. Links are generated dynamically based on the page's URL path. |
| Authoring Strategy | Metadata-driven — no block table authoring required. Controlled via page metadata and bulk metadata. |
| Authoring Source | DA (Document Authoring) |
| Delivery | Edge Delivery Services (EDS) |
| Variants | Default only |

---

## 2. Authoring Criteria

**No block table is authored for breadcrumbs.** Authors do not create a breadcrumb block table on the page. Breadcrumbs are controlled entirely through metadata.

**Breadcrumb links are generated dynamically** based on the page's URL path. No manual link entry is required. The block JS reads the URL hierarchy and builds the navigational trail automatically.

**Default behaviour:** Breadcrumbs are enabled by default (`true`). Authors only need to take action if they want to disable breadcrumbs on a specific page.

**Page-level control:** Authors can enable or disable breadcrumbs on individual pages using the `breadcrumbs` metadata property.

**Bulk control:** Breadcrumbs can be enabled or disabled across an entire subsection or site-wide using the bulk metadata spreadsheet.

**Skip page from breadcrumb trail:** A custom metadata property can be used to exclude a specific page from the breadcrumb navigation and adjust the starting breadcrumb position.

---

## 3. DA Authoring Contract

### 3.1 Page-Level Metadata

Breadcrumbs are controlled via the **Metadata** block at the end of the DA document.

| Metadata | |
|---|---|
| breadcrumbs | true |

| Property | Values | Default | Description |
|---|---|---|---|
| `breadcrumbs` | `true` / `false` | `true` | Enables or disables the breadcrumb trail on the page |

Since the default is `true`, authors only need to add this metadata row when they want to **disable** breadcrumbs:

| Metadata | |
|---|---|
| breadcrumbs | false |

If the `breadcrumbs` metadata row is not present, breadcrumbs are shown.

### 3.2 Bulk Metadata

For site-wide or subsection-level control, breadcrumbs can be managed via the **bulk metadata spreadsheet**. This avoids the need to set metadata on every individual page.

| URL | breadcrumbs |
|---|---|
| /products/** | true |
| /landing-pages/** | false |
| /campaigns/** | false |

Bulk metadata applies to all pages matching the URL pattern. Page-level metadata overrides bulk metadata if both are set.

### 3.3 Skip Page from Breadcrumb Trail

A page can be excluded from the breadcrumb navigation trail using a custom metadata property. When a page is marked to be skipped, it does not appear as a link in the breadcrumb trail of its child pages. The breadcrumb trail connects to the next visible ancestor instead.

| Metadata | |
|---|---|
| breadcrumb-skip | true |

### 3.4 How Breadcrumbs Are Generated

The breadcrumb block JS generates the navigational trail at delivery time:

1. Reads the current page's URL path
2. Splits the path into segments — each segment represents a level in the site hierarchy
3. For each segment, resolves the page title (from the page's metadata or navigation structure)
4. Renders the breadcrumb trail as a series of linked page titles separated by a delimiter
5. The current page (last segment) is displayed as plain text (not a link)

**Example:** For a page at `/products/life-science/pcr/thermal-cyclers`:

```
Home > Products > Life Science > PCR > Thermal Cyclers
```

Each item except the last is a clickable link. "Thermal Cyclers" (current page) is displayed as text.

### 3.5 Authoring Summary

| Concern | Approach |
|---|---|
| Enable breadcrumbs | Default — no action needed (enabled by default) |
| Disable on a page | Add `breadcrumbs: false` in page Metadata block |
| Enable/disable site-wide | Use bulk metadata spreadsheet |
| Skip a page from trail | Add `breadcrumb-skip: true` in page Metadata block |
| Breadcrumb links | Generated automatically from URL path — no manual authoring |
| Breadcrumb labels | Resolved from page titles — no manual authoring |
| Block table | Not needed — no breadcrumb block table on the page |

---

## 4. Authoring Examples

### 4.1 Example 1 — Default (Breadcrumbs Enabled)

A standard page with breadcrumbs. No special authoring needed — breadcrumbs appear by default.

| Metadata | |
|---|---|
| title | Thermal Cyclers |
| description | Explore our range of thermal cyclers |

No `breadcrumbs` row needed. Breadcrumbs are displayed automatically.

**What renders:**

```
Home > Products > Life Science > PCR > Thermal Cyclers
```

---

### 4.2 Example 2 — Breadcrumbs Disabled

A landing page where breadcrumbs should not appear.

| Metadata | |
|---|---|
| title | Summer Campaign 2026 |
| breadcrumbs | false |

**What renders:** No breadcrumb trail on the page.

---

### 4.3 Example 3 — Bulk Metadata for a Subsection

All campaign pages have breadcrumbs disabled via the bulk metadata spreadsheet. No per-page metadata needed.

**Bulk metadata spreadsheet:**

| URL | breadcrumbs |
|---|---|
| /campaigns/** | false |

Every page under `/campaigns/` will have breadcrumbs disabled automatically.

---

### 4.4 Example 4 — Skip a Page from the Trail

A category page should not appear in the breadcrumb trail of its child pages.

Page at `/products/legacy-products`:

| Metadata | |
|---|---|
| title | Legacy Products |
| breadcrumb-skip | true |

**Effect:** Child pages under `/products/legacy-products/` will show a breadcrumb trail that skips "Legacy Products" and connects directly to "Products" instead.
