# Users, Groups, and Permissions — DA + EDS Solution Design

**Document Version:** 1.0
**Status:** Draft
**Date:** 2026-05-20
**Platform:** Edge Delivery Services (EDS) — DA.live
**Scope:** Multi-region Content Authoring — User Groups, Roles, and Permissions
**Author:** Adobe Delivery Team

---

## Table of Contents

1. [Purpose and Scope](#1-purpose-and-scope)
2. [Content Structure](#2-content-structure)
3. [Change from AEM to DA](#3-change-from-aem-to-da)
4. [Roles and User Groups](#4-roles-and-user-groups)
5. [Permission Model](#5-permission-model)
6. [Group and Permission Matrix](#6-group-and-permission-matrix)
7. [Implementation Overview](#7-implementation-overview)
8. [Operational Model](#8-operational-model)
9. [Governance Principles](#9-governance-principles)
10. [Recommended Next Steps](#10-recommended-next-steps)

---

## 1. Purpose and Scope

### 1.1 Purpose

This document defines the solution design for user groups, roles, and permissions across TFS's multi-region EDS (DA.live) implementation. It establishes a structured authoring governance model that controls:

- **Content authoring in DA.live** — who can view, create, edit, and delete content
- **Preview and publishing via EDS** — who can preview and publish content
- **Identity and access management via Adobe IMS** — centralised group management through the Adobe Admin Console

### 1.2 Design Goal

Establish a role-based and region-based permission model for content managed in DA.live that is:

- **Simple** — minimal roles that cover all real-world authoring scenarios (reduced from 40+ AEM groups to ~18 DA groups)
- **Scalable** — adding a new region or user requires no structural changes to the model
- **Governed** — publishing rights are separate from authoring rights; cross-region access is explicitly prohibited unless granted
- **Aligned with Adobe IMS** — all groups are managed through the Adobe Admin Console and applied to DA.live via the DA permissions configuration

### 1.3 In Scope

- DA.live IMS group definitions and naming conventions
- Content path-based permission assignments
- Preview and publish access control via EDS configuration
- Operational procedures for onboarding, offboarding, and new region creation

### 1.4 Out of Scope

- AEM ACL migration (ACLs are not migrated — permissions are designed fresh for DA)
- AEM Workflow migration (no system-enforced workflow in DA)
- DAM/Assets permissions
- Commerce platform access control
- Page-level (granular) permission assignment — access is controlled at region folder level only

---

## 2. Content Structure

TFS's EDS content is organised by region. Permissions are applied at the **region folder level** — not at individual pages or language folders.

```
/content/
  /global/          ← Global team content
  /north-america/   ← North America region content
    /us/en/
    /us/es/
    /ca/en/
    /ca/fr/
  /latin-america/   ← Latin America region content
    /br/pt/
    /mx/es/
  /emea/            ← EMEA region content
    /uk/en/
    /de/de/
    /fr/fr/
  /japan/           ← Japan region content
    /jp/ja/
    /jp/en/
  /ipac/            ← IPAC region content
    /in/en/
    /au/en/
    /sg/en/
  /greater-china/   ← Greater China region content
    /cn/zh/
    /hk/en/
    /tw/zh/
  /korea/           ← Korea region content
    /kr/ko/
    /kr/en/
```

**Key Principle:** Access is granted at the region folder level (e.g., `/content/north-america/**`). Users cannot be granted access to individual pages or language subtrees independently — the region folder is the smallest unit of access control.

---

## 3. Change from AEM to DA

### 3.1 What Changes

| Aspect | AEM (current) | DA + EDS (target) |
|---|---|---|
| Permission model | JCR ACLs — per-node, complex inheritance | Folder-level access via IMS groups |
| Groups | 40+ groups (Content Author, Power User, Super User × 8 regions + workflow + notification + special groups) | ~18 groups (Author + Admin × 8 regions + 2 global) |
| Role levels | 3 (Content Author, Power User, Super User) | 2 (Author, Admin) |
| Publish control | Per-user activate/replicate permission | Separate EDS publish permission |
| Workflow | System-enforced AEM Workflow per region (8 workflow groups) | Not system-enforced — process-based team review |
| Notification groups | 4 AEM workflow notification groups | Eliminated — handled by platform |
| Granularity | Per-page, per-component | Per region folder |
| Group management | AEM User Admin + CRX | Adobe Admin Console (IMS) |
| ACL migration | — | **No ACL migration.** Permissions designed fresh for DA. |

### 3.2 What Is NOT Migrated

| AEM Concept | Reason for elimination |
|---|---|
| JCR ACLs | Different permission model — DA uses folder-level IMS groups |
| Per-page permissions | DA does not support page-level access control |
| Workflow groups (lt-wf-wo-*) | No system-enforced workflow in DA |
| Notification groups (lt-wf-*-notification) | DA platform handles notifications natively |
| Base groups (lt-ca-base, lt-wf-base) | No group inheritance chain needed in flat DA model |
| Friendly-authors group | All authors have same capabilities in DA |
| DAM-admins | Assets managed directly in DA — no separate DAM |
| Separate Content Author vs Power User distinction | DA has no separate "activate" permission — publish is controlled at EDS level |

### 3.3 Why This Simplification Works

In AEM, three role levels existed because:
- **Content Author** = can create/edit but NOT activate (publish)
- **Power User** = can create/edit AND activate via workflow
- **Super User** = can create/edit/delete/activate without workflow

In DA + EDS:
- **Everyone who can edit can also delete** — DA's `write` permission includes both edit and delete. There is no way to grant edit without delete.
- **Preview and publish are separate from DA permissions** — DA controls only authoring access. Preview (.aem.page) and publish (.aem.live) are controlled independently via the Edge Delivery Config Service. They must be explicitly granted.
- **No workflow gate exists** — so the distinction between "can activate via workflow" and "can activate directly" disappears

This naturally collapses 3 roles into 2: Author (write in DA + preview in EDS, no publish) and Admin (write in DA + preview + publish in EDS). The distinction is purely about **who can push content live** — not about edit vs delete capabilities.

**Important:** DA permissions and EDS preview/publish permissions are two completely independent systems. Granting DA write access does NOT automatically grant preview or publish access. Both must be configured separately.

---

## 4. Roles and User Groups

### 4.1 Role Model

The permission model uses a minimal, two-tier role structure consistent across all regions.

**Global Roles:**

| Role | IMS Group Name | Scope | Description |
|---|---|---|---|
| Global Administrator | `tfs-it-administrators` | All regions | Full read/write/delete/publish access across all regions. Manages groups, permissions, and platform settings. |
| Global Read-Only | `tfs-global-readonly` | All regions | Read-only access across all regions for stakeholders, auditors, and cross-regional reviewers. |

**Region-Specific Roles:**

For each region, two groups are created following a consistent naming pattern:

| Role | IMS Group Name | Scope | Authoring | Preview | Publish |
|---|---|---|---|---|---|
| Region Author | `<region>-authors` | Assigned region | Yes | Yes | No |
| Region Admin | `<region>-admins` | Assigned region | Yes | Yes | Yes |

A Region Admin inherits all Author capabilities. A separate author group membership is not required when a user is an Admin — the Admin role includes the full authoring permission set.

### 4.2 IMS Group Naming Convention

All groups follow the pattern: `<scope>-<role>`

**Global Groups:**

| Group Name | Description |
|---|---|
| `tfs-it-administrators` | Global administrator group — full access across all regions |
| `tfs-global-readonly` | Global read-only access for stakeholders and auditors |

**Region-Level Groups:**

| Region | Author Group | Admin Group |
|---|---|---|
| Global | `tfs-global-authors` | `tfs-global-admins` |
| North America | `tfs-na-authors` | `tfs-na-admins` |
| Latin America | `tfs-latam-authors` | `tfs-latam-admins` |
| EMEA | `tfs-emea-authors` | `tfs-emea-admins` |
| Japan | `tfs-japan-authors` | `tfs-japan-admins` |
| IPAC | `tfs-ipac-authors` | `tfs-ipac-admins` |
| Greater China | `tfs-china-authors` | `tfs-china-admins` |
| Korea | `tfs-korea-authors` | `tfs-korea-admins` |

### 4.3 Group Membership Rules

- Authoring and publishing are **independent permissions** — membership in the author group does not confer publish rights
- Users requiring both capabilities must be assigned to the `<region>-admins` group
- Users requiring access to multiple regions must be added to each region's groups independently
- `tfs-it-administrators` members automatically have full access to all regions and do not need to be added to region-specific groups
- Cross-region access must be explicitly approved and is always auditable

### 4.4 Mapping from AEM Groups

| AEM Group | DA Equivalent | Notes |
|---|---|---|
| lt-ca-emea (Content Author EMEA) | `tfs-emea-authors` | Same scope — edit only, no publish |
| lt-pw-emea (Power User EMEA) | `tfs-emea-admins` | Power User had activate = Admin has publish |
| lt-su-emea (Super User EMEA) | `tfs-emea-admins` | Super User collapses into Admin |
| lt-wf-wo-emea (Workflow EMEA) | Eliminated | No system-enforced workflow in DA |
| lt-ba-global (Basic Global Author) | `tfs-global-authors` | Global edit access |

---

## 5. Permission Model

The permission model operates across two distinct layers.

### 5.1 DA.live — Authoring Permissions

Controls who can view and edit content in DA.live.

**Key Characteristics:**
- Managed via the DA permissions sheet in the organization configuration at `https://da.live/config#/<org-name>/`
- Uses IMS Org ID / Group Name format for group references (e.g. `<IMS_ORG_ID>/tfs-na-authors`)
- Applied at the region folder level using path patterns with wildcards
- At runtime, paths are sorted by length and the longest matching path for each group determines the permission level
- Users must log out and log back in after group membership changes for permissions to take effect
- Row order in the permissions sheet does not matter — only path length determines precedence

**Access levels in DA:**

| Level | Description |
|---|---|
| `read` | View content — cannot create, edit, or delete |
| `write` | Create, edit, and delete content (write implies read and delete) |
| (empty) | No access — explicit denial |

**Important:** DA does not have a separate delete permission. Write access includes the ability to delete. It is not possible to grant edit access without also granting delete access. This is a platform constraint.

**Path wildcard patterns:**

| Pattern | Meaning |
|---|---|
| `/content/north-america/**` | All resources under the directory (excluding the directory itself) |
| `/content/north-america/+**` | All resources under the directory, including the directory itself |
| `/content/north-america/us/en/page` | Specific document |

**Critical setup requirement:** The permissions sheet must always include a `CONFIG` row granting the administrator access to the organization configuration itself. Without this, administrators can lock themselves out of the permissions sheet.

**DA Permissions Sheet Configuration:**

Note: In the table below, `<ORG_ID>` represents the TFS IMS Organization ID obtained from the Adobe Admin Console. All group references must use the `<ORG_ID>/group-name` format.

| Path | Groups | Actions |
|---|---|---|
| `CONFIG` | `<ORG_ID>/tfs-it-administrators` | `read, write` |
| `/content/**` | `<ORG_ID>/tfs-it-administrators` | `write` |
| `/content/**` | `<ORG_ID>/tfs-global-readonly` | `read` |
| `/content/global/**` | `<ORG_ID>/tfs-global-authors` | `write` |
| `/content/global/**` | `<ORG_ID>/tfs-global-admins` | `write` |
| `/content/north-america/**` | `<ORG_ID>/tfs-na-authors` | `write` |
| `/content/north-america/**` | `<ORG_ID>/tfs-na-admins` | `write` |
| `/content/latin-america/**` | `<ORG_ID>/tfs-latam-authors` | `write` |
| `/content/latin-america/**` | `<ORG_ID>/tfs-latam-admins` | `write` |
| `/content/emea/**` | `<ORG_ID>/tfs-emea-authors` | `write` |
| `/content/emea/**` | `<ORG_ID>/tfs-emea-admins` | `write` |
| `/content/japan/**` | `<ORG_ID>/tfs-japan-authors` | `write` |
| `/content/japan/**` | `<ORG_ID>/tfs-japan-admins` | `write` |
| `/content/ipac/**` | `<ORG_ID>/tfs-ipac-authors` | `write` |
| `/content/ipac/**` | `<ORG_ID>/tfs-ipac-admins` | `write` |
| `/content/greater-china/**` | `<ORG_ID>/tfs-china-authors` | `write` |
| `/content/greater-china/**` | `<ORG_ID>/tfs-china-admins` | `write` |
| `/content/korea/**` | `<ORG_ID>/tfs-korea-authors` | `write` |
| `/content/korea/**` | `<ORG_ID>/tfs-korea-admins` | `write` |

**Key Rules:**
- No cross-region access is granted unless explicitly required and approved. The absence of a path entry means no access.
- The order of rows in the permissions sheet does not matter — at runtime, the longest matching path for each group is used.
- Permissions do not hide file/folder names in browse views. If content sensitivity is a concern, use dedicated sub-folders with restricted access.

**Note on Author vs Admin at DA level:** Both authors and admins have `write` access in DA — meaning both can create, edit, and delete content. The distinction between the two roles is enforced at the **EDS publish layer** (Section 5.2), not at the DA authoring layer. Authors cannot publish; Admins can.

### 5.2 Preview and Publish — EDS Permissions

Controls who can preview content on `.aem.page` and publish content to `.aem.live`.

**This is a completely separate system from DA authoring permissions.** DA write access does NOT automatically grant preview or publish. Both must be explicitly configured in the Edge Delivery Config Service.

**Key Characteristics:**
- Managed via the Edge Delivery Config Service at `tools.aem.live`
- Uses email addresses and Edge Delivery groups (not Adobe IMS groups directly)
- Preview and publish are independently controlled capabilities
- Must be configured separately from DA permissions

**Access Rules by Role:**

| Group | Preview (.aem.page) | Publish (.aem.live) |
|---|---|---|
| `tfs-it-administrators` | All regions | All regions |
| `tfs-global-readonly` | All regions | No |
| `<region>-authors` | Assigned region | No |
| `<region>-admins` | Assigned region | Assigned region |

---

## 6. Group and Permission Matrix

### 6.1 Full Permission Matrix

| Group | Region Scope | DA.live (write = edit + delete) | Preview (.aem.page) | Publish (.aem.live) |
|---|---|---|---|---|
| `tfs-it-administrators` | All | Yes | Yes | Yes |
| `tfs-global-readonly` | All | Read only | Yes | No |
| `tfs-global-authors` | Global | Yes | Yes | No |
| `tfs-global-admins` | Global | Yes | Yes | Yes |
| `tfs-na-authors` | North America | Yes | Yes | No |
| `tfs-na-admins` | North America | Yes | Yes | Yes |
| `tfs-latam-authors` | Latin America | Yes | Yes | No |
| `tfs-latam-admins` | Latin America | Yes | Yes | Yes |
| `tfs-emea-authors` | EMEA | Yes | Yes | No |
| `tfs-emea-admins` | EMEA | Yes | Yes | Yes |
| `tfs-japan-authors` | Japan | Yes | Yes | No |
| `tfs-japan-admins` | Japan | Yes | Yes | Yes |
| `tfs-ipac-authors` | IPAC | Yes | Yes | No |
| `tfs-ipac-admins` | IPAC | Yes | Yes | Yes |
| `tfs-china-authors` | Greater China | Yes | Yes | No |
| `tfs-china-admins` | Greater China | Yes | Yes | Yes |
| `tfs-korea-authors` | Korea | Yes | Yes | No |
| `tfs-korea-admins` | Korea | Yes | Yes | Yes |

**Note:** At the DA level, authors and admins have the same write access (which includes edit + delete). The key difference is that **only admins can publish** content to the live site. This is enforced at the EDS layer, not the DA layer.

### 6.2 Cross-Region Access Matrix

Each group can only access its assigned region. An empty cell means no access.

| Group | Global | NA | LATAM | EMEA | Japan | IPAC | China | Korea |
|---|---|---|---|---|---|---|---|---|
| `tfs-it-administrators` | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| `tfs-global-readonly` | R | R | R | R | R | R | R | R |
| `tfs-global-authors/admins` | Yes | | | | | | | |
| `tfs-na-authors/admins` | | Yes | | | | | | |
| `tfs-latam-authors/admins` | | | Yes | | | | | |
| `tfs-emea-authors/admins` | | | | Yes | | | | |
| `tfs-japan-authors/admins` | | | | | Yes | | | |
| `tfs-ipac-authors/admins` | | | | | | Yes | | |
| `tfs-china-authors/admins` | | | | | | | Yes | |
| `tfs-korea-authors/admins` | | | | | | | | Yes |

---

## 7. Implementation Overview

### 7.1 Adobe Admin Console — IMS Group Setup

All groups must be created in the Adobe Admin Console before any DA.live permissions can be configured.

**Steps:**

1. Sign in to Adobe Admin Console as a System Administrator
2. Navigate to Users → User Groups
3. Create all groups listed in Section 4.2 using the exact naming convention defined
4. Assign the `tfs-it-administrators` group first and validate admin access before proceeding with region-specific groups
5. Add users to their respective groups — users gain DA.live access automatically once group membership is established

**Important:** Group names in the Admin Console must match exactly the names used in the DA permissions configuration. Any mismatch will result in access being silently denied.

### 7.2 DA.live — Permissions Configuration

DA.live permissions are managed via the permissions sheet in the organization configuration at `https://da.live/config#/<org-name>/`.

**Steps:**

1. Obtain the IMS Organization ID from the Adobe Admin Console
2. Navigate to the DA organization configuration at `https://da.live/config#/<org-name>/`
3. Open or create the `permissions` sheet
4. **First row must be the CONFIG entry** — grant `tfs-it-administrators` read and write access to `CONFIG` to prevent administrator lockout
5. Add the `/content/**` entry for `tfs-it-administrators` with `write` access
6. Add the `/content/**` entry for `tfs-global-readonly` with `read` access
7. For each region, add entries mapping the IMS group (using `<ORG_ID>/group-name` format) to the region path with `write` access
8. Follow the permission table defined in Section 5.1 exactly
9. Validate access by logging in as a user in a region-specific author group and confirming they can only access their assigned region path
10. Confirm that users in one region's group **cannot** access another region's content

**Important:** Group names in the permissions sheet must use the format `<IMS_ORG_ID>/group-name`. The group name alone without the org ID prefix will not work.

### 7.3 EDS — Preview and Publish Permissions

Preview and publish permissions are managed separately from DA.live authoring permissions.

**Steps:**

1. Open the AEM Permissions App (Config Service) for the site
2. Grant preview access to all author and admin groups for their respective regions
3. Grant publish access only to `<region>-admins` and `tfs-it-administrators`
4. Ensure `tfs-global-readonly` has preview access but no publish access
5. Validate the configuration by testing preview and publish with representative users from each role

---

## 8. Operational Model

### 8.1 Adding a New User to an Existing Region

| Step | Action | Performed By |
|---|---|---|
| 1 | Add user's Adobe ID to the `<region>-authors` IMS group in Admin Console | `tfs-it-administrators` |
| 2 | Optionally add user to `<region>-admins` if publish rights are required | `tfs-it-administrators` |
| 3 | User gains DA.live authoring access automatically via IMS group membership | Automatic |
| 4 | Confirm preview access is active via the AEM Permissions App | `tfs-it-administrators` |
| 5 | Notify user that access has been provisioned | `tfs-it-administrators` |

### 8.2 Onboarding a New Region

| Step | Action | Performed By |
|---|---|---|
| 1 | Create the new region folder structure in DA.live under `/content/` | Developer / Admin |
| 2 | Create `<region>-authors` and `<region>-admins` IMS groups in the Adobe Admin Console | `tfs-it-administrators` |
| 3 | Add the new groups to the `.da/permissions` configuration file with the correct region path scope | Developer / Admin |
| 4 | Enable preview and publish access for the new region via the AEM Permissions App | `tfs-it-administrators` |
| 5 | Assign initial users to the new region groups | `tfs-it-administrators` |
| 6 | Validate access end-to-end (authoring → preview → publish) | QA / Admin |

### 8.3 Offboarding a User

| Step | Action | Performed By |
|---|---|---|
| 1 | Remove user from all IMS groups they are a member of in the Adobe Admin Console | `tfs-it-administrators` |
| 2 | Access to DA.live and preview/publish environments is automatically revoked via IMS | Automatic |
| 3 | No manual DA.live or EDS configuration changes are required | — |

Offboarding is fully managed through IMS group membership. No direct changes to DA.live permissions files or the AEM Permissions App are needed for individual user removal.

### 8.4 Granting Temporary Cross-Region Access

If a user requires temporary access to a region outside their normal assignment (e.g., a North America author supporting an EMEA content migration):

| Step | Action |
|---|---|
| 1 | Add the user to `tfs-emea-authors` (or the relevant region group) in Admin Console |
| 2 | Document the reason and expected duration |
| 3 | Remove the user from the temporary group when the work is complete |

Cross-region access must always be explicitly approved and time-bound. It must never be made permanent unless the user's role permanently changes.

---

## 9. Governance Principles

### 9.1 Separation of Duties

| Responsibility | Who |
|---|---|
| Content creation, editing, and deletion | `<region>-authors` or `<region>-admins` (both have write access) |
| Content publishing (push live) | `<region>-admins` only |
| Platform and access administration | `tfs-it-administrators` |
| Cross-region oversight | `tfs-it-administrators` and `tfs-global-readonly` |

### 9.2 Least Privilege

- Users receive only the minimum access required for their role
- Author groups do not have publish rights — they can author content but cannot push it live
- Region groups do not have access to other regions
- `tfs-global-readonly` provides a visibility-only role for senior stakeholders and auditors without any risk of accidental content modification
- DA version history provides a safety net for accidental deletions — content can be restored from version history

### 9.3 Regional Isolation

Each region's content is fully isolated at the permission level. There is no configuration that allows region-level groups to access adjacent region paths. Cross-region access requires an explicit change by a member of `tfs-it-administrators` and is always auditable via Adobe Admin Console activity logs.

### 9.4 Auditability

| What Can Be Audited | Where |
|---|---|
| Group membership changes | Adobe Admin Console → Logs |
| User provisioning/removal | Adobe Admin Console → Users |
| Content edits and versions | DA.live version history per page |
| Publish activity | EDS publish logs |

---

## 10. Recommended Next Steps

| # | Action Item | Owner |
|---|---|---|
| 1 | Create all IMS groups in the Adobe Admin Console per Section 4.2 | `tfs-it-administrators` |
| 2 | Populate initial user membership for each region group | `tfs-it-administrators` |
| 3 | Configure the `.da/permissions` file in DA.live per Section 5.1 | Developer / Admin |
| 4 | Configure preview and publish access in the AEM Permissions App per Section 5.2 | Developer / Admin |
| 5 | Validate end-to-end access for at least one Author and one Admin per region | QA / Admin |
| 6 | Document the access request and approval process for ongoing user onboarding | `tfs-it-administrators` |
| 7 | Schedule a periodic access review (recommended: quarterly) to remove stale memberships | `tfs-it-administrators` |
| 8 | Communicate the new simplified permission model to all regional teams before go-live | `tfs-it-administrators` + Adobe |
