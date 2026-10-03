---
name: action-feedback-ux
description: Enforce clear user feedback for UI mutation actions. Use when Codex creates, reviews, or edits frontend flows with save, submit, reset, restore, delete, sync, publish, import/export, permission changes, admin settings, or any user-triggered operation whose success, failure, loading, or unsaved-change state should be visible.
---

# Action Feedback UX

## Overview

Make mutation flows feel trustworthy. A user should know whether an action is pending, succeeded, failed, has unsaved changes, or was reverted without needing to infer it from silent state changes.

## UX Contract

For every meaningful user-triggered mutation, check and implement the appropriate feedback surface:

- Loading state: show a spinner, progress label, skeleton, or disabled busy control while the operation is in flight.
- Double-submit prevention: disable the initiating action and conflicting actions while pending.
- Success feedback: show a short toast, inline status, or saved-state indicator after confirmed success from the actual persistence boundary.
- Error feedback: show a clear failure message and preserve the user's pending changes unless discarding them is explicitly intended.
- Dirty state: enable save/reset actions only when there are unsaved changes, or otherwise show a clear saved/unchanged state.
- Reset/restore semantics: distinguish "discard local unsaved changes" from "persist a server-side reset"; ask for confirmation before destructive or broad server-side resets.
- Accessibility: expose busy/disabled state through real control state and avoid relying only on color.

## Implementation Guidance

1. Inspect the real persistence flow before editing: component state, service call, API response shape, errors, and any existing toast/message service.
2. Prefer existing local patterns and UI libraries. In Angular + PrimeNG code, prefer `MessageService`, `p-toast`, button loading/disabled states, and concise inline status where already used.
3. Treat success feedback as confirmed only after the service/API completes successfully. Do not show permanent success before the awaited/observable result.
4. On failure, keep edits in place, re-enable controls, and show an actionable message.
5. For reset/discard, restore the last confirmed snapshot and say what happened. For server reset, confirm first and then show success/error feedback.
6. Verify with the strongest practical check: build/type check, relevant tests, and visual/manual review when the change is UI-sensitive.

## Copy Style

Use short, specific messages:

- Success: `Mentés sikeres.`, `Módosítások mentve.`, `Visszaállítás kész.`
- Error: `Nem sikerült menteni a módosításokat.`, `A visszaállítás nem sikerült.`
- Dirty inline state: `Nem mentett módosítások`, `Minden módosítás mentve`

Keep messages near the action if the user may miss global toasts, but avoid duplicating noisy feedback unless the operation is high-stakes.
