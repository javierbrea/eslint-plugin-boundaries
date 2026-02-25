---
id: selectors
title: Element Selectors
sidebar_label: Selectors
description: Use element selectors to match elements when defining architectural boundaries in ESLint Plugin Boundaries.
tags:
  - concepts
  - configuration
keywords:
  - JS Boundaries
  - ESLint plugin
  - boundaries
  - javaScript
  - typeScript
  - setup
  - configuration
  - rules
  - element selectors
  - selectors
  - templates
---

# Selectors

Element selectors are used in rules configuration to match **[specific elements](./elements.md)** based on their type and captured properties. They provide a flexible way to define which elements a rule should apply to.

## Element Selector Formats

### Object Selector (Recommended)

**Format:** `{ type: <string>, captured: <object>, ... }`

The new object-based syntax provides a clear and extensible way to define selectors.

- **`type`** (`string`): A [micromatch pattern](https://github.com/micromatch/micromatch) that matches against the element type.
- **`captured`** (`object`): An object where keys are property names from the element's `capture` or `baseCapture` configuration, and values are [micromatch patterns](https://github.com/micromatch/micromatch) to match against captured values.

```js
// Matches all helpers
{ type: "helpers" }

// Matches helpers and components
{ type: "helpers|components" }

// Matches only helpers with category "data" and elementName "parsers"
{
  type: "helpers",
  captured: {
    category: "data",
    elementName: "parsers"
  }
}
```

### Dependency Properties (Dependency Selectors Only)

When selecting dependencies (e.g., in `allow` or `disallow` lists), you can also filter by properties of the import statement itself:

- **`kind`** (`string`): Matches the kind of the dependency (e.g., "value", "type").
- **`specifiers`** (`string[]`): Array of [micromatch patterns](https://github.com/micromatch/micromatch) to match against the imported names (specifiers).
- **`nodeKind`** (`string`): Matches the kind of the dependency node (e.g., "import", "require", "export").

```js
// Matches import of "HelperA" from helpers
{
  type: "helpers",
  specifiers: ["HelperA"]
}

// Matches only "import" statements (excludes "require", "export", etc.)
{
  type: "helpers",
  nodeKind: "import"
}

// Matches only type imports
{
  type: "helpers",
  kind: "type"
}
```

### Simple Type Selector (Deprecated)

**Format:** `<string>`

> **Warning:** This syntax is deprecated. Use `{ type: "type" }` instead.

A [micromatch pattern](https://github.com/micromatch/micromatch) that matches against the element type.

```js
// Matches all helpers
"helpers"
```

### Type with Captured Properties (Deprecated)

**Format:** `[<string>, <capturedValuesObject>]`

> **Warning:** This syntax is deprecated. Use `{ type: "type", captured: { ... } }` instead.

Matches when both the element type matches AND all specified captured properties match.

```js
// Matches only helpers with category "data"
["helpers", { category: "data" }]
```

### Array of Selectors

**Format:** `[<selector>, <selector>, ...]`

When an array of selectors is provided, it matches if ANY selector in the array matches.

```js
// Matches helpers OR components
[
  { type: "helpers" },
  { type: "components" }
]
```

## Templating in Selectors

Selectors support templating to create dynamic rules based on **[captured properties from other elements](./elements.md#capture-optional)**

**Template Format:** `${from.property}` or `${target.property}`

- `${from.*}` - References properties from the file being analyzed (the importer)
- `${target.*}` - References properties from the dependency being imported

**Available properties:**
- `${from.capturedProperty}` / `${target.capturedProperty}` - Any captured property.

### Template Examples

```js
// Element descriptors
{
  type: "helpers",
  pattern: "helpers/*/*.js",
  capture: ["category", "elementName"]
}

// Rule using templates
{
  from: { type: "helpers" },
  disallow: [
    // Disallow importing helpers from different categories
    {
      type: "helpers",
      captured: { category: "!${from.category}" }
    }
  ]
}
```

**How it works:**

If a file `helpers/data/parser.js` (category: "data") tries to import from `helpers/api/fetcher.js` (category: "api"):

1. Template `${from.category}` resolves to `"data"`
2. Pattern becomes `{ type: "helpers", captured: { category: "!data" } }`
3. The target helper has category "api" → matches `"!data"`
4. Rule disallows the import

**More examples:**

```js
// Only allow importing helpers with the same elementName
{
  from: { type: "helpers" },
  allow: [
    {
      type: "helpers",
      captured: { elementName: "${from.elementName}" }
    }
  ]
}
```

## Selector Context

Selectors are used in different contexts within rules configuration:

- **`from` / `target`** - Specifies which element the rule applies to
- **`allow` / `disallow`** - Specifies which elements are allowed or disallowed

The exact usage depends on the specific rule. See [Rules Configuration](./rules.md) for details.
