# TFS Content Syndication — AEM to EDS + DA Migration Strategy

**Project:** Thermo Fisher Scientific AEM 6.4 → EDS + DA  
**Topic:** Migration of Content Snippet Pages (PFP Pods) from AEM to DA  
**Status:** Recommended Approach

---

## 1. Problem Statement

AEM Content Snippet pages are stored at organisational paths with no relationship to the SKU they serve. The connection is made via `cq:tags`:

```
AEM Path:  /content/lifetech/ipac/en-in/syndicated-content/snippets/pfp/pods/cell-culture/promotions/explore-gibco.html
AEM Tag:   pfp:sku/CHROMELEON7/pod_3
```

In EDS + DA, **the path IS the identifier**:

```
EDS Path:  /in/en/snippets/sku/CHROMELEON7/pod-3
```

**The migration must:** Read tags → derive EDS path → extract content → convert to DA format → create document.

---

## 2. Tag-to-Path Derivation

### Tag Structure

```
pfp:sku/CHROMELEON7/pod_3
│   │   │           │
│   │   │           └── pod identifier (pod_3 → pod-3)
│   │   └── SKU value
│   └── type: sku or fam
└── namespace: pfp
```

### Derivation Rule

```javascript
function deriveEdsPath(cqTag, aemLocale) {
  const [, rest] = cqTag.split(':');
  const parts = rest.split('/');
  const type = parts[0];
  const skuValue = parts[1];
  const podClean = parts[2].replace('pod_', 'pod-');

  const [language, country] = aemLocale.includes('-')
    ? aemLocale.split('-')
    : [aemLocale, 'us'];

  return `/${country}/${language}/snippets/${type}/${skuValue}/${podClean}`;
}
```

### Examples

| AEM cq:tags | Locale | EDS Target Path |
|---|---|---|
| `pfp:sku/CHROMELEON7/pod_3` | `en-in` | `/in/en/snippets/sku/CHROMELEON7/pod-3` |
| `pfp:sku/CHROMELEON7/pod_1` | `en` | `/us/en/snippets/sku/CHROMELEON7/pod-1` |
| `pfp:fam/CELL-CULTURE/pod_2` | `en-in` | `/in/en/snippets/fam/CELL-CULTURE/pod-2` |
| `pdp:sku/ABC123/pod_1` | `de-de` | `/de/de/snippets/pdp/ABC123/pod-1` |

---

## 3. Locale Mapping

| AEM Path Segment | EDS Path |
|---|---|
| `/content/lifetech/global/en/` | `/us/en/` |
| `/content/lifetech/ipac/en-in/` | `/in/en/` |
| `/content/lifetech/europe/de-de/` | `/de/de/` |
| `/content/lifetech/europe/fr-fr/` | `/fr/fr/` |
| `/content/lifetech/north-america/en-us/` | `/us/en/` |
| `/content/lifetech/japan/ja-jp/` | `/jp/ja/` |
| `/content/lifetech/greater-china/zh-cn/` | `/cn/zh/` |

---

## 4. Migration Pipeline

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  1. DISCOVER    │     │  2. EXTRACT &    │     │  3. IMPORT      │
│                 │────▶│     TRANSFORM    │────▶│                 │
│ Query AEM for   │     │ Fetch rendered   │     │ Push to DA via  │
│ all snippet     │     │ HTML from AEM    │     │ Admin API       │
│ pages, extract  │     │ publish, convert │     │                 │
│ tags, build     │     │ to DA format     │     │ Publish pages   │
│ manifest CSV    │     │                  │     │                 │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

---

## 5. Content Extraction

Fetch the **already-rendered HTML** from AEM publish (not raw JCR):

```bash
# AEM delivers clean HTML via pfpsnippet selector
GET https://www.thermofisher.com/in/en/product-family-syndicated-content.pfpsnippet.html/sku/CHROMELEON7/3
```

This returns clean content (headings, paragraphs, images, videos) without page shell or AEM decoration.

---

## 6. Content Transformation — AEM to DA Format

### Key Principle

In EDS, **default content** (headings, paragraphs, lists, links, inline images) does NOT need block wrappers. Only non-standard components (video, raw HTML) become blocks.

