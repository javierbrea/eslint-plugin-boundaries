---
id: module
title: Module Selector
sidebar_label: Module
description: Match the resolved module an import points to — local, external, or core — in eslint-plugin-boundaries.
tags:
  - concepts
  - configuration
keywords:
  - eslint-plugin-boundaries
  - JavaScript
  - TypeScript
  - module selector
  - entity selector
  - origin
  - source
  - internalPath
  - external dependencies
---

# Module Selector

The **module sub-selector** matches the [resolved module an import points to](../classification/modules.md#module-description). It is the `module` key of an [entity selector](./selectors.md#entity-selectors):

```js
{ module: { /* module sub-selector */ } }
```

This is the right sub-selector for matching dependencies on external packages and Node.js core modules, where there is no local element to match. All conditions inside the selector are combined with **AND**; arrays act as **OR**.

## Properties

- **`origin`** — Where the module comes from: `"local"`, `"external"`, or `"core"`. Array = OR. <small>(`<string | string[] | null>`)</small>
- **`source`** — The base module name for external or core modules (for example `"react"`). `null` for local modules. <small>(`<string | string[] | null>`)</small>
- **`internalPath`** — The sub-path inside an external or core module (for example `fp` in `lodash/fp`). <small>(`<string | string[] | null>`)</small>

```js
// Match imports of the "react" package
{ module: { origin: "external", source: "react" } }

// Match any external OR core module
{ module: { origin: ["external", "core"] } }

// Match a sub-path of an external package
{ module: { source: "@mui/material", internalPath: "styles/**" } }

// Match local imports only
{ module: { origin: "local" } }
```

:::info
**All selector properties are optional.** You can match on a single property, or combine several to target a more specific case. Remember that combined properties use AND logic — every one you specify must match.
:::

## Using the Module Selector in Rule Policies

Read the [Selectors](../selectors/selectors.md) section to learn how to use the `module` sub-selector in a policy's `from` or `to` entity selector. See [Policies](../policies/policies.mdx) for how to combine entity selectors with `disallow` and `allow` to write a complete policy.

:::warning
By default the [`dependencies` rule](../rules/dependencies.md) only checks `local`-origin targets. To also enforce rules on `external` and `core` dependencies, enable its `checkAllOrigins` option.
:::

## Next Steps

- [Selectors](./selectors.md) — the entity/dependency model, array queries, captured values, and templating.
- [Element selector](./element.md) — match the element a file belongs to.
- [File selector](./file.md) — match files by category.
- [Modules](../classification/modules.md) — how the plugin classifies each import's origin, source, and internal path.
