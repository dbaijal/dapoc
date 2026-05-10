# Solution Design Document: Forms Config Plugin

**Version:** 1.0  
**Date:** 2026-05-10  
**Status:** Draft  
**Author:** Architecture Team  
**Review:** Technical Architecture Board

---

## 1. Overview

### 1.1 Purpose

The Forms Config Plugin is a Document Authoring (DA) library plugin that enables content authors to configure form container properties — including action types, integration endpoints, multi-step behavior, and submission handling — through a rich dialog interface within the DA editor.

### 1.2 Business Objective

- Enable content authors to build and configure forms entirely within the DA editor without requiring developer intervention for each form instance
- Replicate the authoring experience of AEM's Form Container component dialog in the DA/EDS architecture
- Maintain the same integration capabilities (Eloqua, GCMS, Email, Marketo, etc.) while decoupling from AEM's JCR-based persistence
- Support enterprise-grade form configuration with multi-step authoring, conditional action types, and backend integrations

### 1.3 Technical Objective

- Implement a DA library plugin (iframe-based, using DA SDK) that captures form configuration through a professional dialog UI
- Store all configuration as key-value pairs in an EDS block table (`tfs2-form`)
- Integrate with backend systems via Adobe App Builder serverless actions
- Render configured forms at runtime via EDS block JavaScript

