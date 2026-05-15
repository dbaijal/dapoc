# TFS Forms — Rule Editor SDD

**Document Version:** 2.0
**Status:** Draft
**Date:** 2026-05-13
**Author:** Adobe Delivery Team

---

## Table of Contents

1. [Overview](#1-overview)
2. [Current State — AEM Rule Editor](#2-current-state--aem-rule-editor)
3. [Target Architecture — EDS Rule Editor](#3-target-architecture--eds-rule-editor)
4. [tfs-form-rules Block](#4-tfs-form-rules-block)
5. [Plugin UI — Rule Editor](#5-plugin-ui--rule-editor)
6. [Rule Evaluation Engine](#6-rule-evaluation-engine)
7. [Deliverables](#7-deliverables)
8. [Scope Boundaries](#8-scope-boundaries)

---

## 1. Overview

The Rule Editor provides authors the ability to define conditional visibility rules on form fields. A rule determines whether a form field is shown or hidden based on the value of another field at runtime.

The EDS Rule Editor retains the same authoring mental model and runtime behaviour as the AEM Rule Editor while eliminating server-side dependencies, encryption, and per-field rule storage. All rules are authored through a dedicated Plugin UI and stored in a single `tfs-form-rules` block in the DA document.

---

## 2. Current State — AEM Rule Editor

### 2.1 Authoring

The Rule Editor in AEM is registered as a toolbar action that appears on every form component. A global clientlib registers it dynamically for all components whose `resourceType` starts with `formcommons/components/form`, `tfsite/components/form`, or `patheon/components/form`.

The Rule Editor button appears on all 11 form components: input, options, upload, hidden, label, recaptcha, button, xfinclusion, container, panelcontainer, and stepform.

**Rule types supported:** Show / Hide only.

**Conditions supported:** equal, notequal, lessthan, lessthanequalto, greaterthan, greaterthanequalto, startwith, endwith, contains.

**Logic operators:** all (AND) / any (OR).

### 2.2 Field Discovery

When the Rule Editor dialog opens, it populates the trigger field dropdown via a server-side Sling datasource servlet (`GetFormFieldsServlet`) that reads the JCR directly.

**Discovery scope:**
- Only direct children of the immediate parent form container
- Fields inside nested panel containers are not visible from the parent level
- Fields inside Experience Fragment inclusions are not discoverable
- Multiple form containers on a page are scoped independently

### 2.3 Storage and Runtime

Rules are stored as `rules` child nodes on each individual field component node in JCR. At render time, `ContainerModelImpl` aggregates rules from all child fields into a single JSON array and encrypts it using AES-128-ECB. The encrypted string is placed on the `<form>` element as a `data-showhide` attribute. At runtime, `showhide.js` fetches a decryption key from a server endpoint, decrypts the rules, and wires jQuery change listeners.

### 2.4 Summary

| Concern | AEM Behaviour |
|---|---|
| Rule entry point | Per-field toolbar button |
| Rule storage | Per-field JCR child node |
| Aggregation | Server-side (`ContainerModelImpl`) |
| Runtime delivery | Encrypted `data-showhide` on `<form>` |
| Field discovery | Server-side JCR servlet — direct children only |
| XF field discovery | Not supported |
| JS library | jQuery |

---

## 3. Target Architecture — EDS Rule Editor

### 3.1 Design Decisions

**Single rules block — not per-field.** In AEM, rules live on individual fields because the server aggregates them at render time. In EDS there is no server-side rendering. All rules are defined in one place: a single `tfs-form-rules` block in the DA document. This gives authors a single location to view and manage all form rules.

**No encryption.** In EDS, `tfs-form.js` reads the rules block and removes it from the DOM entirely before the form is presented to the user. Rules are never present in the rendered HTML.

**No server-side aggregation.** `tfs-form.js` reads the `tfs-form-rules` block directly during decoration. No server call, no Sling Model required.

**Plugin-driven authoring only.** The `tfs-form-rules` block table is authored exclusively through the Plugin Rule Editor UI.

### 3.2 Architecture Flow

1. Author opens Rule Editor in the Plugin
2. Plugin reads the editor DOM to discover all `tfs-form-*` blocks and their field names
3. Author builds rules visually — selecting target fields, actions, conditions from dropdowns
4. Plugin writes the `tfs-form-rules` block to the DA document
5. At page render, `tfs-form.js` reads and parses the rules block before building the form
6. The rules block is removed from the DOM — never visible in rendered HTML
7. The rule engine evaluates initial state and attaches change listeners on form fields
8. At runtime, field changes trigger re-evaluation and fields are shown or hidden accordingly

### 3.3 Comparison: AEM vs EDS

| Concern | AEM | EDS |
|---|---|---|
| Rule entry point | Per-field toolbar button | Single Rule Editor in Plugin |
| Rule storage | Per-field JCR node | Single `tfs-form-rules` block |
| Aggregation | Server-side | Not needed |
| Runtime delivery | Encrypted DOM attribute | In-memory — never in DOM |
| Encryption | AES-128-ECB | None |
| Field discovery | Server-side JCR servlet | Plugin reads editor DOM |
| XF field discovery | Not supported | Not supported (same limitation) |
| JS library | jQuery | Vanilla JS |

---

## 4. tfs-form-rules Block

### 4.1 Block Structure

The `tfs-form-rules` block is a two-column DA table placed within the same form section. Rules are stored as numbered key-value rows using a `{ruleNumber}-{property}` naming convention.

Example for two rules:

| Key | Value |
|---|---|
| `1-target` | `state` |
| `1-action` | `show` |
| `1-logic` | `any` |
| `1-cond-1` | `country~contains~IN` |
| `2-target` | `research` |
| `2-action` | `show` |
| `2-logic` | `any` |
| `2-cond-1` | `industry~is-equal-to~diagno` |

### 4.2 Rule Properties

Each rule is identified by a numeric prefix (`1-`, `2-`, etc.) and consists of:

| Property | Values | Description |
|---|---|---|
| `{n}-target` | Field name | The field to show or hide |
| `{n}-action` | `show` / `hide` | Action to apply when conditions are met |
| `{n}-logic` | `any` / `all` | `any` = OR; `all` = AND |
| `{n}-cond-{m}` | `{field}~{operator}~{value}` | Condition string — tilde-delimited |

A rule can have multiple conditions (`{n}-cond-1`, `{n}-cond-2`, etc.).

### 4.3 Supported Operators

| Operator | Behaviour |
|---|---|
| `contains` | Field value contains the given string |
| `is-equal-to` | Field value exactly matches |
| `is-not-equal-to` | Field value does not match |
| `starts-with` | Field value starts with the given string |
| `is-empty` | Field has no value |
| `is-not-empty` | Field has a value |

### 4.4 Block Placement

- The `tfs-form-rules` block must be placed within the same DA section as the `tfs-form` block
- At runtime, the block is read during form decoration and removed from the DOM before the form is rendered
- The block is never visible in the rendered page

---

## 5. Plugin UI — Rule Editor

### 5.1 Entry Point

The Rule Editor is accessible from the Plugin as a dedicated button labelled **Rules** in the field type picker. It opens a dedicated rules screen.

### 5.2 Field Discovery

When the Rule Editor screen opens, the plugin discovers available fields by reading the editor's live DOM. It locates all `tfs-form-*` block tables and reads the `name` property from each. This ensures the dropdown always reflects the current document state — including unsaved changes — without requiring a page preview or save.

If the editor DOM is not accessible, the plugin falls back to fetching the document source from the DA admin API.

### 5.3 Rule Authoring

The Rule Editor presents an inline multi-rule interface:

- All rules are visible simultaneously as cards
- Each card contains: action dropdown (show/hide), target field dropdown, logic dropdown (any/all), and one or more condition rows
- Each condition row contains: source field dropdown, operator dropdown, and value text input
- Authors can add/remove rules and add/remove conditions within a rule
- All field dropdowns are populated dynamically from the document

### 5.4 Read-Back and Edit

When the Rule Editor opens, the plugin reads any existing `tfs-form-rules` block and pre-populates the UI with all existing rules. Authors can modify or delete existing rules. On save, the plugin writes the complete `tfs-form-rules` block to the DA document, replacing any previous version.

---

## 6. Rule Evaluation Engine

The rule evaluation engine is part of `tfs-form.js` and runs as part of the form decoration sequence.

### 6.1 Overview

1. **Parse** — Read the `tfs-form-rules` block from the DOM, parse all rules into an in-memory list, and remove the block from the DOM
2. **Initial state** — For rules with action `show`, hide the target field wrapper before the form is presented. Evaluate all rules once to set correct initial visibility
3. **Listen** — Attach change listeners on all form fields
4. **Evaluate** — On any field change, re-evaluate all rules. For each rule, evaluate every condition against current field values, apply the logic operator (`any`/`all`), and show or hide the target field wrapper accordingly

### 6.2 Show / Hide Behaviour

| Action | Conditions met | Conditions not met |
|---|---|---|
| `show` | Show the field | Hide the field |
| `hide` | Hide the field | Show the field |

Visibility is applied to the field's wrapper element, not the input directly.

---

## 7. Deliverables

| ID | Deliverable | Description | Owner |
|---|---|---|---|
| P2-10 | Rule Editor UI | Rule Editor screen in Plugin. Includes field discovery, rule builder, read-back of existing rules, and write to `tfs-form-rules` block | Adobe |
| P2-11 | `tfs-form-rules` block | Block folder with no-op `decorate()` — all processing owned by `tfs-form.js` | Adobe |
| P2-12 | Rule Evaluation Engine | Evaluation logic within `tfs-form.js` — parse, initial state, change listeners, condition evaluation, and show/hide | Adobe |

---

## 8. Scope Boundaries

| Boundary | Detail |
|---|---|
| Rule types | Show and hide only — same as AEM |
| Field discovery | Plugin discovers `tfs-form-*` blocks in the current DA document. Fields inside Experience Fragment inclusions are not discoverable — same limitation as AEM |
| JS library | Vanilla JavaScript only |
| Rule authoring | Plugin is the only supported way to author rules |
| DOM exposure | Rules are never present in rendered page HTML |
| Form submission | Handling of hidden field values during submission is outside the scope of this deliverable and will be addressed separately |
