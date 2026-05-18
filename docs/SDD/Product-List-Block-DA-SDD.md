# Product List Block — Solution Design

**Document Version:** 2.0 (DA)
**Status:** Draft
**Date:** 2026-05-18
**Author:** Adobe Delivery Team

---

## Table of Contents

1. [Summary](#1-summary)
2. [Current State](#2-current-state)
3. [EDS Approach](#3-eds-approach)
4. [Architecture](#4-architecture)
5. [Integration Contract](#5-integration-contract)
6. [Cache Strategy](#6-cache-strategy)
7. [Ownership and Boundaries](#7-ownership-and-boundaries)
8. [DA Block Table Contract](#8-da-block-table-contract)

---

## 1. Summary

The Product List component displays product catalogs with pricing on web pages, allowing users to view and purchase products.

**References:**
- Celleste Image Analysis Software — Thermo Fisher Scientific
- EVOS LED Light Cubes — Thermo Fisher Scientific
- Molecular Biology Bulk Reagents and Lab Supplies — Thermo Fisher Scientific
- Transfected Cell Analysis — Thermo Fisher Scientific

**Key fact:** Product data (names, sizes, pricing, availability) is NOT authored. It is fetched dynamically at runtime from the Product Microservice based on the SKU list configured by the author. This block defines WHAT to show (SKUs + columns). The Edge Worker + Microservice handle HOW to render it.

---

## 2. Current State

The Product List component is a flexible, data-driven AEM component that renders product information in a table format. It:

- Fetches product details via Catalog Microservice API based on SKU list
- Retrieves pricing via Pricing Access API with user-specific pricing
- Renders a dynamic HTML table with configurable columns (SKU, Name, Size, Price, Quantity)
- Supports Add-to-Cart via client-side JavaScript
- Handles multiple price access types (RequestQuote, OrderNow, NoPrice, etc.)

### Data Flow (Current)

```
BROWSER REQUEST
  ↓
ProductListModel (@PostConstruct)
  │
  ├─ Step 1: Get Locale
  │   - From cookies (CK_ISO_CODE, CK_LANG_CODE)
  │   - Fallback: derive from URL
  │
  ├─ Step 2: Fetch UserType
  │   - UserTypeService → returns userId + erpType
  │
  ├─ Step 3: Parse SKU List
  │   - Convert comma-separated SKUs into list
  │
  └─ Step 4: Call ProductListDetailsService
      - Calls Catalog API
      - Calls Pricing API
      - Merges response into Product object
  ↓
JSP renders product table
  ↓
BROWSER DISPLAY
```

### Service Layer (Current)

ProductListDetailsServiceImpl performs:
- UserType retrieval
- OAuth token generation via AuthTokenProvider
- Catalog API call
- Pricing API call
- Consolidation into a single Product response

### Frontend (Current)

- Only renders data provided by backend
- Handles Add-to-Cart: validates quantity, calls mini-cart
- No API calls from browser

---

## 3. EDS Approach

EDS does not support AEM-style server-side rendering. The published HTML is static.

To support dynamic product data while keeping SEO and security intact, a **two-layer architecture** is proposed:

### 1. Edge Worker (Presentation Layer)

- Reads product-list block from page
- Extracts SKU list and configuration
- Calls Product Microservice
- Renders HTML using returned JSON
- Injects final HTML into response

### 2. Product Microservice (Data Layer)

- Handles OAuth token generation
- Resolves user context (UserType)
- Calls: Catalog API, Pricing API
- Merges responses
- Returns normalized JSON

### Product List Block (Authoring)

The EDS Product List block allows authors to configure:
- SKU list (comma-separated)
- Column selection: Size, Price, Quantity, Add-to-Cart, PDP Link

This ensures flexibility similar to the current AEM component while keeping authoring simple.

### Important Design Decision

- Business logic is NOT implemented in Edge Worker
- Edge should remain thin (rendering only)
- Microservice should handle all backend logic
- Microservice can be implemented using: App Builder, AWS Lambda, or Node.js service

---

## 4. Architecture

```
EDS Page (Product List Block)
  ↓
Edge Worker
  - Read SKUs and column config
  - Call Microservice
  - Render HTML from JSON response
  ↓
Product Microservice
  - Auth Token
  - UserType
  - Catalog API
  - Pricing API
  - Merge response
  ↓
Backend APIs (existing)
```

### Additional Notes

- Add-to-Cart remains client-side (same as current)
- TFS is also planning to introduce a microservice for fetching product details
- Need to confirm: scope of that service and integration approach with EDS

### Recommendation

Adopt Edge Worker + Product Microservice pattern:
- Keeps API logic secure and outside browser
- Maintains SEO via server-side rendering at edge
- Keeps edge layer simple and maintainable
- Reuses existing backend logic effectively

---

## 5. Integration Contract

| Aspect | Specification |
|---|---|
| Request | SKU list + locale/country + user context (cookie/token if authenticated) |
| Response | Normalized JSON — array of product objects with name, SKU, size, price, availability, price access type |
| Authentication | API Key in request header (`X-API-Key`) |
| SLA Target | < 500ms (p95 response time) for typical request (5–20 SKUs) |
| Timeout | 2 seconds at the Edge Worker — if microservice does not respond within 2s, fallback is triggered |
| Method | POST (SKU list in request body) or GET (SKUs as query parameter) — to be agreed |

The integration contract between the Edge Worker and the Product Microservice will be defined and agreed jointly during implementation.

---

## 6. Cache Strategy

| User Type | Strategy | Details |
|---|---|---|
| Anonymous users | Edge-cached | Short TTL (5–15 minutes). Price changes reflect within TTL window. |
| Logged-in users | All caches bypassed | Every request fetches live, personalized pricing from microservice. No edge caching for authenticated requests. |
| Fallback | Stale-while-revalidate | If microservice is temporarily unavailable, serve last cached response (anonymous users only) to avoid complete failure. |

Final TTL is a business decision — trade-off between performance (longer TTL) and pricing freshness (shorter TTL). Will be agreed during implementation.

---

## 7. Ownership and Boundaries

### Ownership Matrix

| Component | Owner | Responsibilities |
|---|---|---|
| Product List Block (EDS) | Adobe / Implementation Team | Block JS/CSS, client-side rendering (fallback), quantity validation, analytics event push, add-to-cart UX |
| Edge Worker | Adobe / Implementation Team | Extract SKU/column config from page HTML, call Product Microservice, render product HTML table, inject into response, manage cache, handle timeout/fallback |
| Product Microservice | TFS | UserType resolution, Catalog API calls, Pricing API calls, response merging, normalized JSON response, SLA ownership |
| Mini-Cart Service | TFS (existing backend) | Cart operations, stock validation, order management |
| Integration Contract | Joint (Adobe + TFS) | Request/response schema agreed during implementation |

### Integration Boundaries

```
┌───────────────────────────────────────────────────────────────┐
│   ADOBE / IMPLEMENTATION TEAM                                 │
│                                                               │
│   EDS Block (JS/CSS)                                          │
│   • Reads authored config (SKUs, columns)                     │
│   • Client-side: quantity validation, add-to-cart, analytics  │
│   • Fallback: client-side fetch if edge rendering fails       │
│                                                               │
│   Edge Worker                                                 │
│   • Extracts block config from page HTML                      │
│   • Calls Product Microservice                                │
│   • Renders product HTML from JSON response                   │
│   • Manages edge cache (anonymous users)                      │
│   • Handles timeout/fallback                                  │
└────────────────────────────┬──────────────────────────────────┘
                             │
                   INTEGRATION CONTRACT
                  (defined and agreed jointly)
                             │
┌────────────────────────────▼──────────────────────────────────┐
│   TFS-OWNED                                                   │
│                                                               │
│   Product Microservice                                        │
│   • Validates API Key                                         │
│   • Resolves UserType                                         │
│   • Orchestrates Catalog API + Pricing API (parallel)         │
│   • Merges and normalizes response                            │
│   • Returns JSON within SLA                                   │
│                                                               │
│   Backend APIs (existing — no change)                         │
│   • Catalog API                                               │
│   • Pricing API                                               │
│   • UserType Service                                          │
│   • Mini-Cart Service                                         │
└───────────────────────────────────────────────────────────────┘
```

---

## 8. DA Block Table Contract

### 8.1 Block Overview

| Property | Value |
|---|---|
| Block Name | Product List |
| Authoring Strategy | Flattened block — key-value configuration table. Author provides SKU list and column display preferences. Product data is fetched dynamically at runtime — not authored. |
| Authoring Source | DA (Document Authoring) |
| Delivery | Edge Delivery Services (EDS) via Edge Worker |

### 8.2 Table Structure

The Product List block uses a **key-value pair** pattern. Each row is a configuration property.

| Column | Role | Content |
|---|---|---|
| Column 1 | Key | Configuration property name |
| Column 2 | Value | Configuration property value |

### 8.3 Available Properties

| Key (Column 1) | Value (Column 2) | Required | Default | Description |
|---|---|---|---|---|
| `sku-list` | Comma-separated SKU IDs | Yes | — | Product SKUs to display (e.g. `16096040, 15596018, A33251, 17909`) |
| `show-size` | `true` / `false` | No | `true` | Show or hide the Size column |
| `show-price` | `true` / `false` | No | `true` | Show or hide the List Price column |
| `show-quantity` | `true` / `false` | No | `true` | Show or hide the Quantity input column |
| `show-add-to-cart` | `true` / `false` | No | `true` | Show or hide the Add to Cart button column |
| `show-pdp-link` | `true` / `false` | No | `false` | Show or hide a link to the Product Detail Page |

Only include rows for properties that need to differ from defaults. If all columns should be shown, only the `sku-list` row is needed.

### 8.4 How the Block Works at Delivery Time

1. Edge Worker reads the Product List block from the page HTML
2. Extracts `sku-list` and column configuration from the block table rows
3. Determines locale from URL structure
4. Calls the Product Microservice with SKU list, locale, and user context
5. Receives normalized JSON response (product name, SKU, size, price, availability, price access type)
6. Renders an HTML product table based on column configuration
7. Injects rendered HTML into the response before delivering to the browser
8. Client-side JS handles Add-to-Cart interactions, quantity validation, and analytics

### 8.5 Authoring Summary

| Concern | Approach |
|---|---|
| Block type | Flattened block — key-value configuration table |
| SKU list | Author enters comma-separated SKU IDs |
| Column visibility | Author sets boolean rows (true/false) for each column |
| Product data | NOT authored — fetched dynamically from Product Microservice |
| Pricing | NOT authored — fetched dynamically with user-specific pricing |
| Add-to-Cart | Client-side — handled by block JS |
| Rendering | Edge Worker renders HTML from microservice JSON response |
| Default behaviour | All columns shown. Only `sku-list` row is strictly required. |

### 8.6 Authoring Examples

**Example 1 — All Columns (Default)**

| Product List | |
|---|---|
| sku-list | 16096040, 15596018, A33251, 17909 |

**What renders:** A product table showing all columns (Name, Size, Price, Quantity, Add-to-Cart) for the four specified products. All column defaults are `true`.

---

**Example 2 — Price and Add-to-Cart Only (No Size, No Quantity)**

| Product List | |
|---|---|
| sku-list | 16096040, 15596018 |
| show-size | false |
| show-quantity | false |

**What renders:** A product table with Name, Price, and Add-to-Cart columns. Size and Quantity columns are hidden.

---

**Example 3 — Display Only (No Purchase Actions)**

| Product List | |
|---|---|
| sku-list | A33251, 17909, 4368577 |
| show-quantity | false |
| show-add-to-cart | false |
| show-pdp-link | true |

**What renders:** A product table with Name, Size, Price, and PDP Link columns. No quantity input or Add-to-Cart button — suitable for informational pages where purchase is not the primary action.

---

**Example 4 — Minimal (Just SKU List)**

| Product List | |
|---|---|
| sku-list | 16096040 |

**What renders:** A full product table for a single product with all default columns visible.
