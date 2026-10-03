# Baseline 0.1.0

Goal: reproducible user-level engineering skills, tool versions, plugin inventory and a private Git-backed catalog across WSL, NAS and later VPS.

Sources: WSL user skills, Windows user skills excluding Codex-owned .system, and user .agents skills. Keep original resources and licenses. Repo-specific AGENTS.md/.ai stay in their source repositories.

Acceptance: locked skill integrity; all 54 user skill definitions and resources included; tampered, added or removed resources rejected; skill update backs up differing originals; idempotent update; unrelated config unchanged; actual setup on WSL/NAS; GitHub private visibility and pushed commit verified.

Challenge: headless CLI cannot provide desktop-only capabilities; external plugin account versions are observations, not immutable software pins; credentials and hook approvals remain host-local. Copying files cannot establish app/provider verification. Keep running goals and project work intact, stage new files without restarting them. Skip automatic overwriting of global config, auth state and system packages. Snapshot pinning and manual updates avoid silent changes mid-goal.

Validation: Python behavioral tests, checksum verification, actual isolated npm installation, Codex CLI marketplace discovery, direct skill install/doctor, private GitHub readback. No Reticle UI verification applies to this environment/config-only repository; NAS application's browser verification continues independently.
