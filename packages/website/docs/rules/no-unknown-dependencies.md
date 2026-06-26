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

> Prevent dependencies to locally-resolved targets that are not recognized by any **[element](../setup/elements.md)** or **[file](../setup/files.md)** descriptor.

:::info[Renamed rule]
This rule was previously named `boundaries/no-unknown`. The old name still works but is **deprecated**: using it prints a one-time warning and it will be removed in a future major version. Update your configuration to `boundaries/no-unknown-dependencies`.
:::

## Rule Details

This rule validates dependencies to local files. A dependency is reported when its target is an **unknown element** or an **unknown file**, depending on the [options](#options). A target is an "unknown element" when it matches no [element descriptor](../setup/elements.md), and an "unknown file" when it matches no [file descriptor](../setup/files.md).

The rule analyzes any source file that the plugin recognizes — a file that matches at least one element descriptor or one file descriptor. It does not analyze files that are both element-unknown and file-unknown, or files that are ignored.

By default (`allowUnknownElements: false`, `allowUnknownFiles: true`) the rule reports only when the target **element** is unknown, regardless of its file. This is the same behavior as the deprecated `boundaries/no-unknown` rule, so upgrading does not change results until you opt into file checking.

## Options

```text
"boundaries/no-unknown-dependencies": [<severity>, <options>]
```

The first value is the ESLint severity: `0` = off, `1` = warning, `2` = error. The optional second value is an options object:

| Option | Type | Default | Description |
|---|---|---|---|
| `allowUnknownElements` | `boolean` | `false` | When `true`, dependencies to unknown elements are allowed (the element axis is disabled). |
| `allowUnknownFiles` | `boolean` | `true` | When `true`, dependencies to unknown files are allowed (the file axis is disabled). |

A dependency is reported when:

```text
(target element is unknown AND allowUnknownElements is false)
  OR
(target file is unknown AND allowUnknownFiles is false)
```

The resulting behavior for each combination:

| `allowUnknownElements` | `allowUnknownFiles` | Reports when |
|---|---|---|
| `false` (default) | `true` (default) | the target element is unknown (legacy behavior) |
| `false` | `false` | the target element **or** file is unknown |
| `true` | `false` | the target file is unknown |
| `true` | `true` | never (rule effectively disabled) |

:::tip[Projects using only file descriptors]
If you classify your project with [`boundaries/files`](../setup/files.md) instead of elements, set `allowUnknownElements: true` and `allowUnknownFiles: false` so the rule judges targets purely by their file descriptor.
:::

### Configuration Example

```js
{
  rules: {
    // Report unknown elements (default) and also unknown files
    "boundaries/no-unknown-dependencies": [2, { allowUnknownFiles: false }]
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
* [Defining Files](../setup/files.md) - Learn how to categorize files with file descriptors
* [Selectors](../setup/selectors.md) - Learn about element, file, and module selectors used in rules
* [Rules Configuration](../setup/rules.mdx) - Learn about rule options and dependency selectors
* [Global Settings](../setup/settings.md) - Learn about global settings that affect all rules
