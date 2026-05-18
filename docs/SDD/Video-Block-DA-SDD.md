# Video and Video Playlist Blocks — DA + EDS Solution Design

**Document Version:** 2.0 (DA)
**Status:** Draft
**Date:** 2026-05-18
**Previous Version:** 1.0 (UE + AEM Authoring Source)
**Author:** Adobe Delivery Team
**Related Document:** Brightcove Integration — Solution Design (for architecture, Schema.org, and config sheet details)

---

## Table of Contents

1. [Block Overview](#1-block-overview)
2. [Authoring Criteria](#2-authoring-criteria)
3. [Display Modes (Variants)](#3-display-modes-variants)
4. [DA Block Table Contract — Video Block](#4-da-block-table-contract--video-block)
5. [DA Block Table Contract — Video Playlist Block](#5-da-block-table-contract--video-playlist-block)
6. [Brightcove Plugin — Authoring Experience](#6-brightcove-plugin--authoring-experience)
7. [Multi-Video Grid Layout](#7-multi-video-grid-layout)
8. [Authoring Examples](#8-authoring-examples)

---

## 1. Block Overview

TFS uses Brightcove Video Cloud as its video hosting platform. The EDS implementation uses **two separate blocks**:

| Block | Purpose | Author Fields |
|---|---|---|
| **Video** | Embed a single Brightcove video | Account, Video ID, Display Mode, conditional fields |
| **Video Playlist** | Embed a Brightcove playlist | Account, Playlist ID, Player, Display Mode, conditional fields |

### Why Separate Blocks

- **Simplified authoring** — authors directly choose between video or playlist without conditional fields or complex dialogs
- **Clear authoring intent** — explicit selection reduces ambiguity
- **Different rendering structures** — single player vs rail/list UI requiring different DOM and styling
- **Different Brightcove configurations** — video and playlist may require different player configurations and script loading
- **Independent styling** — playlist-specific layouts (rails, scrolling) handled independently from video rendering

### References

- Digital Solutions for Scientific Ecosystems — Thermo Fisher Scientific
- Luminex FLEXMAP 3D Instrument System — Thermo Fisher Scientific
- Real-Time PCR — Thermo Fisher Scientific
- 3D SEM Volumescope 2 — Thermo Fisher Scientific
- Gibco Cell Culture Basics — Thermo Fisher Scientific

---

## 2. Authoring Criteria

### 2.1 Video Block

**Account** — required. The Brightcove account (friendly name). Selected via plugin dropdown.

**Video ID** — required. The Brightcove video ID.

**Display Mode** — required. Determines how the video appears on the page (Inline, Button, Link, Thumbnail, Teaser).

**Conditional fields (based on display mode):**
- Button/Link mode: CTA text
- Teaser mode: Title, Description, Image

### 2.2 Video Playlist Block

**Account** — required. The Brightcove account (friendly name). Selected via plugin dropdown.

**Playlist ID** — required. The Brightcove playlist ID.

**Player** — required. The player configuration (Default, Playlist with right rail, Playlist with bottom rail). Selected via plugin dropdown.

**Display Mode** — required. Determines how the playlist appears on the page.

**Conditional fields (based on display mode):**
- Button/Link mode: CTA text
- Teaser mode: Title, Description, Image

### 2.3 Authoring Principle

Authors see **friendly account names** (CBD, PGH, FEI) — never Brightcove account IDs, player IDs, or script URLs. The Brightcove configuration sheet handles name-to-ID resolution at runtime.

All authoring is done via the **Brightcove plugin** in the DA library panel. Authors do not manually create or edit block tables for video content.

---

## 3. Display Modes (Variants)

Both blocks support the same set of display modes. The display mode is written as the **variant** in the block header by the plugin.

| Display Mode | Variant | Behaviour | Author Configures |
|---|---|---|---|
| Inline | (default — no variant) | Player renders directly on page and plays in place | Account + Video/Playlist ID only |
| Button | `button` | A CTA button is displayed. Clicking opens the player in a modal overlay. | + CTA text |
| Link | `link` | A text link is displayed. Clicking opens the player in a modal overlay. | + CTA text |
| Thumbnail | `thumbnail` | Video thumbnail displayed. Clicking opens the player in a modal overlay. | Account + Video/Playlist ID only (thumbnail auto-fetched from Brightcove) |
| Teaser | `teaser` | A card with thumbnail, title, and description. Clicking opens the player in a modal overlay. | + Title + Description + optional Image |

---

## 4. DA Block Table Contract — Video Block

### 4.1 Table Structure

The Video block uses a key-value pair pattern. The display mode is the variant in the block header.

| Column | Role | Content |
|---|---|---|
| Column 1 | Key | Property name |
| Column 2 | Value | Property value |

### 4.2 Available Properties

| Key | Value | Required | Description |
|---|---|---|---|
| `account` | Account friendly name (e.g. CBD, PGH, FEI) | Yes | Resolved to Brightcove account ID via config sheet |
| `video-id` | Brightcove video ID | Yes | The specific video to embed |
| `cta-text` | Button/link label text | Only for Button/Link mode | Text displayed on the CTA |
| `title` | Teaser card title | Only for Teaser mode | Heading displayed on the teaser card |
| `description` | Teaser card description | Only for Teaser mode | Supporting text on the teaser card |
| `image` | Teaser card image | Optional for Teaser mode | Custom thumbnail — if omitted, auto-fetched from Brightcove |

### 4.3 Block Header by Display Mode

| Display Mode | Block Header |
|---|---|
| Inline | `Video` |
| Button | `Video (button)` |
| Link | `Video (link)` |
| Thumbnail | `Video (thumbnail)` |
| Teaser | `Video (teaser)` |

---

## 5. DA Block Table Contract — Video Playlist Block

### 5.1 Table Structure

Same key-value pattern as Video block.

### 5.2 Available Properties

| Key | Value | Required | Description |
|---|---|---|---|
| `account` | Account friendly name | Yes | Resolved to Brightcove account ID via config sheet |
| `playlist-id` | Brightcove playlist ID | Yes | The specific playlist to embed |
| `player` | Player type: `default`, `right-rail`, `bottom-rail` | Yes | Determines playlist layout — resolved to player ID via config sheet |
| `cta-text` | Button/link label text | Only for Button/Link mode | Text displayed on the CTA |
| `title` | Teaser card title | Only for Teaser mode | Heading on teaser card |
| `description` | Teaser card description | Only for Teaser mode | Supporting text on teaser card |
| `image` | Teaser card image | Optional for Teaser mode | Custom thumbnail |

### 5.3 Block Header by Display Mode

| Display Mode | Block Header |
|---|---|
| Inline | `Video Playlist` |
| Button | `Video Playlist (button)` |
| Link | `Video Playlist (link)` |
| Thumbnail | `Video Playlist (thumbnail)` |
| Teaser | `Video Playlist (teaser)` |

---

## 6. Brightcove Plugin — Authoring Experience

### 6.1 Overview

The Brightcove plugin is available in the DA library panel. It provides guided authoring for both Video and Video Playlist blocks in a single plugin with two tabs.

### 6.2 Plugin Dialog

```
┌──────────────────────────────────────────────────┐
│  Brightcove                               Close  │
│                                                  │
│  [ Video ]  [ Playlist ]                         │
│                                                  │
│  Account *                                       │
│  ┌──────────────────────────────────────────┐    │
│  │ CBD                                  ▼   │    │
│  └──────────────────────────────────────────┘    │
│  (options: CBD, PGH, FEI — from config sheet)    │
│                                                  │
│  Video ID *                                      │
│  ┌──────────────────────────────────────────┐    │
│  │ 6293625135001                            │    │
│  └──────────────────────────────────────────┘    │
│                                                  │
│  Display Mode *                                  │
│  ┌──────────────────────────────────────────┐    │
│  │ Teaser                               ▼   │    │
│  └──────────────────────────────────────────┘    │
│  (options: Inline, Button, Link, Thumbnail,      │
│   Teaser)                                        │
│                                                  │
│  ── Conditional fields (Teaser selected) ──      │
│                                                  │
│  Title                                           │
│  ┌──────────────────────────────────────────┐    │
│  │ Are you ready to Connect?                │    │
│  └──────────────────────────────────────────┘    │
│                                                  │
│  Description                                     │
│  ┌──────────────────────────────────────────┐    │
│  │ The Connect Platform delivers a secure...│    │
│  └──────────────────────────────────────────┘    │
│                                                  │
│  Image (optional)                                │
│  ┌──────────────────────────────────────────┐    │
│  │ [Browse/Upload]                          │    │
│  └──────────────────────────────────────────┘    │
│                                                  │
│  ┌──────────────────────────────────────────┐    │
│  │            Add to Page                   │    │
│  └──────────────────────────────────────────┘    │
│                                                  │
│  Cancel                                          │
└──────────────────────────────────────────────────┘
```

### 6.3 Playlist Tab (Additional Field)

When the **Playlist** tab is selected, an additional **Player** dropdown appears:

```
│  Player *                                        │
│  ┌──────────────────────────────────────────┐    │
│  │ Playlist with bottom rail            ▼   │    │
│  └──────────────────────────────────────────┘    │
│  (options: Default, Playlist with right rail,    │
│   Playlist with bottom rail — from config sheet) │
```

### 6.4 Conditional Fields by Display Mode

| Display Mode selected | Additional fields shown |
|---|---|
| Inline | None |
| Button | CTA Text |
| Link | CTA Text |
| Thumbnail | None |
| Teaser | Title, Description, Image (optional) |

### 6.5 What the Plugin Outputs

The plugin writes the **complete block table** to the DA document — including the header row with the correct variant.

| Author selection | Plugin writes |
|---|---|
| Video + Inline | `Video` block table with account + video-id rows |
| Video + Button | `Video (button)` block table with account + video-id + cta-text rows |
| Video + Teaser | `Video (teaser)` block table with account + video-id + title + description + image rows |
| Playlist + Inline | `Video Playlist` block table with account + playlist-id + player rows |
| Playlist + Button | `Video Playlist (button)` block table with account + playlist-id + player + cta-text rows |

### 6.6 Edit Existing Block

When the author selects an existing Video or Video Playlist block and opens the Brightcove plugin:
- Plugin reads the existing block table
- Pre-populates all fields (account, ID, display mode, conditional fields)
- Author modifies what's needed
- Clicks **Update** → plugin rewrites the block table

---

## 7. Multi-Video Grid Layout

When multiple videos need to be displayed in a grid layout (e.g. 3 videos per row, 4 videos per row), authors use **Section Metadata** to apply a grid style to the section containing the video blocks.

### 7.1 How to Author

1. Place multiple Video blocks in the same section
2. Add Section Metadata at the end of the section with a grid style

### 7.2 Section Grid Styles

| Section Metadata style | Layout |
|---|---|
| `3-col` | 3 videos per row |
| `4-col` | 4 videos per row |
| `2-col` | 2 videos per row |

### 7.3 Example — 3 Videos in a Row

```
| Video (thumbnail) | |
| account | CBD |
| video-id | 6293625135001 |

| Video (thumbnail) | |
| account | CBD |
| video-id | 7382946251001 |

| Video (thumbnail) | |
| account | CBD |
| video-id | 8491057362001 |

| Section Metadata | |
| style | 3-col |
```

**What renders:** Three video thumbnails side by side in a 3-column grid. Clicking any thumbnail opens the video in a modal overlay.

### 7.4 Note

The `3-col`, `4-col`, `2-col` section styles are generic — they work for any blocks placed in a section, not just videos. This is the DA/EDS equivalent of AEM's Layout Container column count.

---

## 8. Authoring Examples

### 8.1 Example 1 — Single Inline Video

A video that plays directly on the page.

| Video | |
|---|---|
| account | CBD |
| video-id | 6293625135001 |

**What renders:** A Brightcove video player embedded on the page. Video plays in place when the user clicks play.

---

### 8.2 Example 2 — Video with Button CTA

A button that opens the video in a modal when clicked.

| Video (button) | |
|---|---|
| account | PGH |
| video-id | 7382946251001 |
| cta-text | Watch Video |

**What renders:** A "Watch Video" button. Clicking opens the Brightcove player in a modal overlay.

---

### 8.3 Example 3 — Video with Link CTA

A text link that opens the video in a modal.

| Video (link) | |
|---|---|
| account | CBD |
| video-id | 6293625135001 |
| cta-text | Watch the full presentation |

**What renders:** A text link "Watch the full presentation". Clicking opens the video in a modal overlay.

---

### 8.4 Example 4 — Video Thumbnail

A clickable video thumbnail.

| Video (thumbnail) | |
|---|---|
| account | FEI |
| video-id | 8491057362001 |

**What renders:** The video's thumbnail image (auto-fetched from Brightcove). Clicking opens the player in a modal overlay.

---

### 8.5 Example 5 — Video Teaser Card

A rich teaser card with title, description, and image.

| Video (teaser) | |
|---|---|
| account | CBD |
| video-id | 6293625135001 |
| title | Are you ready to Connect? |
| description | The Connect Platform delivers a secure, scalable and compliant solution to orchestrate the execution of lab processes. |
| image | ![teaser](teaser-connect.jpg) |

**What renders:** A card with the teaser image, title, and description. Clicking opens the video in a modal overlay.

---

### 8.6 Example 6 — Playlist with Bottom Rail

A playlist player with thumbnails along the bottom.

| Video Playlist | |
|---|---|
| account | PGH |
| playlist-id | 12345 |
| player | bottom-rail |

**What renders:** A Brightcove playlist player with the current video playing at the top and a scrollable thumbnail rail along the bottom for switching between videos.

---

### 8.7 Example 7 — Playlist with Right Rail

A playlist player with thumbnails on the right side.

| Video Playlist | |
|---|---|
| account | CBD |
| playlist-id | 67890 |
| player | right-rail |

**What renders:** A Brightcove playlist player with the current video on the left and a vertical thumbnail list on the right for switching between videos.

---

### 8.8 Example 8 — Multiple Videos in Grid (3-Column)

Three thumbnail videos displayed in a row.

```
| Video (thumbnail) | |
| account | CBD |
| video-id | 6293625135001 |

| Video (thumbnail) | |
| account | CBD |
| video-id | 7382946251001 |

| Video (thumbnail) | |
| account | PGH |
| video-id | 8491057362001 |

| Section Metadata | |
| style | 3-col |
```

**What renders:** Three video thumbnails in a 3-column grid. Each thumbnail is clickable and opens its respective video in a modal overlay.
