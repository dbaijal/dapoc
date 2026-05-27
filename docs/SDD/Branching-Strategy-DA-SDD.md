# Branching Strategy & Environments — DA + EDS Solution Design

**Document Version:** 1.0
**Status:** Draft
**Date:** 2026-05-27
**Author:** Adobe Delivery Team

---

## Table of Contents

1. [Overview](#1-overview)
2. [Content vs Code Separation](#2-content-vs-code-separation)
3. [Environments](#3-environments)
4. [Branching Strategy](#4-branching-strategy)
5. [Environment Promotion Flow](#5-environment-promotion-flow)
6. [DA Content Sites](#6-da-content-sites)
7. [Who Uses What](#7-who-uses-what)
8. [Post Go-Live Model](#8-post-go-live-model)

---

## 1. Overview

In EDS with DA authoring, environments are **branch-based**. Each Git branch in the code repository maps to an environment. The branch name determines the preview and publish URLs for that environment.

Content (authored in DA) and code (blocks, CSS, JS in GitHub) are managed independently:

- **Code** lives in a GitHub repository and is promoted through branches (dev → qa → stage → main)
- **Content** lives in DA and is organized into separate DA sites per environment (dev, qa, stage, production)

Each DA content site is connected to a specific GitHub branch. This connection determines which version of the code renders the content.

---

## 2. Content vs Code Separation

| Aspect | Content | Code |
|---|---|---|
| Where it lives | DA (da.live) | GitHub repository |
| Who manages it | Content authors, regional teams | Development team |
| How it's promoted | Content is NOT promoted through environments — authors work in their designated DA site | Code is promoted through branches via Pull Requests |
| How changes go live | Publish workflow (author submits → approval → publish) | PR merged to `main` → AEM Code Sync deploys automatically |
| Environments | Separate DA content sites (dev, qa, stage, production) | Separate Git branches (dev, qa, stage, main) |

**Key point:** Content authors do not interact with Git branches. They author in DA and use the publish workflow. Branching and environment promotion is a development team concern only.

---

## 3. Environments

### 3.1 Environment Table

| Environment | Git Branch | DA Content Site | Purpose |
|---|---|---|---|
| **Development** | `dev` | `<site>-dev` | Development and testing of new blocks, features, and code changes |
| **QA** | `qa` | `<site>-qa` | Quality assurance — validate block functionality and integration |
| **Stage** | `stage` | `<site>-stage` | Pre-production validation — final check before production deployment |
| **Production** | `main` | `<site>` (primary DA site) | Live production — serves content to end users |

### 3.2 URL Pattern

Each environment has two URLs:

| URL type | Pattern | Purpose |
|---|---|---|
| **Preview** | `https://<branch>--<site>--<org>.aem.page` | Preview content — accessible to authenticated users with preview permission |
| **Publish** | `https://<branch>--<site>--<org>.aem.live` | Published content — for production, this is what serves end users |

### 3.3 AEM Code Sync

When code is pushed to any branch, AEM Code Sync automatically:
- Publishes the code to EDS's code bus
- Purges CDN caches for that environment

No manual deployment step is needed. Code changes are live on the target environment within seconds of the push.

---

## 4. Branching Strategy

### 4.1 Branch Types

| Branch | Purpose | Lifecycle |
|---|---|---|
| `feature-<name>` | Implement new features or blocks | Created from `dev`, merged back to `dev` via PR |
| `bugfix-<name>` | Fix bugs | Created from `dev`, merged back to `dev` via PR |
| `dev` | Development integration branch | Long-lived — all feature/bugfix branches merge here |
| `qa` | QA testing environment | Long-lived — receives merges from `dev` via PR |
| `stage` | Pre-production validation | Long-lived — receives merges from `qa` via PR |
| `main` | Production | Long-lived — receives merges from `stage` via PR |

### 4.2 Branch Naming Convention

| Type | Convention | Example |
|---|---|---|
| Feature | `feature-<feature-name>` | `feature-accordion-block` |
| Bugfix | `bugfix-<bug-description>` | `bugfix-hero-image-alignment` |
| Environment | `dev`, `qa`, `stage`, `main` | — |

### 4.3 Pull Request Process

1. Developer creates a `feature-<name>` or `bugfix-<name>` branch from `dev`
2. Completes development work in their branch
3. Creates a Pull Request to merge into `dev`
4. PR is reviewed by another developer — code review required before merge
5. After merge to `dev`, changes are automatically available on the Dev environment
6. After validation in Dev, PR created from `dev` → `qa`
7. After QA validation, PR created from `qa` → `stage`
8. After stage validation, PR created from `stage` → `main` (production deployment)

**All merges require a Pull Request.** Direct pushes to `dev`, `qa`, `stage`, and `main` are not permitted.

---

## 5. Environment Promotion Flow

### 5.1 Code Promotion

```
feature/bugfix branch
        ↓ (PR + code review)
      dev
        ↓ (PR + dev validation)
       qa
        ↓ (PR + QA validation)
     stage
        ↓ (PR + stage validation)
      main (production)
```

Each promotion requires:
- A Pull Request
- Code review / approval
- Validation on the target environment before promoting further

### 5.2 Content — Not Promoted

Content does NOT flow through environments the way code does. Content authored in the production DA site is the real content. Dev/QA/Stage DA content sites are used by the development team with sample or test content to validate code changes.

| DA Content Site | Used for |
|---|---|
| `<site>-dev` | Sample/test content for development — developers test blocks here |
| `<site>-qa` | Test content for QA — QA team validates block rendering and behaviour |
| `<site>-stage` | Validation content for pre-production checks |
| `<site>` (production) | Real content authored by content teams — served to end users |

---

## 6. DA Content Sites

### 6.1 Site-to-Branch Connection

Each DA content site must be connected to the correct GitHub branch. This determines which code version renders the content:

| DA Content Site | Connected to Branch | Result |
|---|---|---|
| `<site>-dev` | `dev` | Content renders with the latest development code |
| `<site>-qa` | `qa` | Content renders with QA-validated code |
| `<site>-stage` | `stage` | Content renders with stage-validated code |
| `<site>` (production) | `main` | Content renders with production code |

### 6.2 Why Separate DA Content Sites

- **Prevents accidental publish** — content authors working in the production DA site cannot accidentally trigger code changes. Code promotion is a separate developer-controlled process.
- **Isolates testing** — developers can test with sample content in dev/qa sites without affecting production content
- **Independent validation** — QA can validate block functionality without waiting for content authors to create test pages

### 6.3 Single Code Repository

TFS has multiple regional sites but uses a **single code repository** for all blocks, CSS, and JS. Regional differences are handled via content in DA (different DA folders per region), not via separate code branches or repositories.

All regions share the same codebase. This means:
- A block developed once works across all regions
- CSS/JS changes apply globally
- Regional content variations are authored in DA — not coded per region

---

## 7. Who Uses What

| Role | Works in | Branch/Site | Purpose |
|---|---|---|---|
| **Developers** | GitHub + `<site>-dev` DA site | `dev` branch + feature/bugfix branches | Build blocks, write CSS/JS, test with sample content |
| **QA Team** | `<site>-qa` DA site | `qa` branch | Validate block functionality, integration testing |
| **Stage Validation** | `<site>-stage` DA site | `stage` branch | Pre-production code validation |
| **Content Authors** | `<site>` (production) DA site | `main` branch (code) | Author real content, submit for approval, publish |
| **Regional Teams** | `<site>` (production) DA site — their region folder | `main` branch (code) | Author regional content within their permitted paths |

**Content authors never touch dev, qa, or stage DA sites.** Those are for the development and QA teams only.

---

## 8. Post Go-Live Model

### 8.1 Before Go-Live (During Implementation)

During the implementation phase, a simplified model is used:

```
feature/bugfix → dev → main
```

- `dev` branch for development
- `main` branch used for both stage validation and production readiness
- Single DA content site for both dev testing and content preparation

### 8.2 After Go-Live (Full Model)

After production go-live, the full branching model is activated:

```
feature/bugfix → dev → qa → stage → main
```

- `qa` branch created — dedicated QA environment
- `stage` branch created — dedicated pre-production environment
- Separate DA content sites for qa and stage created
- Production DA site is the live content managed by content authors
- Code changes go through all four environments before reaching production

### 8.3 Why Two Phases

During implementation, there is no production traffic — speed of development is prioritized. After go-live, stability and quality are prioritized — additional validation gates (QA, Stage) protect the live site from untested code changes.