### 1.4 Role in DA/EDS Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     DA Editor (da.live)                       │
│                                                              │
│  ┌──────────────────┐    ┌─────────────────────────────┐    │
│  │  TFS2 Forms      │    │  TFS2 Form Config Plugin    │    │
│  │  Plugin           │    │  (Form Container Config)    │    │
│  │                   │    │                             │    │
│  │  - Input          │    │  - Action Types (11)        │    │
│  │  - Options        │    │  - Integration Config       │    │
│  │  - Button         │    │  - Multi-step Toggle        │    │
│  │  - Step           │    │  - MQO/Division             │    │
│  │  - Fragment       │    │  - Session Storage          │    │
│  └──────────────────┘    └─────────────────────────────┘    │
│                                                              │
└──────────────────────────────┬───────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────┐
│                   Document Storage (DA)                        │
│                                                               │
│  Block tables stored as HTML tables in document:              │
│  - tfs2-form (container config)                               │
│  - tfs2-form-input (field blocks)                             │
│  - tfs2-form-options (field blocks)                           │
│  - tfs2-form-step (step boundaries)                           │
│  - tfs2-form-button (submit actions)                          │
│  - tfs2-form-fragment (reusable field groups)                 │
└──────────────────────────────┬───────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────┐
│               EDS Runtime (aem.page / aem.live)               │
│                                                               │
│  blocks/tfs2-form/tfs2-form.js                                │
│  - Reads config from block table                              │
│  - Renders <form> with all fields                             │
│  - Handles multi-step navigation                              │
│  - Manages form submission                                    │
└──────────────────────────────────────────────────────────────┘
```

---

## 2. Current Behavior

### 2.1 Existing Form Configuration Flow

In the current AEM implementation, forms are authored using the **Form Container** component which provides:

- A component dialog with tabs (Properties, Session Storage Details)
- Multi-select Action Type dropdown (11 types)
- Dynamic configuration sections that appear/disappear based on selected action types
- Server-side datasource resolution for dropdown options (Division, MQO Form)
- Client-side AJAX calls for GCMS ID generation and email attribute persistence

### 2.2 Current Runtime Behavior

| Phase | Behavior |
|---|---|
| **Authoring** | Author opens Form Container dialog in AEM Sites Editor |
| **Configuration** | Dialog makes AJAX calls (datasource, GCMS fetch, email persist) |
| **Persistence** | All values stored as JCR node properties under the form component |
| **Rendering** | Sightly/HTL template reads JCR properties and renders HTML form |
| **Submission** | Form POST includes hidden fields (gcmsFormId, emailResourceAllocatorKey) |
| **Processing** | Server-side form actions route data to configured endpoints |

### 2.3 How Forms Are Authored Today

1. Author drags "Form Container" component onto the page
2. Opens the component dialog
3. Selects Action Type(s) — triggers dynamic section rendering
4. Fills in action-specific configuration
5. Selects MQO Form and Division (populated from Content Fragments)
6. Clicks Save — triggers email persistence API if applicable
7. Adds form field components (Text, Options, Button) inside the container
8. Each field has its own dialog with Properties/Constraints/Accessibility tabs

### 2.4 Current Integration Handling

| Integration | Trigger | Type | Endpoint |
|---|---|---|---|
| Division Dropdown | Dialog load | Sling Datasource (server-side) | `/content/dam/formcommons/cf/division` |
| GCMS Form ID | Author clicks Fetch | AJAX GET (client-side) | `GET /apps/lifetech/generateFormId` |
| Email Attributes | Dialog save | AJAX POST (client-side, blocking) | `POST /bin/servlet/tf/form/postemailattributes.json` |

### 2.5 Existing Action-Type Handling Logic

The Form Container supports 11 action types (multi-select):

| Code | Action Type | Configuration |
|---|---|---|
| 1001 | Eloqua | Form HTML Name, Region Config (repeatable), Eloqua Instance |
| 1002 | GCMS | GCMS Form ID (Fetch), Region Config with Fetch (repeatable) |
| 1003 | LSG | LSG-specific configuration |
| 1004 | Non LSG | Non LSG Type dropdown (Lead, Case, Quote, Bulk Quote) |
| 1005 | Marketo | Marketo Form ID |
| 1006 | Email | Email Template, Subject, Mailto (repeatable), Regional Email Config |
| 1007 | CORA | CORA Email Template, Subject, Mailto (repeatable), Regional CORA Config |
| 1009 | S3 | PDX S3 Form ID |
| 1010 | ELMS | PDX ELMS Type dropdown |
| 1011 | FSBIO | FSBIO Email Template, Subject, Mailto (repeatable), Regional Config |
| 1013 | Genesys DB | Genesys DB configuration |

When multiple action types are selected, each type's configuration section appears simultaneously. All configurations are persisted independently.

---

## 3. Target-State Solution in DA/EDS

### 3.1 How It Will Function in DA/EDS

The Forms Config Plugin replaces the AEM Form Container component dialog with a DA library plugin that:

- Runs as an iframe inside the DA editor's Library panel (experience: `dialog`)
- Provides the same multi-select action type behavior with conditional configuration sections
- Stores all values as key-value rows in a `tfs2-form` block table
- Integrates with backend systems via Adobe App Builder serverless actions
- Supports edit mode (reading existing config from selected block table)

### 3.2 Plugin Architecture and Runtime Flow

```
┌─────────────────────────────────────────────────┐
│            DA Editor (da.live)                    │
│                                                  │
│  Author opens "TFS2 Form Config" from Library    │
│              ↓                                   │
│  Plugin iframe loads from .aem.page domain       │
│              ↓                                   │
│  Plugin imports DA SDK (sendHTML, getSelection)   │
│              ↓                                   │
│  On load: fetch divisions from App Builder       │
│              ↓                                   │
│  Author selects action types → config sections   │
│              ↓                                   │
│  Author fills config → clicks "Add to Page"      │
│              ↓                                   │
│  [If Email/CORA/FSBIO]: POST email attributes    │
│  via App Builder → receive key                   │
│              ↓                                   │
│  Plugin calls actions.sendHTML(blockTable)        │
│              ↓                                   │
│  Block table inserted into document              │
└─────────────────────────────────────────────────┘
```

### 3.3 How Authoring Experience Changes

| Aspect | AEM (Current) | DA/EDS (Target) |
|---|---|---|
| **Entry point** | Component dialog (double-click component) | Library panel → "TFS2 Form Config" |
| **UI framework** | Coral UI / Granite | Custom HTML/CSS/JS in iframe |
| **Persistence** | JCR node properties | Block table rows (key-value) |
| **Dropdown data** | Sling Datasource (server-side) | App Builder → AEM GraphQL |
| **Save behavior** | Dialog save with blocking API call | "Add to Page" with blocking API call |
| **Edit** | Re-open dialog on same component | Select block → open plugin → "Edit Selected" |
| **Multi-step** | Separate component/template pattern | `multistep: true` flag + `tfs2-form-step` blocks |

### 3.4 How Configurations Are Managed and Rendered

**Storage (document):**
```
| tfs2-form        |                          |
| multistep        | true                     |
| action-types     | 1001,1006                |
| eloqua-form-name | my-form                  |
| eloqua-instance  | instance-1               |
| email-template   | standard                 |
| email-subject    | New inquiry              |
| email-mailto     | team@example.com         |
| email-key        | abc-123-xyz              |
| mqo-form         | form-a                   |
| division         | life-sciences            |
```

**Rendering (tfs2-form.js):**
1. Reads all key-value pairs from block table
2. Determines form behavior (single/multi-step)
3. Collects sibling field blocks
4. Builds `<form>` with all fields
5. Emits hidden inputs for integration values (gcmsFormId, emailResourceAllocatorKey)
6. Handles submission routing based on action-types

---

## 4. DA Plugin Design & Behavior

### 4.1 What DA Plugins Are

DA (Document Authoring) plugins are web pages loaded in an iframe within the DA editor's Library panel. They communicate with the editor via the DA SDK (`https://da.live/nx/utils/sdk.js`) which provides:

