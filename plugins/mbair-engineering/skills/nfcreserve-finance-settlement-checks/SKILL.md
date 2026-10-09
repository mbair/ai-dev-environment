---
name: nfcreserve-finance-settlement-checks
description: Use when changing or debugging NFC Reserve settlement calculations, IFA, payer allocations, overrides, payment totals, or settlement exports.
---

# NFC Reserve Finance Settlement Checks

Protect financial meaning across the full settlement path, not only the edited control.

## Before changing code

- Inspect the current worktree and preserve unrelated edits.
- Use the repository code graph to locate the source of truth and trace callers before reading implementation details.
- Write down the expected arithmetic using the same units as the code. Distinguish HUF from minor units, gross from net, automatic amount from approved amount, and gross charge from post-payment balance.
- Trace the complete path that applies to the change: source calculation → UI draft → displayed line and document totals → readiness/validation → serialized override → backend validation/persistence → rebuilt snapshot/export.
- Confirm which values are canonical and which are derived. A changed child allocation must preserve all unchanged allocations; a total must reconcile to its allocations wherever the contract requires it.

## Regression proof

- Add the smallest test at the seam that reproduces the user's exact scenario before changing production code. Include existing values for untouched rows and assert the expected total after editing one row.
- For an editable settlement, assert both the displayed/effective total and the complete outgoing command, including every payer allocation and its sum. A passing setter-only assertion is insufficient when saving serializes separate data.
- Run the test against the old behavior and confirm the expected failure; then implement the smallest fix and confirm it passes.
- If a frontend change crosses an API contract, inspect and test the backend validator/persistence path too. Do not claim persistence from a component test or mocked browser.

## Before handoff

- Reconcile the original and edited arithmetic explicitly; include the changed delta and confirm untouched amounts remain present.
- Run focused tests, then the relevant build and lint checks. For visible UI changes, exercise the actual browser flow and verify the displayed amount and save payload; keep browser/mock evidence distinct from persisted-data evidence.
- Run `git diff --check`, review the final diff for unrelated edits, and check locale, print, or export paths when the change reaches them.
- Report the exact invariant checked, the evidence run, and any check not performed. Do not claim broader coverage than the evidence supports.
