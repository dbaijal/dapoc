# Multi-Site Manager (MSM) — DA vs JCR (xWalk) Comparison

---

## Context

TFS manages content across a four-level hierarchy: Global English → Regional English → Country English → Local Language. This hierarchy spans 27 English sites and 13 language alternates. Global and Regional levels are non-public (internal authoring only); Country English and Local Language levels are publicly accessible.

Today, TFS achieves this multi-level cascade through a custom MSM rollout service built on AEM 6.4, because AEM Sites supports only one level of inheritance out of the box. This custom service handles recursive rollout, link rewriting, and dependency-ordered activation across levels.

**Important architectural note for xWalk:** AEMaaCS + EDS (xWalk) does not have a publisher tier or dispatcher. Content is authored in JCR and rendered via Edge/CDN. This means any functionality that depends on sling mappings, dispatcher-based URL rewriting, or publisher-side path manipulation will not work in xWalk and requires an alternative approach.

---

## Summary Matrix

| Use Case | DA | xWalk (JCR) |
|---|---|---|
| **Multi-level hierarchy** (Global → Region → Country → Language) | Multi-level inheritance being built into DA product via engineering collaboration. File-existence model — no content duplication. | AEMaaCS MSM supports 1-level OOTB (same limitation as AEM 6.4). TFS's custom recursive rollout service must be refactored for AEMaaCS compatibility. |
| **Page-level inheritance & overrides** | OOTB — break inheritance by creating page in satellite folder or cancelling from base. Resume inheritance available. | OOTB — Live Copy with cancel/resume inheritance at page level. Familiar AEM MSM model. |
| **Component-level inheritance** | Not supported at block level. Process change — break page inheritance, then use selective sync (merge mode with content diff) to manage specific blocks locally. | OOTB in AEMaaCS MSM — component-level inheritance cancel is a native Live Copy feature. How this surfaces in Universal Editor needs validation. |
| **Rollout & synchronization** | Multi-level rollout handled natively by DA product (pending delivery). No custom rollout service needed. Automatic link rewriting included. | AEMaaCS has rollout configurations OOTB (1-level). TFS's custom recursive rollout service and automatic link rewriting logic must be refactored for cloud. Sling mapping-based path resolution will not work — alternative needed. |
| **Regional & country site management** (virtual sites, fallbacks) | All country sites rolled out from region. No content duplication — satellite folders remain empty. Replaces custom configuration service. | Standard Live Copy from regional to country nodes. Content duplicated across all levels. Custom virtual site configuration (Belgium→UK routing) must be rebuilt — sling mappings not available in xWalk. |

---

## Use Case 1: MSM Hierarchy Management

**Current TFS State:** Four-level content cascade (Global → Region → Country → Language) achieved through a custom MSM rollout service that recursively discovers all direct and indirect live copies, builds dependency-ordered rollout queues, and manages content flow across levels. AEM 6.4 does not support multi-level inheritance natively — TFS built and maintains this custom service.

**DA Approach:** Multi-level inheritance is being built into the DA product natively through direct engineering collaboration with TFS. The DA model uses file-existence based inheritance — satellite site folders start empty and content flows from the base at delivery time without duplication. Only pages where inheritance has been actively broken appear in satellite folders. Once multi-level support is delivered, the entire Global → Region → Country → Language cascade works without any custom development.

**JCR Approach (xWalk):** AEMaaCS MSM supports one level of inheritance out of the box — the same limitation as AEM 6.4. To achieve TFS's multi-level hierarchy in xWalk, the existing custom recursive rollout service must be refactored for AEMaaCS compatibility (OSGi DS annotations, Sling Content Distribution, removal of deprecated APIs). The JCR model duplicates content across all levels — each level maintains its own copy of all pages. Multi-level remains a custom-maintained capability in xWalk.

**Key Difference:** DA eliminates the custom rollout service — multi-level becomes a product feature. xWalk retains the custom service model with cloud-level refactoring required.

---

## Use Case 2: Page-Level Inheritance & Overrides

**Current TFS State:** Authors can break page-level inheritance at any level of the hierarchy. A broken page is managed locally from that point — the live copy relationship for that specific page is cancelled while other pages continue to inherit.

**DA Approach:** Fully supported out of the box. Two mechanisms available: (1) A base site author cancels inheritance for a specific page — the page is copied into the satellite folder as a local override. (2) A satellite author creates a page at the same path — DA treats file existence as an implicit inheritance break. Authors can also resume inheritance — deleting the local override and reverting to base content. Inheritance breaks are not permanent.

**JCR Approach (xWalk):** Fully supported via AEMaaCS Live Copy. Cancel and resume inheritance at page level is a native MSM feature. Content is duplicated into the live copy node in JCR. Authors use the familiar AEM MSM actions (cancel, resume, detach).

**Key Difference:** Both support page-level inheritance break OOTB. DA uses file-existence (no file = inheriting, file exists = overridden). xWalk uses JCR live copy relationships (content duplicated, sync managed via rollout).

---

## Use Case 3: Component-Level Inheritance

**Current TFS State:** Authors can selectively break inheritance at the component/block level within a page. The rest of the page continues to inherit from the parent while only specific components are managed locally. This is used extensively — many pages have only one or two components localized while the remainder flows from global.

**DA Approach:** DA does not support block-level inheritance. Only page-level inheritance exists. This is a process change from AEM Sites. To achieve the same business outcome: authors break page-level inheritance (making the page a local override), then use Sync from Base with merge mode — DA shows a content diff between the base page and the local version. Authors selectively accept or reject changes per block. Blocks they want to keep local are not synced. Everything else stays aligned with the parent through periodic selective sync.

