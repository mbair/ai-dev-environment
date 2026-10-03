# Baseline verification — 2026-10-03

- 54 user skill definitions in 49 top-level folders; 221 locked plugin files.
- WSL and NAS: locked npm install completed, checksum verification passed, actual user-skill installation completed, private marketplace registered.
- Behavioral tests: 6/6 passed on WSL and NAS after observing failing tests before implementation. Cases cover changed/added/deleted resources, backups, idempotence, unrelated config preservation and configured/disabled MCP preservation.
- WSL and NAS doctor: 70/70 entries in expected states. Exact versions for Node/npm/Codex/Graft/codebase-memory/uv, skill resource matches, enabled plugin versions, configured MCP names and a reachable Docker daemon were checked. Doctor does not test every provider/plugin action or app flow.
- New skill plugin discovered through `codex plugin list --available --marketplace mbair-dev --json`; direct copies remain the selected deployment method.
- Secret-pattern and file-name scan passed before publication. No auth state, private keys, sessions, full config files or plugin caches were imported.
- Windows desktop skill destination received the same user skills. Native desktop tools/MCP wrappers are distinct from Linux CLI; no blanket parity claim.
- Imported skill content is preserved byte-for-byte (including original line endings and whitespace); authored files receive a separate git whitespace check. Git attributes prevent checkout line-ending changes to the checksum-locked plugin sources.
- No application source changed for this setup. Reticle UI verification is skipped for environment/config work; the NAS application's tests continue independently.

The previous 20-skill comparison covered Windows and .agents trees but missed the separate WSL .codex/skills collection. This baseline includes those 39 additional definitions, excluding five Codex-owned system skills. Existing clients must reload to discover added skills; the running NAS goal was not restarted by this setup.

## NAS activation 0.1.1

The active development goal was explicitly paused by the user. Its background E2E processes and owned disposable MySQL/Mailpit resources were stopped. The Codex client was restarted with the shared tool prefix, its reviewed four Graft lifecycle hooks were trusted through the native review UI, and the newly imported Angular skills were visible in the native skill picker.

PrimeNG had failed MCP initialization through the plugin's startup npx call. Installing @primeng/mcp 22.1.2 in the locked prefix and selecting its direct binary with an explicit startup timeout resolved native Codex startup; no warning remained and the server ran as a child of that client. The portable Ouroboros reference was corrected to `mcp serve` with its actual runtime/backend environment variables.

An actual Chromium/Reticle check of the local /auth/login form passed: the submit button was disabled before inputs, and filling synthetic email/password enabled it through reticle_act_and_wait (`verified: yes`). No sign-in request was submitted. The reportingBriefing store was visible. This narrow DOM verdict had partial coverage (four closed shadow roots); it does not establish Event Director acceptance or backend authentication correctness. Reticle's tracked intent/impact evidence updated, while application source edits were preserved.

The Angular dev server hit Node's default ~2 GB heap ceiling on its first startup. A 4096 MB heap cap allowed it to compile; the NAS runtime profile now supplies that cap. The verification browser/server were closed afterward, and the goal remains paused.
