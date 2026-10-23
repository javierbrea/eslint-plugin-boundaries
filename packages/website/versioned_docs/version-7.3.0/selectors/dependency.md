---
id: dependency
title: Dependency Selector
sidebar_label: Dependency
description: Match dependency metadata — import kind, element relationship, specifiers, and source — in eslint-plugin-boundaries.
tags:
  - concepts
  - configuration
keywords:
  - eslint-plugin-boundaries
  - JavaScript
  - TypeScript
  - dependency selector
  - dependency metadata
  - kind
  - relationship
  - specifiers
  - nodeKind
  - source
---

# Dependency Selector

The **dependency metadata selector** matches [metadata about the dependency itself](../classification/dependency.md#dependency-metadata-description) — the import kind, the relationship between importer and imported elements, the imported specifiers, and so on. It is the `dependency` key of a [dependency selector](./selectors.md#dependency-selectors):

```js
{ dependency: { /* dependency metadata selector */ } }
```

All conditions inside the selector are combined with **AND**; arrays act as **OR**.

## Properties

- **`kind`** — Matches the dependency kind: `"value"`, `"type"`, or `"typeof"`. <small>(`<string | string[]>`)</small>
- **`relationship`** — Match the relationship between both elements. <small>(`<object>`)</small>
  - **`from`** — The relationship from the importer's perspective. <small>(`<string | string[]>`)</small>
  - **`to`** — The relationship from the imported element's perspective. <small>(`<string | string[]>`)</small>
- **`specifiers`** — Matches the imported or exported specifier names. <small>(`<string | string[]>`)</small>
- **`nodeKind`** — Matches the [dependency node](../settings/settings.md#boundariesdependency-nodes) name that produced the dependency. <small>(`<string | string[]>`)</small>
- **`source`** — Matches the literal source string written in the `import`/`export` statement. <small>(`<string | string[]>`)</small>

Relationship values are: `internal`, `child`, `descendant`, `sibling`, `parent`, `uncle`, `nephew`, and `ancestor`. The `from` and `to` perspectives are inverses of each other (a `child` from one side is a `parent` from the other).

```js
// Match type-only dependencies to helpers
{
  to: { element: { type: "helper" } },
  dependency: { kind: "type" }
}

// Match dependencies whose literal source matches "lodash/*"
{
  dependency: { source: "lodash/*" }
}

// Match dependencies to a descendant element
{
  dependency: { relationship: { to: "descendant" } }
}
```

:::warning[Deprecated]
The **`module`** property on a dependency metadata selector is deprecated. Use the [`module` sub-selector](./module.md) with **`source`** in `to` instead — for example `to: { module: { source: "react" } }`. Read the [Legacy Dependency Metadata Selector Syntax](./legacy/dependency.md) page for migration guidance.
:::

:::info
**All selector properties are optional.** You can match on a single property, or combine several to target a more specific case. Remember that combined properties use AND logic — every one you specify must match.
:::

## Next Steps

- [Selectors](./selectors.md) — the entity/dependency model, array queries, captured values, and templating.
- [Policies](../policies/policies.mdx) — use `from`/`to`/`dependency` together with `allow`/`disallow`.
- [Classification → Dependency](../classification/dependency.md) — the runtime dependency metadata the plugin builds.
