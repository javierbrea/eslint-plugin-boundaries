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

> Prevent importing **[ignored files](../setup/settings.md#boundariesignore)** from recognized **[elements](../setup/elements.md)**.

## Rule Details

This rule validates `import` statements (or any other **[dependency-creating syntax](../setup/settings.md#boundariesdependency-nodes)**) to local files. If the imported file is **[marked as ignored in the plugin settings](../setup/settings.md#boundariesignore)**, the import will be reported as an error when importing from files recognized as **[elements](../setup/elements.md)**.

:::info
This rule prevents recognized elements from depending on files that have been explicitly excluded from the architectural boundaries.
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

```json
{
  "settings": {
    "boundaries/include": ["src/**/*.js"],
    "boundaries/ignore": ["src/foo.js"],
    "boundaries/elements": [
      {
        "type": "helpers",
        "pattern": "helpers/*/*.js",
        "mode": "file",
        "capture": ["category", "elementName"]
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

## Further Reading

Read next sections to learn more about related topics:

* [Defining Elements](../setup/elements.md) - Learn how to define architectural elements in your project
* [Global Settings](../setup/settings.md) - Learn about global settings including ignore patterns
