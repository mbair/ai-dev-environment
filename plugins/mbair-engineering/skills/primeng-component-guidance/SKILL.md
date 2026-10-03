---
name: primeng-component-guidance
description: Implement or review PrimeNG components using the official LLM documentation. Use whenever adding, changing, styling, or testing a PrimeNG component, directive, overlay, or button in NFC Reserve.
---

# PrimeNG Component Guidance

Use the official PrimeNG LLM documentation as the component API source of truth. Combine this skill with `primeng-modern-migration` for version upgrades or deprecated API replacement.

## Documentation lookup

1. Start with `https://primeng.dev/llms/llms.txt` to locate the correct component and guide.
2. Read the specific Markdown endpoint when available: `https://primeng.dev/llms/components/<component>.md`.
3. If an endpoint is unavailable, use the corresponding official component page. Do not infer current inputs, emitted events, DOM classes, or accessibility contracts from an older PrimeNG version.
4. `llms-full.txt` is a fallback for cross-cutting configuration, theming, accessibility, animation, or overlay questions. Search it narrowly; do not load or copy the whole document into a task.

## Project constraints

- NFC Reserve currently uses PrimeNG 21. Verify documented APIs against the installed package before adopting content from the current v22 documentation.
- Prefer imports and APIs proven to exist in v21. Do not add v22-only components, directives, or new compound APIs without an explicit version upgrade.
- Prefer design tokens and component-supported properties over brittle internal DOM/CSS overrides. Use Pass Through only when a supported public API cannot meet the requirement.
- Retain localized labels, keyboard operation, focus visibility, responsive behavior, and the domain operation's loading/error/success feedback.

## Buttons and mutation actions

- Prefer the `pButton` directive on a native `<button>` for standard actions. Put the icon and localized label inside the button; icon order determines its position.
- An icon-only action requires an accessible `aria-label` or equivalent visible description.
- During asynchronous mutations, use a real disabled state and a visible busy indicator; prevent duplicate submits. Restore a usable state after failure while preserving user input.
- Use `severity`, `outlined`, `text`, `rounded`, `raised`, `link`, `size`, and `iconOnly` only when they match the action's semantic importance and the installed API supports them.

## Verification

After a component change, run the focused test and `npm run build:check`. For overlays, forms, responsive behavior, selectors, or visual changes, verify the rendered DOM/UI at the affected viewport. Check console errors and `git diff --check` before handoff.

## Official sources

- https://primeng.dev/llms/llms.txt
- https://primeng.dev/llms/llms-full.txt
- https://primeng.dev/llms/components/button.md