| Method | Purpose |
|---|---|
| `actions.sendText(text)` | Insert plain text into the document |
| `actions.sendHTML(html)` | Insert HTML (including tables) into the document |
| `actions.getSelection()` | Get the HTML of the current editor selection |
| `actions.closeLibrary()` | Close the library panel |

Plugins are registered in the DA site config (library sheet) with:
- **title**: Display name in the Library panel
- **path**: URL to the plugin HTML page
- **experience**: `dialog` (popup) or empty (inline panel)

### 4.2 What This Plugin Does

The TFS2 Form Config Plugin:

1. **Creates** form container configuration (action types, integrations, multi-step flag)
2. **Edits** existing form container configuration via selection detection
3. **Integrates** with backend systems (divisions API, GCMS fetch, email persistence)
4. **Validates** configuration before insertion (required fields, API success)
5. **Stores** all config as a `tfs2-form` block table in the document

### 4.3 Plugin Lifecycle and Responsibilities

```
┌───────────────────────────────────────────────┐
│              Plugin Lifecycle                   │
├───────────────────────────────────────────────┤
│                                               │
│  1. LOAD                                      │
│     - Import DA SDK                           │
│     - Fetch dropdown data (divisions, etc.)   │
│     - Show "Edit Selected" button             │
│                                               │
│  2. ADD MODE                                  │
│     - Author selects action types             │
│     - Conditional config sections appear      │
│     - Author fills configuration              │
│     - Author clicks "Add to Page"             │
│     - [Blocking] Call email persistence API   │
│     - Insert block table via sendHTML         │
│                                               │
│  3. EDIT MODE                                 │
│     - Author selects existing block table     │
│     - Opens plugin → clicks "Edit Selected"   │
│     - Plugin calls getSelection()             │
│     - Parses HTML → extracts config           │
│     - Pre-fills all form fields               │
│     - Author modifies → clicks "Update"       │
│     - [Blocking] Re-call email persistence    │
│     - Replace selection via sendHTML          │
│                                               │
└───────────────────────────────────────────────┘
```

### 4.4 Multi-Step Form Authoring

#### How Multi-Step Forms Are Authored

1. Author opens **TFS2 Form Config** plugin → checks "Enable Multi-step Form"
2. Plugin inserts `tfs2-form` block with `multistep: true`
3. Author opens **TFS2 Forms** plugin → selects "Step"
4. Fills step title and number → inserts `tfs2-form-step` block
5. Adds field blocks (Input, Options) below the step
6. Repeats steps 3-5 for each form step
7. Adds Submit button in the last step

#### Step Configuration Strategy

| Block | Purpose | Properties |
|---|---|---|
| `tfs2-form` | Container with `multistep: true` | action-types, integrations, multistep flag |
| `tfs2-form-step` | Step boundary marker | title, step number |
| Field blocks | Form fields within each step | All field properties |
| `tfs2-form-button` | Submit button (in last step) | label, type, error messages |

#### Navigation/State Handling

- **Rendering:** `tfs2-form.js` detects `multistep: true` in form config
- **Grouping:** Fields between `tfs2-form-step` markers are grouped into panels
- **Display:** Only active step panel is visible
- **Stepper UI:** Visual indicator with numbered circles and connecting line
- **Next button:** Validates current step fields before advancing
- **Previous button:** Navigates back without validation
- **Last step:** Shows Submit button + Previous (no Next)

#### Authoring Constraints

- `tfs2-form-step` blocks MUST come before their associated fields
- All blocks must be in the same section (no section dividers between steps)
- Step numbers should be sequential (1, 2, 3...)
- Fragment blocks can be used within any step

---

## 5. Dynamic Action-Type Complexity

### 5.1 Why This Introduces Complexity

The Form Container supports **11 action types** that can be **multi-selected**. Each action type reveals a unique configuration section with different fields, some of which include:

