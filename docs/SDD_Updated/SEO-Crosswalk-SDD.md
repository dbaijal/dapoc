# SEO — AEM as Authoring Source (Crosswalk)

**Document Version:** 1.0
**Status:** Draft
**Date:** 2026-06-12
**Author:** Adobe Delivery Team
**Authoring Source:** AEM (Universal Editor / Crosswalk) + Edge Delivery Services

---

The SEO foundations of the existing site will be preserved and improved while moving delivery to Adobe Experience Manager with Edge Delivery Services (EDS), authored in AEM using Universal Editor.

At this stage, Adobe's design intent is to achieve SEO parity for critical page types and SEO signals, including page titles, meta descriptions, canonical URLs, robots directives, Open Graph tags, hreflang coverage, sitemap support, redirect handling, crawlable semantic HTML, and applicable Schema.org structured data.

The detailed field-level mapping and template-specific implementation will be finalized during implementation once the final block design, template inventory, localization model, and content authoring patterns are agreed.

## SEO Parity Commitment

The target solution will preserve critical SEO signals and applicable Schema.org structured data from the source implementation, subject to final confirmation of page templates, localization rules, and content model decisions during implementation.

This includes parity for:

- Core metadata fields (title, description, keywords)
- Canonical URL handling with auto-generation fallback
- Robots directives (index/follow, noindex patterns)
- Open Graph metadata (og:title, og:description, og:image, og:type)
- Hreflang alternates for multi-locale pages
- Sitemap and robots.txt support
- Redirect handling (301 permanent redirects)
- Page-type-appropriate structured data (Schema.org)

Adobe will complete a detailed template-level schema inventory, metadata field mapping, generation strategy, and validation matrix during implementation to ensure controlled parity and minimize SEO regression risk during cutover.

> **Note on authoring source:** SEO delivery behaviour (HTML rendering, edge caching, sitemap and robots.txt support, image optimization, structured data injection, and Core Web Vitals) operates at the Edge Delivery layer and is independent of how the content is authored. The authoring source change — from the previous model to **AEM Sites edited in Universal Editor** — affects only how SEO metadata and configuration are authored and managed, not how SEO signals are delivered.

---

## How EDS Delivers SEO Advantages

Edge Delivery Services provides inherent SEO advantages over the traditional AEM architecture:

| Aspect | Traditional AEM 6.4 | EDS (Target State) |
|---|---|---|
| HTML Rendering | Server-side rendered via HTL/JSP on the Publish instance | Pre-rendered static HTML served from the edge CDN — fully crawlable without JS |
| Page Load Speed | Dependent on Dispatcher cache + CDN configuration | Sub-second delivery from the global edge; Lighthouse 100 target |
| JavaScript Dependency | Component clientlibs may block rendering | Vanilla JS loaded progressively; critical content in the initial HTML |
| Image Optimization | Requires Scene7 / Dynamic Media configuration | Automatic image optimization at the edge (format, compression, sizing) |
| Core Web Vitals | Requires optimization effort to achieve good scores | Architecture designed for CWV compliance by default |
| Crawlability | Full HTML available; risk of JS-dependent content | Fully server-rendered semantic HTML; no client-side rendering dependency |
| TTL / Cache | Dispatcher + CDN cache rules | Aggressive edge caching with instant invalidation on publish |

### SEO Architecture Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            SEO ARCHITECTURE FLOW                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│   ┌──────────────┐      ┌──────────────────┐      ┌────────────────────────┐ │
│   │  AEM Author  │      │   EDS Pipeline   │      │     Edge Delivery      │ │
│   │ (Universal   │─────▶│   (Processing)   │─────▶│     (CDN / Browser)    │ │
│   │   Editor)    │      │                  │      │                        │ │
│   └──────────────┘      └──────────────────┘      └────────────────────────┘ │
│          │                       │                            │               │
│          ▼                       ▼                            ▼               │
│   ┌──────────────┐      ┌──────────────────┐      ┌────────────────────────┐ │
│   │ • Page       │      │ • head.html      │      │ • <title>, <meta>      │ │
│   │   metadata   │      │   (global head)  │      │ • Canonical URL        │ │
│   │ • Page title │      │ • Block logic    │      │ • OG tags              │ │
│   │ • OG fields  │      │   (schema gen)   │      │ • Hreflang tags        │ │
│   │ • Robots     │      │ • Sitemap gen    │      │ • JSON-LD structured   │ │
│   │ • Alt text   │      │ • Redirect config│      │   data                 │ │
│   └──────────────┘      └──────────────────┘      │ • robots.txt           │ │
│                                                    │ • sitemap.xml          │ │
│   ┌──────────────┐      ┌──────────────────┐      │ • Semantic HTML        │ │
│   │ Config       │      │ GitHub Repo      │      │ • Optimized images     │ │
│   │ • Redirects  │      │ • head.html      │      │ • Fast TTFB (<200ms)   │ │
│   │ • Sitemap    │      │ • metadata model │      └────────────────────────┘ │
│   │ • Config     │      │ • Block code     │                                 │
│   └──────────────┘      └──────────────────┘                                 │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Metadata Delivery Mechanism

With AEM as the authoring source, SEO metadata is managed through multiple layers:

| Layer | Mechanism | What It Handles |
|---|---|---|
| Page metadata | Authored in **Universal Editor** as page properties / metadata fields on the page | Per-page: title, description, og:image, robots, canonical, custom fields |
| Block-level logic | JavaScript in block decoration (for example, breadcrumb and video blocks) | Schema.org JSON-LD generated from block content (BreadcrumbList, VideoObject, and similar) |
| Configuration data | Maintained as configuration sources published through EDS (for example, redirects and sitemap configuration) | Bulk redirects, sitemap inclusion/exclusion rules |
| Global head | Code file in the GitHub repo (`head.html`) | Shared `<head>` elements: favicon, fonts, global meta tags, analytics scripts |
| Edge/CDN config | Configuration at the delivery layer | robots.txt, security headers, cache headers, environment-aware rules |

