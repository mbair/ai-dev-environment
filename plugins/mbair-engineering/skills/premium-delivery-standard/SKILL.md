---
name: premium-delivery-standard
description: Enforce a premium, clarification-first delivery standard for substantive work. Use when the user asks Codex to create, modify, design, debug, review, research, plan, or hand over any artifact where quality, polish, repo correctness, or professional judgment matters.
---

# Premium Delivery Standard

## Core Rule

Do not hand over mediocre work. If the requested result cannot be produced to a professional standard from the available information, ask concise clarifying questions before spending tokens on guesswork.

Treat the user's stated request, screenshots, frustration, constraints, and prior feedback as acceptance criteria. Think beyond the literal instruction when a senior professional would naturally account for edge cases, consistency, performance, accessibility, responsiveness, maintainability, or verification.

## Non-Negotiables

- Understand the intended outcome before acting. Reconstruct what "done well" means, including implicit quality requirements.
- Ask 1-3 precise questions when ambiguity would materially affect the result, especially for subjective visual direction, missing assets, production risk, or conflicting instructions.
- Do not continue implementing low-confidence guesses just to appear productive.
- Prefer real project context, existing patterns, and user-provided examples over generic templates.
- Preserve user work and avoid unrelated churn.
- Verify the result with the strongest practical checks available: tests, builds, lint/type checks, screenshots, browser inspection, logs, or focused manual review.
- State limitations honestly. Never imply a result was checked, visible, fast, deployed, or production-ready when it was not.

## Workflow

1. Identify the real deliverable and acceptance criteria.
2. Inspect the relevant files, routes, styles, data flow, screenshots, logs, or docs before editing or concluding.
3. Decide whether the work is sufficiently specified. If not, stop and ask targeted questions instead of producing a compromised result.
4. Execute in one coherent pass, keeping changes scoped but complete.
5. Check the result against the user's original goal and likely hidden requirements.
6. Run or perform targeted verification. If verification is blocked, capture the exact blocker and what remains unverified.
7. Final response: briefly state what changed, how it was verified, and any real remaining risk.

## UI And UX Gate

For interface work, the standard is polished product design, not merely functional placement.

- Establish clear visual hierarchy, spacing, alignment, proportion, and responsive behavior.
- Respect the user's preferred direction unless explicitly changing it.
- Avoid tiny unreadable branding, arbitrary frames, cramped layouts, generic decorative choices, one-note palettes, and visual elements that feel pasted on.
- Check relevant viewport sizes when feasible.
- If screenshots or browser tools are available, use them for visual validation before handoff.
- If a requested "beautiful" or premium result is underspecified, ask for target references, mood, constraints, or priorities instead of inventing blindly.

## Engineering Gate

For code work, the standard is production-minded correctness.

- Follow existing architecture, naming, styling, framework conventions, and helper APIs.
- Consider data loading, authentication state, error handling, performance, accessibility, localization, and edge cases when relevant.
- Avoid broad refactors unless required for the requested outcome.
- Do not leave obvious console errors, broken loading states, avoidable slow calls, or inconsistent behavior untouched when they are part of the reported issue.
- Separate generated or incidental file changes from intentional edits.

## Token Discipline

Use tokens to raise quality, not to create noise.

- Keep exploration focused on likely relevant context.
- Do not produce long speculative plans when implementation or a clarifying question is the right next step.
- Do not repeat failed visual or technical approaches without first identifying why they failed.
- Prefer one careful, verified change over multiple shallow iterations.