- **Repeatable rows** (regions, email addresses)
- **Nested conditional fields** (enable regional config → shows region panel)
- **API-driven fields** (Fetch buttons that call backend)
- **Cross-field dependencies** (email template affects available options)
- **Blocking validation** (email persistence must succeed before save)

This creates a combinatorial UI where the plugin must dynamically render 0-11 configuration sections simultaneously, each with its own state management.

### 5.2 Complexity Matrix

| Action Type | Static Fields | Repeatable Rows | API Calls | Conditional Sub-sections |
|---|---|---|---|---|
| Eloqua | 2 | Yes (regions) | No | No |
| GCMS | 1 | Yes (regions) | Yes (Fetch per row) | No |
| LSG | TBD | TBD | TBD | TBD |
| Non LSG | 1 (dropdown) | No | No | No |
| Marketo | 1 | No | No | No |
| Email | 3 | Yes (mailto) | Yes (on save) | Yes (regional email) |
| CORA | 3 | Yes (mailto) | Yes (on save) | Yes (regional CORA) |
| S3 | 1 | No | No | No |
| ELMS | 1 (dropdown) | No | No | No |
| FSBIO | 3 | Yes (mailto) | Yes (on save) | Yes (regional email) |
| Genesys DB | TBD | TBD | TBD | TBD |

### 5.3 Suggested Implementation Approach

**Architecture: Template-Based Dynamic Rendering**

```html
<!-- Each action type has an HTML <template> element -->
<template id="tpl-eloqua">...</template>
<template id="tpl-gcms">...</template>
<template id="tpl-email">...</template>
```

**Behavior:**

1. Author selects action type from dropdown
2. Plugin clones the corresponding `<template>` and appends to config area
3. Attaches event listeners for that section (Fetch buttons, Add rows, toggles)
4. Displays as a tagged chip + config panel
5. Removing a tag removes the corresponding config panel
6. On submit: iterates all active panels, collects values into fields array

**State Management:**

- `selectedActions` Set tracks active types
- Each panel is self-contained (template clone with scoped event listeners)
- No global form state — values collected at submit time from DOM
- Edit mode: parses stored values → calls `addActionType()` for each → populates fields

### 5.4 Validation Strategy

| Level | What | When |
|---|---|---|
| **Required fields** | Label, Name, Action Type | On "Add to Page" click (form validation) |
| **API validation** | Email persistence success | Before insertion (blocking) |
| **Cross-field** | Regional config only if toggle enabled | Conditional display (no dead fields) |
| **Format** | Email format, numeric IDs | Input type constraints |

---

## 6. Integration Solutioning

### 6.1 Integration 1: Division Dropdown Population

#### Current Behavior
- **Trigger:** Dialog opens
- **Type:** Sling Datasource (server-side resource type)
- **Source:** Content Fragments at `/content/dam/formcommons/cf/division`
- **Mechanism:** AEM resolves CF options at dialog render time via `contentfragmentoptionsdatasource`
- **Result:** Division `<coral-select>` populated with text/value pairs

#### Existing Dependency
- AEM DAM Content Fragments (author-managed)
- Sling Datasource framework (AEM server-side)

#### Target-State Solution

```
DA Plugin (on load)
    ↓ fetch()
App Builder Action: GET /api/divisions
    ↓ (with service credentials)
AEM as a Cloud Service: GraphQL API
    → Query: divisionList { items { text, value } }
    ↓
JSON response → Plugin populates <select>
```

#### Integration Flow

| Step | Actor | Action |
|---|---|---|
| 1 | Plugin | `fetch('https://<app-builder>/api/divisions')` |
| 2 | App Builder | Authenticates with AEM via service credentials |
| 3 | App Builder | Executes GraphQL query against AEM CF model |
| 4 | AEM | Returns division content fragment data |
| 5 | App Builder | Transforms to `[{text, value}]` format |
| 6 | Plugin | Populates Division dropdown |

#### Assumptions & Constraints
- AEM as a Cloud Service with publicly accessible GraphQL endpoint
- Content Fragment model for divisions exists and is maintained
- App Builder action handles auth (IMS service-to-service)
- CORS configured on App Builder to allow requests from `da.live` / `aem.page`
- Fallback: static JSON file in project if AEM is unreachable

---

### 6.2 Integration 2: GCMS Form ID Generation

