# Brightcove Integration — Solution Design

**Document Version:** 2.0 (DA)
**Status:** Draft
**Date:** 2026-05-18
**Author:** Adobe Delivery Team

---

## Table of Contents

1. [Objective](#1-objective)
2. [Architecture](#2-architecture)
3. [Configuration Sheet](#3-configuration-sheet)
4. [Runtime Flow](#4-runtime-flow)
5. [Schema.org (JSON-LD) via Edge Worker](#5-schemaorg-json-ld-via-edge-worker)
6. [Brightcove Plugin](#6-brightcove-plugin)
7. [Ownership and Boundaries](#7-ownership-and-boundaries)

---

## 1. Objective

Integrate Brightcove video playback into the EDS site in a way that is:

- Easy for authors to use (no technical IDs exposed)
- Scalable across multiple accounts and player configurations
- Lightweight for the frontend
- Aligned with Edge Delivery principles
- SEO-optimized with automated Schema.org metadata

The solution provides a simple authoring experience via a DA plugin, avoids exposing Brightcove technical IDs to authors, supports both video and playlist use cases, and keeps the integration frontend-driven.

---

## 2. Architecture

### 2.1 Integration Layers

| Layer | Responsibility |
|---|---|
| **Brightcove Plugin (DA)** | Guided authoring — account selection, video/playlist ID entry, display mode. Writes block table to document. |
| **Configuration Sheet** | Single source of truth for account-to-ID and player-to-ID mappings. Published as JSON. |
| **Video / Video Playlist Block (EDS)** | Reads authored config from block table, fetches config sheet, resolves friendly names to Brightcove IDs, injects Brightcove player dynamically. |
| **Edge Worker** | Detects video/playlist blocks, fetches metadata from Brightcove Playback API, injects Schema.org JSON-LD into page response. |
| **Brightcove CDN** | Hosts player JS. Player loads and talks directly to Brightcove backend — no EDS backend integration required. |

### 2.2 Design Principles

- **No raw HTML or iframe code authored** — block handles all embed construction
- **No Brightcove IDs exposed to authors** — authors see friendly names (CBD, PGH, FEI), config sheet resolves to IDs
- **Frontend-driven rendering** — Brightcove player JS loaded from Brightcove CDN, no EDS server-side processing for playback
- **Lazy loading** — player script loaded when block enters viewport (protects Lighthouse scores)
- **Centralized configuration** — one sheet governs all account/player mappings site-wide

---

## 3. Configuration Sheet

### 3.1 Location

The Brightcove configuration sheet is stored at:

```
/config/brightcove.xlsx
```

Published as JSON at: `/config/brightcove.json`

This location is chosen because:
- `/config/` is the standard EDS location for site-wide configuration
- The sheet is shared across all Video and Video Playlist blocks site-wide
- It's separate from content pages and data sheets
- Authors do not need to access this — it's maintained by the implementation/admin team

### 3.2 Sheet Structure

| Account Name | Account ID | Player Name | Player ID | Player Type | Playlist Align |
|---|---|---|---|---|---|
| CBD | 3663210762001 | Default Player | abc123def | default | |
| CBD | 3663210762001 | Playlist with right rail | xyz456ghi | playlist | right-rail |
| CBD | 3663210762001 | Playlist with bottom rail | jkl789mno | playlist | bottom-rail |
| PGH | 6650015910001 | Default Player | pqr012stu | default | |
| PGH | 6650015910001 | Playlist with right rail | vwx345yza | playlist | right-rail |
| PGH | 6650015910001 | Playlist with bottom rail | 9wemoeX81 | playlist | bottom-rail |
| FEI | 8876543210001 | Default Player | bcd678efg | default | |
| FEI | 8876543210001 | Playlist with right rail | hij901klm | playlist | right-rail |
| FEI | 8876543210001 | Playlist with bottom rail | nop234qrs | playlist | bottom-rail |

### 3.3 How It's Used

- **Brightcove Plugin** fetches this sheet to populate the Account dropdown in the authoring dialog
- **Block JS** fetches this sheet at runtime to resolve friendly names to Brightcove account/player IDs
- **Edge Worker** fetches this sheet to resolve account IDs for Playback API calls (Schema.org)

### 3.4 Maintenance

The config sheet is maintained by the implementation/admin team. Changes include:
- Adding new accounts
- Adding new player configurations
- Updating player IDs when Brightcove players are reconfigured

Changes are a spreadsheet edit — no code deployment needed.

---

## 4. Runtime Flow

### 4.1 Video Block Runtime

```
1. Page loads → Block JS detects Video block
2. Block reads authored values (account name, video ID, display mode)
3. Block fetches /config/brightcove.json
4. Resolves: account name → account ID, default player → player ID
5. Constructs Brightcove player markup:
   <video data-video-id="..." data-account="..." data-player="..." ...>
6. Injects Brightcove player script from CDN:
   https://players.brightcove.net/ACCOUNT_ID/PLAYER_ID_default/index.min.js
7. Brightcove player initializes and handles playback
```

### 4.2 Video Playlist Block Runtime

```
1. Page loads → Block JS detects Video Playlist block
2. Block reads authored values (account name, playlist ID, player type)
3. Block fetches /config/brightcove.json
4. Resolves: account name → account ID, player type → player ID
5. Constructs Brightcove playlist player markup
6. Injects appropriate player script
7. Brightcove playlist player initializes with selected layout (right-rail or bottom-rail)
```

### 4.3 Brightcove Player Behaviour

Once loaded, the Brightcove player JS communicates directly with Brightcove's backend using the configured account, player, and video/playlist IDs. This means:
- No extra EDS backend integration is required for playback
- No EDS server-side processing is needed
- The Brightcove embed remains fully managed by the frontend block

---

## 5. Schema.org (JSON-LD) via Edge Worker

### 5.1 Approach

Schema.org metadata (VideoObject) is automatically injected into pages containing Brightcove video or playlist blocks via an **Edge Worker**. No manual authoring of Schema.org metadata is required.

### 5.2 Flow

1. Author publishes page with Video/Playlist block
2. HTML is served via Edge Delivery CDN
3. Edge Worker intercepts the response:
   - Parses HTML to detect Brightcove blocks
   - Extracts account name and video/playlist ID from block markup
   - Fetches `/config/brightcove.json` to resolve account ID
   - Calls Brightcove Playback API to retrieve video metadata (title, description, thumbnail, duration, upload date)
   - Constructs VideoObject JSON-LD
   - Injects `<script type="application/ld+json">` into the HTML `<head>`
4. Final response is delivered to the browser with Schema.org metadata

### 5.3 Sample JSON-LD Output

```json
{
  "@context": "https://schema.org",
  "@type": "VideoObject",
  "name": "Video Title",
  "description": "Video description",
  "thumbnailUrl": ["https://.../image.jpg"],
  "uploadDate": "2022-01-25T22:55:01.489Z",
  "duration": "PT1M9S",
  "contentUrl": "https://.../video.mp4",
  "embedUrl": "https://players.brightcove.net/{accountId}/{playerId}_default/index.html?videoId={videoId}"
}
```

### 5.4 Benefits

- Better search engine visibility
- Improved content discoverability
- Compatibility with LLM-based consumption
- Zero authoring effort — fully automated

---

## 6. Brightcove Plugin

### 6.1 Overview

The Brightcove plugin is a DA library panel tool that provides guided authoring for both Video and Video Playlist blocks. It replaces manual block table creation with a dialog-driven experience.

### 6.2 Plugin Capabilities

| Capability | Description |
|---|---|
| Account selection | Dropdown populated from `/config/brightcove.json` — shows friendly names |
| Video/Playlist toggle | Author selects whether they're adding a video or playlist |
| Display mode selection | Dropdown: Inline, Button, Link, Thumbnail, Teaser |
| Conditional fields | Plugin shows only fields relevant to the selected display mode |
| Player selection (playlist only) | Dropdown: Default, Right rail, Bottom rail |
| Block table output | Plugin writes the complete block table with correct variant and rows |
| Edit existing block | Plugin reads existing block, pre-populates fields, allows update |

### 6.3 What the Plugin Outputs

**For Video:**

The plugin writes a `Video` or `Video (variant)` block table.

**For Playlist:**

The plugin writes a `Video Playlist` or `Video Playlist (variant)` block table.

The plugin determines the variant from the Display Mode selection and writes it into the block header automatically.

---

## 7. Ownership and Boundaries

| Component | Owner | Responsibility |
|---|---|---|
| Brightcove Plugin (DA) | Adobe / Implementation Team | Plugin UI, config sheet fetch, block table generation, edit support |
| Video Block (EDS) | Adobe / Implementation Team | Block JS/CSS, config resolution, Brightcove player injection, lazy loading, display mode rendering |
| Video Playlist Block (EDS) | Adobe / Implementation Team | Block JS/CSS, config resolution, playlist player injection, rail layout rendering |
| Edge Worker (Schema.org) | Adobe / Implementation Team | Block detection, Playback API call, JSON-LD construction and injection |
| Configuration Sheet | Implementation/Admin Team | Account/player mappings, maintained via spreadsheet edits |
| Brightcove Playback API | TFS / Brightcove | Video metadata for Schema.org, video/playlist content delivery |
| Brightcove Player CDN | Brightcove | Player JS hosting, player rendering |
