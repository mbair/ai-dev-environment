---
name: nfcreserve-i18n-safe-edits
description: Prevent and repair raw translation keys, missing locale entries, wrong flat-versus-nested key placement, and stale i18n verification in NFC Reserve frontend work. Use whenever Codex adds, edits, reviews, or debugs translated UI text in frontend/Zichy2, touches hu.json, gb.json, or de.json, sees a literal key such as GUEST.metrics.label in the UI, or changes an Angular template that uses the translate pipe.
---

# NFC Reserve i18n Safe Edits

Work in `/home/mbair/GIT/NFCreserve/frontend/Zichy2` unless the checkout differs.

## Non-negotiable rules

1. Inspect the complete canonical parent object before editing. NFC Reserve locale files contain legacy flat keys and newer nested objects; never infer placement from a nearby flat key.
2. Add every new key to `src/assets/i18n/hu.json`, `gb.json`, and `de.json` in the same structural location.
3. If the root segment is an object, add the key inside that object. For example, when `GUEST` is an object, put `metrics.registeredGuests` under `GUEST.metrics`; do not add a top-level `"GUEST.metrics.registeredGuests"` entry.
4. Update existing files in place. Do not regenerate, reorder, or broadly reformat locale files.
5. Do not use hard-coded UI fallback text to hide a missing translation.
6. Treat a raw key in the rendered UI as a failed implementation even when all JSON files parse.

## Workflow

1. Extract every new or changed translation key from the template or TypeScript.
2. Inspect its root and parent in all three locale files. Use targeted searches plus a small surrounding excerpt.
3. Edit all locales with identical nesting and meaningful translations.
4. Run the bundled validator for every touched key or parent prefix:

```bash
python3 ~/.codex/skills/nfcreserve-i18n-safe-edits/scripts/validate_i18n_keys.py \
  --root /home/mbair/GIT/NFCreserve/frontend/Zichy2 \
  --prefix GUEST.metrics
```

Use repeated `--key` arguments for isolated keys. The validator must pass before build or browser testing.

5. Run `git diff --check` and `npm run build:check`. Use `build:check`, not the release-style `npm run build`, unless the user explicitly requests release assets.
6. Add or update a focused browser assertion that rendered text contains the expected translation and does not contain the key prefix. A layout-only assertion is insufficient.
7. Verify the relevant viewport and active language. When the UI supports Hungarian, English, and German switching, verify all affected locale values programmatically and at least the reported language in the browser.

## Raw-key diagnosis

Check in this order:

1. Does the requested key resolve through the nested object used by ngx-translate?
2. Is it present and non-empty in all three locales?
3. Did it accidentally land in a legacy top-level dotted entry while the root is also a nested object?
4. Does the served locale response contain the key in the correct structure?
5. Does a fresh browser context still render the raw key?
6. Only after structural checks pass, investigate version/cache behavior. The loader uses `APP_VERSION`; do not label a structural error as cache staleness.

## Completion gate

Report completion only when locale structure validation, JSON parsing, Angular build, and a rendered-text assertion pass. Mention any unrelated pre-existing test failures separately.
