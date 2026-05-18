# Immersive Block — DA + EDS Solution Design

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
5. [Content Categories](#5-content-categories)
6. [Authoring Examples](#6-authoring-examples)

---

## 1. Block Overview

| Property | Value |
|---|---|
| Block Name | Immersive |
| Description | A single EDS block for embedding interactive 3D tours, calculators, forms, quizzes, configurators, and other rich experiences directly on the page. Authors select an experience type and provide a URL/identifier — all rendering logic is handled by the block. |
| Authoring Strategy | Flattened block — key-value pair table. Author selects variant (experience type) and provides one URL or identifier. Minimal authoring surface. |
| Authoring Source | DA (Document Authoring) |
| Delivery | Edge Delivery Services (EDS) |

### Design Principle

Authors should never paste iframe code, script tags, or raw HTML. The block handles all embed construction, asset loading, and rendering internally. The author's only responsibility is selecting the experience type and providing the URL/identifier given to them by the immersive team or vendor.

---

## 2. Authoring Criteria

**Experience type (variant)** — required. Selected via the block header. Determines how the block renders the content.

**URL or identifier** — required. A single URL or ID that points to the experience. What this looks like depends on the content category:

| Content Category | What the author provides | Provided by |
|---|---|---|
| 3D Tour | Experience JSON URL | Internal immersive team |
| Web Experience | Bundle URL (JS entry point) | Internal immersive team |
| External Embed | Experience ID or URL | External vendor / project team |

**That's it.** The author provides one variant and one URL. Everything else — rendering, asset loading, iframe construction, viewer initialization — is handled by the block.

---

## 3. Variants

The variant identifies the type of immersive experience. It determines the rendering approach used by the block JS.

| Variant | DA Block Name | Description |
|---|---|---|
| `3d-tour` | `Immersive (3d-tour)` | Interactive 3D product tour with rotatable model, hotspots, side menu, camera perspectives, animations, and AR support |
| `calculator` | `Immersive (calculator)` | Interactive calculator or cost savings tool |
| `selection-tool` | `Immersive (selection-tool)` | Cross-reference or product selection tool |
| `learning-lab` | `Immersive (learning-lab)` | Interactive learning lab or learning center |
| `virtual-experience` | `Immersive (virtual-experience)` | Virtual lab or platform experience |
| `quiz` | `Immersive (quiz)` | Quiz or assessment |
| `game` | `Immersive (game)` | Marketing game or gamification experience |
| `configurator` | `Immersive (configurator)` | Product configurator |
| `form` | `Immersive (form)` | External form experience |
| `landing-page` | `Immersive (landing-page)` | Interactive landing page |

Authors select the experience type from this list. The block determines how to render it internally based on the variant.

---

## 4. DA Block Table Contract

### 4.1 Table Structure

The Immersive block is a **minimal key-value table**. One row for the URL/identifier. That's the entire authoring surface.

| Column | Role | Content |
|---|---|---|
| Column 1 | Key | Property name (`url`) |
| Column 2 | Value | URL or identifier for the experience |

### 4.2 Block Header and Variant

The first row is the block header. The variant (experience type) is specified in parentheses.

| Author types in header row | Content category |
|---|---|
| `Immersive (3d-tour)` | 3D Tour |
| `Immersive (calculator)` | Web Experience |
| `Immersive (selection-tool)` | Web Experience |
| `Immersive (learning-lab)` | Web Experience |
| `Immersive (virtual-experience)` | Web Experience |
| `Immersive (quiz)` | Web Experience |
| `Immersive (game)` | Web Experience |
| `Immersive (configurator)` | Web Experience |
| `Immersive (form)` | External Embed |
| `Immersive (landing-page)` | Web Experience |

### 4.3 Available Properties

| Key (Column 1) | Value (Column 2) | Required | Description |
|---|---|---|---|
| `url` | URL or identifier | Yes | The experience JSON URL, bundle URL, or external experience ID/URL |

Only one property row is needed. The variant in the block header tells the block JS how to interpret and render the URL.

### 4.4 How the Block Works at Delivery Time

The block JS reads the variant and URL, then applies the appropriate rendering strategy:

| Variant category | Block JS action |
|---|---|
| **3D Tour** | Creates canvas element + UI overlay → loads viewer engine from config sheet → passes experience JSON URL to viewer |
| **Web Experience** | Creates a mount div → loads the experience's JS/CSS bundle from the URL → bundle handles all rendering |
| **External Embed** | Constructs an iframe from the ID/URL → handles resize and cross-domain communication |

All loading is asynchronous — the immersive content does not block page rendering.

### 4.5 Authoring Summary

| Concern | Approach |
|---|---|
| Block type | Flattened block — key-value table (one row) |
| Experience type | Variant in block header |
| Experience URL/ID | Single `url` row in the table |
| Rendering logic | Handled entirely by block JS — author provides only the URL |
| Raw HTML / iframes | Never authored directly — block constructs embeds internally |
| Config and assets | Managed by immersive team and dev team — not by content authors |

---

## 5. Content Categories

### 5.1 3D Tour

**Built by:** Internal immersive team
**Rendered via:** Native canvas element using a shared 3D viewer engine

**How it works:**
- Author provides the Experience JSON URL
- Block JS reads viewer engine paths from a shared config sheet (maintained by dev team)
- Viewer engine initializes the 3D scene from the experience JSON
- Features: rotatable 3D model, hotspots, camera views, animations, side menu, AR support

**Experience JSON (maintained by immersive team) defines:**
- 3D model path and environment settings
- Hotspot names, positions, and linked content page URLs
- Camera views and perspectives
- Animations and trigger behaviour
- CTA buttons and links
- Translation keys for localization

**Hotspot popup content:** Authored as standalone chromeless DA pages (no header/footer). Loaded into modals at runtime by the viewer engine. Editable independently from the immersive block.

**Config sheet (maintained by dev team):**
- 3D tour viewer engine JS and CSS bundle paths
- Dev and prod resource paths
- Updated when the immersive team ships a new viewer version — no code deployment needed
- Authors do not interact with this

### 5.2 Web Experience

**Built by:** Internal immersive team
**Rendered via:** Experience's own JS/CSS bundle loaded dynamically

**How it works:**
- Author provides the Bundle URL (path to the experience's JS entry point)
- Block JS creates a mount div and loads the bundle
- The experience's own code handles all rendering and interaction

**Includes:** Calculators, learning labs, virtual experiences, selection tools, quizzes, games, configurators, interactive landing pages.

### 5.3 External Embed

**Built by:** External vendors
**Rendered via:** iframe constructed by the block

**How it works:**
- Author provides the experience ID or URL
- Block JS constructs the iframe internally from the identifier
- Block handles domain logic, iframe resize, and cross-domain communication

**Hosted on:** Thermo Fisher subdomains and third-party domains (e.g. Kaon)

**Note:** External iframe content loads after the EDS page — expected latency from cross-domain calls. Native rendering (3D tour, web experience) provides full analytics tracking; iframe-based embeds may have limited tracking.

---

## 6. Authoring Examples

### 6.1 Example 1 — 3D Product Tour

An interactive 3D tour of the Volumescope 2 SEM.

| Immersive (3d-tour) | |
|---|---|
| url | /content/dam/experiences/volumescope-tour.json |

**What renders:** A full-width interactive 3D viewer with a rotatable product model, clickable hotspots showing product features, camera perspective buttons, a side menu, and AR launch button on supported devices.

---

### 6.2 Example 2 — Cost Savings Calculator

An interactive calculator tool.

| Immersive (calculator) | |
|---|---|
| url | /content/dam/experiences/cost-savings-calculator/bundle.js |

**What renders:** An interactive calculator where users input their lab parameters and see estimated cost savings. Fully rendered from the JS bundle — no iframe.

---

### 6.3 Example 3 — Product Selection Tool

A cross-reference or product finder tool.

| Immersive (selection-tool) | |
|---|---|
| url | /content/dam/experiences/antibody-selector/bundle.js |

**What renders:** A guided product selection tool where users answer questions or apply filters to find the right product for their application.

---

### 6.4 Example 4 — Learning Lab

An interactive learning centre.

| Immersive (learning-lab) | |
|---|---|
| url | /content/dam/experiences/pcr-learning-lab/bundle.js |

**What renders:** An interactive educational experience with step-by-step modules, animations, and knowledge checks.

---

### 6.5 Example 5 — External Vendor Embed (Kaon)

An externally hosted interactive experience.

| Immersive (configurator) | |
|---|---|
| url | kaon-experience-12345 |

**What renders:** An iframe-based product configurator hosted by the external vendor. The block constructs the iframe from the ID, handles sizing, and manages cross-domain communication.

---

### 6.6 Example 6 — Quiz

An interactive quiz or assessment.

| Immersive (quiz) | |
|---|---|
| url | /content/dam/experiences/genomics-quiz/bundle.js |

**What renders:** A multi-step quiz with questions, scoring, and results. Users interact directly on the page — no navigation away from the content.
