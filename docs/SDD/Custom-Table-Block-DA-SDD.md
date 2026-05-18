# Custom Table Block (Data List) — DA + EDS Solution Design

**Document Version:** 2.0 (DA)
**Status:** Draft
**Date:** 2026-05-18
**Previous Version:** 1.0 (UE + AEM Authoring Source)
**Author:** Adobe Delivery Team

---

## Table of Contents

1. [Block Overview](#1-block-overview)
2. [Authoring Criteria](#2-authoring-criteria)
3. [Spreadsheet Structure](#3-spreadsheet-structure)
4. [DA Block Table Contract](#4-da-block-table-contract)
5. [Authoring Workflows](#5-authoring-workflows)
6. [Authoring Examples](#6-authoring-examples)

---

## 1. Block Overview

| Property | Value |
|---|---|
| Block Name | Data List |
| Maps to Existing | Table + Row Component (AEM 6.x) |
| Description | A spreadsheet-driven data listing block that automatically builds search, filters, pagination, and item cards from a single spreadsheet. Replaces the old AEM Table + Row approach with a single source of truth. |
| Authoring Strategy | Flattened block — key-value configuration table on the page. Content data maintained in a separate spreadsheet. |
| Authoring Source | DA (Document Authoring) — block configuration on page, data in spreadsheet |
| Delivery | Edge Delivery Services (EDS) |

### Key Concept

Authors maintain a single spreadsheet (the data source). The Data List block reads that spreadsheet's JSON endpoint and automatically:

- Extracts filter values from specified columns
- Builds the search bar and filter dropdowns
- Renders item cards (title, date, image, description, link)
- Provides pagination controls

Authors only edit the **spreadsheet** (for content/data) and the **block configuration table** (for display options). No per-item authoring on the page is needed.

---

## 2. Authoring Criteria

**Spreadsheet** — required. A DA spreadsheet (`.xlsx`) that contains all data items. Each row is one item. Each column is a field. The spreadsheet is served as JSON by EDS.

**Block configuration** — required. A Data List block table on the page that points to the spreadsheet and configures search, filters, and pagination options.

**No per-item authoring on the page.** All content items (events, resources, products, etc.) are managed in the spreadsheet. The page only contains the block configuration.

---

## 3. Spreadsheet Structure

### 3.1 Column Roles

Spreadsheet columns serve different purposes depending on how they are used:

| Role | Purpose | Examples |
|---|---|---|
| **Display** | Fields shown on item cards | title, date, description, image, link |
| **Filter** | Fields used as filter facets — values become dropdown options | event-type, country, month |
| **Search** | Hidden field used for text search matching | search-keywords |

### 3.2 Example Spreadsheet

| title | date | end-date | location | description | link | image | event-type | country | month | search-keywords |
|---|---|---|---|---|---|---|---|---|---|---|
| SLAS 2026 | 2026-02-07 | 2026-02-11 | Boston, MA US | Short event blurb | /events/slas-2026 | /images/slas.jpg | Tradeshow | United States | February | SLAS, Automation |
| Bio Europe 2026 | 2026-03-15 | 2026-03-17 | Berlin, Germany | Annual biotech conference | /events/bio-europe | /images/bio-europe.jpg | Conference | Germany | March | Bio, Europe, Biotech |

### 3.3 How Filters Are Derived

Filter dropdowns are **automatically populated** from the unique values in the specified filter columns. Authors do not manually define filter options.

For example, if `event-type` column contains: Tradeshow, Conference, Webinar, Workshop — the filter dropdown will show these four options automatically. When a new event type is added to the spreadsheet, it appears in the filter without any configuration change.

### 3.4 Spreadsheet Location

The spreadsheet is stored in DA as a `.xlsx` file and served by EDS as a JSON endpoint.

**Example:** A spreadsheet at `/data/events.xlsx` is accessible as JSON at `/data/events.json`.

The block configuration points to this JSON path.

### 3.5 Spreadsheet Organization — Best Practices

All data-list spreadsheets should be organized in a dedicated `/data` folder at the site root. This keeps data sources separate from authored pages and makes them easy to find, manage, and govern.

**Recommended folder structure:**

```
/data/
  events.xlsx              ← Events and webinars listing
  resources.xlsx           ← Resource/document library
  news.xlsx                ← News and announcements
  team.xlsx                ← Team members
  products-catalog.xlsx    ← Product catalog data
  training-courses.xlsx    ← Training and courses
```

**Naming conventions:**

| Convention | Rule | Example |
|---|---|---|
| Location | All spreadsheets in `/data/` folder | `/data/events.xlsx` |
| Naming | Lowercase, hyphen-separated, descriptive | `training-courses.xlsx` not `TC_Data.xlsx` |
| One spreadsheet per listing | Each Data List block points to its own spreadsheet | Events page → `/data/events`, Resources page → `/data/resources` |
| No page-path nesting | Spreadsheets live in `/data/` regardless of which page uses them | A page at `/products/life-science/events` still points to `/data/events` |

**Why `/data/` at the root:**

- **Discoverable** — all data sources in one predictable location
- **Shared** — multiple pages can reference the same spreadsheet (e.g. a "Featured Events" widget on the homepage and the full Events page both point to `/data/events`)
- **Governed** — permissions and access control can be applied to the `/data/` folder as a whole
- **Clear separation** — authored pages live in their content hierarchy, data spreadsheets live in `/data/`

**When to create sub-folders:**

For large sites with many spreadsheets, organize by domain:

```
/data/
  /events/
    events-global.xlsx
    events-americas.xlsx
    events-emea.xlsx
  /resources/
    resources-life-science.xlsx
    resources-clinical.xlsx
  /products/
    products-catalog.xlsx
    products-discontinued.xlsx
```

Sub-folders are recommended when the `/data/` folder exceeds 10–15 spreadsheets.

---

## 4. DA Block Table Contract

### 4.1 Table Structure

The Data List block is authored as a **key-value configuration table**. Each row sets one configuration option.

| Column | Role | Content |
|---|---|---|
| Column 1 | Key | Configuration property name |
| Column 2 | Value | Configuration property value |

### 4.2 Available Properties

| Key | Value | Required | Default | Description |
|---|---|---|---|---|
| `data-source` | Path to JSON endpoint | Yes | — | Path to the spreadsheet JSON (e.g. `/events-data`) |
| `searchable` | `true` / `false` | No | `false` | Enables a text search bar above the listing |
| `filterable` | `true` / `false` | No | `false` | Enables filter dropdowns |
| `filter-columns` | Comma-separated column names | No (required if filterable is true) | — | Spreadsheet columns to use as filter facets (e.g. `event-type, country, month`) |
| `pagination` | `true` / `false` | No | `false` | Enables pagination controls |
| `per-page` | `5`, `10`, `15`, `20`, `25` | No | `10` | Number of items displayed per page |
| `left-nav-filters` | `true` / `false` | No | `false` | Places filters in a left rail instead of top bar |

Only include rows for properties that are needed. Omitted properties use their default values.

### 4.3 Block Header

The first row is the block header identifying the block. No variants — the block has a single visual presentation.

| Data List | |
|---|---|

### 4.4 How the Block Works at Delivery Time

1. Block JS reads the configuration from the block table rows
2. Fetches the spreadsheet JSON from the `data-source` path
3. If `searchable` is true — renders a text search bar
4. If `filterable` is true — reads `filter-columns`, extracts unique values from those columns, and renders filter dropdowns
5. Renders item cards from the spreadsheet data (title, date, image, description, link)
6. If `pagination` is true — renders pagination controls with the configured `per-page` count
7. Search and filter interactions update the visible items in real-time without page reload

### 4.5 Authoring Summary

| Concern | Approach |
|---|---|
| Block type | Flattened block — key-value configuration table |
| Data source | Spreadsheet in DA served as JSON by EDS |
| Adding an item | Add a row to the spreadsheet — no page edit needed |
| Removing an item | Delete the row from the spreadsheet |
| Bulk edits | Edit spreadsheet cells, save once |
| Filters | Auto-derived from spreadsheet column values |
| Search | Matches against search-keywords column |
| Configuration | Key-value rows in the block table on the page |
| Per-item authoring on page | None — all items managed in the spreadsheet |

---

## 5. Authoring Workflows

### 5.1 Add a New Item

1. Open the spreadsheet in DA (e.g. `events-data.xlsx`)
2. Add a new row — fill in all fields (title, date, location, image, event-type, etc.)
3. Save the spreadsheet
4. The page renders the new item automatically — no page edit required

### 5.2 Remove an Expired Item

1. Open the spreadsheet
2. Delete the row
3. Save the spreadsheet
4. The item disappears from the listing. Filters update automatically — if that was the last item with a specific filter value, the value is removed from the dropdown.

### 5.3 Bulk Update

1. Open the spreadsheet
2. Edit multiple cells (e.g. change 20 dates, update descriptions, fix links)
3. Save once
4. All changes reflect on the page immediately

### 5.4 Add a New Filter Category

1. Add a new column to the spreadsheet (e.g. `region`)
2. Fill the column values for existing rows
3. Update the block configuration on the page — add the new column name to `filter-columns`
4. The new filter dropdown appears automatically with values from the column

### 5.5 Change Block Configuration

1. Open the page in DA
2. Edit the Data List block table — change any configuration value (e.g. change `per-page` from 10 to 20)
3. Save the page
4. Configuration change takes effect

---

## 6. Authoring Examples

### 6.1 Example 1 — Events Listing with Search, Filters, and Pagination

A full-featured events listing page.

| Data List | |
|---|---|
| data-source | /events-data |
| searchable | true |
| filterable | true |
| filter-columns | event-type, country, month |
| pagination | true |
| per-page | 10 |

**What renders:** A page with a search bar at the top, three filter dropdowns (Event Type, Country, Month), a grid of event cards (title, date, image, description, link), and pagination controls at the bottom showing 10 events per page.

---

### 6.2 Example 2 — Resource Library with Left-Nav Filters

A resource/document library with filters in a left rail.

| Data List | |
|---|---|
| data-source | /resources-data |
| searchable | true |
| filterable | true |
| filter-columns | resource-type, topic, year |
| pagination | true |
| per-page | 15 |
| left-nav-filters | true |

**What renders:** A page with filters in a left sidebar (Resource Type, Topic, Year), search bar above the content area, resource cards in the main area, and pagination showing 15 items per page.

---

### 6.3 Example 3 — Simple Listing (No Search, No Filters)

A minimal listing showing all items with pagination only.

| Data List | |
|---|---|
| data-source | /news-data |
| pagination | true |
| per-page | 5 |

**What renders:** A list of news cards (title, date, description, link) with pagination controls. No search bar, no filters. Shows 5 items per page.

---

### 6.4 Example 4 — Full Listing (No Pagination)

All items displayed at once — no pagination, no search, no filters.

| Data List | |
|---|---|
| data-source | /team-data |

**What renders:** All team member cards rendered on the page at once. No search, no filters, no pagination. Suitable for small datasets.

---

### 6.5 Comparison: AEM Table + Rows vs EDS Data List

| Concern | AEM Table + Rows | EDS Data List |
|---|---|---|
| Where data lives | Table config + many Row child components | One spreadsheet (single source) |
| Defining filters | Manual list in Table config + per-row mapping | Auto-derived from spreadsheet columns |
| Add new item | Add Row in AEM, map filters, publish | Add row in spreadsheet, save |
| Bulk edits | Edit each Row individually | Edit spreadsheet cells, save once |
| Page authoring | Heavy — many components per page | Light — one block table on page |
| Content maintenance | Per-item in AEM author | Spreadsheet only — no page edits |
