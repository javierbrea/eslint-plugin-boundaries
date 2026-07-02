---
id: modules
title: Modules
sidebar_label: Modules
description: Learn how ESLint Plugin Boundaries classifies the module each import resolves to — local, external, or core.
tags:
  - concepts
  - configuration
keywords:
  - eslint-plugin-boundaries
  - JavaScript
  - TypeScript
  - module origin
  - external dependencies
  - core modules
  - module source
  - internal path
  - flag as external
  - monorepo
---

# Modules

The **module** is the third classification layer of the [entity](./classification.md). It describes **what each import resolves to** — your own project, an installed package, or a Node.js built-in.

Unlike [elements](./elements.md) and [files](./files.md), there are **no descriptors to configure** for modules. The plugin derives the module description automatically from the import source and how it resolves on disk. An import such as `import sort from "./utils/sort.js"` resolves to a local module; `import React from "react"` resolves to an external one.

This layer is what lets you write rule policies about dependencies on packages and built-ins — where there is no local file, and therefore no element or file, to match.

## Module Origins

Every import is classified into one of three origins:

- **`local`** — your own project files. Example: `import sort from "./utils/sort.js"`.
- **`external`** — installed packages. Example: `import React from "react"`.
- **`core`** — Node.js built-ins. Example: `import path from "node:path"` (and the unprefixed `import path from "path"`).

The plugin decides the origin like this:

1. **`core`** when the import source resolves to a Node.js built-in module. The `node:` prefix is stripped before the check, so `node:path` and `path` are both `core`. Sub-paths of a built-in are still `core` (for example `node:fs/promises`).
2. **`external`** when the import is not a built-in but matches any of the [`boundaries/flag-as-external`](../settings/settings.md#boundariesflag-as-external) conditions. By default this covers:
   - imports resolved to a path inside `node_modules`;
   - non-relative imports that cannot be resolved (unresolvable aliases that look like a package or `@scope/...` name).
3. **`local`** in every other case — including relative imports and aliases that resolve to a file inside your project.

```js
import sort from "./utils/sort.js"; // origin: "local"
import React from "react";          // origin: "external"
import path from "node:path";       // origin: "core"
```

:::note
The plugin computes `origin` for each import from how that import resolves and from your settings, not from the package name alone. The defaults above are configurable — see [How settings influence origin](#how-settings-influence-origin).
:::

### Monorepo workspace imports

In a monorepo, imports of sibling workspace packages are a common edge case. Whether they count as `external` (a separate package) or `local` (part of the same boundary graph) depends on how they resolve and on your [`boundaries/flag-as-external`](../settings/settings.md#boundariesflag-as-external) and [`boundaries/root-path`](../settings/settings.md#boundariesroot-path) settings. The [Monorepo Setup guide](../guides/monorepo-setup.md) walks through the common configurations.

## Module Source and Internal Path

For `external` and `core` modules, the plugin splits the import source into two parts:

- **`source`** — the base package name.
- **`internalPath`** — the rest of the path inside that package, or `null` when the import has no sub-path.

Scoped packages keep their full `@scope/name` as the source. For example, `import Autocomplete from "@mui/material/Autocomplete"` produces:

```js
{ origin: "external", source: "@mui/material", internalPath: "Autocomplete" }
```

Unscoped packages use the first path segment as the source. For example, `import get from "lodash/get"` produces `source: "lodash"`, `internalPath: "get"`.

For **`local`** modules, both `source` and `internalPath` are `null` — there is no package to name. The local classification you care about lives in the [element](./elements.md) and [file](./files.md) layers instead.

## Module Description

When the plugin analyzes a dependency, the module description is available as `from.module` and `to.module`. It has three properties:

| Property | Type | Description |
| --- | --- | --- |
| `origin` | `"local" \| "external" \| "core"` | Where the module comes from. |
| `source` | `<string \| null>` | The base package name for `external`/`core` modules (for example `"react"`), or `null` for `local`. |
| `internalPath` | `<string \| null>` | The sub-path inside an `external`/`core` module (for example `"fp"` in `lodash/fp`), or `null`. |

The module description has no `isIgnored`, `isUnknown`, or `path` — it is always one of the three origins. See [Classification](./classification.md#dependency) for how `module` combines with `element` and `file` in a full dependency description.

## Matching Modules using Selectors

To target a dependency by its module, use the [`module` sub-selector](../selectors/module.md) inside a policy's `to`:

```js
// Match imports of the "react" package
{ to: { module: { origin: "external", source: "react" } } }
```

This is the right way to write policies about packages and built-ins, where there is no local element to match. See [Module Selectors](../selectors/module.md) for the full `module` selector reference.

## Replacing the Deprecated External Rule

The module layer replaces the patterns from the deprecated [`boundaries/external`](../rules/external.mdx) rule. Instead of a separate rule for package imports, match the module directly in `boundaries/dependencies`:

```js
// Forbid helpers from importing the "react" package
{
  from: { element: { type: "helper" } },
  disallow: { to: { module: { origin: ["external", "core"], source: "react" } } }
}
```

It also replaces the deprecated `dependency.module` metadata selector — use `to.module.source` instead. See the [v6 to v7 migration guide](../releases/migration-guides/v6-to-v7.mdx) for the full mapping.

## How Settings Influence Origin

Two settings change how the plugin assigns an origin. Their schemas live in the [Settings reference](../settings/settings.md); this layer only describes their effect:

- **[`boundaries/flag-as-external`](../settings/settings.md#boundariesflag-as-external)** — controls which imports become `external`. Adjust it to treat `node_modules`, unresolvable aliases, paths outside the root, or custom source patterns as external.
- **[`boundaries/root-path`](../settings/settings.md#boundariesroot-path)** — defines the project root. It affects the `outsideRootPath` condition of `flag-as-external` and how resolved paths are compared.

```js
import { resolve } from "node:path";

export default [{
  settings: {
    "boundaries/root-path": resolve(import.meta.dirname),
    "boundaries/flag-as-external": {
      customSourcePatterns: ["@my-org/*"] // Treat org packages as external
    }
  }
}]
```

:::tip
These settings are most useful in monorepos. See the [Monorepo Setup guide](../guides/monorepo-setup.md) for complete configurations.
:::

## Next Steps

- **[Selectors](../selectors/module.md)** - match modules, elements, and files in your policies.
- **[Policies](../policies/policies.mdx)** - write dependency policies that enforce your architecture.
- **[Settings](../settings/settings.md#boundariesflag-as-external)** - configure `flag-as-external` and `root-path`.
- **[Monorepo Setup](../guides/monorepo-setup.md)** - classify workspace imports as local or external.
- **[Classification](./classification.md)** - how element, file, and module combine into one entity.
