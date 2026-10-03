---
name: primeng-accessibility-review
description: Review or implement accessible PrimeNG and Angular interfaces, especially forms, overlays, navigation, and custom interactive controls.
---

# PrimeNG Accessibility Review

Use this skill whenever a PrimeNG/Angular UI is created, materially changed, or reviewed and the task involves forms, navigation, dialogs/overlays, controls, color, focus, or user feedback.

## Outcome

Preserve PrimeNG's built-in accessibility while ensuring the surrounding application markup, styling, labels, and custom behavior meet an AA-oriented baseline. Do not claim legal certification from a code review.

## Review and implementation rules

- Prefer native semantic elements. Use a real `<button>` for an action, a real `<label>` associated with each form control, and landmarks/headings that reflect the page structure. Do not make a `div` or icon clickable when a native control can be used.
- Keep the PrimeNG component's documented input/output and keyboard behavior intact. Before overriding a component with custom markup, CSS, or Pass Through attributes, verify the installed-version API using the PrimeNG MCP or the official component documentation.
- Give icon-only controls an accessible name with `aria-label` or visible text. Decorative icons must not become the only label or instruction.
- Ensure validation, saving/loading, success, failure, and unsaved-change states are perceivable without relying on color alone. Associate inline errors and concise instructions with their controls where appropriate.
- Preserve a logical Tab sequence, visible keyboard focus, and Escape/close behavior for dialogs, drawers, menus, and popovers. Do not remove focus outlines without providing an equally visible replacement.
- When focus is moved programmatically after an action, make that movement purposeful and avoid stealing focus during ordinary typing or navigation.
- Maintain at least 4.5:1 contrast for normal-size text; review hover, disabled, error, and dark-theme states separately. Treat contrast changes to brand tokens as a design decision, not a superficial CSS tweak.
- Keep touch targets and state changes understandable; do not use motion, color, or a transient toast as the only indication that an operation finished.

## Scope-specific checks

For forms, check labels, required-state instructions, error association, autocomplete semantics where appropriate, password visibility controls, and submission feedback.

For overlays and navigation, check the trigger name and expanded state, initial focus, focus containment/return, keyboard close behavior, and whether the screen-reader context is clear.

For custom templates around PrimeNG components, inspect the rendered DOM in a browser. Static template inspection is insufficient for overlays, generated inputs, and dynamically announced state.

## Validation

Run the smallest relevant checks first: Angular build/type check, focused component tests, then browser keyboard testing for changed interactive paths. Use an automated accessibility scan as supporting evidence when available, but also perform targeted manual keyboard and visual-focus checks. Report what was verified and any remaining limitations.

In NFC Reserve, preserve localized text and run the repository's i18n validation when changing translated UI text.
