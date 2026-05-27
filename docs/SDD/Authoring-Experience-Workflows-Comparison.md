# Authoring Experience & Publishing Workflows — DA vs JCR (xWalk) Comparison

---

## Use Case 1: Authoring Experience

How content is authored, edited, and managed by authors on a day-to-day basis. This comparison helps content marketers and authors understand what the authoring experience looks like in each approach.

**Important note:** Regardless of the authoring approach chosen (DA or xWalk), the end result is the same — content is delivered via Edge Delivery Services (EDS). The authored content produces the same markup and is served from the same EDS CDN. The authoring experience is different; the delivery is identical.

---

| Dimension | Details |
|---|---|
| **Current TFS State** | AEM 6.4 Sites authoring via Touch UI. Authors use a WYSIWYG page editor with a component side panel — drag components onto the page, open dialogs to configure properties, preview in-context. Components are configured via multi-tab dialogs with fields, dropdowns, asset pickers, and path browsers. Content is stored in JCR. Authors interact with the AEM Sites console for page management (create, move, publish, view properties). |
| **DA Approach** | Authors work in a **document-style editor** at da.live — similar to Google Docs or Microsoft Word. Content is authored as structured text, tables, images, and links. Blocks (components) are represented as tables — the table header names the block, rows contain the content. Variants are selected by typing the variant name in the block header (e.g. `Cards (4-col, feature-card)`). For complex blocks requiring constrained input (forms, video, CTA), DA plugins provide guided dialogs with dropdowns and validated fields. An optional **UE overlay** can provide structured dialog-based editing on top of the DA document — component-definition.json defines fields that map to table cells, giving authors a familiar property panel experience without changing the underlying content model. |
| **JCR Approach (AEMaaCS + xWalk)** | Authors work in the **Universal Editor (UE)** — a WYSIWYG editor that renders the actual EDS page and allows inline editing. Authors click on content to edit it in place or use a properties panel on the right side. Blocks are added from a block palette and configured via structured dialogs defined in component-definition.json. Variants are selected via dropdown fields in the properties panel. Content is stored in JCR (AEM content repository). Authors use a Sites-like console for page management. The experience is closer to traditional AEM Touch UI authoring — click, edit, configure via panel. |
| **Functional Differences** | DA is document-centric — authors think in terms of "writing content in a document" with tables representing structured blocks. xWalk is page-centric — authors think in terms of "editing a rendered page" with property panels for configuration. DA uses the table header for variant selection (typed text). xWalk uses dropdown fields for variant selection (constrained options). DA plugins provide constrained input for complex blocks — similar outcome to xWalk's model-defined dialogs. DA with UE overlay bridges the gap — provides structured dialogs over the document model. Both produce the same EDS markup — the final rendered page is identical regardless of authoring source. |
| **Operational Impact** | **DA:** Authors can create and edit content quickly — document-style editing is fast for text-heavy pages. No dependency on component-definition.json for basic authoring (any block table can be created directly). Plugin updates and Library changes are config-level — no code deployment needed. New blocks can be added to the Library immediately without development for the authoring side. Real-time collaboration supported — multiple authors can edit the same page simultaneously. **xWalk:** Authors have a structured experience with constrained dialogs — field types, required fields, and select options guide correct input. Every new block or block change requires component-definition.json and potentially component-filters.json updates (development effort). Page management via Sites-like console provides familiar AEM operations (move, copy, publish, versions). |
| **Governance Impact** | Covered in detail in the Governance & Template Enforcement comparison document. In summary: DA relies on Library guidance + plugins + publish workflow for governance. xWalk relies on component-filters + model definitions + field constraints for governance. |
| **Change Mgmt Impact** | **DA:** Significant shift for AEM-trained authors. The editing paradigm moves from "WYSIWYG page with component dialogs" to "document with tables." Authors familiar with Google Docs or Word will find DA intuitive. Authors familiar only with AEM Touch UI will need retraining on the document-based model. Training areas: how blocks are represented as tables, how to use the Library for blocks/templates, how plugins work for complex blocks, variant naming convention in headers. The UE overlay option reduces this shift — authors get structured dialogs similar to AEM while the underlying model remains DA. **xWalk:** Moderate shift for AEM-trained authors. The Universal Editor is different from Touch UI but conceptually similar — still WYSIWYG, still property panels, still structured fields. Authors adapt to a new interface but the mental model (click element → edit properties → save) remains the same. Training areas: new UE interface navigation, properties panel location and behaviour, block palette usage, differences from Touch UI. Less paradigm shift than DA for teams with AEM authoring experience. |