#### Current Behavior
- **Trigger:** Author clicks "Fetch" button
- **Type:** AJAX GET (client-side, from `gcms.js`)
- **Endpoint:** `GET /apps/lifetech/generateFormId`
- **Response:** XML with `<formId>` element
- **Result:** ID value set into GCMS Form ID field (global or per-region)

#### Existing Dependency
- AEM backend servlet/application
- Likely calls an external database to generate sequential/unique IDs

#### Target-State Solution

```
DA Plugin → "Fetch" button click
    ↓ fetch()
App Builder Action: GET /api/gcms/generateFormId
    ↓
Backend Database/Service (TFS-owned)
    ↓
Returns: { "formId": "12345678" }
    ↓
Plugin populates GCMS ID field
```

#### Integration Flow

| Step | Actor | Action |
|---|---|---|
| 1 | Author | Clicks "Fetch" button next to GCMS ID field |
| 2 | Plugin | `fetch('https://<app-builder>/api/gcms/generateFormId')` |
| 3 | App Builder | Calls TFS backend database/service |
| 4 | Backend | Generates unique Form ID |
| 5 | App Builder | Returns `{ formId: "..." }` |
| 6 | Plugin | Sets value in GCMS ID input field |

#### Assumptions & Constraints
- TFS team provides the backend endpoint/API for ID generation
- Same endpoint used for both global and regional GCMS IDs
- Each Fetch click generates a new unique ID
- IDs are idempotent (calling Fetch again generates a different ID — previous is overwritten)
- Fetch button is disabled in demo mode (manual input available)

---

### 6.3 Integration 3: Email Attribute Persistence

#### Current Behavior
- **Trigger:** Author clicks Save on dialog (action types 1006, 1007, or 1011)
- **Type:** AJAX POST (client-side, from `email-action.js`)
- **Endpoint:** `POST /bin/servlet/tf/form/postemailattributes.json`
- **Behavior:** `e.preventDefault()` blocks dialog save until API completes
- **Payload:** Full email config JSON (key, actionType, global config, regional overrides)
- **Response:** `200` → save proceeds; anything else → error alert, save blocked
- **Backend chain:** `PostEmailAttributesServlet` → `FormProcessorServiceImpl` → middleware

#### Existing Dependency
- AEM Servlet (`PostEmailAttributesServlet`)
- `FormProcessorServiceImpl` service
- External middleware (`aem-datahub-formprocessor`)
- `emailResourceAllocatorKey` (unique key, generation mechanism TBD)

#### Target-State Solution

```
DA Plugin → Author clicks "Add to Page"
    ↓ (blocking — prevent insertion until success)
App Builder Action: POST /api/emailAttributes
    ↓
Middleware (aem-datahub-formprocessor or equivalent)
    ↓
Returns: { "emailResourceAllocatorKey": "abc-123-xyz" }
    ↓
Plugin inserts block table WITH the key
```

#### Integration Flow

| Step | Actor | Action |
|---|---|---|
| 1 | Author | Fills email config → clicks "Add to Page" |
| 2 | Plugin | Detects email action type (1006/1007/1011) is selected |
| 3 | Plugin | Constructs payload: template, subject, mailto, regional config |
| 4 | Plugin | `fetch('https://<app-builder>/api/emailAttributes', { method: 'POST', body })` |
| 5 | App Builder | Forwards to middleware with credentials |
| 6 | Middleware | Persists email config, generates/returns `emailResourceAllocatorKey` |
| 7 | App Builder | Returns key to plugin |
| 8 | Plugin | On success: includes `email-key` in block table, inserts via `sendHTML` |
| 9 | Plugin | On failure: shows error, does NOT insert block |

#### Assumptions & Constraints
- **Critical assumption:** `emailResourceAllocatorKey` is generated by middleware (not client-side)
- Middleware endpoint must be accessible from App Builder action
- Payload format matches existing middleware contract
- On edit/update: API called again with same or new key (middleware handles update)
- At form submission time: only the key is sent in POST — never actual email addresses

---

## 7. Runtime Ownership & Dependency Matrix

### 7.1 Component Ownership

| Component | Owner | Responsibility |
|---|---|---|
| DA Plugin UI (HTML/CSS/JS) | EDS Development Team | Build, maintain, deploy plugin code |
| App Builder Actions | EDS Development Team | Build serverless actions, manage deployment |
| AEM GraphQL Endpoint | AEM/Content Team | Maintain CF models, publish content |
| GCMS ID Generation Backend | TFS Backend Team | Provide API, maintain database |
| Email Middleware | TFS Backend Team | Provide endpoint, generate keys, persist config |
| EDS Block Rendering (`tfs2-form.js`) | EDS Development Team | Parse config, render form, handle submission |
| Form Submission Processing | TFS Backend Team | Route submissions based on action types |

