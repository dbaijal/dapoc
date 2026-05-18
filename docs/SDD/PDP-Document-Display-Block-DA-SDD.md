# PDP Document Display Block — DA + EDS Solution Design

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
5. [Architecture and Integration](#5-architecture-and-integration)
6. [Configuration Governance](#6-configuration-governance)
7. [Error Handling](#7-error-handling)
8. [Performance and Security](#8-performance-and-security)
9. [Authoring Examples](#9-authoring-examples)

---

## 1. Block Overview

| Property | Value |
|---|---|
| Block Name | PDP Document Display |
| Maps to Existing | PDP Document Display - Parent Component |
| Description | Integrates an external Product Data Page (PDP) documents application into EDS. The external app provides document browsing and filtering based on product SKUs, document IDs, and document types. EDS acts as a lightweight orchestration layer. |
| Authoring Strategy | Flattened block — key-value pair table. Author provides product and document configuration. Block JS handles external script loading, config passing, and container management. |
| Authoring Source | DA (Document Authoring) |
| Delivery | Edge Delivery Services (EDS) |
| Instance Limit | One instance per page |

### Responsibility Separation

| Layer | Responsibility |
|---|---|
| **EDS Block** | Captures author input, creates container, loads external script, passes configuration |
| **External Application** | Document fetching, filtering, UI rendering, user interactions |

---

## 2. Authoring Criteria

**SKU** — required (unless Document IDs provided). Product SKU(s) used to fetch documents. Supports comma-separated values for multi-SKU.

**Document IDs** — optional. Specific document identifiers for targeted display.

**Document Types** — optional. Filters the document listing by type (e.g. spec, manual, guide, certificate, SDS).

**Sort By** — optional. Default sort order for results.

**Expanded** — optional. Whether result accordions display expanded or collapsed on load.

Authors configure these fields — the external application uses them to fetch and display the relevant documents.

---

## 3. Variants

| Variant | DA Block Name | Description |
|---|---|---|
| default | `PDP Document Display` | Standard document display |

**Note:** The corpcommons base component defines two style variants (`red-border` and `black-border`). These were not configured in TFS template policies and do not appear to be actively used. If confirmed needed by the client, they will be implemented as block variants: `PDP Document Display (red-border)`.

---

## 4. DA Block Table Contract

### 4.1 Table Structure

The PDP Document Display block uses a **key-value pair** pattern. Each row is a configuration property.

| Column | Role | Content |
|---|---|---|
| Column 1 | Key | Configuration property name |
| Column 2 | Value | Configuration property value |

### 4.2 Available Properties

| Key (Column 1) | Value (Column 2) | Required | Description |
|---|---|---|---|
| `sku` | Product SKU(s) — comma-separated for multiple | Yes (unless document-ids provided) | Product SKU used to fetch associated documents |
| `document-ids` | Comma-separated document IDs | No | Specific document identifiers for targeted display |
| `document-types` | Comma-separated types (e.g. `spec, manual, guide`) | No | Filters results by document type |
| `sort-by` | Sort field name | No | Default sort order for results |
| `expanded` | `true` / `false` | No (default: `false`) | Show result accordions expanded on page load |

Only include rows for properties that are needed. Omitted properties use default values.

### 4.3 Document Type Values

The same document type string values used in the current AEM implementation are used in EDS — no taxonomy change. Values passed to `window.documentsConfiguration()` remain identical.

Examples: `spec`, `manual`, `guide`, `certificate`, `SDS`, `protocol`

Ownership of the document type taxonomy sits with the external application team. The EDS block passes whatever values are authored.

### 4.4 Authoring Summary

| Concern | Approach |
|---|---|
| Block type | Flattened block — key-value configuration table |
| Product SKU | Author enters SKU(s) in the `sku` row |
| Document filtering | Author specifies types in `document-types` row |
| Specific documents | Author enters IDs in `document-ids` row |
| External app URL | Centrally governed — not authored per page (see Section 6) |
| Rendering | Handled entirely by the external application |
| Instance limit | One per page |

---

## 5. Architecture and Integration

### 5.1 Architecture Flow

1. Author configures block (SKU, document types, etc.) in DA
2. EDS block JS reads authored values from the block table
3. Block creates a container `<div>` with a fixed ID (`pdp-document-display-content`)
4. Block fetches the external application URL from the siteConfig sheet
5. Block waits for visibility (lazy load via IntersectionObserver) — or loads immediately if above-the-fold
6. External JS is loaded dynamically
7. Block constructs the configuration object:

```
{
  sku: "ABC-12345",
  documentIds: ["DOC-001", "DOC-002"],
  documentTypes: ["spec", "manual"],
  sortBy: "date",
  expanded: true,
  containerId: "pdp-document-display-content"
}
```

8. Block invokes: `window.documentsConfiguration(config)`
9. External application fetches data and renders UI into the container

### 5.2 Container ID Strategy

Since only one instance of this block is permitted per page, the `containerId` is a **fixed predictable value** set by the block JS — no dynamic generation required.

The block assigns a consistent ID (`pdp-document-display-content`) to the render container and passes it to `window.documentsConfiguration()`. This keeps the integration contract simple and stable.

---

## 6. Configuration Governance

### 6.1 External Application URL

The application URL is **centrally managed** via a siteConfig sheet using a key-value structure. Authors do not configure or see this URL.

**siteConfig sheet entry:**

| Key | Value |
|---|---|
| pdp-application-url | /store/v2/documents/static/conditionalLoadAssets.js |

The EDS block fetches this sheet at runtime and reads the URL. This ensures:
- URL is governed centrally — not author-editable
- URL changes are a spreadsheet edit — no code deployment needed
- Consistent across all pages using this block

### 6.2 Why Centrally Governed

The external script URL is an infrastructure concern, not a content concern. Allowing authors to configure it per page would:
- Create security risk (arbitrary script URLs)
- Lead to inconsistency across pages
- Make updates require per-page edits

---

## 7. Error Handling

The EDS block carries forward proven error handling patterns from the existing AEM implementation.

### 7.1 Script Load Failure / Missing Global Function

The block uses a polling mechanism (`checkPDPReady`) that checks every 200ms for up to 30 attempts (6-second timeout). If the external application does not respond within this window, the block renders an error message in the container.

### 7.2 Multiple Instances on Same Page

A detection function identifies duplicate instances on page load and replaces the duplicate with a clear error message. Only one instance per page is supported.

### 7.3 Invalid or Empty SKU / Document Results

Block JS guards against invoking `window.documentsConfiguration()` if both SKU and Document IDs are absent. The existing CSS rule suppressing the "no results" message from end users is carried forward to the block stylesheet.

---

## 8. Performance and Security

### 8.1 Loading Strategy

The block follows EDS recommended loading best practices:

- **Below-the-fold placement** — lazy initialization using IntersectionObserver. External JS loads when the block enters or nears the viewport.
- **Above-the-fold placement** — immediate load without deferral.

The load strategy is determined by the block's typical placement on PDP pages. Both patterns are supported.

**Benefits:**
- Improves Core Web Vitals
- Reduces initial page load time
- External script loaded only once (duplicate load prevention)

### 8.2 CSP (Content Security Policy)

The EDS CSP approach is **nonce-based with `strict-dynamic`** as documented at aem.live/docs/csp. Under this model:

- Scripts dynamically loaded by trusted EDS scripts are automatically covered through the trust chain
- No separate nonce or domain whitelisting is required for the external PDP application script
- The centrally governed application URL (via siteConfig) ensures the script source is not author-editable, reducing risk of unintended or malicious URLs

No custom CSP configuration is anticipated for this block beyond the standard EDS setup.

---

## 9. Authoring Examples

### 9.1 Example 1 — Single SKU, All Documents

Display all documents for a single product.

| PDP Document Display | |
|---|---|
| sku | 4331182 |

**What renders:** A document listing showing all available documents (specs, manuals, guides, certificates) for product SKU 4331182. Filtered by default document types. Accordions collapsed.

---

### 9.2 Example 2 — Single SKU with Filtered Document Types

Display only specifications and manuals for a product.

| PDP Document Display | |
|---|---|
| sku | 4331182 |
| document-types | spec, manual |

**What renders:** A filtered document listing showing only specifications and manuals for the product. Other document types are excluded.

---

### 9.3 Example 3 — Multi-SKU with Expanded Results

Display documents for multiple products with accordions expanded.

| PDP Document Display | |
|---|---|
| sku | 4331182, 4367659, 4368577 |
| expanded | true |

**What renders:** A document listing showing all documents across three products. Result accordions are expanded on page load so users see document details immediately.

---

### 9.4 Example 4 — Specific Document IDs

Display specific documents by their IDs.

| PDP Document Display | |
|---|---|
| document-ids | DOC-2026-001, DOC-2026-002, DOC-2026-003 |

**What renders:** Only the three specified documents are displayed, regardless of product SKU. Useful for curated document collections on specific landing pages.

---

### 9.5 Example 5 — Full Configuration

All options configured.

| PDP Document Display | |
|---|---|
| sku | ABC-12345 |
| document-ids | DOC-001, DOC-002 |
| document-types | spec, manual, guide |
| sort-by | date |
| expanded | true |

**What renders:** Documents for SKU ABC-12345, plus specific documents DOC-001 and DOC-002, filtered to specs/manuals/guides, sorted by date, with accordions expanded.