---

## Authoring Experience: Side-by-Side

| Aspect | DA | xWalk (JCR) |
|---|---|---|
| Editor type | Document-style editor (da.live) | WYSIWYG page editor (Universal Editor) |
| Content creation metaphor | "Writing a document with tables" | "Editing a rendered page with panels" |
| Adding a block | Create a table with block name as header | Select block from palette, drop on page |
| Configuring a block | Fill table cells (key-value or content rows) | Edit fields in properties panel |
| Variant selection | Type variant name in table header: `Block (variant)` | Select from dropdown in properties panel |
| Complex block input | Plugin dialogs (CTA, Forms, Brightcove) — constrained | Model-defined dialogs — constrained |
| Rich text editing | Inline in document (bold, italic, links, lists) | Inline on page or in richtext field in panel |
| Image insertion | Drag and drop into table cell | Asset picker from AEM Assets |
| Page creation | New document + apply template from Library | Create page from template in Sites console |
| Multi-author collaboration | Real-time — multiple authors can edit the same page simultaneously | Not available in the same real-time manner as DA |
| Variant/style visibility | Visible in table header text (author always sees it) | Visible in properties panel when block is selected |
| Content structure visibility | Author sees tables and sections (document structure) | Author sees rendered page (visual structure) |
| What authors see vs what users see | Different — authors see tables, users see rendered blocks | Similar — authors see close-to-final rendering |
| UE overlay option | Available — adds structured dialogs over document model | N/A — UE is the native editor |
| New block availability | Add to Library (config) — no code deployment for authoring | Requires component-definition.json update (development) |
| Learning curve for AEM authors | High — new paradigm (document-based) | Moderate — new interface, same paradigm (WYSIWYG) |
| Learning curve for non-AEM users | Low — familiar document editing | Moderate — need to learn WYSIWYG page editing concepts |

---

---

## Use Case 2: Approval & Publishing Workflows

How content approval gates, publishing workflows, notifications, and release management are handled in DA vs JCR.

---

