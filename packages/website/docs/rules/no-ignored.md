---
id: no-ignored
title: Rule no-ignored
sidebar_label: No Ignored
description: Documentation for the no-ignored rule in ESLint Plugin Boundaries.
tags:
  - rules
  - configuration
  - examples
---

# no-ignored

> Prevent importing **[ignored files](../setup/settings.md#boundariesignore)** from known **[elements](../setup/elements.md)**.

## Rule Details

This rule validates dependencies to local files. If the imported file is **[marked as ignored in the plugin settings](../setup/settings.md#boundariesignore)**, the import will be reported as an error when importing from known **[elements](../setup/elements.md)**.

:::info
This rule prevents recognized elements from depending on files that have been explicitly excluded from the architectural boundaries.
:::

:::tip
The restriction set by this rule can also be achieved with the **[`boundaries/element-types` rule](./dependencies.md)**, which allows you to specify rules based on the `isIgnored` property of the [elements selector](../setup/selectors.md), but it is provided as a shortcut for this common use case. You can choose to use either this specific rule or the `boundaries/element-types` for more granularity and flexibility based on your preference and needs.

Read [replacement with `boundaries/element-types`](#replacement-with-boundarieselement-types) section below for more details and examples.
:::

## Options

```
"boundaries/no-ignored": [<enabled>]
```

**Configuration properties:**

- `enabled`: Enables the rule. `0` = off, `1` = warning, `2` = error

### Configuration Example

```json
{
  "rules": {
    "boundaries/no-ignored": [2]
  }
}
```

### Settings

The following examples use this project structure and settings configuration.

**Project structure:**

```text
src/
├── helpers/
│   ├── data/
│   │   ├── sort.js
│   │   └── parse.js
│   └── permissions/
│       └── roles.js
├── foo.js
└── index.js
```

**Settings configuration:**

```js
{
  settings: {
    "boundaries/include": ["src/**/*.js"],
    "boundaries/ignore": ["src/foo.js"],
    "boundaries/elements": [
      {
        type: "helpers",
        pattern: "helpers/*/*.js",
        mode: "file",
        capture: ["family", "elementName"]
      }
    ]
  }
}
```

## Examples

### Incorrect

Helpers importing ignored `foo.js` file:

```js
// src/helpers/data/sort.js
import foo from "../../foo"
```

### Correct

Unknown files importing ignored files:

```js
// src/index.js
import foo from "./foo"
```

## Replacement with `boundaries/element-types`

You can achieve the same result by using the [`boundaries/element-types` rule](./dependencies.md) and specifying rules based on the `isIgnored` property of the [elements selector](../setup/selectors.md):

```js
{
  rules: {
    "boundaries/element-types": [
      2,
      {
        rules: [
          {
            from: { isUnknown: false },
            disallow: {
              to: { isIgnored: true }
            }
          },
          // Or use more granular rules to allow some specific dependencies
          // to ignored files, for example:
          {
            from: { type: "helpers" },
            allow: {
              to: { isIgnored: true }
            }
          }
        ]
      }
    ]
  }
}
```

## Further Reading

Read next sections to learn more about related topics:

* [Defining Elements](../setup/elements.md) - Learn how to define architectural elements in your project
* [Global Settings](../setup/settings.md) - Learn about global settings including ignore patterns
