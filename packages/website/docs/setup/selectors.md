---
id: selectors
title: Element Selectors
sidebar_label: Selectors
description: Use element selectors to match elements when defining architectural boundaries in ESLint Plugin Boundaries.
tags:
  - concepts
  - configuration
keywords:
  - eslint-plugin-boundaries
  - JavaScript
  - TypeScript
  - selectors
  - element selectors
  - dependency selectors
  - micromatch
  - rules configuration
---

# Selectors

Element selectors are used in rules configuration to **match [specific elements or dependencies](./elements.md) based on [their description](./elements.md#runtime-description-properties)**. They provide a flexible way to define which elements a rule should apply to.

Selectors match against [runtime element/dependency descriptions](./elements.md#runtime-description-properties) generated from your element descriptors.

- Conceptual flow:
  1. You define [element descriptors](./elements.md) in your configuration.
  2. During analysis, the plugin generates [runtime descriptions](./elements.md#runtime-description-properties) for each element and dependency, resolving all properties and relationships.
  3. Selectors in your rules match against these runtime descriptions to determine if a rule applies.

Example selector matching a controller element:

```js
{ type: "controller" }
```

Example selector matching a runtime dependency to a service:

```js
{
  to: { type: "service" },
  dependency: { kind: "value" },
}
```

:::info Legacy Selector Formats
This page covers the modern **object-based selector syntax**. If you're using older selector formats (strings or tuples), please refer to the [Legacy Selectors](./selectors/legacy-selectors.md) page and consider migrating to the object-based syntax for better functionality and future compatibility.
:::

## Selectors

**Selectors provide a way to [match element or dependency descriptions](./elements.md#runtime-description-properties) in rules configuration**. Properties can be combined, and all specified properties must match (AND logic).

### Element Selectors

Match elements based on their type, category, origin, and any other property from their [runtime description](./elements.md#runtime-description-properties):

- **`type`**  - [Micromatch pattern(s)](https://github.com/micromatch/micromatch) matching element type. <small>(`<string | string[] | null>`)</small>
- **`category`**  - Micromatch pattern(s) matching element category/categories. <small>(`<string | string[] | null>`)</small>
- **`captured`**  - Match captured values (see [Captured Values Matching](#captured-values-matching)). <small>(`<object | object[]>`)</small>
- **`origin`**  - Element origin (local files, node_modules, or Node.js core). <small>(`<"local" | "external" | "core">`)</small>
- **`path`**  - Micromatch pattern(s) matching file path. <small>(`<string | string[] | null>`)</small>
- **`elementPath`**  - Micromatch pattern(s) matching element path. <small>(`<string | string[] | null>`)</small>
- **`internalPath`**  - Micromatch pattern(s) matching path within element. <small>(`<string | string[] | null>`)</small>
- **`isIgnored`** - Whether element is marked as ignored. <small>(`<boolean>`)</small>
- **`isUnknown`** - Whether the file doesn't match any element descriptor. <small>(`<boolean>`)</small>
- **`parent`** - Match **the first parent element** based on their type, category, origin, etc. <small>(`<object | object[] | null>`)</small>
  - **`type`**  - [Micromatch pattern(s)](https://github.com/micromatch/micromatch) matching the element's first parent type. <small>(`<string | string[] | null>`)</small>
  - **`category`**  - Micromatch pattern(s) matching the element's first parent category. <small>(`<string | string[] | null>`)</small>
  - **`elementPath`**  - Micromatch pattern(s) matching the element path of the first parent. <small>(`<string | string[] | null>`)</small>
  - **`captured`**  - Match captured values from the first element's parent (see [Captured Values Matching](#captured-values-matching)). <small>(`<object | object[]>`)</small>

```js
// Match all helper elements
{ type: "helper" }

// Match React components
{ type: "component", category: "react" }

// Match external dependencies only
{ origin: "external" }

// Match components in specific path
{ type: "component", path: "**/features/**" }

// Match unknown elements
{ isUnknown: true }
```

### Dependency Selectors

Match dependencies using element selector properties for the `from` and `to` elements, as well as properties from the dependency description.

:::tip
Use dependency selectors in your rule configuration to match specific dependencies and define the policy that applies to them. For more details, see the [Rules documentation](./rules.mdx).
:::

- **`from`**  - **[Element selector/s](#element-selectors)** matching the importer element. You can provide a single selector or an array of selectors to match multiple cases (OR logic).
- **`to`**  - **[Element selector/s](#element-selectors)** matching the imported element. You can provide a single selector or an array of selectors to match multiple cases (OR logic).
- **`dependency`**  - **[Dependency metadata selector/s](#dependency-metadata-selectors)** matching properties from the dependency description. You can provide a single selector or an array of selectors to match multiple cases (OR logic).

#### Dependency Metadata Selectors

Dependency descriptions contain metadata about the dependency being analyzed, such as the kind of import, the relationship between the importer and imported elements. You can match dependencies based on this metadata using the `dependency` property in selectors, which supports the following properties:

- **`kind`**  - Micromatch pattern(s) matching dependency kind (e.g., "value", "type", "typeof"). <small>(`<string | string[]>`)</small>
- **`relationship`**  - Relationship selectors from both perspectives. <small>(`<object>`)</small>
  - **`from`**  - Relationship from the `from` perspective. <small>(`<string | string[]>`)</small>
  - **`to`**  - Relationship from the `to` perspective. <small>(`<string | string[]>`)</small>
- **`specifiers`**  - Micromatch pattern(s) matching import/export specifiers. <small>(`<string | string[]>`)</small>
- **`nodeKind`**  - Micromatch pattern(s) matching the dependency node type (e.g., `import`, `require`, etc. See [dependency nodes](../setup/settings.md#boundariesdependency-nodes) for further information). <small>(`<string | string[]>`)</small>
- **`source`**  - Micromatch pattern(s) matching dependency source. <small>(`<string | string[]>`)</small>
- **`module`**  - Micromatch pattern(s) matching base module name for external or core dependencies. <small>(`<string | string[]>`)</small>

:::info
**All properties are optional.** You can only use one of the properties above to match dependencies or elements, but you can combine them to select more specific cases. Remember that all specified properties must match (AND logic).
:::

```js
// Match dependencies of kind "type" to services
{
  to: { type: "service" },
  dependency: { kind: "type" }
}

// Match dependencies of kind "type" to elements of type "service" OR
// elements of category "data-access" from any module
{
  to: [{ type: "service" }, { category: "data-access" }],
  dependency: { kind: "type" }
}

// Match any runtime dependency with source matching "lodash/*"
{
  dependency: { kind: "value", source: "lodash/*" }
}

// Match dependencies from controllers
{
  from: { type: "controller" },
}
```

## Combining Properties

### AND Logic

When multiple properties are specified in a selector object, **all** conditions must match for the selector to match an element (AND logic):

**Element selector examples:**

```js
// Match local helpers with category "data"
{
  type: "helper",
  category: "data",
  origin: "local"
}

// Match React components in the auth feature
{
  type: "component",
  category: "react",
  path: "**/features/auth/**"
}
```

**Dependency selector examples:**

```js
// Match dependencies from helpers to components
{
  from: { type: "helper" },
  to: { type: "component" }
}
```

### OR Logic

Arrays of values for a selector property use **OR logic** - any value in the array can match:

```js
// Match helpers with category "data" OR "api"
{
  type: "helper",
  category: ["data", "api"]
}
```

When an array of selectors is provided, it matches if **any** selector in the array matches (OR logic).

**Element selector examples:**

```js
// Matches helpers OR components
[
  { type: "helper" },
  { type: "component" }
]

// Matches data helpers OR all services
[
  { type: "helper", captured: { domain: "users" } },
  { type: "service" }
]

// Complex OR conditions
[
  { type: "component", category: "react", path: "**/features/auth/**" },
  { type: "component", category: "vue", path: "**/features/billing/**" },
  { type: "shared-component" }
]
```

**Dependency selector examples:**

```js
// Match dependencies from helpers to type components OR category service
{
  from: { type: "helper" },
  to: [
    { type: "component" },
    { category: "service" }
  ]
}

// Match dependencies from helpers in the users or billing domain to components in the billing domain OR services in the auth category
{
  from: { type: "helper", captured: { domain: ["users", "billing"] } },
  to: [
    { type: "component", captured: { domain: "billing" } },
    { type: "service", category: "auth" }
  ]
}
```

## Matching null values

In selectors, you can use `null` to explicitly match elements that do not have a value for a specific property. This is useful to differentiate between elements that have a property with a specific value and those that simply don't have that property defined.

```js
// Match elements that do not have a category defined
{ category: null }

// Match elements that do not have any parent
{ parent: null }
```

:::warning
When using micromatch patterns, `null` is treated as a non-string value and will not match any pattern. Therefore, if you want to match elements that do not have a value for a property, you should explicitly use `null` in your selector.
:::

## Captured Values Matching

The `captured` property in selectors allows matching elements based on values extracted from their file paths using the `capture` configuration.

### Object Format (AND Logic)

When `captured` is an object, **all** properties must match:

```js
// Element configuration
{
  type: "helper",
  pattern: "helpers/*/*.js",
  capture: ["domain", "elementName"]
}

// Selector - matches helpers where domain is "users" AND elementName is "parser"
{
  type: "helper",
  captured: { domain: "users", elementName: "parser" }
}

// Using micromatch patterns
{
  type: "helper",
  captured: { domain: "users|admin", elementName: "parse*" }
}
```

### Array Format (OR Logic)

When `captured` is an **array of objects**, the element matches if **any** object in the array matches:

```js
// Matches helpers where:
// - domain is "auth" OR
// - domain is "users" AND elementName is "profile"
{
  type: "helper",
  captured: [
    { domain: "auth" },
    { domain: "users", elementName: "profile" }
  ]
}

// Matches components from either the auth or billing domains
{
  type: "component",
  captured: [
    { domain: "auth" },
    { domain: "billing" }
  ]
}
```

## Templating in Selectors

Selectors support templating to create dynamic rules based on values of the elements and dependencies being analyzed. This allows you to define rules that adapt to the specific context of the dependency.

### Modern Template Syntax

The modern template syntax uses Handlebars-style double curly braces:

- `{{ from.* }}` - References properties from the file being analyzed (the importer)
- `{{ to.* }}` - References properties from the dependency being imported
- `{{ dependency.* }}` - References properties from the dependency itself, such as the kind of import, the relationship between both elements, etc.

:::tip
In short, the template can access any property from the dependency description. Read more about the available properties in the [Runtime Description Properties](./elements.md#runtime-description-properties) documentation.
:::

### Template Examples

Example rule disallowing runtime dependencies between elements of the same type but different domains:

```js
{
  disallow: {
    to: {
      type: "{{ from.type }}" // Match the same element type as the importer
      captured: { domain: "!{{ from.domain }}" }
    },
    dependency: { kind: "value" }
  }
}
```

:::info
You can see here the `disallow` property, which is not a selector property but a rule configuration property. The selectors in this case are the content of the `from` and `disallow` properties.

For further info about rules syntax, read the [Rules documentation](./rules.mdx).
:::

**How it works:**

If a file `users/helpers/parser.js` (domain: "users") tries to import from `auth/helpers/fetcher.js` (domain: "auth"):

1. Template `{{ from.domain }}` resolves to `"users"`
2. Template `{{ from.type }}` resolves to `"helper"`
2. Pattern becomes `{ type: "helper", captured: { domain: "!users" } }`
3. The target helper has domain "auth" → matches `"!users"`
4. Rule disallows the import

**More template examples:**

```js
// Only allow importing from helpers with the same base domain
{
  from: { type: "component", captured: { domain: "auth|data" } },
  allow: [
    {
      type: "helper",
      captured: { domain: "{{ from.domain }}-*" }
    }
  ]
}

// Type-level templating
{
  // Allow importing element types that share the same base type (e.g. "component" can import "component-*" but not "service")
  allow: [{ type: "{{ from.type }}-*" }]
}
```

:::caution
When the new [`boundaries/legacy-templates` setting](./settings.md#boundarieslegacy-templates) is enabled (default until next major version), if you are capturing properties with names equal to any of the [Runtime Element Description Properties](./elements.md#runtime-description-properties) (e.g., `path`, `category`, `origin`, etc.) they will overwrite the corresponding template variables and cause unexpected behavior in the templates.

To avoid this, it is recommended to check your captured properties and set `boundaries/legacy-templates` to `false`, which will avoid injecting captured properties at first level object and instead require using the `captured` namespace to access them.
:::

### Legacy Template Syntax

:::warning
The legacy template syntax `${property}` is still supported for backwards compatibility but will be deprecated in the future. Use the modern `{{ property }}` syntax for new code.
:::

In legacy templates, you can also use `${target.*}` instead of `{{ to.* }}` to reference properties from the dependency.

When the [`boundaries/legacy-templates`](./settings.md#boundarieslegacy-templates) setting is enabled, you can also access to any captured property from the importer or dependency elements, respectively, by using:

- `${from.capturedProperty}`
- `${target.capturedProperty}`
- `${to.capturedProperty}`

This is something you should migrate to the new syntax as soon as possible (<small>`{{ from.captured.capturedProperty }}` / `{{ to.captured.capturedProperty }}`</small>).
