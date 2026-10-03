# Shared environment maintenance

Preserve skill sources, resources and upstream licenses. Use `skill-sources.json` and `environment.json` to locate definitions before searching unrelated content. Verify skill integrity before installation; review and explicitly refresh locks after intentional changes. Keep tests for backup, config preservation, idempotency and integrity enforcement passing.

Do not put credentials, auth.json, SSH private keys, session databases, logs or full user config files in this repository. Do not automatically trust hooks or change a running goal's environment. Keep desktop-only capabilities and actual app verification separate from CLI installation checks. This is an environment repository; application-specific instructions stay in application repos.
