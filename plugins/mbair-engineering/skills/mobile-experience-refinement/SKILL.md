---
name: mobile-experience-refinement
description: "Refine a responsive website into an intentionally composed, accessible, performant mobile experience while preserving the desktop experience."
---

# Mobile Experience Refinement

Use this skill when a website needs deliberate phone composition, mobile navigation, responsive motion, mobile-specific media, or mobile performance work. Do not treat mobile as a simple desktop shrink and do not use this skill for unrelated backend or admin changes.

## Composition and navigation

- Keep desktop and mobile as responsive versions of the same site and codebase, while allowing independent composition, typography, spacing, and scroll pacing.
- If a fixed mobile header is used, keep it outside any pinned animation so it survives the entire page. Respect safe-area insets, maintain contrast, and give interactive controls at least 44x44 CSS pixels.
- The menu must have a clear accessible name, close control, keyboard operation, focus management, Escape-to-close behavior, link-selection close behavior, and anchor offsets that prevent the header covering headings.
- Keep the mobile opening focused: persistent brand navigation, one short headline, one primary action, and a subtle scroll cue. Move supporting copy and secondary actions out of the visual's way, then reintroduce concise context at the relevant reveal.
- Keep text and controls in deliberate negative space and clear of the subject, header, and gesture area. Ensure there is a visible way to skip a long visual story and reach the main content.

## Responsive media and performance

- Use a dedicated portrait asset or sequence only when it materially improves the story. Recompose for the tall viewport; do not stretch landscape media. Preserve brand, object geometry, lighting, palette, and narrative.
- Keep important action central enough to survive phone aspect-ratio differences, fill the environment edge-to-edge, and avoid exposed corners, seams, borders, or pasted-looking panels.
- Select the intended asset variant before requesting/loading frames: mobile loads portrait, desktop loads landscape. Do not preload both variants and hide one with CSS.
- Show a lightweight poster immediately, load frames progressively around the current scroll position, bound concurrent requests and decoded-image memory, cancel obsolete work after breakpoint changes, and release old decoded images.
- Respect reduced-motion preferences by using a composed still and normal flow without fetching the animation sequence. Provide a usable poster fallback when loading fails. Do not block the rest of the page on the full sequence.
- Tune mobile scroll mapping independently. Compress inactive holds, preserve motion through important transitions, and use brief opening/closing holds for readability. Removing frames alone does not shorten scroll distance.

## Validation

- Inspect the actual implementation at several phone widths and heights, plus desktop after mobile changes. Check immediate readability, subject framing, clip seams, scroll pacing, final product visibility, text/button collisions, horizontal overflow, safe-area spacing, and persistent navigation after the story ends.
- Exercise menu open/close, focus return, Escape, anchor offsets, reduced motion, poster fallback, breakpoint changes, and fast/reverse scrolling.
- When network inspection is available, verify that each viewport requests only its intended asset variant. Report asset sizes separately from measured loading speed; never infer speed from file size alone.
- State what was browser-verified versus inferred from build/tests, and leave a reviewable mobile preview when the environment supports one.