### 7.2 Dependency Matrix

| Dependency | Provider | Consumer | Type | Critical? |
|---|---|---|---|---|
| DA SDK | Adobe (da.live) | Plugin | Runtime library | Yes |
| AEM GraphQL (divisions) | AEM Cloud | App Builder | Data source | No (fallback: static JSON) |
| GCMS ID API | TFS Backend | App Builder | Service API | Yes (no fallback) |
| Email Middleware | TFS Backend | App Builder | Service API | Yes (blocks save) |
| App Builder Runtime | Adobe I/O | Plugin | Serverless platform | Yes |
| `.aem.page` domain | Adobe EDS | Plugin hosting | CDN/Preview | Yes |

### 7.3 Runtime Responsibilities

| Phase | Responsible System | Actions |
|---|---|---|
| **Authoring** | DA Plugin + App Builder | UI, validation, API calls, block insertion |
| **Storage** | DA (content.da.live) | Persist document with block tables |
| **Preview/Publish** | EDS (aem.page/aem.live) | Serve page with block JS/CSS |
| **Rendering** | EDS Block JS (tfs2-form.js) | Parse config, build form HTML, step navigation |
| **Submission** | EDS Block JS + Backend | Collect form data, POST to configured endpoints |
| **Processing** | TFS Backend | Route data to Eloqua/GCMS/Email/etc. |

---

## 8. Middleware Clarification (Critical)

### 8.1 Current Understanding

The `emailResourceAllocatorKey` is a unique identifier that:
- Associates a form instance with its email configuration in a backend database
- Is generated when email attributes are first persisted
- Is sent as part of form submission payload (instead of actual email addresses)
- Provides security: email addresses are never exposed in client-side HTML or form POST

### 8.2 Existing Assumption

**The current working assumption is:**

> When the DA plugin calls the email attributes API (via App Builder), the middleware will:
> 1. Receive the email configuration payload
> 2. Persist it in the backend database
> 3. Generate (or return existing) `emailResourceAllocatorKey`
> 4. Return the key in the API response

The plugin then stores this key in the block table as `email-key`.

### 8.3 Dependency on Middleware

| Aspect | Detail |
|---|---|
| **Key generation** | Middleware responsibility (not client-side) |
| **Key persistence** | Middleware stores key ↔ email config mapping |
| **Key lookup** | At form submission, backend resolves key → email config |
| **Key update** | On edit, middleware accepts same key or generates new one |
| **Key format** | Unknown — assumed to be string (UUID or similar) |

### 8.4 Open Questions

| # | Question | Impact if Unresolved |
|---|---|---|
| 1 | Is `emailResourceAllocatorKey` generated by middleware or derived from form path/ID? | Plugin may need to generate and send key vs. receive it |
| 2 | What is the exact payload contract for the email attributes API? | Plugin may send incorrect format |
| 3 | Does the middleware support "update" (same key, new config) or only "create"? | Edit mode behavior unclear |
| 4 | Is the existing middleware (`aem-datahub-formprocessor`) accessible outside AEM? | May need new middleware or proxy |
| 5 | What authentication does the middleware require? | App Builder action auth setup |

### 8.5 Potential Risks

| Risk | Severity | Mitigation |
|---|---|---|
| Middleware not accessible from App Builder | High | Confirm network connectivity early; may need VPN/private networking |
| Key generation logic is AEM-specific | Medium | Extract logic into standalone service or App Builder action |
| Middleware contract changes | Medium | Version API; agree on stable contract before implementation |
| Key/config synchronization on edit | Low | Always re-call API on update; middleware handles idempotency |

---

## 9. Current vs Future State Comparison

### 9.1 Behavioral Changes

| Behavior | Current (AEM) | Future (DA/EDS) |
|---|---|---|
| Dialog opens | Coral UI dialog inline | iframe plugin in Library panel (dialog mode) |
| Dropdown population | Server-side Sling datasource | Client-side fetch via App Builder |
| GCMS Fetch | AJAX to AEM servlet | Fetch to App Builder action |
| Email persistence | AJAX on dialog save (blocking) | Fetch on "Add to Page" (blocking) |
| Config storage | JCR node properties | Block table rows (key-value HTML) |
| Edit existing | Re-open dialog on same component | Select block → open plugin → "Edit Selected" |
| Multi-step config | Separate template/component pattern | `multistep: true` flag in block table |

