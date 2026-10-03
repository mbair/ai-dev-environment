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
