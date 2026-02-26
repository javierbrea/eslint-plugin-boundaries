---
id: rules
title: Rules Configuration
sidebar_label: Rules
description: Define and configure architectural rules in ESLint Plugin Boundaries to enforce boundaries between elements.
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
---

# Rules Configuration

Rules require additional configuration to define to which elements they apply and what is allowed or disallowed. This configuration uses **[element selectors](./selectors.md)** to match specific elements based on their type and captured properties.

## Main Rules Format

The main rules ([`element-types`](../rules/dependencies.md), [`external`](../rules/external.md), [`entry-point`](../rules/entry-point.md)) share a common configuration format.

Rules work by setting an `allow` or `disallow` default value, then providing an array of rules that override that default. Each matching rule overrides previous values, so the final result is determined by the last matching rule.

**Basic structure:**

```js
export default [{
  rules: {
    "boundaries/element-types": [2, {
      // Default policy
      default: "allow",
      
      // Optional custom message
      message: "{{from.type}} is not allowed to import {{to.type}}",
      
      // Array of rules
      rules: [
        {
          from: ["helpers"],
          disallow: ["modules", "components"],
          message: "Helpers must not import other thing than helpers"
        },
        {
          from: ["components"],
          disallow: ["modules"]
          // Uses message from top level
        }
      ]
    }]
  }
}]
```

:::info Important
- All rules are evaluated, and the final result is from the last matching rule
- If a rule has both `allow` and `disallow` properties, `disallow` takes priority
- Each rule's result will be "allow" or "disallow", producing an ESLint error accordingly
:::

## Rule Properties

### `from` / `target`

**Type:** `<element selector>` or `<array of element selectors>`

Determines when the rule applies:
- **`from`** - The rule applies if the file being analyzed matches this selector
- **`target`** - The rule applies if the dependency being imported matches this selector

Which property is used depends on the specific rule.

```js
{
  from: ["helpers"],
  // ...rule applies to files that are helpers
}

{
  from: [["components", { family: "atoms" }]],
  // ...rule applies to atom components
}
```

### `allow` / `disallow`

**Type:** Varies by rule (typically `<element selector>` or `<array of element selectors>`)

Specifies what is allowed or disallowed when the rule matches.

- If the target matches this selector, the rule result is "allow" or "disallow"
- Required content type depends on the specific rule
- For `element-types` rule: expects [element selectors](./selectors.md) for dependency types

```js
{
  from: ["helpers"],
  disallow: ["modules", "components"],
  // Helpers cannot import modules or components
}

{
  from: ["components"],
  allow: ["helpers", { category: "math" }],
  // Components can only import helpers of category "math" 
}
```

