# Shared AI development environment

The read-only [Reserve diagnostics MCP](mcp/reserve-diagnostics/README.md) supports NFCReserve and AlpenReserve as independent projects, with explicit project/tenant selection and manual file comparison. Install its locked dependencies through setup; register it separately against each host's private profile using `scripts/register-reserve-mcp.py`. Existing project processes and client MCP settings are preserved.

Private baseline for mbair's Codex development on WSL, NAS and future VPS hosts. Source of truth: this Git repository, not a live shared NAS folder.

The package contains 60 user SKILL.md definitions in 55 top-level folders, with their scripts, references, assets and existing license files. It includes Angular, PrimeNG, Ouroboros, Reticle, review, testing and design workflows. Codex-owned `.system` skills come from Codex itself. Skill origins are recorded in `skill-sources.json`; external plugin IDs and observed versions are in `environment.json`.

## Install on Linux / WSL / NAS

Prerequisites: Git, Python 3.11+, Node 24.14.0 with npm 11.9.0, compiler/Python build tools for Graft, and account access to this private repository. Activate Node with your existing runtime manager. No root installer is run.

```bash
gh repo clone mbair/ai-dev-environment
cd ai-dev-environment
git checkout v0.1.1
bash scripts/setup.sh         # preview
bash scripts/setup.sh --apply
bash scripts/doctor.sh
```

Setup verifies SHA-256 integrity, installs the locked Codex/Graft npm toolchain in `tools/node_modules`, copies versioned skills into `${CODEX_HOME:-$HOME/.codex}/skills` with backups of differing originals, and registers the private marketplace through Codex's CLI. Unchanged skill folders are preserved. It does not replace `config.toml`, change system Node/GLIBC, install Docker, trust hooks, sign in, or change running project processes. Backups are under the destination Codex home's `environment-backups/<timestamp>/`; restore a skill by moving the backed-up folder back after removing the installed copy.

The default deployment uses direct skill copies. The same skills are available as `mbair-engineering@mbair-dev` through the private marketplace for plugin-based distribution. Choose one discovery method for a given skill; don't enable the bundled skill plugin in addition to direct copies. Existing duplicate user/legacy skill locations should be consolidated during a planned client restart.

For another client with plugin installation:

```bash
codex plugin marketplace add mbair/ai-dev-environment --ref v0.1.1
codex plugin add mbair-engineering@mbair-dev
```

The CLI above requires a version supporting these commands. The pinned one installed by setup is 0.159.2. Use `bash scripts/codex.sh -C /path/to/project` to launch it without changing your global Codex version or user-selected model.

## Windows Desktop

Run the installer in WSL and target the desktop skill folder explicitly if needed:

```bash
python3 scripts/environment.py install-skills \
  --dest /mnt/c/Users/YOUR_USER/.codex/skills --apply
```

Linux tools run inside WSL or through WSL wrappers, not as native Windows executables. The desktop app's bundled tools stay client-provided. Restart/reload clients after installing skills or MCPs; a running goal retains its current context. Account sign-in, service authorization and hook trust are machine-local.

## MCP and external plugins

`config/mcp.json` is the shared portable MCP baseline. On Linux/WSL/NAS, inspect and add only missing servers with:

```bash
python3 scripts/environment.py configure-mcp
python3 scripts/environment.py configure-mcp --apply
```

The command preserves all existing and explicitly disabled servers, backs up a config before adding entries, and refuses to inject Linux executables into a Windows config. For the desktop profile, keep the existing WSL wrappers or configure equivalent Windows/WSL wrappers explicitly. Preserve existing working MCP definitions. Configure missing entries with `codex mcp add` using the pinned package arguments in that file; start Codex from the target repository so graph tools inspect the right project. Reticle always runs via npx. `codebase-memory-mcp` 0.8.1 and `uv` 0.11.14 are external executables checked by doctor; this repository does not distribute their binaries. Provision the appropriate upstream build on each platform.

Remote/account plugin versions in `environment.json` record the audited baseline. Account-managed updates may change them; doctor reports a mismatch instead of pretending those packages can be locked locally. PrimeNG's source marketplace is `https://github.com/primefaces/primeui-plugins.git`. Do not copy plugin caches, login state, token files or sessions between machines.

