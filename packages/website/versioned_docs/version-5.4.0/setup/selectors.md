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

Element selectors can be defined in a pair of formats, simple type matching or type with captured properties matching.

### Simple Type Selector

**Format:** `<string>`

A [micromatch pattern](https://github.com/micromatch/micromatch) that matches against the element type.

```js
// Matches all helpers
"helpers"

// Matches helpers and components
"helpers|components"

// Matches any element type ending in "component"
"*-component"
```

### Type with Captured Properties

**Format:** `[<string>, <capturedValuesObject>]`

Matches when both the element type matches AND all specified captured properties match.

The `<capturedValuesObject>` contains:
- **Keys:** Property names from the element's `capture` or `baseCapture` configuration
- **Values:** [micromatch patterns](https://github.com/micromatch/micromatch) to match against captured values

```js
// Element descriptor
{
  type: "helpers",
  pattern: "helpers/*/*.js",
  capture: ["category", "elementName"]
}

// Selectors using captured properties

// Matches only helpers with category "data" and elementName "parsers"
["helpers", { category: "data", elementName: "parsers" }]

// Matches all helpers with category "data"
["helpers", { category: "data" }]

// Matches helpers in "data" or "api" categories
["helpers", { category: "data|api" }]

// Matches helpers where elementName starts with "parse"
["helpers", { elementName: "parse*" }]
```

### Array of Selectors

**Format:** `[<selector>, <selector>, ...]`

When an array of selectors is provided, it matches if ANY selector in the array matches.

```js
// Matches helpers OR components
["helpers", "components"]

// Matches data helpers OR all components
[
  ["helpers", { category: "data" }],
  "components"
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
  from: ["helpers"],
  disallow: [
    // Disallow importing helpers from different categories
    ["helpers", { category: "!${from.category}" }]
  ]
}
```

**How it works:**

If a file `helpers/data/parser.js` (category: "data") tries to import from `helpers/api/fetcher.js` (category: "api"):

1. Template `${from.category}` resolves to `"data"`
2. Pattern becomes `["helpers", { category: "!data" }]`
3. The target helper has category "api" → matches `"!data"`
4. Rule disallows the import

**More examples:**

```js
// Only allow importing helpers with the same elementName
{
  from: ["helpers"],
  allow: [["helpers", { elementName: "${from.elementName}" }]]
}

// Only allow importing from elements with matching prefix
{
  from: ["components", { family: "*" }],
  allow: [["helpers", { category: "${from.family}-*" }]]
}

// Type-level templating
{
  from: ["helpers"],
  allow: ["${from.category}-*"]  // Allow importing element types like "data-provider", "api-client"
}
```

## Selector Context

Selectors are used in different contexts within rules configuration:

- **`from` / `target`** - Specifies which element the rule applies to
- **`allow` / `disallow`** - Specifies which elements are allowed or disallowed

The exact usage depends on the specific rule. See [Rules Configuration](./rules.md) for details.
