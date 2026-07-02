---
id: dependency
title: Dependency Metadata
sidebar_label: Dependency
description: Learn how ESLint Plugin Boundaries describes the dependency metadata of each import — kind, relationship, specifiers, node kind, and source.
tags:
  - concepts
  - configuration
keywords:
  - eslint-plugin-boundaries
  - JavaScript
  - TypeScript
  - dependency metadata
  - dependency description
  - kind
  - relationship
  - specifiers
  - nodeKind
  - source
---

# Dependency Metadata

The **dependency metadata** is the layer that describes the relationship itself, on top of the two [entities](./classification.md#entity) it connects. While `from` and `to` answer *what are the two files involved?*, the dependency metadata answers *what is this dependency?* — is it a type-only import, what is the structural relationship between the two elements, which specifiers does it bring in.

Unlike [elements](./elements.md) and [files](./files.md), there are **no descriptors to configure** for the dependency metadata. The plugin computes it automatically from the import: from the AST node that produced the dependency, the literal source string, and the relative position of the two elements.

This is the layer that lets you write rules about the *nature* of an import — for example, allowing a type-only dependency where a value dependency would be forbidden, or restricting imports to a `child` element.

## Dependency Metadata Description

When the plugin analyzes a dependency, the dependency metadata is available as `dependency`, alongside the `from` and `to` entities. It has the following properties:

| Property | Type | Description |
| --- | --- | --- |
| `source` | `<string>` | The source string of the dependency as written in the code (for example `"../helpers/data"` or `"react"`). |
| `kind` | `<"value" \| "type" \| "typeof">` | The dependency kind. A regular import is a `value`; a TypeScript `import type` is a `type`; an `import typeof` is a `typeof`. |
| `nodeKind` | `<string \| null>` | The `name` of the AST dependency node that produced it (see [`boundaries/additional-dependency-nodes`](../settings/settings.md#boundariesadditional-dependency-nodes)), or `null`. |
| `specifiers` | `<array \| null>` | The imported or exported specifier names, or `null` when there are none. |
| `relationship.from` | `<string \| null>` | The relationship from the importer's perspective. One of `"internal"`, `"child"`, `"descendant"`, `"sibling"`, `"parent"`, `"uncle"`, `"nephew"`, `"ancestor"`. It is `null` when the target is not a known local element (for example an external package). |
| `relationship.to` | `<string \| null>` | The relationship from the imported element's perspective, the inverse of `relationship.from`. |

## Element Relationship

When both sides of a dependency are known local elements, the plugin computes the structural **relationship** between them from their positions in the element hierarchy. The `from` and `to` perspectives are inverses of each other — a `child` seen from one side is a `parent` seen from the other:

| `relationship.from` | `relationship.to` | Meaning |
| --- | --- | --- |
| `internal` | `internal` | Both files belong to the same element. |
| `child` | `parent` | The target is a direct child of the importer. |
| `descendant` | `ancestor` | The target is nested deeper inside the importer. |
| `sibling` | `sibling` | Both elements share the same parent. |
| `uncle` | `nephew` | The target is a sibling of one of the importer's ancestors. |

When the target is not a known local element (for example an external package or an unknown file), both `relationship.from` and `relationship.to` are `null`.

## Matching Dependency Metadata using Selectors

To target a dependency by its metadata, use the [`dependency` selector](../selectors/dependency.md) inside a rule, alongside the `from` and `to` entity selectors:

```js
// Match type-only dependencies to helpers
{
  to: { element: { type: "helper" } },
  dependency: { kind: "type" }
}

// Match dependencies to a descendant element
{
  dependency: { relationship: { to: "descendant" } }
}
```

See [Selectors → Dependency](../selectors/dependency.md) for the full dependency metadata selector reference.

## Next Steps

- **[Selectors → Dependency](../selectors/dependency.md)** - match dependency metadata in your rules.
- **[Policies](../policies/policies.mdx)** - use `from`/`to`/`dependency` together with `allow`/`disallow`.
- **[Settings](../settings/settings.md#boundariesadditional-dependency-nodes)** - configure which AST nodes produce dependencies.
- **[Classification](./classification.md)** - how the dependency metadata combines two entities into one dependency description.
