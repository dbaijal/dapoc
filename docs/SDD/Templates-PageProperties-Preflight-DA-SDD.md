# Templates, Page Properties & Preflight — DA Solution Design

**Document Version:** 1.0
**Status:** Draft
**Date:** 2026-05-27
**Author:** Adobe Delivery Team

---

## Table of Contents

1. [Overview](#1-overview)
2. [Templates in DA](#2-templates-in-da)
3. [Page Properties (Metadata)](#3-page-properties-metadata)
4. [Preflight — Pre-Publish Validation](#4-preflight--pre-publish-validation)
5. [How They Work Together](#5-how-they-work-together)

---

## 1. Overview

This document covers how page consistency, structure, and quality are maintained in DA through three connected mechanisms:

| Mechanism | Purpose |
|---|---|
| **Templates** | Provide authors with pre-built page structures as starting points for new pages |
| **Page Properties (Metadata)** | Define page-level configuration — title, description, template type, and any custom properties |
| **Preflight** | Validate content against defined rules before preview or publish — catches issues before content goes live |

Together, these form the page quality and consistency model in DA.

---

## 2. Templates in DA

### 2.1 What Templates Are

Templates in DA are **pre-built page documents** that contain the expected page structure — the right blocks, section metadata, and page metadata already in place. They live in the DA Library and are available to authors when creating new pages.

A template is simply a DA document that has been designated as a template. It contains:
- The blocks expected on that page type (e.g. Hero, Cards, Accordion)
- Section separators and section metadata where needed
- Pre-filled metadata block with required properties (template name, default values)
- Placeholder content where authors should add their own

### 2.2 How Authors Use Templates

1. Author opens the DA Library panel
2. Navigates to **Templates**
3. Selects the appropriate template for the page they want to create (e.g. Product Page, Landing Page, Article Page)
4. The template content is placed into the document — all blocks, sections, and metadata pre-populated
5. Author replaces placeholder content with their actual content

### 2.3 How Templates Are Configured

Templates are configured via a **templates sheet** in the DA Library configuration:

- A sheet with two columns: `key` (template name displayed in Library) and `value` (link to the template document)
- Each template document is a standard DA page containing the expected structure
- Adding a new template = creating a template document + adding an entry to the templates sheet

### 2.4 Different Page Types, Different Templates

For TFS, different page types have different layouts and block combinations. Each page type gets its own template:

| Page Type | Template Contains |
|---|---|
| Product Landing Page | Hero, Product List, Cards, Accordion (FAQ), CTA |
| Content Article | Hero, Anchor List, content sections, Related Content cards |
| Campaign Landing Page | Hero (center-align), Cards, Testimonial, CTA |
| Event Page | Hero, Data List (events), Columns |

Authors select the appropriate template for their page type. The template provides the correct starting structure.

### 2.5 Templates Are Guidance, Not Enforcement

Templates provide the **recommended** structure. Once the template content is placed in the document, authors can modify it — add blocks, remove blocks, or rearrange sections. The template is a starting point, not a constraint.

Enforcement of page structure compliance is handled separately through **Preflight** (Section 4).

---

## 3. Page Properties (Metadata)

### 3.1 How Page Properties Work in DA

In DA, page properties are authored via a **Metadata block** at the end of the page document. This is a standard two-column table with property names and values.

| Metadata | |
|---|---|
| title | Thermal Cyclers |
| description | Explore our range of advanced thermal cyclers |
| template | product-page |
| image | /media/thermal-cyclers-hero.jpg |
| robots | index, follow |

### 3.2 Common Page Properties

| Property | Purpose |
|---|---|
| `title` | Page title — used in browser tab, search results, and as H1 if block reads it |
| `description` | Meta description for SEO |
| `template` | Identifies the page type — used by code for template-specific styling or logic |
| `image` | Social sharing / OG image |
| `robots` | Search engine indexing directives |
| `breadcrumbs` | Enable/disable breadcrumb display |
| `locale` | Language/country for the page |

Additional custom properties can be added as needed — any key-value pair in the Metadata block is available to block JS and page-level code.

### 3.3 Bulk Metadata

For properties that apply across entire folders or sections of the site, DA supports **bulk metadata** via a spreadsheet. This avoids repeating the same metadata on every page.

| URL pattern | template | robots | breadcrumbs |
|---|---|---|---|
| /products/** | product-page | index, follow | true |
| /campaigns/** | campaign-page | noindex, nofollow | false |
| /support/** | support-page | index, follow | true |

Bulk metadata applies to all pages matching the URL pattern. If a page has its own Metadata block with the same property, the page-level value takes precedence.

### 3.4 How the `template` Property Is Used

The `template` metadata value is read by page-level code to apply template-specific behaviour:

- **CSS loading** — different template types can load additional stylesheets (e.g. `product-page.css`)
- **Auto-blocking** — code can automatically inject or configure blocks based on template type
- **Layout logic** — JS can apply different section layouts or grid configurations per template
- **Preflight rules** — custom preflight checks can validate content based on the declared template type

The `template` property does not enforce anything by itself — it is a declaration that code reads and acts upon.

---

## 4. Preflight — Pre-Publish Validation

### 4.1 What Preflight Is

Preflight is an **always-on plugin in the DA Prepare menu** that automatically checks a document for issues before the author previews or publishes. It is the quality gate that catches problems before content reaches the live site.

### 4.2 When Preflight Runs

When an author opens the **Prepare menu** in DA, preflight runs automatically and presents its findings. Authors review the results and address any issues before proceeding with preview or publish.

Preflight checks are categorized by severity:

| Severity | Meaning |
|---|---|
| **Error** | Critical issue — should be fixed before publishing |
| **Warning** | Potential problem — author should review |
| **Info** | Informational — may need attention |
| **Success** | Check passed — no issues found |

Issues are grouped by category for easy review and remediation.

### 4.3 What Preflight Checks Out of the Box

DA preflight includes built-in checks for common content quality issues:

| Check | What it detects |
|---|---|
| Unpublished fragments | Page references a fragment that has not been published — would result in missing content |
| Unreachable internal links | Links to internal pages that return errors or don't exist |
| Unreachable external links | Links to external URLs that are broken or unreachable |
| Placeholder content | Lorem ipsum or other placeholder text left in the page |
| Missing page title | No title defined in page metadata |
| Duplicate page title | Same title used as another page |
| Missing meta description | No description defined in page metadata |
| Duplicate meta description | Same description used as another page |
| Missing H1 | Page has no H1 heading |
| Multiple H1s | Page has more than one H1 heading |

### 4.4 Extensibility — Custom Rules for TFS

Preflight is **extensible via custom plugins**. TFS-specific validation rules can be built to enforce content standards beyond the OOTB checks. Custom preflight rules can validate any aspect of the page content that is programmatically inspectable.

**Examples of custom rules that can be built for TFS:**

| Custom Rule | What it would validate |
|---|---|
| Required metadata fields | Check that specific metadata properties (e.g. `template`, `locale`, `breadcrumbs`) are present |
| Template-specific block validation | Based on the declared `template` value, verify expected blocks are present on the page |
| Content length checks | Warn if description is too short/long, or if page has insufficient content |
| Image alt text | Check that all images have alt text for accessibility |
| Block configuration validation | Verify that key-value blocks have required properties filled (e.g. Product List must have `sku-list`) |
| Metadata value validation | Check that `template` value is from an approved list, or `robots` is correctly formatted |
| Section structure checks | Validate expected number of sections or section metadata presence |

### 4.5 How Authors Experience Preflight

1. Author finishes editing a page
2. Author opens the **Prepare menu**
3. Preflight runs automatically — checks the document against all configured rules
4. Results are displayed grouped by category with severity indicators
5. Author reviews and addresses errors and warnings
6. Once satisfied, author proceeds to preview or submit for publish approval

Preflight does not block the author from previewing — it informs and guides. Combined with the publish approval workflow, it provides a two-layer quality net: preflight catches technical issues, reviewers catch content/business issues.

### 4.6 Integration with AEM Sites Optimizer

Preflight integrates with AEM Sites Optimizer for broader reporting across the site — providing visibility into content quality at scale, not just per-page.

---

## 5. How They Work Together

Templates, page properties, and preflight form a connected content quality model in DA:

```
┌─────────────────────────────────────────────────────────────┐
│  AUTHOR CREATES A NEW PAGE                                  │
│                                                             │
│  Step 1: SELECT TEMPLATE                                    │
│  → Library provides pre-built page structure                │
│  → Correct blocks, sections, and metadata pre-populated     │
│  → Author has the right starting point                      │
│                                                             │
│  Step 2: AUTHOR CONTENT                                     │
│  → Author replaces placeholder with real content            │
│  → Adds/modifies blocks as needed                           │
│  → Fills in metadata (page properties)                      │
│                                                             │
│  Step 3: PREFLIGHT (Prepare Menu)                           │
│  → Automatic validation runs                                │
│  → OOTB checks: broken links, missing titles, placeholders  │
│  → Custom rules: template compliance, required fields, etc. │
│  → Author fixes issues before proceeding                    │
│                                                             │
│  Step 4: PUBLISH WORKFLOW                                    │
│  → Author submits for approval                              │
│  → Reviewer validates content (human judgment)              │
│  → Approved → published to live site                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

| Layer | What it provides | Type |
|---|---|---|
| **Templates** | Correct starting structure — right blocks, right layout | Guidance |
| **Metadata** | Page identity and configuration — template type, SEO, locale | Declaration |
| **Preflight** | Automated validation — catches technical and compliance issues | Automated check |
| **Publish Workflow** | Human review — catches content quality and business alignment issues | Human review |

This layered approach ensures:
- Authors start with the right structure (templates)
- Pages have correct properties and identity (metadata)
- Technical issues are caught before publish (preflight)
- Business and content quality issues are caught by reviewers (workflow)
