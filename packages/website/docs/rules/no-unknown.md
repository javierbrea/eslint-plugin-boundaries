---
id: no-unknown
title: Rule no-unknown
sidebar_label: No Unknown
description: Documentation for the no-unknown rule in ESLint Plugin Boundaries.
tags:
  - rules
  - configuration
  - examples
---

# no-unknown

> Prevent importing unknown **[elements](../setup/elements.md)** from known **[elements](../setup/elements.md)**.

## Rule Details

This rule validates dependencies to local files. If the imported file is not recognized as any of the **[elements defined in settings](../setup/elements.md)**, the dependency will be reported as an error when importing from a known element.

:::info
This rule helps ensure that all files used in your project are properly categorized as elements, preventing unstructured dependencies.
:::

:::tip
The restriction set by this rule can also be achieved with the **[`boundaries/element-types` rule](./dependencies.md)**, which allows you to specify rules based on the `isUnknown` property of the [elements selector](../setup/selectors.md), but it is provided as a shortcut for this common use case. You can choose to use either this specific rule or the `boundaries/element-types` for more granularity and flexibility based on your preference and needs.

Read [replacement with `boundaries/element-types`](#replacement-with-boundarieselement-types) section below for more details and examples.
:::

## Options

```
"boundaries/no-unknown": [<enabled>]
```

**Configuration properties:**

- `enabled`: Enables the rule. `0` = off, `1` = warning, `2` = error

### Configuration Example

```js
{
  rules: {
    "boundaries/no-unknown": [2]
  }
}
```

### Settings

The following examples use this project structure and settings configuration.

**Project structure:**

```text
src/
├── components/
│   └── atoms/
│       ├── atom-a/
│       │   ├── index.js
│       │   └── AtomA.js
│       └── atom-b/
│           ├── index.js
│           └── AtomB.js
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
    "boundaries/elements": [
      {
        type: "helper",
        pattern: "helpers/*/*.js",
        mode: "file",
        capture: ["family", "elementName"]
      },
      {
        type: "component",
        pattern: "components/*/*",
        mode: "folder",
        capture: ["family", "elementName"]
      }
    ]
  }
}
```

## Examples

### Incorrect

Helpers importing unknown `foo.js` file:

```js
// src/helpers/data/parse.js
import foo from '../../foo'
```

Components importing unknown `index.js` file:

```js
// src/components/atoms/atom-a/AtomA.js
import index from '../../../index'
```

### Correct

Components importing helpers:

```js
// src/components/atoms/atom-a/AtomA.js
import { someParser } from '../../../helpers/data/parse'
```

Unknown files importing other unknown files:

```js
// src/index.js
import foo from './foo'
```

## Replacement with `boundaries/element-types`

You can achieve the same result by using the [`boundaries/element-types` rule](./dependencies.md) and specifying rules based on the `isUnknown` property of the [elements selector](../setup/selectors.md).

:::warning
You need to set the `checkUnknownLocals` option to `true` in your `boundaries/element-types` configuration to make sure that dependencies from unknown local files are also checked, as by default `boundaries/element-types` only checks dependencies between local known elements.
:::

```js
{
  rules: {
    "boundaries/element-types": [
      2,
      {
        checkUnknownLocals: true,
        default: "allow",
        rules: [
          {
            from: { isUnknown: false },
            disallow: {
              to: { isUnknown: true }
            }
          },
          // Or use more granular rules to allow some specific dependencies
          // to unknown files, for example:
          {
            from: { type: "helper" },
            allow: {
              to: { isUnknown: true }
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
* [Global Settings](../setup/settings.md) - Learn about global settings that affect all rules