**JCR Approach (xWalk):** AEMaaCS MSM supports component-level inheritance cancellation natively. Authors can cancel inheritance on individual components while the page maintains its live copy relationship. This is the same capability as AEM 6.4. How this component-level inheritance action surfaces in the Universal Editor interface (vs the familiar Touch UI) needs to be validated.

**Key Difference:** xWalk preserves the familiar component-level inheritance model from AEM Sites. DA requires a different process (page-level break + selective sync) to achieve the same business outcome.

---

## Use Case 4: Rollout & Synchronization Behavior

**Current TFS State:** Custom MSM rollout service discovers all downstream descendants (not just direct children), honours cancellation flags (pages with broken inheritance are excluded), and manages dependency-ordered rollout (country language waits for country English to complete). Automatic link rewriting converts global paths to regional/country paths during rollout.

**DA Approach:** Multi-level inheritance in DA handles cascading rollout natively — the product manages all levels without custom code. Link rewriting is built into the multi-level inheritance model. Activation at the global level cascades to all regions and countries. No custom rollout service to build or maintain. Content is published to the edge as part of the inheritance flow.

**JCR Approach (xWalk):** AEMaaCS provides rollout configurations out of the box for one level. For TFS's multi-level cascade, the custom recursive rollout service must be refactored for cloud compatibility. Key changes required: Sling Content Distribution replaces agent-based replication, OOTB Goto Step replaces custom handlers, OSGi DS annotations replace Felix SCR. Additionally — any rollout logic that depends on sling mappings for path resolution or dispatcher for URL rewriting will not work in xWalk. Edge/CDN rendering means path manipulation must be handled differently (CDN rules or edge worker logic).

**Key Difference:** DA absorbs the rollout complexity into the product — no custom code. xWalk requires the custom rollout service to be refactored for cloud and adapted for the no-dispatcher/no-sling-mapping architecture.

---

## Use Case 5: Regional & Country Site Management

**Current TFS State:** Virtual sites — countries without their own content nodes (e.g. Belgium) are mapped via a custom configuration service to serve content from a primary country (e.g. UK). This uses named delegation (Belgium → UK) and catch-all delegation (Others → primary). Behind the scenes, this translates to sling rewrite rules or custom routing logic.

**DA Approach:** Virtual site concept is replaced by standard rollout. Belgium is rolled out from the Europe region as a satellite site — because DA does not duplicate content, the Belgium folder remains empty. No pages are created, no authoring overhead. Belgium content flows from Europe at delivery time, achieving the same result without a custom routing service. Process change: country-to-country inheritance (Belgium from UK) is replaced by country inheriting from its region (Belgium from Europe). Recommended for cleaner hierarchy and no custom configuration to maintain.

**JCR Approach (xWalk):** In AEMaaCS, the custom configuration service for virtual sites must be rebuilt or replaced. The current approach relies on sling mappings or custom path rewriting at the publisher/dispatcher level — neither exists in xWalk. Content is served via Edge/CDN, so virtual site routing must be handled through CDN-level redirect rules or edge worker logic. Live Copy can be used to create actual site nodes (Belgium as live copy of UK), but this creates content duplication that the custom service was designed to avoid.

**Key Difference:** DA achieves virtual sites natively through its no-duplication model (empty satellite folder, content flows from parent). xWalk loses the sling-based routing mechanism and must find an alternative (CDN rules or content duplication via Live Copy).

---

## Operational Impact (All Use Cases Combined)

**DA:**
- No custom MSM rollout service to maintain — multi-level inheritance is a product capability
- No content duplication across hierarchy levels — satellite folders contain only locally overridden pages
- Lower storage and content management overhead at TFS's scale (thousands of pages × multiple levels)
- Rollout, link rewriting, and cascading activation handled by the product — no custom code
- Custom relocation feature and MSM visualization need to be built as plugins/apps (TFS-specific requirements)
- Authors see only locally managed pages in satellite folders — cleaner authoring view
- Periodic selective sync replaces automatic component-level inheritance flow (different operational rhythm)

**xWalk (JCR):**
- Custom MSM rollout service must be refactored for AEMaaCS — ongoing custom code maintenance
- Content duplicated at every level — same operational model as AEM 6.4 (known and proven at TFS scale)
- Sling mapping dependent functionality needs replacement (CDN rules, edge logic) — additional architecture work
- Component-level inheritance preserved — same granular control authors have today
- Live Copy Overview console available for visualizing relationships
- Custom visualization UI (if beyond OOTB) needs UE compatibility validation
- Authors see all pages at every level (duplicated) — familiar but higher content volume to manage

---

## Change Management Impact (All Use Cases Combined)

**DA:**
- Fundamental mental model change: from "content exists everywhere, synced via rollout" to "content exists once, flows transparently via inheritance — local overrides appear only when needed"
- Authors managing satellite sites see empty folders by default — need to understand that inherited content is still being served even though it's not visible in their folder
- Component-level override process changes: authors break page → selective sync → manage diff. Different from clicking "cancel inheritance" on a component in AEM
- Training needed on: file-existence inheritance concept, sync from base with merge mode, understanding that missing file = inheriting (not missing)
- Simpler long-term: fewer pages to manage, no duplicate content confusion, no "which copy is the source of truth" issues

**xWalk (JCR):**
- Same MSM mental model as AEM Sites — Live Copy, Blueprint, rollout, cancel/resume inheritance. Familiar concepts for existing TFS AEM teams
- Primary training focused on: Universal Editor interface for MSM actions, AEMaaCS-specific differences (Content Distribution, no dispatcher)
- Teams maintaining the custom rollout service must learn AEMaaCS APIs and adapt existing code
- Sling mapping removal impacts how virtual sites and URL management works — teams need to learn CDN-based alternatives
- Less conceptual shift for authors — same content model, same inheritance model, new interface
