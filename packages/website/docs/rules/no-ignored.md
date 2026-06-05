---
id: no-ignored
title: Rule no-ignored
sidebar_label: No Ignored
description: Documentation for the no-ignored rule in ESLint Plugin Boundaries.
tags:
  - rules
  - configuration
  - examples
keywords:
  - eslint-plugin-boundaries
  - no-ignored rule
  - ignored files
  - boundaries/ignore
  - known elements
  - architecture enforcement
  - import restrictions
---

# no-ignored

> Prevent importing **[ignored files](../setup/settings.md#boundariesignore)** from recognized files.

## Rule Details

This rule validates dependencies to local files. If the imported file is **[marked as ignored in the plugin settings](../setup/settings.md#boundariesignore)**, the dependency is reported as an error.

The rule analyzes any source file that the plugin recognizes: a file that belongs to a known **[element](../setup/elements.md)** or that matches a known **[file descriptor](../setup/files.md)**. It does not analyze files that are both element-unknown and file-unknown, or files that are ignored.

:::tip
This rule is disabled in the `recommended` preset and enabled in the `strict` preset. Enable it when you want to prevent recognized files from depending on files that are intentionally excluded from analysis.
:::

## Options

```text
"boundaries/no-ignored": [<severity>]
```

This rule has no options. The only value is the ESLint severity: `0` = off, `1` = warning, `2` = error.

### Configuration Example

```js
{
  rules: {
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
        type: "helper",
        pattern: "helpers/*",
        capture: ["family"]
      }
    ]
  }
}
```

## Examples

### Incorrect

Helpers importing the ignored `foo.js` file:

```js
// src/helpers/data/sort.js
import foo from "../../foo"
```

### Correct

A recognized file importing a non-ignored local file:

```js
// src/helpers/data/sort.js
import { parse } from "./parse"
```

Unrecognized files (matched by no element or file descriptor) importing ignored files. The rule does not analyze `src/index.js`, so this dependency is not reported:

```js
// src/index.js
import foo from "./foo"
```

## Error Messages

Default error message:

```text
Dependencies to ignored files are not allowed
```

## Further Reading

Read next sections to learn more about related topics:

* [Defining Elements](../setup/elements.md) - Learn how to define architectural elements in your project
* [Selectors](../setup/selectors.md) - Learn about element, file, and module selectors used in rules
* [Rules Configuration](../setup/rules.mdx) - Learn how to configure rule options and custom messages
* [Global Settings](../setup/settings.md) - Learn about global settings including ignore patterns
