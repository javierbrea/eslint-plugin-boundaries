---
id: legacy-selectors
title: Legacy Selector Syntax
sidebar_label: Legacy Selectors
description: Documentation for legacy selector formats (string and tuple syntax) in ESLint Plugin Boundaries.
tags:
  - configuration
  - deprecated
keywords:
  - JS Boundaries
  - ESLint plugin
  - boundaries
  - legacy
  - selectors
  - deprecated
  - migration
---

# Legacy Selector Syntax

:::warning Deprecated
The selector formats documented on this page are **deprecated** and will be removed in a future major version. These formats still work but will show a deprecation warning in your console.

**We strongly recommend migrating to the modern [object-based selector syntax](../selectors.md).** See the [v5 to v6 migration guide](../../releases/migration-guides/v5-to-v6.md) for detailed migration instructions and examples.
:::

## Overview

Legacy selector formats were the original way to define element selectors in ESLint Plugin Boundaries. While these formats continue to work for backwards compatibility, they offer limited functionality compared to the modern object-based syntax.

## String Selector Format

**Format:** `<string>`

A simple [micromatch pattern](https://github.com/micromatch/micromatch) that matches against the element type.

```js
// Matches all helpers
"helpers"

// Matches helpers and components
"helpers|components"

// Matches any element type ending in "-component"
"*-component"
```

**Modern equivalent:**

```js
// Single type
{ type: "helpers" }

// Multiple types (using array of selectors)
[{ type: "helpers" }, { type: "components" }]

// Pattern matching
{ type: "*-component" }
```

## Tuple Selector Format

**Format:** `[<string>, <capturedValuesObject>]`

Matches when both the element type matches AND all specified captured properties match.

```js
// Match helpers with domain "users"
["helpers", { domain: "users" }]

// Match helpers with domain "users" or "admin"
["helpers", { domain: "users|admin" }]

// Match helpers where elementName starts with "parse"
["helpers", { elementName: "parse*" }]
```

**Modern equivalent:**

```js
// Single captured property
{ type: "helpers", captured: { domain: "users" } }

// Pattern in captured values
{ type: "helpers", captured: { domain: "users|admin" } }

// Multiple captured conditions
{ type: "helpers", captured: { elementName: "parse*" } }
```

## Array of Legacy Selectors

**Format:** `[<selector>, <selector>, ...]`

When an array of selectors is provided, it matches if ANY selector in the array matches (OR logic).

```js
// Matches helpers OR components
["helpers", "components"]

// Matches data helpers OR all components
[
  ["helpers", { domain: "users" }],
  "components"
]
```

**Modern equivalent:**

```js
// Object-based selectors with OR logic in a property
{ type: ["helpers", "components" ] }

// Array of object-based selectors with OR logic
[
  { type: "helpers", captured: { domain: "users" } },
  { type: "components" }
]
```

## Why Migrate?

The modern object-based selector syntax provides:

- ✅ **Better readability** - Object properties are self-documenting
- ✅ **Advanced features** - Access to properties like `origin`, `path`, `internalPath`, and more
- ✅ **OR logic for captured values** - Use arrays to match multiple captured value combinations
- ✅ **Type safety** - Better TypeScript support and IDE autocompletion
- ✅ **Future-proof** - New features will only be added to object-based syntax

## Migration Guide

For comprehensive migration instructions and examples, see the **[v5 to v6 Migration Guide](../../releases/migration-guides/v5-to-v6.md)**.

## See Also

- [Object-Based Selectors](../selectors.md) - Modern selector documentation
- [v5 to v6 Migration Guide](../../releases/migration-guides/v5-to-v6.md) - Step-by-step migration instructions
- [Elements Configuration](../elements.md) - Understanding captured properties
