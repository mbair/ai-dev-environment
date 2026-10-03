---
name: demo-presentation-defaults
description: Ensure demo and presentation screens open with meaningful, safe sample content instead of an avoidable empty state. Use for demo defaults, initial selectors, and showcase flows; not for ordinary production preferences.
---

# Demo Presentation Defaults

Demo screens should be immediately understandable during a presentation. When a screen depends on a selector, use an eligible data-bearing default after the options have loaded so the first impression is useful.

## Default-selection rules

- Preserve an explicit URL/deep-link selection and a user-made or deliberately persisted selection. Use a default only when no valid selection exists.
- Select the first eligible real item, never a synthetic "none" option, a disabled option, or an item that cannot load the dependent data.
- Trigger the same data-loading path as a user selection. Updating only the selector label is not sufficient.
- Keep a deliberately cleared selection intact unless the product explicitly requires it to repopulate. An empty state may be appropriate after an intentional clear or when no eligible items exist.
- Keep demo-only defaults scoped to the demo experience unless equivalent production behavior is explicitly desired.

## Verification

- Cover the no-selection default, persisted/deep-link precedence, no-eligible-option behavior, and manual selection behavior.
- Verify the rendered screen with representative demo data: the selector and its dependent table, cards, or charts must both contain content after load.
- Run the focused component test and Angular build before handoff.