### 9.2 Runtime Changes

| Aspect | Current | Future |
|---|---|---|
| Form rendering | Sightly/HTL server-side | Client-side JavaScript (tfs2-form.js) |
| Hidden fields | Rendered by HTL from JCR | Built by JS from block table config |
| Step navigation | Custom AEM clientlib JS | Built into tfs2-form.js |
| Form submission | AEM Form Action framework | Client-side fetch POST |
| Validation | AEM Foundation validation | Native HTML5 validation + custom JS |

### 9.3 Integration Changes

| Integration | Current Path | Future Path |
|---|---|---|
| Division data | AEM DAM → Sling Datasource → Dialog | AEM GraphQL → App Builder → Plugin |
| GCMS ID | AEM Servlet → Dialog field | App Builder → Backend DB → Plugin field |
| Email persist | AEM Servlet → Middleware | App Builder → Middleware → Plugin |
| Form submit | AEM Form Action servlets | Client-side JS → Backend endpoints |

### 9.4 Authoring Changes

| Aspect | Current | Future |
|---|---|---|
| Form Container | Drag component → open dialog | Open Form Config plugin → configure |
| Form Fields | Drag components inside container | Open Forms plugin → add fields |
| Multi-step | Template/structural component approach | Step blocks between field groups |
| Fragments | AEM Experience Fragments | `tfs2-form-fragment` blocks with path |
| Reordering | Drag in paragraph system | DA editor block drag/reorder |
| Delete | Select → delete in editor | Select → delete in DA |

### 9.5 Ownership Changes

| Responsibility | Current Owner | Future Owner |
|---|---|---|
| Dialog UI | AEM Component Developer | EDS Plugin Developer |
| Integration logic | AEM Servlet/Service Developer | App Builder Developer |
| Rendering | HTL/Sightly Developer | EDS Block JS Developer |
| Content storage | AEM JCR | DA Document Storage |
| Deployment | AEM Cloud Manager | GitHub (auto-deploy on push) |

---

## 10. Risks, Dependencies & Open Questions

### 10.1 Technical Risks

| # | Risk | Probability | Impact | Mitigation |
|---|---|---|---|---|
| 1 | Plugin iframe loses editor selection on open (edit mode unreliable) | Medium | Medium | Implemented workaround: "Edit Selected" button with retry |
| 2 | `sendHTML` doesn't support complex HTML structures | Low | High | Validated: table insertion works via `<table>` elements |
| 3 | App Builder cold start latency on Fetch/Email calls | Medium | Low | Add loading indicators; consider warm-up strategies |
| 4 | Block table becomes very large (many action types selected) | Low | Low | Only non-empty values stored; table is machine-readable not author-facing |
| 5 | DA plugin caching (old version served) | Medium | Medium | Use `.aem.page` domain (no CDN caching) for plugin URL |
| 6 | ProseMirror schema limitations | Low | Medium | Validated: standard `<table>` elements are supported |

### 10.2 Integration Dependencies

| Dependency | Status | Owner | Blocker? |
|---|---|---|---|
| AEM GraphQL endpoint for divisions | Available (AEM Cloud) | AEM Team | No — fallback to static JSON |
| GCMS ID generation API spec | **Not yet provided** | TFS Backend | Yes for GCMS action type |
| Email middleware API spec | **Not yet provided** | TFS Backend | Yes for Email/CORA/FSBIO |
| App Builder project setup | Not started | EDS Team | Yes for all integrations |
| CORS configuration | Not configured | EDS Team | Yes for plugin → App Builder |
| Middleware network accessibility | **Unknown** | TFS Infrastructure | Potential blocker |

### 10.3 Assumptions

| # | Assumption | Risk if Invalid |
|---|---|---|
| 1 | AEM Cloud GraphQL is accessible from App Builder | Need alternative data source for divisions |
| 2 | Middleware accepts same payload format as current AEM servlet | Need payload transformation in App Builder |
| 3 | `emailResourceAllocatorKey` is generated by middleware | Plugin flow changes if client must generate key |
| 4 | GCMS ID generation is a simple API call (no complex auth) | App Builder action becomes more complex |
| 5 | All 11 action types are needed in Phase 1 | Can prioritize most-used types first |
| 6 | Division/MQO options don't change frequently | Static JSON fallback is acceptable |