### Transformation Rules

| AEM Output | DA Format | Notes |
|---|---|---|
| `<h1>` to `<h6>`, `<p>`, `<ul>`, `<ol>`, `<a>` | Keep as-is (bare default content) | No wrapper needed |
| `<img>` inline with text | Keep as-is (default content) | Ensure absolute URLs |
| Image + text in columns | `<div class="columns">` block | Two-column layout |
| Brightcove video/embed | `<div class="video">` block | Extract player URL |
| Raw HTML (`LTRawHTML`) | `<div class="raw-html">` block | Manual review required |

### Example Output (DA format)

```html
<h3>Chromeleon Software</h3>
<p>Increase productivity and efficiency with Chromeleon 7 CDS Software.</p>
<p><a href="/in/en/chromeleon.html">Learn more</a></p>

<div class="video">
  <div><div>
    <a href="https://players.brightcove.net/1234567890/default/index.html?videoId=6012345678001">
      https://players.brightcove.net/1234567890/default/index.html?videoId=6012345678001
    </a>
  </div></div>
</div>
```

### Image Handling

- Download images from AEM DAM
- Upload to DA (or host on a CDN)
- Update image references in content to new URLs
- If keeping AEM publish URLs temporarily: ensure CORS and availability

---

## 7. DA Import

### DA Admin API

```javascript
async function importToDA(edsPath, htmlContent) {
  const url = `https://admin.da.live/source/${DA_ORG}/${DA_SITE}${edsPath}.html`;

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'text/html',
      'Authorization': `Bearer ${DA_TOKEN}`,
    },
    body: htmlContent,
  });

  return { path: edsPath, status: response.status, ok: response.ok };
}
```

### Publish

After import, trigger preview/publish via AEM Admin API:

```javascript
async function publishPage(edsPath) {
  await fetch(`https://admin.hlx.page/preview/${DA_ORG}/${DA_SITE}/main${edsPath}`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${DA_TOKEN}` },
  });
}
```

---

## 8. Migration Manifest

Track all pages through the pipeline:

| AEM Path | cq:tags | Locale | EDS Target Path | Status |
|---|---|---|---|---|
| `.../explore-gibco.html` | `pfp:sku/CHROMELEON7/pod_3` | `en-in` | `/in/en/snippets/sku/CHROMELEON7/pod-3` | PENDING |

Status values: `PENDING` → `EXTRACTED` → `TRANSFORMED` → `IMPORTED` → `PUBLISHED` → `VALIDATED`

---

## 9. Validation

For each migrated page:

1. EDS URL returns HTTP 200
2. Key text strings from AEM exist in EDS output
3. Image URLs are absolute and accessible
4. No AEM-specific class names remain

**Manual review for:**
- Pages with `LTRawHTML` (scripts may not execute)
- Pages with Brightcove video (confirm player loads)

---

## 10. Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Pages with no `cq:tags` | Cannot derive path | Manifest review catches these; content team assigns paths manually |
| Duplicate tags (2 pages → same pod) | Conflict | Manifest flags duplicates; team decides canonical |
| Raw HTML with inline scripts | May not work in EDS | Identify in Phase 1; handle case-by-case |
| Images on AEM publish become unavailable | Broken images | Download and re-upload to DA/CDN |
| Content changes during migration | Stale content | Define content freeze; re-run after freeze |
| DA Admin API rate limits | Slow import | Throttle to 1 request/second |

---

## Summary

```
AEM Content Snippet Page              EDS + DA Document
─────────────────────────             ─────────────────────

Path: .../cell-culture/explore...     Path: /in/en/snippets/sku/CHROMELEON7/pod-3
Tag:  pfp:sku/CHROMELEON7/pod_3

        │  MIGRATION PIPELINE
        │
        ├── 1. Discover: Query AEM → build manifest
        ├── 2. Extract: Fetch rendered HTML from publish
        ├── 3. Transform: AEM HTML → DA default content + blocks
        ├── 4. Import: DA Admin API PUT
        └── 5. Validate: Compare AEM vs EDS output
```
