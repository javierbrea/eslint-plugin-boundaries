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

This rule validates `import` statements (or any other **[dependency-creating syntax](../setup/settings.md#boundariesdependency-nodes)**) to local files. If the imported file is not recognized as any of the **[elements defined in settings](../setup/elements.md)**, the import will be reported as an error when importing from a known element.

:::info
This rule helps ensure that all files used in your project are properly categorized as elements, preventing unstructured dependencies.
:::

## Options

```
"boundaries/no-unknown": [<enabled>]
```

**Configuration properties:**

- `enabled`: Enables the rule. `0` = off, `1` = warning, `2` = error

### Configuration Example

```json
{
  "rules": {
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

```json
{
  "settings": {
    "boundaries/elements": [
      {
        "type": "helpers",
        "pattern": "helpers/*/*.js",
        "mode": "file",
        "capture": ["category", "elementName"]
      },
      {
        "type": "components",
        "pattern": "components/*/*",
        "mode": "folder",
        "capture": ["family", "elementName"]
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

## Further Reading

Read next sections to learn more about related topics:

* [Defining Elements](../setup/elements.md) - Learn how to define architectural elements in your project
* [Global Settings](../setup/settings.md) - Learn about global settings that affect all rules
