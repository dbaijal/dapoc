# Content Review Workflows — DA + EDS Solution Design

**Document Version:** 1.0
**Status:** Draft
**Date:** 2026-05-20
**Author:** Adobe Delivery Team

---

## Table of Contents

1. [Summary](#1-summary)
2. [TFS Current Workflow Model](#2-tfs-current-workflow-model)
3. [DA Workflow Capability](#3-da-workflow-capability)
4. [Target State — Enhanced DA Workflow for TFS](#4-target-state--enhanced-da-workflow-for-tfs)
5. [Simplified Workflow Mapping](#5-simplified-workflow-mapping)
6. [Email Notifications](#6-email-notifications)
7. [Pre-Requisites from TFS](#7-pre-requisites-from-tfs)
8. [Open Items](#8-open-items)

---

## 1. Summary

TFS uses multi-step content review workflows (Major Review and Simple Review) as a critical part of their content governance process. These workflows ensure content passes through designated approval gates before being published.

**DA has built-in workflow capability** (Request Publish) that provides author submission, approval routing, email notifications, and auto-publish on approval. To support TFS's multi-step approval requirement, the DA workflow will be enhanced through engineering collaboration with the DA product team to provide sequential approval stages aligned with TFS's business outcomes.

**Key principle:** The goal is not to replicate the 43-step AEM workflow in DA. The goal is to achieve the **same business outcome** — the same number of human approval gates, the same reviewer roles, and the same governance — in a simplified, DA-native implementation that eliminates infrastructure steps (replication, cache flush, logging) that DA handles automatically.

---

## 2. TFS Current Workflow Model

### 2.1 Two Workflow Variants

TFS uses two workflow variants that share the same infrastructure but differ in the number of approval gates:

| Variant | Approval Gates | Use Case |
|---|---|---|
| **Major Review** | 3 gates: Design/UX → Editorial → Final Production (Web Ops) | Content requiring multi-team review |
| **Simple Review** | 1 gate: Final Production (Web Ops) only | Content requiring only Web Ops approval |

### 2.2 Business Capabilities

Both workflows share these business capabilities:

| Capability | Description |
|---|---|
| Multi-stage sequential approval | Content passes through designated reviewers in sequence |
| Reject and rework loop | Reviewer rejects → author reworks → resubmits for review |
| Scheduled/delayed release | Reviewer sets an activation date — content publishes at that time |
| Force deploy | Bypass the scheduled wait — publish immediately |
| Email notifications | Notifications sent at each workflow stage to relevant participants |
| Cancellation | Workflow can be cancelled from any stage |
| Web Ops team selection | Author selects which Web Ops team handles final review |
| Preview before review | Content is available on preview for reviewer to inspect |

### 2.3 Participant Roles

| Role | Responsibility | Used In |
|---|---|---|
| Content Author / Initiator | Submits content, selects Web Ops team, reworks on rejection | Both |
| Design / UX Reviewer | Reviews visual/UX aspects, approves or rejects | Major only |
| Editorial Reviewer | Reviews editorial content, approves or cancels | Major only |
| Final Production Reviewer (Web Ops) | Final approval, sets release date, approves or cancels | Both |

### 2.4 What the Workflow Achieves (Business Outcome)

Regardless of the number of infrastructure steps, the actual human decision flow is:

**Major Review:**
```
Author submits
  → Design/UX Reviewer: Approve / Reject / Cancel
  → Editorial Reviewer: Approve / Cancel
  → Web Ops Reviewer: Approve / Cancel + Set release date
  → Content published
```

**Simple Review:**
```
Author submits
  → Web Ops Reviewer: Approve / Reject / Cancel + Set release date
  → Content published
```

This is the business outcome that must be preserved in DA.

---

## 3. DA Workflow Capability

### 3.1 Current DA Request Publish Feature

DA provides a built-in **Request Publish** workflow that supports:

| Feature | Supported |
|---|---|
| Author submission with notes | Yes |
| Path-based approval routing (different approvers per content area) | Yes |
| Email notifications (submission, approval, rejection) | Yes |
| Rejection with reason and resubmit | Yes |
| Content diff/comparison for reviewers | Yes |
| Auto-publish on approval | Yes |
| Custom email provider integration | Yes |
| Distribution lists (group-to-email mapping) | Yes |
| Configurable settings (required comments, CC approvals) | Yes |

### 3.2 Multi-Step Enhancement

DA's Request Publish currently supports single-stage approval. To support TFS's multi-step requirement, the DA product team will enhance the workflow capability through direct engineering collaboration.

**What has been confirmed by the DA engineering team:**

- Multi-step sequential approval will be supported through enhancement of the Request Publish plugin
- The enhancement will provide the same business outcome as TFS's current workflows in fewer infrastructure steps
- The DA engineering team will work directly with TFS to define the enhanced workflow that meets their approval governance requirements
- TFS must provide a timeline for when this capability is needed so engineering can plan accordingly

---

## 4. Target State — Enhanced DA Workflow for TFS

### 4.1 Target Workflow Model

The target state for DA workflows will preserve TFS's approval governance while leveraging DA's native capabilities:

**Major Review (Target):**

```
Author submits content for review
  ↓
Step 1: Design/UX Approval
  - Designated Design/UX reviewers notified via email
  - Reviewer inspects content on preview
  - Decision: Approve → advance to Step 2 | Reject → return to author for rework
  ↓
Step 2: Editorial Approval
  - Designated Editorial reviewers notified via email
  - Reviewer inspects content
  - Decision: Approve → advance to Step 3 | Cancel → workflow ends
  ↓
Step 3: Final Production (Web Ops) Approval
  - Designated Web Ops reviewers notified via email
  - Reviewer inspects content
  - Decision: Approve → publish | Cancel → workflow ends
  ↓
Content published to live site
```

**Simple Review (Target):**

```
Author submits content for review
  ↓
Step 1: Final Production (Web Ops) Approval
  - Designated Web Ops reviewers notified via email
  - Reviewer inspects content
  - Decision: Approve → publish | Reject → return to author for rework | Cancel → workflow ends
  ↓
Content published to live site
```

### 4.2 What DA Handles Automatically

The following infrastructure steps from the AEM workflow are handled natively by DA/EDS and do not require workflow steps:

| AEM Workflow Step | DA/EDS Equivalent |
|---|---|
| Replicate to Preview | DA preview is automatic — content is always available on `.aem.page` |
| Cache Flush Preview | Not needed — EDS CDN handles invalidation |
| Replicate to Production | Publish action triggers EDS CDN delivery |
| Cache Flush Production | Not needed — EDS CDN handles invalidation |
| Log steps | DA platform manages audit trail |
| Jump/routing steps | DA workflow engine manages step sequencing |

This is why a 43-step AEM workflow becomes a 3-step DA workflow — the business gates are preserved, the infrastructure is eliminated.

### 4.3 Business Outcomes Preserved

| Business Requirement | Preserved in DA? | How |
|---|---|---|
| Sequential multi-stage approval | Yes | Enhanced DA Request Publish with sequential steps |
| Reject → rework → resubmit | Yes | DA rejection with reason + author resubmit (built-in) |
| Email notifications at each stage | Yes | DA email notifications per step (built-in + custom provider) |
| Preview before review | Yes | DA preview always available (`.aem.page`) |
| Publish on final approval | Yes | DA auto-publish on approval (built-in) |
| Cancellation | Yes | Workflow cancellation support |
| Path-based reviewer assignment | Yes | DA path-based approval routing (built-in) |
| Audit trail | Yes | DA version history and workflow records |

---

## 5. Simplified Workflow Mapping

### 5.1 Step Reduction

| | AEM (current) | DA (target) | Reduction |
|---|---|---|---|
| Major Review | 43 steps | 3 approval steps + automated publish | ~93% reduction in steps |
| Simple Review | 29 steps | 1 approval step + automated publish | ~97% reduction in steps |

### 5.2 What Changes for Users

| Role | What changes | What stays the same |
|---|---|---|
| Content Author | Submits via DA Request Publish plugin (instead of AEM workflow dialog) | Same governance — cannot publish without approval |
| Design/UX Reviewer | Reviews via DA approval inbox/email link | Same responsibility — approve or reject |
| Editorial Reviewer | Reviews via DA approval inbox/email link | Same responsibility — approve or cancel |
| Web Ops (Final Production) | Reviews via DA approval inbox/email link | Same responsibility — final approval before publish |
| All participants | Email notifications via DA (custom email provider) | Same notification points — submission, approval, rejection |

---

## 6. Email Notifications

### 6.1 Notification Points

| Event | Who is notified | Major Review | Simple Review |
|---|---|---|---|
| Content submitted for review | First-stage reviewers | Design/UX reviewers | Web Ops reviewers |
| Step approved → next step | Next-stage reviewers | Next reviewer group | N/A (single step) |
| Content rejected | Content author | Yes — with reason | Yes — with reason |
| Content approved and published | Content author + stakeholders | Yes | Yes |
| Workflow cancelled | Content author | Yes | Yes |

### 6.2 Email Provider Requirement

DA supports custom email providers for workflow notifications. **TFS must provide their own email API** that DA will call to send notifications.

**Requirements for TFS email API:**
- Publicly accessible endpoint
- Accepts JSON payload with recipient, subject, HTML body
- Supports multiple recipients and CC
- Secured via API key (`x-auth-api-key` header)

The DA documentation provides the exact payload format specification that the email API must accept.

---

## 7. Pre-Requisites from TFS

| # | Pre-Requisite | Details |
|---|---|---|
| 1 | **Timeline** | TFS must communicate when multi-step workflow capability is needed so DA engineering can plan the enhancement |
| 2 | **Email API** | TFS must provide a publicly accessible email API endpoint for workflow notifications. DA will call this API to send emails at each workflow step. |
| 3 | **Reviewer groups and assignments** | TFS must define which reviewer groups (Design/UX, Editorial, Web Ops) map to which content paths — same path-based routing configuration |
| 4 | **Allowed email domains** | TFS must provide the list of email domains that participants use (for DA onboarding configuration) |
| 5 | **Engagement with DA engineering** | TFS stakeholders should be available to discuss workflow requirements directly with the DA product team to finalize the enhanced workflow design |

---

## 8. Open Items

| # | Item | Owner | Priority |
|---|---|---|---|
| 1 | Confirm timeline for when multi-step workflow is needed in production | TFS | High |
| 2 | Scheduled/delayed release — confirm if this is still a business requirement in EDS (since EDS publishes instantly to CDN). If required, discuss implementation approach with DA engineering. | TFS + DA Engineering | High |
| 3 | Force deploy — confirm if this is needed in DA context. In DA, if an approver approves, content publishes. There is no separate wait state unless scheduled release is implemented. | TFS | Medium |
| 4 | Web Ops team selection by author — in DA, approvers are configured per content path. Confirm if dynamic reviewer selection at submission time is still needed or if path-based assignment is sufficient. | TFS | Medium |
| 5 | Email API — confirm TFS can provide a publicly accessible email endpoint with the required JSON payload format. Confirm API key authentication is acceptable. | TFS IT | High |
| 6 | Notification requirements beyond email — if TFS needs Slack, Teams, or other notification channels, this must be discussed separately with DA engineering. | TFS | Low |
| 7 | Comment history — confirm if workflow comment history (carried through email notifications) is a requirement and how it should work across sequential approval steps. | TFS | Medium |
