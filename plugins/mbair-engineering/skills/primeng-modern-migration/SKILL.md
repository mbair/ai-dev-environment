---
name: primeng-modern-migration
description: Safely modernize or migrate PrimeNG applications across v19-v22. Use when changing PrimeNG components, templates, themes, selectors, animations, forms, or version dependencies; especially in NFC Reserve's Angular 21 and PrimeNG 21 frontend.
---

# PrimeNG Modern Migration

Use official PrimeNG migration guidance to make targeted, verified modernization changes. Preserve product behavior and accessibility; do not upgrade to a newer PrimeNG major solely to adopt a visual pattern.

## Version boundary

NFC Reserve currently targets Angular 21 and PrimeNG 21. Prefer the modern v19-v21 APIs that are compatible with that installed version. Treat v22 as forward-planning guidance: do not introduce v22-only components or removed APIs until an explicit v22 dependency upgrade is approved and verified.

## Modern API rules

- Use `providePrimeNG` and a design-token preset for application configuration. Do not reintroduce legacy `primeng/resources` themes or runtime theme-link swapping as a new pattern.
- Prefer current component names and imports: `DatePicker`, `Select`, `ToggleSwitch`, `Popover`, and `Drawer`; do not add `Calendar`, `Dropdown`, `InputSwitch`, `OverlayPanel`, or `Sidebar`.
- Prefer the component's native `class` attribute over `styleClass` when that component is host-enabled. Check the component documentation before changing an existing `styleClass`, as not all components share the same host behavior in v21.
- Use kebab-case selectors and native HTML attributes where applicable.
- Use component `invalid` inputs to express validation state when available. Keep existing Angular form validity and error text behavior intact.
- Do not add `showTransitionOptions` or `hideTransitionOptions`; use CSS-based animation customization. Existing usages need visual verification because v21 ignores those inputs and v22 removes them.
- For new template work, use native Angular template reference variables rather than `pTemplate` where the installed component supports the modern API. Do not mechanically rewrite working templates without checking the v21 component documentation.

## v22 forward-compatibility scan

When touching related code, identify and avoid increasing use of these v22-deprecated APIs: `MultiSelect`, `PanelMenu`, `Password`, `Galleria`, `ColorPicker`, `InputMask`, `ScrollPanel`, old `pButtonIcon`/`pButtonLabel`, and `styleClass` on host-enabled components. Do not replace a component merely because it is deprecated; do so only when the user task, installed version, and regression coverage support it.

## Required workflow

1. Inspect the installed PrimeNG version and the affected component's official documentation before selecting an API.
2. Search both templates and SCSS for old component names, selectors, and deprecated inputs. CSS selectors must match the actual v21 DOM, e.g. `p-select`, `p-select-option`, `p-select-overlay`, and `p-drawer-close-button`.
3. Make the smallest coherent change. Preserve form state, keyboard access, overlay behavior, responsive behavior, localization, and server-side persistence paths.
4. For user-triggered mutations, retain visible loading, success, error, and dirty-state feedback.
5. Verify with the relevant focused test, `npm run build:check`, and `git diff --check`. For visual or selector changes, inspect the rendered UI at the affected viewport.

## Official sources

- https://primeng.dev/migration/v19
- https://primeng.dev/migration/v20
- https://primeng.dev/migration/v21
- https://primeng.dev/migration/v22