| Dimension | Details |
|---|---|
| **Current TFS State** | Custom multi-step approval workflows built on AEM 6.4 workflow engine. Two variants: Major Review (3 approval gates: Design/UX → Editorial → Final Production/Web Ops) and Simple Review (1 approval gate: Final Production only). 43 steps (Major) / 29 steps (Simple) — mostly infrastructure steps (replication, cache flush, logging, routing). Business capabilities include: reject → rework loop, scheduled/delayed release, force deploy (bypass wait), email notifications at each stage (8 notification points for Major, 5 for Simple), cancellation from any stage, Web Ops team selection by author at submission, and comment history. Workflow groups per region (8 workflow operator groups). Custom recursive handlers maintained by TFS development team. |
| **DA Approach** | DA has a built-in Request Publish workflow that currently supports single-step approval. Current capability: author submits → approver(s) review → approve (auto-publish) or reject (with reason, author resubmits). Path-based approval routing configures different approvers per content area via config sheets. Email notifications on submit, approve, and reject. Custom email provider support — TFS provides their own email API. Multi-step sequential approval (to support TFS's 3-gate Major and 1-gate Simple requirement) will be enhanced through direct engineering collaboration with the DA product team. The goal is to achieve the same business outcome — same number of human approval gates, same reviewer roles, same governance — in fewer infrastructure steps. DA handles replication, cache invalidation, and routing automatically. Workflow configuration is spreadsheet-based — no custom code to maintain. |
| **JCR Approach (AEMaaCS + xWalk)** | Full AEM Workflow engine available in AEMaaCS. Custom TFS workflows (Major + Simple Review) can be migrated with refactoring — all business logic preserved (same approval gates, same participant roles, same rework loops, same scheduled release). Infrastructure changes required: Sling Content Distribution replaces agent-based replication, cloud-compatible email service replaces SMTP-based MailService, OSGi DS annotations replace deprecated Felix SCR, OOTB Goto Step replaces custom jump handlers. Familiar AEM Inbox experience for reviewers. Scheduled release, force deploy, cancellation — all preserved. Custom Java handlers require migration and ongoing maintenance. 43 steps reduced to 38 (Major) / 29 to 25 (Simple) due to cache flush steps being eliminated (EDS CDN handles invalidation). |
| **Functional Differences** | DA simplifies the workflow to its business essence — 3 human decision points instead of 43 infrastructure steps. xWalk preserves the full workflow model with all intermediate technical steps. DA workflow is configuration-based (path-pattern → approvers in a config sheet). xWalk workflow is code-based (custom Java handlers, ECMA scripts, workflow models in JCR). DA auto-publishes on final approval — content goes live immediately. xWalk supports delayed/scheduled release via timer steps (reviewer sets activation date). DA's multi-step enhancement requires engineering collaboration with a timeline to be aligned. xWalk's multi-step is available today via AEM Workflow engine. DA has a one pending request per page limitation. xWalk has no such constraint. |
| **Operational Impact** | **DA:** Once multi-step enhancement lands — zero custom workflow code to maintain. Workflow changes are spreadsheet/config edits, not code deployments. Authors submit via DA Request Publish plugin, approvers act via email link or DA inbox app. Regional teams manage approvers via config sheets — adding/removing approvers is a config change, not development. Publishing is automatic on final approval — no manual activation step. No custom handlers to refactor or maintain across upgrades. **xWalk:** Custom workflow handlers must be maintained as code — changes require development and deployment cycles. Familiar AEM Inbox for reviewers — no retraining on the approval experience itself. Scheduled release and force deploy available as built-in capabilities. Regional workflow operator groups preserved as-is. Ongoing maintenance burden for custom workflow code across AEMaaCS upgrades. |
| **Governance Impact** | **DA:** Approval routing controlled via path-based config sheets — easy to modify, no code deployment needed. Reviewers are the governance enforcement point — rejection prevents publish. Config sheets define who approves what content paths — transparent and auditable. No conditional routing (if content type X → route to team Y) — static path-based rules only. **xWalk:** Full workflow model with OR splits, conditional routing, and custom logic. More complex governance rules possible (e.g. auto-route based on content properties, different rejection targets per stage). AEM Inbox provides centralized view of all pending approvals across the organization. Workflow admin console available for monitoring active workflows, deadlines, and bottlenecks. |
| **Change Mgmt Impact** | **DA:** Authors learn a new submission flow (DA Request Publish plugin instead of AEM Start Workflow dialog). Approvers receive email links with review/approve/reject actions instead of AEM Inbox work items (or use DA inbox app). Teams managing workflow configuration edit spreadsheets instead of workflow models in JCR. TFS must provide a publicly accessible email API endpoint for notifications. Paradigm shift — from code-based workflow to configuration-based workflow. **xWalk:** Authors and approvers continue using AEM Inbox — familiar experience. Workflow initiators see UE-styled dialogs instead of Classic/Touch UI dialogs. Technical teams refactor existing Java handlers — same business logic, updated annotations and APIs. Moderate training on AEMaaCS workflow differences. Less organizational disruption since workflow experience and concepts remain fundamentally the same. |

---

## Publishing Workflows: Key Decision Factors

| Factor | DA | xWalk (JCR) |
|---|---|---|
| Multi-step approval today | Enhancement in progress via engineering collaboration | Yes — AEM Workflow engine supports it today |
| Custom code maintenance | None — config-sheet based | Yes — custom handlers to maintain |
| Workflow changes require | Config sheet edit (no deployment) | Code change + deployment |
| Scheduled/delayed release | To be discussed with DA engineering | Available — timer steps preserved |
| Reviewer experience | Email link + DA inbox app | AEM Inbox (familiar) |
| Author submission | DA Request Publish plugin | AEM Start Workflow dialog in UE |
| Notification mechanism | TFS-provided email API | AEM cloud-compatible email service |
| Path-based routing | Built-in (config sheet) | Custom code (PropertiesParticipantChooser) |
| Conditional routing | Not supported (static path rules) | Supported (OR splits, custom logic) |
| Ongoing maintenance | Low — config only | Higher — custom Java code |
