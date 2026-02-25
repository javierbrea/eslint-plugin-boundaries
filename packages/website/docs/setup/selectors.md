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

:::info Legacy Selector Formats
This documentation covers the modern **object-based selector syntax**. If you're using older selector formats (strings or tuples), please refer to the [Legacy Selectors](./selectors/legacy-selectors.md) documentation and consider migrating to the object-based syntax for better functionality and future compatibility.
:::

## Object-Based Selector Format

**Format:** `{ property: value, ... }`

Object-based selectors provide the most powerful and flexible way to match elements. Properties can be combined, and all specified properties must match (AND logic).

### Available Properties

Selectors match against runtime element/dependency descriptions generated from your element descriptors.

- Conceptual flow:
  1. You define [element descriptors](./elements.md) in your configuration.
  2. During analysis, the plugin generates [runtime descriptions](./elements.md#runtime-description-properties) for each element and dependency, resolving all properties and relationships.
  3. Selectors in your rules match against these runtime descriptions to determine if a rule applies.

#### Element Properties

Match elements based on their type, category, origin, and other characteristics:

- **`type`** (`string | string[]`) - [Micromatch pattern(s)](https://github.com/micromatch/micromatch) matching element type(s)
- **`category`** (`string | string[]`) - Micromatch pattern(s) matching element category/categories
- **`captured`** (`object | object[]`) - Match captured values (see [Captured Values Matching](#captured-values-matching))
- **`origin`** (`"local" | "external" | "core"`) - Element origin (local files, node_modules, or Node.js core)
- **`path`** (`string | string[]`) - Micromatch pattern(s) matching file path
- **`elementPath`** (`string | string[]`) - Micromatch pattern(s) matching element path 
- **`internalPath`** (`string | string[]`) - Micromatch pattern(s) matching path within element
- **`isIgnored`** (`boolean`) - Whether element is marked as ignored
- **`isUnknown`** (`boolean`) - Whether element type is unknown

#### Dependency Properties

Additional properties available when matching dependencies (in `allow`/`disallow` rules):

- **`kind`** (`string | string[]`) - Micromatch pattern(s) matching dependency kind
- **`relationship`** (`string | string[]`) - Element relationship: `"internal"`, `"child"`, `"parent"`, `"sibling"`, `"uncle"`, `"nephew"`, `"descendant"`, `"ancestor"`
- **`specifiers`** (`string | string[]`) - Micromatch pattern(s) matching import/export specifiers
- **`nodeKind`** (`string | string[]`) - Micromatch pattern(s) matching AST node type
- **`source`** (`string | string[]`) - Micromatch pattern(s) matching dependency source
- **`baseSource`** (`string | string[]`) - Micromatch pattern(s) matching base module name

### Basic Examples

```js
// Match all helper elements
{ type: "helpers" }

// Match React components
{ type: "component", category: "react" }

// Match external dependencies only
{ origin: "external" }

// Match components in specific path
{ type: "component", path: "**/features/**" }

// Match unknown element types
{ isUnknown: true }
```

### Combining Properties

All properties in a selector object use AND logic - all must match:

```js
// Match local helpers with category "data"
{
  type: "helpers",
  category: "data",
  origin: "local"
}

// Match React components in the auth feature
{
  type: "component",
  category: "react",
  path: "**/features/auth/**"
}

// Match child elements that are services
{
  type: "service",
  relationship: "child"
}
```

## Captured Values Matching

The `captured` property allows matching elements based on values extracted from their file paths using the `capture` configuration.

### Object Format (AND Logic)

When `captured` is an object, **all** properties must match:

```js
// Element configuration
{
  type: "helpers",
  pattern: "helpers/*/*.js",
  capture: ["category", "elementName"]
}

// Selector - matches helpers where category is "data" AND elementName is "parser"
{
  type: "helpers",
  captured: { category: "data", elementName: "parser" }
}

// Using micromatch patterns
{
  type: "helpers",
  captured: { category: "data|api", elementName: "parse*" }
}
```

### Array Format (OR Logic)

When `captured` is an **array of objects**, the element matches if **any** object in the array matches:

```js
// Matches helpers where:
// - category is "auth" OR
// - category is "user" AND feature is "profile"
{
  type: "helpers",
  captured: [
    { category: "auth" },
    { category: "user", feature: "profile" }
  ]
}

// Matches components from either the auth or payment modules
{
  type: "component",
  captured: [
    { module: "auth" },
    { module: "payment" }
  ]
}
```

**Use cases for captured arrays:**

- Match elements from multiple related features/modules
- Create exception rules for specific combinations
- Group related elements without creating separate rules

## Array of Selectors

**Format:** `[<selector>, <selector>, ...]`

When an array of selectors is provided, it matches if **any** selector in the array matches (OR logic).

```js
// Matches helpers OR components
[
  { type: "helpers" },
  { type: "components" }
]

// Matches data helpers OR all services
[
  { type: "helpers", captured: { category: "data" } },
  { type: "services" }
]

// Complex OR conditions
[
  { type: "component", category: "react", path: "**/features/auth/**" },
  { type: "component", category: "vue", path: "**/features/billing/**" },
  { type: "shared-component" }
]
```

:::tip
Use an array of selectors for OR logic at the selector level, and use captured arrays for OR logic within captured values.
:::

## Templating in Selectors

Selectors support templating to create dynamic rules based on **[captured properties from other elements](./elements.md#capture-optional)**.

### Modern Template Syntax

**Format:** `{{ from.property }}` or `{{ target.property }}`

The modern template syntax uses Handlebars-style double curly braces:

- `{{ from.* }}` - References properties from the file being analyzed (the importer)
- `{{ target.* }}` - References properties from the dependency being imported

**Available template properties:**
- `{{ from.capturedProperty }}` / `{{ target.capturedProperty }}` - Any captured property from element configuration
- `{{ from.type }}` / `{{ target.type }}` - Element type
- `{{ from.category }}` / `{{ target.category }}` - Element category

### Template Examples

```js
// Element configuration
{
  type: "helpers",
  pattern: "helpers/*/*.js",
  capture: ["category", "elementName"]
}

// Disallow importing helpers from different categories
{
  from: { type: "helpers" },
  disallow: [
    {
      type: "helpers",
      captured: { category: "!{{ from.category }}" }
    }
  ]
}
```

**How it works:**

If a file `helpers/data/parser.js` (category: "data") tries to import from `helpers/api/fetcher.js` (category: "api"):

1. Template `{{ from.category }}` resolves to `"data"`
2. Pattern becomes `{ type: "helpers", captured: { category: "!data" } }`
3. The target helper has category "api" → matches `"!data"`
4. Rule disallows the import

**More template examples:**

```js
// Only allow importing helpers with the same elementName
{
  from: { type: "helpers" },
  allow: [
    {
      type: "helpers",
      captured: { elementName: "{{ from.elementName }}" }
    }
  ]
}

// Only allow importing from elements with matching prefix
{
  from: { type: "component", captured: { family: "*" } },
  allow: [
    {
      type: "helpers",
      captured: { category: "{{ from.family }}-*" }
    }
  ]
}

// Type-level templating
{
  from: { type: "helpers" },
  // Allow importing element types like "data-provider", "api-client"
  allow: [{ type: "{{ from.category }}-*" }]
}

// Complex template with multiple properties
{
  from: { type: "component", captured: { module: "*", feature: "*" } },
  allow: [
    {
      type: "service",
      captured: {
        module: "{{ from.module }}",
        feature: "{{ from.feature }}"
      }
    }
  ]
}
```

### Legacy Template Syntax

:::note
The legacy template syntax `${property}` is still supported for backwards compatibility but will be deprecated in the future. Use the modern `{{ property }}` syntax for new code.
:::

## Selector Context

Selectors are used in different contexts within rules configuration:

- **`from` / `target`** - Specifies which element the rule applies to
- **`allow` / `disallow`** - Specifies which elements are allowed or disallowed

The exact usage depends on the specific rule. See [Rules Configuration](./rules.md) for details.
