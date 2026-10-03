---
name: angular-input-performance
description: "Prevent and diagnose typing lag when creating or editing Angular/PrimeNG forms, overlays, keyboard listeners, NFC scanner handling, or session activity monitoring. Use for unnecessary change detection and repeated-key stutter; keep necessary input, shortcut, and accessibility behavior."
---

# Angular Input Performance

Keep native text entry responsive. Run application work only when a user action needs it. Scope a prevention review to the edited flow; expand to global listeners when the reported problem or request requires it.

## Before editing a form or keyboard flow

- Determine which fields need live validation, calculations, filtering, or dependent updates. Plain description/note fields often need their model only on field exit or submission.
- Inspect the field, its ancestors, open overlays, route component, and root services. A guarded global Angular listener can still trigger change detection for every ignored key.
- Use the repository's required discovery tools first. For an exhaustive audit, include templates, native listeners, RxJS subscriptions, property handlers, and installed component implementations when application source does not explain the behavior.
- Search for `HostListener`, `keydown`, `keypress`, `keyup`, `beforeinput`, `input`, `addEventListener`, `fromEvent`, and `onkeydown`. Classify each handler by purpose, target, active lifetime, accepted keys, Angular zone, and cleanup.

## Choose the smallest effective fix

1. Remove a listener only when its behavior is unnecessary or covered by another event. Keep search-as-you-type, input masking, validation, and accessibility handlers when they serve the flow.
2. Prefer an element listener over a global listener when focus reliably identifies the target. Attach scanner/dialog listeners only while that operation is active; detach on close and destroy.
3. Prefer Angular key filters such as `(keydown.escape)` or `(keydown.enter)` for one-key behavior. Choose the target deliberately: element handlers require focus inside that element; document handlers need active-overlay guards.
4. For necessary scanner buffers or activity bookkeeping, register listeners outside Angular. Reenter Angular for a completed scan, an actual shortcut action, session refresh, logout, or another visible state change. Registering outside Angular and then unconditionally calling `zone.run()` per key keeps the expensive work.
5. Avoid restarting timers, logging, requests, parsing, or formatting per key when no result needs updating. For idle monitoring, a last-activity deadline and one pending timer can preserve the timeout without recreating timers for every input event.
6. Consider Angular event/run coalescing when measurements show duplicate checks. Verify the installed version and actual bootstrap injector. Coalescing complements removal of unnecessary handlers; it does not eliminate their work.

Do not switch a large component to OnPush, detach its view, debounce visible text entry, or migrate the whole app to zoneless change detection solely to hide a keyboard bottleneck. Such changes require their own state-update analysis.

## Form and scanner invariants

- Hardware NFC readers may type into a focused readonly identifier field. Exclude ordinary editable inputs, textareas, selects, and editable content from global scanner capture without excluding the intended scanner field.
- Preserve scanner mappings, terminator behavior, and processing of a completed scan. Reject unrelated keys and modifier/composition events according to the scanner's actual contract.
- Event targets may be `Window` or `Document`; check `instanceof HTMLElement` before using `.closest()`. Clean up native listeners with the same callback and capture setting.
- Keep real typing as session activity. Removing redundant raw key events must preserve idle expiration, renewal throttling, warning updates, and Angular reentry for visible session changes.
- Moving a text field to `[value]` plus `(change)` is suitable only when live model updates are unnecessary. Check the actual submit path: mouse click, keyboard submit, programmatic save, and pending drafts may read the model before blur. Explicitly reconcile the DOM value on submit when needed.
- `ngModelOptions.updateOn: 'blur'` delays model updates but does not necessarily remove input-triggered change detection. PrimeNG input/textarea directives may have their own input listeners. Inspect the installed implementation before claiming a field has no per-character handler.
- If a native control replaces a directive, preserve theme styling, labels, focus appearance, disabled/readonly state, lengths, resizing, and validation feedback used by that field.

## PrimeNG overlay pitfalls

- An Escape handler bound to all document keydowns or all drawer-root keydowns can check the entire page while typing. Inspect both global registration and internal template bindings; disabling `closeOnEscape` may leave an internal `(keydown)` handler active.
- Preserve Escape closing only the intended top overlay, Tab/Shift+Tab navigation, focus trapping/restoration, and cleanup. Nested overlays and focus outside the drawer need explicit consideration.
- Use supported APIs and filtered bindings first. A central EventManager plugin is justified only for a source-confirmed library handler with a narrow, documented contract. Keep unrelated handlers working, preserve event options/error handling/cleanup, and check the workaround after dependency upgrades.
- Angular may install listeners before setting dynamic classes or roles. A DOM-based filter must consider when its selector becomes valid.
- In an NgModule application, a provider in AppModule may not reach an EventManager created in the application injector. Verify registration in the running app; use version-supported `applicationProviders` when appropriate.
- Do not edit `node_modules` as a durable fix or broadly suppress keyboard propagation. Bindings must be narrowed without disabling controls elsewhere.

## Evidence for a reported performance defect

When browser verification is requested or authorized, reproduce the actual flow with realistic row counts and all relevant overlays open. Use safe fixtures when live data is unnecessary.

- Measure keydown-to-next-frame latency, median/tail latency, and relevant change-detection counts. Separate ordinary typing, held-key repetition, numeric controls, and scanning. `fill()` alone does not reproduce per-keystroke overhead.
- Use comparable before/after data, focus state, CPU settings, and instrumentation. A fresh browser or reduced dataset is not an equivalent baseline. State when a baseline is simulated.
- Register measurement listeners outside Angular so the probe does not introduce the overhead being measured. Wait for initial rendering and focus transitions before collecting samples.
- Check full text and numeric values, the submitted payload including the last character, scanner isolation, session behavior, Escape, and Tab. Do not equate a fast description field with a verified fast numeric control or another route.
- Keep runtime evidence, tests, build checks, and user confirmation distinct. Report remaining failures and only call them preexisting when baseline evidence supports that claim. If browser access is unavailable, state that limitation instead of inventing latency or declaring the stutter resolved.

For routine prevention work, inspect the changed flow and its listener lifetimes without imposing a global audit or benchmark. Run or add tests only when requested or authorized by the current task. Skill-format validation does not establish browser correctness.
