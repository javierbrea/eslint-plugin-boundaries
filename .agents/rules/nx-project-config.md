---
paths:
  - "**/project.json"
  - "nx.json"
---

# Nx project configuration

`project.json` and `nx.json` are parsed as **jsonc** — comments are allowed and already used in `nx.json` to explain `namedInputs`.

Target names are standardized across every project (the list is in the root `AGENTS.md`, "Commands"); `nx.json`'s `targetDefaults` define the common `dependsOn`/`inputs`/`outputs` for each. A project only needs to redeclare a target in its own `project.json` when it diverges from the default — e.g. `eslint-plugin` adds `lint: dependsOn: [eslint:config, build]` because it lints itself with the plugin it builds, and `eslint-plugin-e2e` overrides `build`'s `outputs` for its generated configs.

Configure `dependsOn`, `inputs`, and `outputs` so Nx keeps or invalidates its cache correctly, both locally and in CI. When adding or changing a target, check that its `inputs` cover everything that should invalidate the cache and its `outputs` cover everything the task produces — an incomplete `outputs` list means a "successful" cached run silently omits files a downstream target depends on.

Every project also declares `implicitDependencies` for the shared configs it relies on but doesn't import in code (`eslint-config`, `cspell-config`) — keep this list in sync with which shared config the project actually consumes.
