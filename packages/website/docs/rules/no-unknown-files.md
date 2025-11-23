---
id: no-unknown-files
title: No Unknown Files
description: Learn how to enforce that all files in your project belong to a known element type using ESLint Plugin Boundaries.
tags:
  - rules
  - configuration
  - examples
---

# no-unknown-files

> Prevent creating files not recognized as any **[element](../setup/elements.md)** type.

## Rule Details

This rule validates local file paths. If a file is not recognized as part of any **[element](../setup/elements.md)** defined in settings, it will be reported as an error.

:::info
This rule ensures that all files in your project belong to a defined element type, maintaining a clean architectural structure.
:::

## Options

```
"boundaries/no-unknown-files": [<enabled>]
```

**Configuration properties:**

- `enabled`: Enables the rule. `0` = off, `1` = warning, `2` = error

### Configuration Example

```json
{
  "rules": {
    "boundaries/no-unknown-files": [2]
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
    "boundaries/ignore": ["src/index.js"],
    "boundaries/elements": [
      {
        "type": "helpers",
        "pattern": "helpers/*/*.js",
        "mode": "file"
      }
    ]
  }
}
```

## Examples

### Incorrect

Unrecognized `foo.js` file:

```js
// src/foo.js
```

### Correct

Helper files that match element definitions:

```js
// src/helpers/data/sort.js
```

Ignored files in settings:

```js
// src/index.js
```

## Further Reading

Read next sections to learn more about related topics:

* [Defining Elements](../setup/elements.md) - Learn how to define architectural elements in your project
* [Global Settings](../setup/settings.md) - Learn about global settings including ignore patterns
