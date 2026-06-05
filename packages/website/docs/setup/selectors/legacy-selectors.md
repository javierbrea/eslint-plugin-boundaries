---
id: legacy-selectors
title: Legacy Selector Syntax
sidebar_label: Legacy Selectors
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

# Legacy Selector Syntax

:::warning Deprecated
The string and tuple selector formats on this page are kept for backward compatibility but are deprecated and will be removed in a future major version. Use the [object-based selector syntax](../selectors.md) instead.
:::

These formats keep working without changes. A runtime console warning for string and tuple selectors is planned but is not yet emitted, so existing configurations run silently. When you are ready to migrate, the [v6 to v7 migration guide](../../releases/migration-guides/v6-to-v7.mdx) covers the full transition, including the [entity selector](../selectors.md#entity-selectors) form.

## Overview

String and tuple selectors were the original way to match elements. They still work, but they can only match an element type and its captured values. The modern [object-based selectors](../selectors.md) — and especially the [entity selector](../selectors.md#entity-selectors) form — can also match a file's categories, a module's origin, and more.

## String selector format

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

:::tip Why the `element` wrapper
Wrapping the type in an `element` sub-selector turns it into a full [entity selector](../selectors.md#entity-selectors). The flat form `{ type: "helper" }` still works and is converted internally, but only the entity form lets you also match [`file.categories`](../selectors.md#file-sub-selector) and [`module.origin`/`module.source`](../selectors.md#module-sub-selector).
:::

## Tuple selector format

**Format:** `[<string>, <capturedValuesObject>]`

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

## Array of legacy selectors

When you provide an array of selectors, it matches if **any** selector in the array matches (OR logic).

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

:::note
Both forms above match a `helper` or a `component`. Use the type-array form (`type: ["helper", "component"]`) when the only difference is the type. Use an array of selectors when the alternatives also differ in other properties (for example, a different `captured` value per type), since each selector can carry its own conditions.
:::

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

## Why migrate?

The object-based and entity selector syntax gives you:

- **Self-documenting selectors** — Object properties read clearly, especially in long rule lists.
- **Entity matching** — Wrap element properties in `{ element: { ... } }` to also match [`file.categories`](../selectors.md#file-sub-selector) (file descriptors) and [`module.origin`/`module.source`](../selectors.md#module-sub-selector) (external and local module origin). These are only reachable through entity selectors.
- **Richer element matching** — Object selectors support `element.type`, `element.path`, `element.fileInternalPath`, `element.captured`, `element.parent`, and the `isIgnored`/`isUnknown` flags.
- **Type safety** — Better TypeScript support and editor autocompletion.
- **Future features** — New capabilities are added to the object-based syntax only.

## Migration guide

For step-by-step migration instructions and examples, see the [v6 to v7 migration guide](../../releases/migration-guides/v6-to-v7.mdx). If you are migrating from an earlier version, the [v5 to v6 migration guide](../../releases/migration-guides/v5-to-v6.mdx) covers the original move from string and tuple selectors to object selectors.

## See Also

- [Selectors](../selectors.md) — modern object-based and entity selector reference.
- [Rules](../rules.mdx) — where selectors are used in `from`/`to`/`dependency`.
- [Settings](../settings.md) — configure `boundaries/files`, `boundaries/elements-single-type`, and `boundaries/legacy-templates`.
- [Elements](../elements.md) — element descriptors and captured values.
- [v6 to v7 Migration Guide](../../releases/migration-guides/v6-to-v7.mdx) — full migration instructions.