The authoring source change affects the first layer (page metadata moves to Universal Editor page properties) and the configuration layer (managed within the AEM/EDS toolchain). The block-level logic, global head, and edge/CDN layers are unchanged. The SEO Architecture Flow above shows how these layers move from authoring through the EDS pipeline to delivery.

---

## Metadata Field Mapping

### Core SEO Metadata

The following table shows the initial target-state ownership for core SEO elements:

| Metadata / SEO Element | Target-State Ownership | Notes |
|---|---|---|
| Page title (`<title>`) | Page-level metadata authored in Universal Editor | Governed defaults may be applied by template; max 60 characters recommended |
| Meta description | Page-level metadata authored in Universal Editor | Max 160 characters; unique per page; used as the Open Graph description fallback |
| Canonical URL | Page-level field with auto-generation fallback | Defaults to a self-referencing canonical; override available for syndicated content |
| Robots directives | Page-level metadata field | Supports index/follow and noindex/nofollow patterns; default is index, follow |
| Open Graph (og:title, og:description, og:image) | Page metadata with fallback logic | Falls back to the page title/description if Open Graph-specific fields are empty |
| Twitter Card meta | Derived from Open Graph fields | `summary_large_image` card type by default |
| Hreflang alternate tags | Locale configuration (AEM MSM) + runtime generation | Needs full locale mapping confirmation during MSM/translation design |
| robots.txt | Global delivery configuration (edge) | Environment-aware: staging blocks all crawlers; production allows |
| sitemap.xml | Generated from the content tree / configuration | Coverage and exclusions validated before launch; auto-updated on publish |

### Authoring Example — Page Metadata in Universal Editor

Authors enter SEO metadata through the page properties / metadata fields in Universal Editor. A typical set of values for a page:

| Field | Example Value |
|---|---|
| title | Environmental Analysis Solutions \| Thermo Fisher Scientific |
| description | Our portfolio of environmental analysis technologies meets today's requirements and tomorrow's challenges. |
| image | /images/environmental-hero.jpg |
| robots | index, follow |
| canonical | (leave empty for the self-referencing default) |
| og:type | website |

These fields are authored in the structured metadata UI of Universal Editor. The EDS pipeline reads them and emits the corresponding `<head>` tags at delivery time.

---

## Structured Data (Schema.org)

### Current State Analysis

Below is an initial analysis of how structured data will be implemented in EDS. This is an initial inventory and will be enhanced during implementation-phase story grooming. Structured data generation is handled by block JavaScript and the global head, which are unchanged by the authoring source.

### Schema Mapping by Block Pattern

Based on the current block inventory, the following schema opportunities are relevant in the target state:

| Block Pattern | Schema Type | Generation Method |
|---|---|---|
| Breadcrumb block | BreadcrumbList | Block JS generates JSON-LD from the navigation hierarchy |
| Video / Video Playlist blocks | VideoObject | Block JS generates from Brightcove embed metadata |
| Product List / Commerce blocks | Product + Offer | Generated from the product data API response |
| FAQ / Accordion FAQ blocks | FAQPage | Block JS generates from accordion item titles and bodies |
| Cards / Carousel / Collection blocks | ItemList | Block JS generates from card/item content |
| Testimonial content | Review / Testimonial | Block JS generates from testimonial author and quote |
| Form content | Semantic HTML only | No schema unless a valid business need is identified |
| Organization (global) | Organization | Global `head.html` — site-wide structured data |
| Search (sitelinks) | WebSite + SearchAction | Global `head.html` — enables the sitelinks search box |

### JSON-LD Implementation Example

Structured data is injected as JSON-LD in the page `<head>` or within the block markup. Block JavaScript reads the authored content and emits the corresponding JSON-LD at render time. The generation mechanism is independent of the authoring source.

```html
<!-- BreadcrumbList — generated by breadcrumb block JS -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.thermofisher.com/" },
    { "@type": "ListItem", "position": 2, "name": "Industrial", "item": "https://www.thermofisher.com/industrial/" },
    { "@type": "ListItem", "position": 3, "name": "Environmental" }
  ]
}
</script>

<!-- FAQPage — generated by accordion block JS when FAQ variant detected -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What is carrier screening?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Carrier screening is a genetic testing approach..."
      }
    }
  ]
}
</script>
```

---

## General SEO Best Practices

The following best practices will be enforced across the EDS implementation:

| Practice | Implementation |
|---|---|
| Server-side rendered HTML | All content in the initial HTML; no JS-dependent text or links |
| HTTPS everywhere | Enforced at the edge CDN layer; HTTP → HTTPS redirect |
| Semantic heading hierarchy | H1 → H2 → H3 structure enforced by block design |
| Minimal click-depth | Important pages within three clicks from the homepage |
| No orphaned pages | All pages linked from navigation or internal links |
| Core Web Vitals compliance | Architecture-first approach following EDS performance practices |
| Image alt text | Required authoring field in the Universal Editor component dialog |
| Clean URL structure | Descriptive, keyword-relevant paths; no query parameters for content |
| Mobile-first responsive | Mobile-first CSS; min-width breakpoints |
| Internal linking | Contextual links within content; breadcrumbs; related content blocks |

**Note:** TFS was to provide a prioritized list of dynamic components/use cases requiring Edge Workers (for example, schema, personalization, dynamic content). Once received, recommendations and solutions can be provided for each.
