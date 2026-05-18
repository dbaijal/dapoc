# Product Selection Guide Block — Solution Design

**Document Version:** 2.0 (DA)
**Status:** Draft
**Date:** 2026-05-18
**Author:** Adobe Delivery Team

---

## Table of Contents

1. [Overview](#1-overview)
2. [Current AEM Implementation](#2-current-aem-implementation)
3. [Key Concern](#3-key-concern)
4. [Proposed Approach — JSON + EDS Block](#4-proposed-approach--json--eds-block)
5. [Pros and Cons](#5-pros-and-cons)
6. [Summary and Ownership](#6-summary-and-ownership)
7. [DA Block Table Contract](#7-da-block-table-contract)

---

## 1. Overview

The Product Selection Guide component integrates with an external Feature Collection service.

Component acts as a lightweight wrapper that orchestrates parameter extraction and HTTP communication with the external service, returning the pre-rendered HTML response directly into the page.

**Reference:** Nalgene Bottle, Carboy and Vial Selection Guide — Thermo Fisher Scientific

---

## 2. Current AEM Implementation

Authors configure the component using `featureCollectionId` (mandatory). The component relies on the featureCollectionId to fetch and render the appropriate product selection guide.

At runtime, the component uses a Sling Model (server-side) to:

- Read authored properties
- Extract request parameters (filters, paging, etc.)
- Derive contextual information such as:
  - locale (language/country)
  - device type (mobile vs desktop)

The Sling Model then:

1. Constructs a request to the external Feature Collection service
2. Passes: featureCollectionId, query parameters, headers/cookies (locale, user-agent, etc.)
3. Performs a server-side HTTP call
4. Receives a response in the form of HTML (including CSS and JS)
5. Directly injects this HTML into the AEM page

---

## 3. Key Concern

The current implementation relies on HTML passthrough from an external service, which introduces significant concerns:

- External HTML may include uncontrolled CSS and JavaScript
- Increased risk of:
  - render-blocking resources
  - layout shifts
  - degraded Core Web Vitals (LCP, TBT)
- Limited control over markup, accessibility, and styling
- Tight coupling between backend response and frontend rendering

**This pattern is not suitable for EDS, where performance, control, and predictable rendering are critical.**

---

## 4. Proposed Approach — JSON + EDS Block

Replace HTML passthrough with a structured JSON contract, and let the EDS block handle rendering (decoration).

- **Backend** → Provides data (JSON)
- **EDS Block** → Handles rendering (HTML, CSS, JS)

### EDS Block Behaviour

The `product-selection-guide` block will:

1. Read authored configuration:
   - featureCollectionId
   - optional display settings
2. Read runtime context from the URL:
   - filters
   - paging
   - view type
3. Determine locale using EDS-supported mechanisms (URL structure or metadata)
4. Call the Feature Collection service (JSON endpoint)
5. Render:
   - product listing (grid/list)
   - filters and controls
   - pagination
   - empty and error states

### JSON API Requirement

The external Feature Collection service should expose a structured JSON API instead of returning pre-rendered HTML.

This establishes a clear separation of responsibilities:

- **Backend** → Business logic and data
- **EDS Block** → Rendering and interaction

Adopting a JSON-based contract is critical because:

- Prevents uncontrolled injection of external CSS and JavaScript
- Ensures full control over markup, styling, and behavior within EDS
- Enables optimized rendering, lazy loading, and better Core Web Vitals
- Improves maintainability by decoupling backend output from frontend structure

**EDS blocks should consume structured data, not pre-rendered HTML.**

---

## 5. Pros and Cons

| Aspect | Current AEM (HTML Passthrough) | Proposed (JSON + EDS Block) |
|---|---|---|
| Performance (Core Web Vitals) | Risky due to external CSS/JS injection | Strong control with optimized rendering |
| Control over UI | Low (backend defines HTML) | High (EDS controls DOM and styling) |
| Maintainability | Tightly coupled to backend output | Clean separation of data and presentation |
| Authoring Experience | Simple, based on featureCollectionId | Same model retained |
| Flexibility | Limited | High (UI changes independent of backend) |
| Accessibility & Semantics | Depends on external HTML | Fully controllable in EDS |
| EDS Alignment | Not aligned | Fully aligned with EDS principles |

---

## 6. Summary and Ownership

The current implementation uses a server-side HTML passthrough model, where AEM acts as a proxy to an external service and renders its response directly. While functional, this introduces performance and maintainability challenges.

The recommended approach is to adopt a JSON-driven integration with an EDS block, where:

- The backend provides structured data
- The EDS block handles rendering and interaction

This results in:

- Improved performance and Core Web Vitals
- Full control over markup and styling
- A scalable, maintainable architecture aligned with EDS best practices

### Ownership Matrix

| Component | Owner | Responsibility |
|---|---|---|
| Product Selection Guide Block (EDS) | Adobe / Implementation Team | Block JS/CSS, rendering (grid/list/filters/pagination/empty/error states), URL parameter handling, locale detection, UX interactions |
| Feature Collection Service (JSON API) | TFS | Exposes structured JSON endpoint, business logic, filtering, sorting, pagination logic, product data |
| JSON API Contract | Joint (Adobe + TFS) | Request/response schema agreed during implementation |
| API Authentication (if needed) | TFS provides credentials; Adobe configures (in Edge Worker if API can't be accessed from browser) | Depends on API authentication |

### Key Dependency: TFS Must Deliver JSON API

The EDS integration requires TFS to expose a structured JSON endpoint from the Feature Collection service. The current HTML passthrough endpoint cannot be used in EDS.

---

## 7. DA Block Table Contract

### 7.1 Block Overview

| Property | Value |
|---|---|
| Block Name | Product Selection Guide |
| Authoring Strategy | Flattened block — key-value pair table. Author provides the Feature Collection ID and optional display settings. |
| Authoring Source | DA (Document Authoring) |
| Delivery | Edge Delivery Services (EDS) |

### 7.2 Table Structure

The block uses a **key-value pair** pattern. The author provides the Feature Collection ID — the block handles everything else at delivery time.

| Column | Role | Content |
|---|---|---|
| Column 1 | Key | Configuration property name |
| Column 2 | Value | Configuration property value |

### 7.3 Available Properties

| Key (Column 1) | Value (Column 2) | Required | Description |
|---|---|---|---|
| `feature-collection-id` | ID string | Yes | The Feature Collection ID that identifies which product selection guide to display |

Additional display settings will be defined during implementation if needed.

### 7.4 Service URL Governance

The Feature Collection service URL is **centrally managed** via a siteConfig sheet. Authors do not configure or see this URL.

**siteConfig sheet entry:**

| Key | Value |
|---|---|
| feature-collection-service-url | (service endpoint URL) |

The block JS fetches this sheet at runtime and reads the URL. This ensures:
- URL is governed centrally — not author-editable
- URL changes are a spreadsheet edit — no code deployment needed
- Consistent across all pages using this block

### 7.5 How the Block Works at Delivery Time

1. Block JS reads the `feature-collection-id` from the authored table
2. Block fetches the service URL from the siteConfig sheet
3. Block determines locale from URL structure or page metadata
4. Block reads any filter/paging/view parameters from the current page URL
5. Block calls the Feature Collection JSON API with the ID, locale, and parameters
6. Block renders the product listing, filters, pagination, and handles empty/error states

### 7.6 Authoring Example

| Product Selection Guide | |
|---|---|
| feature-collection-id | nalgene-bottles-carboys-vials |

**What renders:** A product selection guide with product listing (grid or list), filter controls, and pagination. The guide content is determined by the Feature Collection ID and fetched from the external JSON API at delivery time.

### 7.7 Authoring Summary

| Concern | Approach |
|---|---|
| Block type | Flattened block — key-value table |
| Feature Collection ID | Author enters the ID in the table |
| Service URL | Centrally governed via siteConfig sheet — not author-editable |
| Filters and pagination | Handled by block JS using URL parameters — no authoring needed |
| Locale | Detected automatically from URL structure or metadata |
| Rendering | Fully controlled by EDS block JS |
| External dependency | TFS must provide JSON API (not HTML passthrough) |
