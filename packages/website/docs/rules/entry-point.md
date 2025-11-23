---
id: entry-point
title: Entry Point
description: Learn how to manage and enforce entry points of your elements in ESLint Plugin Boundaries rules.
tags:
  - rules
  - configuration
  - examples
---

# entry-point


> Enforce entry point restrictions for **[elements](../setup/elements.md)** in your project.


## Rule Details


This rule validates `import` statements (or any other **[dependency-creating syntax](../setup/settings.md#boundariesdependency-nodes)**) to ensure that each element is imported only through its defined entry point based on the provided configuration. It helps maintain consistent access patterns across your codebase and prevents bypassing public interfaces.


## Options


```
"boundaries/entry-point":
  [<enabled>, { "default": <string>, "message": <string>, "rules": <object> }]
```


**Configuration properties:**


- `enabled`: Enables the rule. `0` = off, `1` = warning, `2` = error
- `default`: `"allow"` or `"disallow"`. Determines the default behavior for imports that don't match any rule
- `message`: Custom error message for rule violations. Note that **the default message provides detailed information about why the error occurred**, so only define a custom message if necessary. See [error messages](#error-messages) for more information
- `rules`: An array of rule objects processed in order to determine whether an import should be allowed. Each rule object contains:
  - `target`: **[`<element selectors>`](../setup/selectors.md)** - If the imported element matches this selector, the rule will be evaluated. Otherwise, it is skipped
  - `disallow`: `<string>` - A [micromatch pattern](https://github.com/micromatch/micromatch). If the imported file path matches this pattern, the import is disallowed (can be overridden by a subsequent rule returning `"allow"`)
  - `allow`: `<string>` - A [micromatch pattern](https://github.com/micromatch/micromatch). If the imported file path matches this pattern, the import is allowed (can be overridden by a subsequent rule returning `"disallow"`)
  - `importKind`: `<string>` - Optional. [TypeScript](../guides/typescript-support.md) only. Specifies whether the rule applies to value or type imports. Can be a string, array of strings, or micromatch pattern. Possible values: `"value"`, `"type"`, or `"typeof"`
  - `message`: `<string>` - Custom error message for this specific rule. See [error messages](#error-messages) for more information


### Configuration Example


```json
{
  "rules": {
    "boundaries/entry-point": [2, {
      // disallow all entry points by default
      "default": "disallow",
      "rules": [
        {
          // when importing helpers
          "target": ["helpers"],
          // allow any file (helpers are single files)
          "allow": "*"
        },
        {
          // when importing components or modules
          "target": ["components", "modules"],
          // only allow index.js
          "allow": "index.js",
          // allow only importing values, not types (TypeScript only)
          "importKind": "value"
        }
      ]
    }]
  }
}
```


### Settings


The following examples use this project structure and settings configuration.


**Project structure:**


```text
src/
├── components/
│   ├── atoms/
│   │   ├── atom-a/
│   │   │   ├── index.js
│   │   │   └── AtomA.js
│   │   └── atom-b/
│   │       ├── index.js
│   │       └── AtomB.js
│   └── molecules/
│       ├── molecule-a/
│       │   ├── index.js
│       │   └── MoleculeA.js
│       └── molecule-b/
│           ├── index.js
│           └── MoleculeB.js
├── helpers/
│   ├── data/
│   │   ├── sort.js
│   │   └── parse.js
│   └── permissions/
│       └── roles.js
└── modules/
    ├── module-a/
    │   ├── index.js
    │   └── ModuleA.js
    └── module-b/
        ├── index.js
        └── ModuleB.js
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
      },
      {
        "type": "modules",
        "pattern": "modules/*",
        "mode": "folder",
        "capture": ["elementName"]
      }
    ],
    "import/resolver": {
      "babel-module": {}
    }
  }
}
```


:::note
These examples use aliases for the `src/helpers`, `src/components`, and `src/modules` folders. You can also use relative paths. You can **[configure the plugin to recognize aliases by using resolvers](../guides/custom-resolvers.md).**
:::


## Examples


### Incorrect


Importing files other than `index.js` from components:


```js
// src/modules/module-a/ModuleA.js
import AtomA from 'components/atoms/atom-a/AtomA'
```


Importing files other than `index.js` from modules:


```js
// src/modules/module-a/ModuleA.js
import ModuleB from 'modules/module-b/ModuleB'
```


Importing types from module entry points:


```js
// src/modules/module-a/ModuleA.js
import type ModuleB from 'modules/module-b'
```


### Correct


Importing helper files:


```js
// src/components/atoms/atom-a/AtomA.js
import { someParser } from 'helpers/data/parse'
```


Importing `index.js` from components:


```js
// src/components/atoms/atom-a/AtomA.js
import ComponentB from 'components/atoms/atom-b'
```


Explicitly importing `index.js` from components:


```js
// src/components/atoms/atom-a/AtomA.js
import ComponentB from 'components/atoms/atom-b/index.js'
```


Importing `index.js` from modules:


```js
// src/modules/module-a/ModuleA.js
import ModuleB from 'modules/module-b'
```


## Error Messages


This rule provides detailed error messages to help you understand and resolve violations.


- **Default disallow message:** When an entry point is disallowed because it doesn't match any rule and the default is `"disallow"`, the message includes the entry point and dependency information:


  `No rule allows the entry point 'fooFile.js' in dependencies of type 'components' with category 'molecules' and elementName 'molecule-c'`


- **Rule violation message:** When a specific rule disallows an entry point, the message includes which rule triggered it:


  `The entry point 'fooFile.js' is not allowed in elements of type 'helpers' with elementName 'helper-c'. Disallowed in rule 2`


- **Import kind message:** For TypeScript imports, the message also includes the import kind:


  `The entry point 'fooFile.js' is not allowed in elements of type 'helpers' with elementName 'helper-c' when importing type. Disallowed in rule 2`


:::tip
You can customize error messages globally or for specific rules. See [Rules Configuration](../setup/rules.md) for details.
:::


## Further Reading


Read next sections to learn more about related topics:


* [Defining Elements](../setup/elements.md) - Learn how to define architectural elements in your project
* [Element Selectors](../setup/selectors.md) - Learn how to define and use element selectors in your rules
* [Rules Configuration](../setup/rules.md) - Learn how to configure common rule options
* [Global Settings](../setup/settings.md) - Learn about global settings that affect all rules