- For `entry-point` rule: expects a [micromatch pattern](https://github.com/micromatch/micromatch) for file paths

```js
{
  target: ["modules"],
  allow: "index.js",
  // Modules can be imported only via their index.js entry point
}
```

:::warning
If both `allow` and `disallow` are present and match, `disallow` takes precedence.
:::

### `importKind` (deprecated)

**Type:** `<string>` or `<array of strings>` or `<micromatch pattern>`

**Available with:** TypeScript

**Optional**

Specifies whether the rule applies based on how the dependency is imported.

:::warning Deprecated in v6
Rule-level `importKind` is kept for backward compatibility but is deprecated.

Prefer using selector-level `kind` in object-based selectors instead:

- `element-types`: use `kind` in `allow` / `disallow` selectors
- `entry-point`: use `kind` in `target` selectors
- `external`: use `kind` in `from` selectors

When both rule-level `importKind` and selector-level `kind` are defined, selector-level `kind` takes precedence.
:::

**Possible values:**
- `"value"` - Importing as a value
- `"type"` - Importing as a type
- `"typeof"` - Importing with typeof

```js
{
  from: ["components"],
  allow: ["helpers"],
  importKind: "value"
  // Components can import helpers as values
}

{
  from: ["components"],
  disallow: ["helpers"],
  importKind: "type"
  // Components cannot import helper types
}

{
  from: ["services"],
  allow: ["models"],
  importKind: ["value", "type"]
  // Services can import models as values or types
}

{
  from: ["controllers"],
  allow: ["models"],
  importKind: "*"
  // Controllers can import models as any import kind
}
```

### `message`

**Type:** `<string>`

**Optional**

Some rules support custom error messages in addition to their built-in defaults. Custom messages allow expressing more helpful feedback tailored to your project conventions.

The plugin provides a default message for each rule. For details on each default, refer to that rule's documentation. You can override this by setting the `message` in the rule options.

#### Message Templating

Custom error messages use Handlebars templates to dynamically insert information about the dependency violation.

**Example:**

```js
{
  "message": "{{from.type}}s of category {{from.category}} are not allowed to import {{to.category}}s"
  // If the error is produced by a file with type "component" and captured property "category" as "atom"
  // importing a dependency with category "molecule", the message becomes:
  // "components of category atom are not allowed to import molecules"
}
```

##### Template Context

Handlebars templates receive this context:

```ts
{
  from: ElementDescription,
  to: ElementDescription,
  dependency: DependencyInfo,
  report: Record<string, unknown>
}
```

- `from`: The element importing/analyzing the dependency
- `to`: The element being imported
- `dependency`: Information about the dependency itself (kind, specifiers, relationship)
- `report`: Rule-specific metadata (when provided by the rule)

:::tip
For the complete API reference of all available properties in `from`, `to`, and `dependency`, see [Elements → Runtime Description Properties](./elements.md#runtime-description-properties).
:::

**Usage in templates:**

```js
{
  // Access element properties
  "message": "{{from.type}} cannot import {{to.type}}",
  
  // Access captured values
  "message": "Module {{from.captured.elementName}} cannot import {{to.captured.family}} components",
  
  // Access dependency information
  "message": "Cannot import {{dependency.kind}} from {{to.type}}",
  
  // Access rule-specific report data
  "message": "Cannot import {{report.specifiers}} from {{to.source}}"
}
```

:::note
Missing properties in Handlebars templates resolve to an empty string.
:::

##### Legacy Message Templates

:::info Backwards Compatibility
Legacy message templates using `${...}` syntax are still supported but deprecated. For migration guidance, see [Legacy Message Templates](#legacy-message-templates) and the [v5 to v6 migration guide](../releases/migration-guides/v5-to-v6.md#migrating-custom-messages).
:::

#### Rule-specific `report` Properties

Some rules provide extra metadata in the `report` object for custom messages. For example, the [`external`](../rules/external.md) rule provides details about forbidden specifiers:

```js
{
  "message": "Do not import {{report.specifiers}} from {{to.source}} in helpers"
}
```

:::tip
Check each specific rule’s documentation for the complete list of `report` properties supported.
:::

## Rule Evaluation Order

Rules are evaluated sequentially, and each matching rule can override previous results:

```js
{
  default: "disallow",
  rules: [
    {
      from: ["components"],
      allow: ["helpers"],
      // If this matches: result is "allow"
      // Components can import helpers
    },
    {
      from: [["components", { family: "atoms" }]],
      disallow: [["helpers", { category: "api" }]],
      // If this also matches: result is "disallow" (overrides previous).
      // Component family "atoms" cannot import "api" helpers
    },
    {
      from: [["components", { family: "atoms" }]],
      allow: [["helpers", { category: "api", elementName: "fetcher" }]],
      // If this also matches: result is "allow" (overrides previous).
      // Component family "atoms" can import "api/fetcher" helper, in exception to previous rule
    }
  ]
}
```

:::warning
Rule order matters: Place more specific rules after more general rules so they can override when needed.
:::

## Complete Example

Just to illustrate the high level of customization that the plugin supports, here is an example of advanced options for the `boundaries/element-types` rule:

```js
export default [{
  rules: {
    "boundaries/element-types": [2, {
      // disallow importing any element by default
      default: "disallow",
      rules: [
        {
          // allow importing helpers from helpers
          from: ["helpers"],
          allow: ["helpers"]
        },
        {
          // when file is inside an element of type "components"
          from: ["components"],
          allow: [
            // allow importing components of the same family
            ["components", { family: "{{from.family}}" }],
            // allow importing helpers with category "data"
            ["helpers", { category: "data" }],
          ]
        },
        {
          // when component has family "molecule"
          from: [["components", { family: "molecule" }]],
          allow: [
            // allow importing components with family "atom"
            ["components", { family: "atom" }],
          ],
        },
        {
          // when component has family "atom"
          from: [["components", { family: "atom" }]],
          disallow: [
            // disallow importing helpers with category "data"
            ["helpers", { category: "data" }]
          ],
          // Custom message only for this specific error
          message: "Atom components can't import data helpers"
        },
        {
          // when file is inside a module
          from: ["modules"],
          allow: [
            // allow importing any type of component or helper
            "helpers",
            "components"
          ]
        },
        {
          // when module name starts by "page-"
          from: [["modules", { elementName: "page-*" }]],
          disallow: [
            // disallow importing any type of component not being of family layout
            ["components", { family: "!layout" }],
          ],
          // Custom message only for this specific error
          message: `
            Modules with name starting by 'page-' only can import layout components.
            You tried to import a component of family {{to.captured.family}}
            from a module with name {{from.captured.elementName}}
          `
        }
      ]
    }]
  }
}]
```

## Legacy Message Templates

:::warning Deprecated
Legacy message template syntax using `${...}` is deprecated and will be removed in a future major version. It is strongly recommended to migrate to Handlebars templates using `{{...}}` syntax.
:::

### Backward Compatibility

For backward compatibility, message rendering runs in two phases:

1. **Legacy replacement** (`${...}`): Processes legacy template syntax with flattened property access
2. **Handlebars rendering** (`{{...}}`): Processes modern template syntax with nested object access

This allows existing templates to continue working while you migrate to the new format.

### Legacy Syntax

Legacy templates use `${...}` syntax with flattened property access and additional legacy aliases:

**Available properties:**

- `${file.*}` and `${dependency.*}` - Legacy aliases for the importing/imported elements
- `${from.*}` and `${target.*}` - Alternative legacy aliases
- `${file.parent.*}`, `${from.parent.*}`, `${dependency.parent.*}`, `${target.parent.*}` - Parent element properties
- `${report.*}` - Rule-specific metadata

**Flattened properties include:**

- `type` - Element type
- `internalPath` - Path inside the element
- `source` - Import source
- `importKind` - Import kind (value, type, typeof)
- All captured values from the element pattern

**Example:**

```js
{
  "message": "${file.type} cannot import ${dependency.type}"
}
```

### Migration to Handlebars

To migrate from legacy templates to Handlebars:

1. **Replace `${...}` with `{{...}}`**: Change the delimiter syntax
2. **Update property paths**: Use the nested structure (`from`, `to`, `dependency`, `report`) instead of flattened aliases
3. **Remove legacy aliases**: Use official property names instead of deprecated aliases

**Migration examples:**

```js
// Legacy
"${file.type} cannot import ${dependency.type}"

// Handlebars
"{{from.type}} cannot import {{to.type}}"

// Legacy with captured values
"${file.type} with name ${file.elementName} cannot import ${dependency.category}"

// Handlebars with captured values
"{{from.type}} with name {{from.captured.elementName}} cannot import {{to.captured.category}}"

// Legacy with parent
"${file.type} in ${file.parent.type} cannot import ${dependency.type}"

// Handlebars with parent (using helper or conditional)
"{{from.type}} in {{from.parents.0.type}} cannot import {{to.type}}"
```

:::tip Migration Guide
For detailed migration steps and examples, see the [v5 to v6 migration guide](../releases/migration-guides/v5-to-v6.md#migrating-custom-messages).
:::
