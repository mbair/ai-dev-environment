# Reserve diagnostics MCP

Read-only stdio MCP for **two independent projects**, NFCReserve and AlpenReserve.
The shared implementation belongs to `ai-dev-environment`; project roots, development
origins, tenant hosts and authentication remain host-local. Feature transfers are
manual, in either direction. No project is the default or a fallback for the other.

NFCReserve's backend and frontend are separate Git repositories under its source
root. AlpenReserve is a monorepo. The `repositories` map describes these separately
from the `areas` used for counterpart file comparisons. Project status returns
one entry per configured Git repository, without merging their histories.

## Tools

| Tool | Purpose |
| --- | --- |
| `reserve_list_projects` | Discover checkout availability and configured scopes. |
| `reserve_project_status` | Explicit project's Git HEAD, branch and dirty counts. |
| `reserve_api_health` | AlpenReserve `/api/healthz` process health only. |
| `reserve_channel_sync` | Recent synchronization counts and sanitized records for an explicit project, scope and channel ID. |
| `reserve_compare_files` | Hash up to 32 counterpart source files in explicitly selected projects and source area. |

All tools carry read-only annotations. All results identify their project(s),
scope where relevant, observation time and evidence source/coverage. No SQL,
shell execution, arbitrary URL fetching, deployments, worker restarts, writes or
automatic feature transfers are exposed. Git is invoked using fixed argument
lists with inherited `GIT_*` overrides removed.

Finance settlement inspection, Docker/NAS administration, worker liveness and
log search are **not implemented in this first version**. Application-specific
diagnostics require independently verified adapters and appropriately scoped
authorization. A successful process health check does not prove tenant routing,
database availability, worker health or completed synchronization.

## Install and register

Use the host's existing Node 24 runtime; dependencies are pinned in package-lock.json.

```bash
npm ci --prefix mcp/reserve-diagnostics --no-audit --no-fund
npm test --prefix mcp/reserve-diagnostics
mkdir -p ~/.config/reserve-diagnostics
cp mcp/reserve-diagnostics/config.example.json ~/.config/reserve-diagnostics/config.json
chmod 600 ~/.config/reserve-diagnostics/config.json
# Edit each root to the actual, separate checkout on this host.
python3 scripts/register-reserve-mcp.py \
  --node /absolute/path/to/node \
  --config ~/.config/reserve-diagnostics/config.json --apply
```

Registration validates the private config, appends only the new MCP definition,
backs up existing client settings, and preserves existing/disabled definitions.
Restart/reload the client after its current work finishes. Running sessions are
not restarted. Configuration alone does not establish a protocol handshake.

For Windows Desktop, run the same registration script inside WSL with
`--codex-home /mnt/c/Users/YOUR_USER/.codex --wsl-distribution YOUR_DISTRO`.
The generated wrapper launches Node and reads the private profile inside that
specific WSL distribution. Windows Desktop and WSL share that profile; the NAS
has its own profile. Do not copy credentials between hosts.

If a checkout is absent on the NAS, leave its own expected path configured.
The MCP reports `PROJECT_UNAVAILABLE` instead of reading the other project.

## API scopes

Empty `scopes` are valid: Git status and comparisons work without API access.
Add only confirmed development endpoints. For example, inside AlpenReserve's
profile (values below are examples, not detected configuration):

```json
"scopes": {
  "hotel_dev": {
    "origin": "http://127.0.0.1:3001",
    "mode": "multi",
    "host": "hotel.alpen.localhost",
    "tokenEnv": "RESERVE_ALPENRESERVE_HOTEL_DEV_TOKEN"
  }
}
```

`origin` must be a loopback HTTP(S) origin with no credentials, query or path.
Use an SSH tunnel if necessary. `mode` records the configured routing mode;
multi mode requires `host`, which is sent as the HTTP Host header. The profile
does not independently attest the remote tenant identity. Every scope has a
unique origin/host pair and its own project-prefixed token environment variable.
Set tokens privately in the MCP process environment, never in this repository,
tool arguments or chat. If authentication is configured but missing, the
request fails before any network access. An unconfigured scope fails explicitly.

Only fixed GET routes are used. Redirects are refused, requests have a 5-second
timeout and responses are limited to 256 KiB. Channel records must match the
requested channel ID; only known statuses, kinds, counts and timestamps are
returned. Raw request/response payloads, user IDs and free-text errors are omitted.
Counts describe only the returned recent records, not the complete historical
backlog. API 401/403 responses are reported without exposing their response body.

NFCReserve has no verified general `/api/healthz` route. The health tool returns
`HEALTH_UNSUPPORTED` for that project, rather than borrowing AlpenReserve's route.
Both projects currently expose the verified channel sync-log GET route.

## Feature comparison

The profiles map their different backend and frontend layouts to source areas.
Choose corresponding relative paths explicitly, for example:

```json
{
  "source_project": "nfcreserve",
  "target_project": "alpenreserve",
  "area": "backend",
  "paths": ["routes/Channel.js", "controllers/channelController.js"]
}
```

The result reports identical/different/missing files and SHA-256 hashes. Different
hashes do not prove a feature is missing: tenant routing and other project-specific
implementations may differ intentionally. Comparison reads regular code,
template or stylesheet files up to 1 MiB; traversal, symlinks, configuration,
generated output and dependency directories are excluded. It does not inspect
secrets, return source contents or decide how to synchronize a feature.

## Validation

```bash
npm run check --prefix mcp/reserve-diagnostics
npm test --prefix mcp/reserve-diagnostics
python3 -m unittest discover -s tests
RESERVE_DIAGNOSTICS_CONFIG=~/.config/reserve-diagnostics/config.json \
  node mcp/reserve-diagnostics/smoke.mjs
```

The tests include actual SDK stdio initialization/tool calls, independent Git
fixtures, a mock HTTP server that checks the transmitted Host/token, missing
checkouts, redirects, bounded responses, sanitization and traversal rejection.
The smoke test reads the real checkouts and compares a known channel route;
missing NAS checkouts are expected errors, not successful project checks.
Tests do not claim live application/API integration or measured model accuracy.

`evaluation.xml` contains ten stable multi-tool evaluation questions for the
isolated `evaluation-fixture.mjs` server. Its temporary repositories and mock
APIs are unrelated to real project data. The test suite verifies every answer
key through actual MCP calls. This verifies the dataset, **not an LLM's accuracy**;
the optional upstream model-based evaluation harness has not been run.

SDK reference: [official first server guide](https://github.com/modelcontextprotocol/typescript-sdk/blob/main/docs/get-started/first-server.md).
