---
name: reticle
description: Verify a change against the running app, from inside it, before calling it done.
---

Reticle exposes the running app to you as `reticle_*` MCP tools. Look, act, observe, assert.

Only `reticle_act_and_wait` and `reticle_assert` produce a verdict. Everything else moves or
reads the app and proves nothing, so a drive that ends without one of those has no result however
many tools it used.

`verified: "unknown"` is not a pass: it means Reticle could not tell what happened.
`verified: "no-fault"` is not a pass either, because nothing was declared to prove. Never weaken a
check to make it pass.

The cheapest path that answers the question:

- "did my edit break anything?" -> `reticle_run({ tool: "reticle_verify", args: { action: "change", files: [...] } })`
- "does this known journey still work?" -> `reticle_run({ tool: "reticle_flow_replay", args: { flowName: "..." } })`
- "does this new behaviour work?" -> `reticle_act_sequence` for the setup, then ONE `reticle_act_and_wait`