NAS uses `DOCKER_HOST=tcp://127.0.0.1:2375` for the approved separate test daemon. This profile must not select the NAS host Docker socket. The NAS worker currently uses GPT-6-Luna by user choice; shared tools don't imply identical quality across models.

Doctor distinguishes matching executables/skills/plugins, configured MCPs and a reachable Docker daemon. It reports gaps and exits nonzero. MCP configuration is not a protocol handshake; a handshake is not a browser/app verdict. Real repository tests and Reticle assertions are still required for application changes.

## Update and verify

Keep a released version checked out during long-running goals. To update, fetch and checkout a reviewed release, preview setup, apply and run doctor. Schedule client reload after current work finishes; don't automatically modify a running goal's toolchain.

```bash
python3 -m unittest discover -s tests
python3 scripts/environment.py verify
```

SHA-256 locks detect drift; they don't establish publisher authenticity. Only install a trusted repository commit. Maintainers intentionally regenerate `skills.lock.json` after reviewed skill changes using `write_lock` in `scripts/environment.py`, then run tests and verification and create a new release tag.

Upstream docs: [skills](https://learn.chatgpt.com/docs/build-skills), [private plugin marketplaces](https://developers.openai.com/plugins/build/plugins).

PrimeNG MCP 22.1.2 is installed in the locked tool prefix and can run as `primeng-mcp` without an npx download at client startup. Use the shared launcher PATH. Large Angular dev builds on the NAS use `NODE_OPTIONS=--max-old-space-size=4096`; this does not reserve 4 GB for every process.

## Evidence before development completion claims

`verification-before-completion` from [obra/superpowers](https://github.com/obra/superpowers/tree/8ca22dba9a94f28898bbce59f2537ff4d87c747d/skills/verification-before-completion) requires fresh verification evidence before claiming that work is complete, a bug is fixed, tests pass, or a build succeeds. It is discoverable for these development tasks and can be invoked explicitly as `$verification-before-completion`. It does not establish factual accuracy for arbitrary answers, and its effectiveness in this environment has not been benchmarked. The original skill is preserved unchanged with its MIT license; its upstream commit and entrypoint hash are recorded in `skill-sources.json`.

## Debugging and review feedback

- `$diagnosing-bugs` from `mattpocock/skills` builds a reproducible signal for hard bugs and performance regressions, tests competing hypotheses, and verifies the fix against the original scenario. Its human-in-the-loop template is retained for cases requiring manual reproduction.
- `$receiving-code-review` from `obra/superpowers` checks review suggestions against actual codebase behavior and existing decisions before implementing them.

Both are discoverable when their described tasks arise. Original instructions and resources are retained with MIT licenses and pinned provenance in `skill-sources.json`. Installation does not execute the diagnostic template or change project code. Repository instructions, user authorization, and host execution policies continue to take precedence over imported workflow examples.

## Property-based testing

`$property-based-testing` from Trail of Bits helps select meaningful invariants, generate constrained inputs, review weak or vacuous tests, and classify minimized failing inputs. It supports JavaScript/TypeScript through fast-check as well as other languages. The skill is installed as guidance only; no application dependencies are added. The original resources, attribution and CC-BY-SA-4.0 license are preserved. The sole Codex adaptation removes the Claude-specific `effort: low` field; the original entrypoint is in `UPSTREAM-SKILL.md`, and both entrypoint hashes are recorded in `skill-sources.json`. Upstream model-specific eval reports are retained as upstream documentation, not as evidence of local Codex effectiveness.

## Building MCP integrations

`$mcp-builder` from Anthropic provides guidance for custom TypeScript or Python MCP servers, tool schemas, pagination, transport selection, testing and evaluations. The complete upstream skill, references, helper scripts and Apache-2.0 license are retained unchanged at a pinned commit. Installation adds guidance only and does not configure or start an MCP server. The optional evaluation harness uses the Anthropic API and requires separate dependencies, credentials and authorized execution; it was not run during installation. Use current protocol and SDK documentation as the skill instructs, rather than treating its SDK or model examples as current version pins.
