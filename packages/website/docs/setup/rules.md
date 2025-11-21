---
id: rules
title: Rules
description: Define and configure architectural rules in ESLint Plugin Boundaries to enforce boundaries between elements.
tags:
  - concepts
  - configuration
keywords:
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
      message: "${file.type} is not allowed to import ${dependency.type}",
      
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

### `importKind`

**Type:** `<string>` or `<array of strings>` or `<micromatch pattern>`

**Available with:** TypeScript

**Optional**

Specifies whether the rule applies based on how the dependency is imported.

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

Custom error messages enable you to inject dynamic information related to the current file and the dependency being checked. Use `${file.PROPERTY}` or `${dependency.PROPERTY}` for variables that will be replaced with the corresponding property from the file or dependency.

**Example:**

```jsonc
{
  "message": "${file.type}s of category ${file.category} are not allowed to import ${dependency.category}s"
  // If the error is produced by a file with type "component" and captured property "category" as "atom"
  // importing a dependency with category "molecule", the message becomes:
  // "components of category atom are not allowed to import molecules"
}
```

##### Available Properties

Both `file` and `dependency` provide these properties:

- `type`: Element's type
- `internalPath`: File path being analyzed or imported (relative to the element's root path)
- `source`: Only available for `dependency`. The import source as written in code.
- `parent`: If the element is a child of another element, this property is also available and contains `type`, `internalPath`, and captured properties for the parent.
- `importKind`: Only for `dependency` when using TypeScript. The kind of import being analyzed: `"value"`, `"type"`, or `"typeof"`
- *All captured properties*: Any custom properties you define in the [element descriptor's `capture` and `baseCapture`](./elements.md#capture-optional) will also be available here.


#### Additional Error Report Properties

Some rules also allow extra info about the violation, which may be exposed in the error message using `${report.PROPERTY}`. For example, the [rule `external`](../rules/external.md) provides details about forbidden specifiers:

```jsonc
{
  "message": "Do not import ${report.specifiers} from ${dependency.source} in helpers"
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
            ["components", { family: "${from.family}" }],
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
            You tried to import a component of family ${target.family}
            from a module with name ${from.elementName}
          `
        }
      ]
    }]
  }
}]
```
