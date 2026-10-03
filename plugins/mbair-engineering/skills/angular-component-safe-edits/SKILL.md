---
name: angular-component-safe-edits
description: Use when editing Angular components, especially files referenced by templateUrl or styleUrls, to prevent transient or final NG2008/NG2007 missing template/style failures, broken dev-server watcher states, and handoff before a verified Angular build.
---

# Angular Component Safe Edits

Use this skill before modifying any Angular component `.ts`, `.html`, or `.scss/.css` file, especially when the component metadata contains `templateUrl` or `styleUrls`.

## Non-Negotiable Rules

- Never replace an existing `templateUrl` or `styleUrls` target with a `Delete File` followed by `Add File`.
- For existing Angular template/style files, update the file in place with `apply_patch` using `*** Update File`.
- If a new template/style file is needed, create the new file first, verify it exists, then update the component metadata to reference it.
- If removing a template/style file is genuinely required, first update the component metadata away from that path, run a build, then remove the old file.
- Do not leave the Angular dev server or watcher with a momentary missing file state when the user likely has it running.
- Before final handoff, verify every `templateUrl` and `styleUrls` path touched in the component metadata exists on disk.

## Workflow

1. Inspect the component metadata before editing:
   - `templateUrl`
   - `styleUrls`
   - current component directory contents
2. Choose an edit method that keeps referenced files present throughout the edit.
3. After edits, run a path existence check for every referenced template/style file touched.
4. Run the strongest practical Angular verification, usually:
   - `npx ng build --configuration development`
5. If a running dev server reports `NG2008` or a missing template/style error after the files exist:
   - explain that the watcher caught a transient state
   - restart or ask the user to restart the dev server
   - re-run the build after restart if possible
6. In the final answer, state both:
   - the Angular build result
   - whether template/style path existence was checked

## Quick Checks

From the Angular project root, use commands like:

```bash
test -f src/app/path/to/component.html
test -f src/app/path/to/component.scss
npx ng build --configuration development
```

For broader checks:

```bash
rg -n "templateUrl|styleUrls" src/app/path/to/component.ts
ls -l src/app/path/to
```

## Failure Pattern To Avoid

Bad:

1. Delete `some.component.html`.
2. Add `some.component.html` back with new content.
3. Angular watcher sees the gap and reports `NG2008`.

Good:

1. Patch `some.component.html` in place.
2. Confirm the file exists.
3. Build before handoff.
