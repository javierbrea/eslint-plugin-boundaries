---
id: legacy-selectors
title: Legacy Selector Syntax
sidebar_label: Legacy Selectors
description: Documentation for legacy selector formats (string and tuple syntax) in ESLint Plugin Boundaries.
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
  - object-based selectors
---

# Legacy Selector Syntax

:::warning Deprecated
The selector formats documented on this page are **deprecated** and will be removed in a future major version. These formats still work but will show a deprecation warning in your console.

**We strongly recommend migrating to the modern [object-based selector syntax](../selectors.md).** See the [v5 to v6 migration guide](../../releases/migration-guides/v5-to-v6.mdx) for detailed migration instructions and examples.
:::

## Overview

Legacy selector formats were the original way to define element selectors in ESLint Plugin Boundaries. While these formats continue to work for backwards compatibility, they offer limited functionality compared to the modern object-based syntax.

## String Selector Format

**Format:** `<string>`

A simple [micromatch pattern](https://github.com/micromatch/micromatch) that matches against the element type.

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
// Single type
{ type: "helper" }

// Multiple types (using array of selectors)
[{ type: "helper" }, { type: "component" }]

// Pattern matching
{ type: "*-component" }
```

## Tuple Selector Format

**Format:** `[<string>, <capturedValuesObject>]`

Matches when both the element type matches AND all specified captured properties match.

```js
// Match helpers with domain "users"
["helper", { domain: "users" }]

// Match helpers with domain "users" or "admin"
["helper", { domain: "users|admin" }]

// Match helpers where elementName starts with "parse"
["helper", { elementName: "parse*" }]
```

**Modern equivalent:**

```js
// Single captured property
{ type: "helper", captured: { domain: "users" } }

// Pattern in captured values
{ type: "helper", captured: { domain: "users|admin" } }

// Multiple captured conditions
{ type: "helper", captured: { elementName: "parse*" } }
```

## Array of Legacy Selectors

**Format:** `[<selector>, <selector>, ...]`

When an array of selectors is provided, it matches if ANY selector in the array matches (OR logic).

```js
// Matches helper OR component
["helper", "component"]

// Matches data helper OR all component
[
  ["helper", { domain: "users" }],
  "component"
]
```

**Modern equivalent:**

```js
// Object-based selectors with OR logic in a property
{ type: ["helper", "component" ] }

// Array of object-based selectors with OR logic
[
  { type: "helper", captured: { domain: "users" } },
  { type: "component" }
]
```

## Why Migrate?

The modern object-based selector syntax provides:

- ✅ **Better readability** - Object properties are self-documenting
- ✅ **Advanced features** - Access to properties like `origin`, `path`, `internalPath`, and more
- ✅ **Type safety** - Better TypeScript support and IDE autocompletion
- ✅ **Future-proof** - New features will only be added to object-based syntax

## Migration Guide

For comprehensive migration instructions and examples, see the **[v5 to v6 Migration Guide](../../releases/migration-guides/v5-to-v6.mdx)**.

## See Also

- [Object-Based Selectors](../selectors.md) - Modern selector documentation
- [v5 to v6 Migration Guide](../../releases/migration-guides/v5-to-v6.mdx) - Step-by-step migration instructions
- [Elements Configuration](../elements.md) - Understanding captured properties
