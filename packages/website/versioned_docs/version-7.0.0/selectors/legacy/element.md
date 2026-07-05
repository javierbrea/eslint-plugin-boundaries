---
id: element
title: Legacy Elements Selector Syntax
sidebar_label: Elements Selector
description: Reference for deprecated string and tuple selector formats in eslint-plugin-boundaries, with migration guidance to modern object-based and entity selectors.
tags:
  - configuration
  - deprecated
keywords:
  - eslint-plugin-boundaries
  - legacy
  - selectors
  - deprecated
  - migration
  - string selector
  - tuple selector
  - object selector
  - entity selector
  - file selector
  - module selector
---

# Legacy Elements Selector Syntax

These formats keep working without changes, but when a policy uses them the plugin emits a one-time runtime console warning encouraging migration to object-based selectors. When you are ready to migrate, the [v6 to v7 migration guide](../../releases/migration-guides/v6-to-v7.mdx) covers the full transition, including the [entity selector](../selectors.md#entity-selectors) form.

## String and tuple selectors

String and tuple selectors were the original way to match elements. They still work, but they can only match an element type and its captured values. The modern [object-based selectors](../selectors.md) — and especially the [entity selector](../selectors.md#entity-selectors) form — can also match a file's categories, a module's origin, and more.

### String selector format

**Format:** `<string>`

A [micromatch pattern](https://github.com/micromatch/micromatch) matched against the element type.

```js
// Matches all helpers
"helper"

// Matches helpers and components
"helper|component"

// Matches any element type ending in "-component"
"*-component"
```

**Modern equivalent:**

```js
// Entity selector (canonical form)
{ element: { type: "helper" } }

// Match multiple types with an array of selectors
[{ element: { type: "helper" } }, { element: { type: "component" } }]

// Pattern matching on the type
{ element: { type: "*-component" } }
```

### Tuple selector format

**Format:** `[<string>, <capturedValuesObject>]`

The first entry is a micromatch pattern matched against the element type. The second entry is an object of captured values to match.

Matches when both the element type matches **and** all the listed captured values match.

```js
// Match helpers captured in the "data" family
["helper", { family: "data" }]

// Match helpers in the "data" OR "permissions" family
["helper", { family: "data|permissions" }]

// Match helpers whose elementName starts with "parse"
["helper", { elementName: "parse*" }]
```

**Modern equivalent:**

```js
// Single captured property
{ element: { type: "helper", captured: { family: "data" } } }

// Micromatch pattern in a captured value
{ element: { type: "helper", captured: { family: "data|permissions" } } }

// Multiple captured conditions
{ element: { type: "helper", captured: { elementName: "parse*" } } }
```

### Array of strings

```js
// Matches helper OR component
["helper", "component"]
```

**Modern equivalent:**

```js
// OR within the type pattern
{ element: { type: ["helper", "component"] } }

// OR across selectors
[
  { element: { type: "helper" } },
  { element: { type: "component" } }
]
```

### Mixed array of strings and tuples

```js
// Match data helpers OR all components
[
  ["helper", { family: "data" }],
  "component"
]
```

**Modern equivalent:**

```js
[
  { element: { type: "helper", captured: { family: "data" } } },
  { element: { type: "component" } }
]
```

## Element selector properties

The following [element selector](../element.md) properties still work but are kept only for backward compatibility. They will be removed in a future major version.

### Category

The category property on element descriptors is deprecated, so the `category` property on element selectors is also deprecated. The replacement is a [file descriptor](../../classification/files.md) category matched through the `file` sub-selector. File descriptors let you assign multiple categories to different files within the same element.

| Deprecated | Replacement |
| --- | --- |
| `{ element: { category: "test" } }` | `{ file: { categories: "test" } }` |

### Origin

Module origin describes where an imported module comes from, so it now lives on the `module` sub-selector. The legacy form keeps working.

| Deprecated | Replacement |
| --- | --- |
| `{ element: { origin: "external" } }` | `{ module: { origin: "external" } }` |

### internalPath

The `internalPath` property on an element selector is deprecated. Use the [`module` sub-selector](../module.md) `internalPath` to match the path within an external or core module, or `fileInternalPath` to match the path within a local element.

| Deprecated | Replacement |
| --- | --- |
| `{ element: { internalPath: "index.js" } }` | `{ file: { fileInternalPath: "index.js" } }` |
| `{ element: { internalPath: "index.js" } }` | `{ module: { internalPath: "index.js" } }` |

### filePath

The `filePath` property on an element selector is deprecated. Use the [`module` sub-selector](../module.md) `internalPath` to match the path within an external or core module, or `fileInternalPath` to match the file internal path within a local element relative to the element root.

| Deprecated | Replacement |
| --- | --- |
| `{ element: { filePath: "index.js" } }` | `{ file: { fileInternalPath: "index.js" } }` |
| `{ element: { filePath: "index.js" } }` | `{ module: { internalPath: "index.js" } }` |

## Using element selectors as entity selectors

From v7, the `element` selector is a sub-selector of the [entity selector](../selectors.md#entity-selectors) syntax. But, for backward compatibility, the `element` selector can still be used as a top-level selector. The following two selectors are equivalent in places where an entity selector is expected, such as the `from` and `to` properties of a policy. The first form is deprecated and will be removed in a future major version.

```js
// Top-level element selector (deprecated)
{ type: "helper" }

// Entity selector (canonical form)
{ element: { type: "helper" } }
```

## Why migrate?

The object-based and entity selector syntax gives you:

- **Self-documenting selectors** — Object properties read clearly, especially in long policy lists.
- **Entity matching** — Wrap element properties in `{ element: { ... } }` to also match [`file.categories`](../file.md) (file descriptors) and [`module.origin`/`module.source`](../module.md) (external and local module origin). These are only reachable through entity selectors.
- **Richer element matching** — Object selectors support `element.type`, `element.path`, `element.fileInternalPath`, `element.captured`, `element.parent`, and the `isIgnored`/`isUnknown` flags.
- **Future features** — New capabilities are added to the object-based syntax only.

## Migration guide

For step-by-step migration instructions and examples, see the [v6 to v7 migration guide](../../releases/migration-guides/v6-to-v7.mdx). If you are migrating from an earlier version, the [v5 to v6 migration guide](../../releases/migration-guides/v5-to-v6.mdx) covers the original move from string and tuple selectors to object selectors.

## See Also

- [Selectors](../selectors.md) — modern object-based and entity selector reference.
- [Policies](../../policies/policies.mdx) — where selectors are used in `from`/`to`/`dependency`.
- [Settings](../../settings/settings.md) — configure `boundaries/files` and `boundaries/elements-single-type`.
- [Elements](../../classification/elements.md) — element descriptors and captured values.
- [v6 to v7 Migration Guide](../../releases/migration-guides/v6-to-v7.mdx) — full migration instructions.
