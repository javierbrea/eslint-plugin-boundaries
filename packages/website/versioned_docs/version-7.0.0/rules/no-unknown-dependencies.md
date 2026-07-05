---
id: no-unknown-dependencies
title: Rule no-unknown-dependencies
sidebar_label: No Unknown Dependencies
description: Documentation for the no-unknown-dependencies rule in ESLint Plugin Boundaries.
tags:
  - rules
  - configuration
  - examples
keywords:
  - eslint-plugin-boundaries
  - no-unknown-dependencies rule
  - unknown elements
  - unknown files
  - import validation
  - architecture enforcement
  - import restrictions
---

# no-unknown-dependencies

> Prevent dependencies to locally-resolved targets that are not recognized by any **[element](../classification/elements.md)** or **[file](../classification/files.md)** descriptor.

:::note[Renamed rule]
This rule was previously named `boundaries/no-unknown`. The old name still works but is **deprecated**: using it prints a one-time warning and it will be removed in a future major version. Update your configuration to `boundaries/no-unknown-dependencies`.
:::

## Rule Details

This rule validates dependencies to local files. A dependency is reported when its target is unknown on the classification axes selected by the [`require` option](#options). A target is an "unknown element" when it matches no [element descriptor](../classification/elements.md), and an "unknown file" when it matches no [file descriptor](../classification/files.md).

The rule analyzes any source file that the plugin recognizes — a file that matches at least one element descriptor or one file descriptor. It does not analyze files that are ignored.

## Options

```text
"boundaries/no-unknown-dependencies": [<severity>, <options>]
```

The first value is the ESLint severity: `0` = off, `1` = warning, `2` = error. The optional second value is an options object:

| Option | Type | Default | Description |
|---|---|---|---|
| `require` | `"any" \| "element" \| "file" \| "all"` | `"any"` | Which classification axes the dependency target must be known on **to be valid**. |

:::info[Default behavior]
With the default `require: "any"`, known on **at least one** axis (element or file) is enough for the target to be valid. The rule reports only when the target is unknown on **both** axes.
:::

`require` describes the requirement for the target to be valid, not the report condition directly — a lenient requirement (`"any"`) only fails, and reports, when every axis fails; a strict requirement (`"all"`) fails, and reports, as soon as any single axis fails:

| `require` | To be valid, the target must be known on… | Reports when |
|---|---|---|
| `"any"` (default) | at least one axis (element or file) | **both** the element and the file are unknown |
| `"element"` | the element axis, regardless of the file | the element is unknown |
| `"file"` | the file axis, regardless of the element | the file is unknown |
| `"all"` | both axes | **either** the element or the file is unknown |


### Configuration Example

```js
{
  rules: {
    // Report a dependency when its target is unknown as an element OR a file
    "boundaries/no-unknown-dependencies": [2, { require: "all" }]
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

The default message depends on which axes triggered the report:

```text
Dependencies to unknown elements are not allowed
Dependencies to unknown files are not allowed
Dependencies to unknown elements and files are not allowed
```

## Replacing this rule with `boundaries/dependencies`

You can achieve the same result with the [`boundaries/dependencies` rule](./dependencies.md) by specifying rules based on the `isUnknown` property of the [`element` sub-selector](../selectors/selectors.md).

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
        policies: [
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

## Further Reading

Read next sections to learn more about related topics:

* [Defining Elements](../classification/elements.md) - Learn how to define architectural elements in your project
* [Defining Files](../classification/files.md) - Learn how to categorize files with file descriptors
* [Selectors](../selectors/selectors.md) - Learn about element, file, and module selectors used in rules
* [Policies](../policies/policies.mdx) - Learn about rule options and dependency selectors
* [Global Settings](../settings/settings.md) - Learn about global settings that affect all rules
