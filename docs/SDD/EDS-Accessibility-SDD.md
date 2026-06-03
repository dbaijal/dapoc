# EDS Accessibility

---

## 1. Overview

Edge Delivery Services produces semantic and accessible HTML markup by default. EDS's architecture — semantic HTML first, CSS for presentation, JavaScript for behavior — inherently supports accessibility best practices.

However, accessible markup by default does not guarantee full WCAG compliance. Custom blocks, interactive patterns, authored content, and complex integrations require deliberate accessibility implementation during design and development.

This section defines the accessibility approach for the TFS EDS implementation — how accessibility is embedded into page structure, blocks, styling, authoring, and testing.

Reference: [EDS Semantic Markup — Sections & Blocks](https://www.aem.live/developer/markup-sections-blocks)

---

## 2. Objectives

The TFS EDS implementation must:

- Build accessibility directly into EDS page templates, default content, and custom blocks
- Favor semantic HTML first
- Use ARIA only when native HTML semantics are insufficient
- Follow established interaction patterns for accordions, tabs, carousels, dialogs, and other advanced controls
- Support keyboard-only, screen reader, low-vision, and zoom/reflow use cases
- Preserve EDS principles of simplicity, performance, and maintainability

---

## 3. Design Principles

### 3.1 Accessibility is a build-time requirement

Accessibility must be implemented during design, development, and QA — not deferred to a final audit or post-launch phase.

### 3.2 Semantic HTML first

EDS implementations should use native HTML elements wherever possible: `button`, `a`, `nav`, `main`, `header`, `footer`, `form`, `label`, `input`, `select`, `fieldset`, `legend`, `ul`, `ol`, `li`, `table`, and proper heading levels.

### 3.3 ARIA enhances semantics; it does not replace them

ARIA should be used to express role, state, and relationship only where native HTML does not already provide the needed behavior.

### 3.4 Accessibility must survive authoring freedom

DA emphasizes lightweight authoring and reusable blocks. Accessibility cannot depend on authors "remembering everything correctly." The implementation should make the accessible outcome the default outcome through sensible markup, constrained block behavior, semantic defaults, and design-system patterns.

### 3.5 EDS blocks are not automatically WCAG compliant

EDS blocks can be used to build accessible experiences, but accessibility compliance is not guaranteed by default. Custom blocks require deliberate implementation and testing.

---

## 4. EDS-Specific Accessibility Approach

### 4.1 Prefer default content before custom interaction

- Use plain headings, paragraphs, lists, links, and images wherever possible
- Avoid creating a custom block when semantic default content already solves the use case
- Minimize variant explosion — more variants increase accessibility risk and testing burden

### 4.2 Blocks must generate semantic output

Each block must produce HTML that is meaningful before CSS and JavaScript are applied.

| Block Type | Preferred Semantic Structure |
|---|---|
| Hero | heading, paragraph, link/button, image |
| Cards | `ul` / `li` or `article` list |
| Accordion | heading + button + associated region |
| Tabs | `tablist` / `tab` / `tabpanel` |
| Forms (tfs2-form) | proper labels, field grouping, help text, validation mapping |
| Columns | semantic sections with appropriate heading hierarchy |
| Testimonial | `blockquote` or `article` with attribution |

### 4.3 Styling must not break accessibility

- Never remove focus indicators without a visible replacement
- Preserve contrast for text, controls, icons, and focus rings
- Do not rely on color alone to convey meaning
- Ensure text reflows and remains usable under zoom
- Avoid styling that visually reorders content while leaving DOM order incorrect

---

## 5. How Accessibility Is Implemented in EDS Blocks

Accessibility in EDS blocks is implemented at five layers:

### Layer 1: Semantic HTML structure

- Clickable actions use `<button>` or `<a>`, not clickable divs
- Grouped navigation uses `<nav>`
- Main content uses `<main>`
- Page sections use proper headings
- Lists use `ul`/`ol`/`li`
- Data tables use proper table markup only for tabular data

### Layer 2: Accessible names and relationships

- Icon-only buttons use `aria-label` or `aria-labelledby`
- Form controls are associated with labels
- Helper text and error text are referenced by `aria-describedby`
- Disclosure/expansion controls use `aria-expanded` and `aria-controls`

### Layer 3: Keyboard support

- All interactive controls reachable by Tab
- Logical tab order based on DOM order
- No positive tabindex
- Enter/Space support where appropriate
- Escape to dismiss overlays, dialogs, menus

### Layer 4: Focus management

- Dialogs move focus into the dialog on open and restore it on close
- Newly revealed content gets focus when context changes materially
- Focus is trapped within modal dialogs
- No keyboard traps in dropdowns, menus, or disclosure panels

### Layer 5: Announcements for dynamic updates

- Inline validation messages use `aria-live`
- Status updates (form submission, loading states) are announced
- Use `aria-live` carefully and only where needed

---

## 6. Pattern Guidance for TFS Blocks

For non-native interaction patterns, the implementation should follow the WAI-ARIA APG pattern that matches the control behavior.

### Accordion

- Button-driven disclosure pattern
- Visible heading structure
- `aria-expanded`, `aria-controls`
- Controlled content region

### Tabs

- Use tabs only when content is truly peer-panel switching
- `tablist`, `tab`, `tabpanel`
- Roving focus or supported keyboard pattern
- `aria-selected`

### Carousel

- Pause/play control accessible via keyboard
- Slide navigation announced
- Auto-play respects `prefers-reduced-motion`

### Forms (tfs2-form)

- All fields have associated labels
- Required fields indicated programmatically (`aria-required`)
- Validation errors referenced by `aria-describedby`
- Multi-step forms announce step transitions
- Rule-based show/hide does not create keyboard traps

---

## 7. Authoring Considerations in DA

Authors influence accessibility. The implementation should reduce the chance of inaccessible output.

### 7.1 Make the accessible choice the default

- Heading hierarchy built into templates and authoring patterns
- Image blocks encourage or require meaningful alt text
- Decorative images can be marked decorative
- CTA blocks require meaningful link text (no "Click here")
- Form blocks include labels and error mappings by default

### 7.2 Content guidance for authors

Even with strong block engineering, authors need guidance on:

- Heading order (H2 → H3, never skip levels)
- Descriptive link text (not "Read more" or "Click here")
- Alt text quality (describe the content, not "image of...")
- Table usage (only for tabular data, not for layout)
- Avoiding images of text
- Captioning/transcripts for video content (Brightcove)

### 7.3 Preflight validation for accessibility

Preflight rules can be extended to catch common accessibility issues before publish:

- Missing alt text on images
- Empty link text
- Heading level violations
- Required metadata missing

---

## 8. Testing Strategy

Accessibility validation must include both automated and manual checks.

### 8.1 Automated testing

- axe-based scans in local development
- Lighthouse accessibility audits
- Regression testing for known accessibility rules

Automated testing catches: missing labels, some ARIA misuse, contrast problems, landmark issues, duplicate IDs.

### 8.2 Manual testing

Required manual validation:

- Keyboard-only navigation
- Screen reader testing (NVDA/JAWS on Windows, VoiceOver on Mac)
- Visible focus review
- Zoom/reflow checks (200%, 400%)
- Content-on-hover/focus behavior
- Modal/dialog escape and restore behavior
- Error handling and announcement behavior

### 8.3 Block release gate

No custom block should be promoted to production status unless it passes:

- Semantic structure review
- Keyboard navigation review
- Focus management review
- axe scan (zero critical/serious violations)
- Basic screen reader review
- Responsive/zoom review