### 10.4 Open Clarification Items

| # | Item | Required From | Priority |
|---|---|---|---|
| 1 | GCMS ID generation: exact API endpoint, auth, request/response format | TFS Backend Team | High |
| 2 | Email middleware: exact endpoint, auth, payload contract, response format | TFS Backend Team | High |
| 3 | `emailResourceAllocatorKey`: who generates it, format, update behavior | TFS Backend/Middleware Team | Critical |
| 4 | LSG action type (1003): full configuration spec | TFS Product Team | Medium |
| 5 | Genesys DB (1013): full configuration spec | TFS Product Team | Medium |
| 6 | Division CF model: GraphQL query name, persisted query availability | AEM Team | Medium |
| 7 | Middleware network: accessible from Adobe I/O Runtime? | TFS Infrastructure | High |
| 8 | Form submission endpoints: same as today or new? | TFS Backend Team | Medium |

### 10.5 Implementation Concerns

| Concern | Detail | Recommendation |
|---|---|---|
| **Phased rollout** | Not all integrations available Day 1 | Phase 1: Static config + manual IDs. Phase 2: Live integrations |
| **Testing** | Can't test integrations without backend endpoints | Mock App Builder actions for development/QA |
| **Fallback** | What if App Builder is down? | Plugin allows manual input for all fields; API calls optional |
| **Migration** | Existing forms in AEM need migration to DA | Build migration tooling to extract JCR config → block tables |
| **Training** | Authors accustomed to AEM dialog UX | Provide documentation + training on DA plugin workflow |

---

## Appendix A: Block Table Schema

### tfs2-form (Form Container)

| Key | Value Example | Source |
|---|---|---|
| multistep | true | Form Config plugin toggle |
| action-types | 1001,1006 | Multi-select in plugin |
| eloqua-form-name | my-form | Eloqua config section |
| eloqua-instance | instance-1 | Eloqua config section |
| eloqua-regions | north-america:us:form-na\|europe:uk:form-eu | Repeatable rows |
| gcms-form-id | 12345678 | Fetch button / manual |
| gcms-regions | north-america:87654321\|europe:11223344 | Repeatable rows with Fetch |
| marketo-form-id | MK-001 | Manual input |
| nonlsg-type | lead | Dropdown selection |
| email-template | standard | Dropdown |
| email-subject | New inquiry | Text input |
| email-mailto | a@co.com,b@co.com | Repeatable emails |
| email-regional-enabled | true | Toggle |
| email-regional-config | north-america:Subject NA:na@co.com | Repeatable rows |
| email-key | abc-123-xyz | Returned by middleware API |
| s3-form-id | S3-001 | Manual input |
| elms-type | lead | Dropdown |
| mqo-form | form-a | Dropdown (from API/JSON) |
| division | life-sciences | Dropdown (from API/JSON) |
| id | form-container-123 | Auto-generated or manual |
| session-storage | true | Toggle |
| session-key | formData | Text input |
| session-persist | true | Checkbox |

---

## Appendix B: App Builder Actions Specification

### Action 1: GET /api/divisions

| Aspect | Detail |
|---|---|
| **Method** | GET |
| **Auth** | None (public) or API key |
| **Backend call** | AEM GraphQL: persisted query for division CFs |
| **Response** | `[{ "text": "Division Name", "value": "division-id" }]` |
| **Caching** | 1 hour (divisions rarely change) |
| **Fallback** | Return static list if AEM unreachable |

### Action 2: GET /api/gcms/generateFormId

| Aspect | Detail |
|---|---|
| **Method** | GET |
| **Auth** | API key or service token |
| **Backend call** | TFS database/service (TBD) |
| **Response** | `{ "formId": "12345678" }` |
| **Caching** | None (each call generates new ID) |
| **Error handling** | Return 500 with error message |

### Action 3: POST /api/emailAttributes

| Aspect | Detail |
|---|---|
| **Method** | POST |
| **Auth** | API key or service token |
| **Payload** | `{ actionType, emailConfig: { template, subject, mailto[], regional[] } }` |
| **Backend call** | Middleware (aem-datahub-formprocessor or equivalent) |
| **Response** | `{ "emailResourceAllocatorKey": "abc-123-xyz" }` |
| **Blocking** | Yes — plugin waits for response before inserting block |
| **Error handling** | Return error → plugin shows message, blocks insertion |

---

*End of Document*
