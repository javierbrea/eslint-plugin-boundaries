---
id: no-unknown
title: Rule no-unknown
sidebar_label: No Unknown
description: Documentation for the no-unknown rule in ESLint Plugin Boundaries.
tags:
  - rules
  - configuration
  - examples
keywords:
  - eslint-plugin-boundaries
  - no-unknown rule
  - unknown elements
  - import validation
  - architecture enforcement
  - import restrictions
---

# no-unknown

> Prevent dependencies to locally-resolved files that do not match any **[element](../setup/elements.md)** descriptor.

## Rule Details

This rule validates dependencies to local files. If the dependency's target does not match any **[element descriptor](../setup/elements.md)** (its element is unknown) and the dependency has local origin, it is reported as an error.

The rule analyzes any source file that the plugin recognizes — a file that matches at least one element descriptor or one [file descriptor](../setup/files.md). It does not analyze files that are both element-unknown and file-unknown, or files that are ignored.

:::note
The rule reports based on the target's **element**: a dependency is flagged when the target matches no element descriptor. A file matched only by a [file descriptor](../setup/files.md) (`boundaries/files`) is still an unknown element, so importing it is reported by this rule.
:::

:::tip
The restriction set by this rule can also be achieved with the **[`boundaries/dependencies` rule](./dependencies.md)**, which lets you specify rules based on the `isUnknown` property of the [`element` sub-selector](../setup/selectors.md). This rule is provided as a shortcut for this common use case.

Note that the two are not strictly equivalent. By default, `boundaries/dependencies` skips a target only when **both** its file and its element are unknown, while `no-unknown` looks only at the element. So a target that is **both file-unknown and element-unknown** is reported by `no-unknown`, but skipped by `boundaries/dependencies` unless you set `checkUnknownLocals: true`. A target matched by a [file descriptor](../setup/files.md) (known file, unknown element) is treated the **same** by both rules: since its file is known, `boundaries/dependencies` does not skip it, so both rules report it.

Read the [replacement with `boundaries/dependencies`](#replacing-this-rule-with-boundariesdependencies) section below for more details and examples.
:::

## Options

```text
"boundaries/no-unknown": [<severity>]
```

This rule has no options. The only value is the ESLint severity: `0` = off, `1` = warning, `2` = error.

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
        pattern: "helpers/*",
        capture: ["family"]
      },
      {
        type: "component",
        pattern: "components/*/*",
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

## Error Messages

Default error message:

```text
Dependencies to unknown elements are not allowed
```

## Replacing this rule with `boundaries/dependencies`

You can achieve the same result with the [`boundaries/dependencies` rule](./dependencies.md) by specifying rules based on the `isUnknown` property of the [`element` sub-selector](../setup/selectors.md).

:::warning
Set the `checkUnknownLocals` option to `true` in your `boundaries/dependencies` configuration so dependencies to unknown local elements are also checked. By default `boundaries/dependencies` only checks dependencies between local known elements.
:::

```js
{
  rules: {
    "boundaries/dependencies": [
      2,
      {
        checkUnknownLocals: true,
        default: "allow",
        rules: [
          {
            from: { element: { isUnknown: false } },
            disallow: {
              to: { element: { isUnknown: true } }
            }
          },
          // Or use more granular rules to allow some specific dependencies
          // to unknown elements, for example:
          {
            from: { element: { type: "helper" } },
            allow: {
              to: { element: { isUnknown: true } }
            }
          }
        ]
      }
    ]
  }
}
```

:::note
The flat form (`{ isUnknown: false }`) still works and is converted internally to the entity selector form. Prefer `{ element: { isUnknown: false } }` in new configurations for consistency with [entity selectors](../setup/selectors.md).
:::

## Further Reading

Read next sections to learn more about related topics:

* [Defining Elements](../setup/elements.md) - Learn how to define architectural elements in your project
* [Selectors](../setup/selectors.md) - Learn about element, file, and module selectors used in rules
* [Rules Configuration](../setup/rules.mdx) - Learn about rule options and dependency selectors
* [Global Settings](../setup/settings.md) - Learn about global settings that affect all rules
