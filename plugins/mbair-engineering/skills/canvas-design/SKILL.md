---
name: canvas-design
description: Create original, visually driven static artwork, posters, covers, diagrams, and other design-forward canvas artifacts as PNG or PDF. Use when the user asks for a poster, art piece, visual composition, print-ready graphic, cover, or other single-page design where visual expression matters more than explanatory text.
---

# Canvas Design

## Overview

Create an art object, not a text document with decoration. Translate the user's concise idea into an original visual philosophy, then express that philosophy through form, space, color, material, scale, rhythm, composition, and sparse typography.

Default to one highly resolved page and a visually dominant composition. Produce a final PNG or PDF, and save the short visual philosophy as a Markdown file alongside it when the workflow is being used as a reusable design artifact or when the user asks for it. Follow the user's requested dimensions, page count, language, and output format whenever provided.

## Workflow

### 1. Interpret the request

Extract the subject, intended audience, mood, medium, dimensions, orientation, required text, language, number of pages, and output type. Treat these as a foundation, not a complete art direction. Preserve essential words exactly, but keep nonessential copy out of the composition.

If the user supplies a reference image, use it only within the requested transformation or as a source of composition information. Do not imitate a living artist's signature style or reproduce a copyrighted work; describe the visual properties and create an original result.

### 2. Write the visual philosophy

Before producing the canvas, name a short original movement or aesthetic direction in one or two words. Write a concise philosophy that defines:

- Space and form: geometry, organic structure, density, negative space, and edges.
- Color and material: palette, contrast, surface, texture, light, and implied physicality.
- Scale and rhythm: what repeats, what dominates, and how the eye moves.
- Composition and hierarchy: balance, tension, focal point, and reading order.

Keep the philosophy specific enough to constrain the mood but open enough to allow interpretation. Make visual communication primary: ideas should live in spatial relationships, color, marks, images, and shapes rather than explanatory paragraphs. Emphasize care, precision, and deliberate craft without repeating the same instruction mechanically.

### 3. Find the conceptual thread

Look for a subtle, nonliteral idea embedded in the request—a technical detail, cultural reference, material, gesture, rhythm, or spatial metaphor. Weave it into the visual system so someone familiar with the subject can sense it while everyone else can still experience a coherent composition. Do not make the reference a conspicuous label unless the user explicitly asks for literal communication.

### 4. Choose the production route

Choose the simplest route that preserves the requested quality:

- Use the image-generation capability for image-led, painterly, photographic, textured, or illustrative bitmap work. Keep text short and add exact typography afterward when the wording must be reliable.
- Use SVG, HTML/CSS, a canvas library, or a drawing script for exact geometry, repeated patterns, diagrams, logos, grids, and typography-heavy posters. Prefer vector primitives when the design needs to scale cleanly.
- Use the PDF workflow and available PDF tooling for print-ready or multi-page PDF output. Render the PDF to images for inspection before delivery.
- Reuse project-local assets and existing visual conventions when the user provides them. Inspect available fonts and assets locally; do not assume a `canvas-fonts` directory exists and do not download fonts unless the user explicitly permits it and the environment supports it.

When exact text, alignment, or a repeatable layout is central, do not rely on an image model alone. Compose the visual layer and the typography separately, or use a vector/PDF route from the start.

### 5. Compose the canvas

Create one polished page by default. Use a restrained palette, intentional margins, clear hierarchy, and a small number of strong visual decisions. Aim for a visual-first balance—roughly 90% visual material and 10% essential text—unless the user's purpose requires more copy.

Treat typography as part of the composition: select type that supports the material and era, establish a deliberate scale system, and use words as labels, anchors, or gestures rather than filler. Make every text block legible at the intended viewing size.

Contain every element inside the canvas with comfortable margins. Prevent clipping, collisions, accidental tangencies, unreadable contrast, and unintentional empty gaps. Keep repeated elements consistent and align related elements to a visible or implied system.

Do not copy an existing artist, poster, brand, or reference image. Build an original composition from general visual properties, supplied assets, and the user's subject.

### 6. Refine and verify

Always perform a second pass. Refine the existing composition before adding more elements: improve spacing, hierarchy, contrast, edge quality, type treatment, and cohesion. The result should look deliberately made and resolved at close inspection, not merely populated.

Before delivery, render or reopen the final artifact and check:

- The file opens successfully and has the requested dimensions, orientation, and page count.
- Nothing is clipped, outside the page, overlapping unintentionally, or too close to the edge.
- Text is exact, legible, correctly encoded, and visually integrated.
- Contrast, hierarchy, palette, repetition, and negative space support the intended reading.
- PNG/PDF export quality is appropriate for the requested use; inspect a rendered PDF page rather than trusting source code alone.

If verification exposes a problem, fix the source and render again. Do not claim the artifact is pristine without inspecting the rendered result.

## Delivery

Deliver the final PNG or PDF as the primary artifact. Include the visual-philosophy Markdown file when requested or when it is part of the reusable design workflow. Respond in the user's language and keep the handoff concise: identify the files, format, and any important production assumption.
