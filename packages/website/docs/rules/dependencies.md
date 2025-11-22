---
id: dependencies
title: Element Types
description: Learn how to manage and enforce dependencies in ESLint Plugin Boundaries rules.
tags:
  - concepts
  - rules
  - configuration
  - examples
---

# element-types

> Enforce allowed dependencies between **[elements](../setup/elements.md)** in your project.

## Rule Details

This rule validates `import` statements (or any other **[dependency-creating syntax](../setup/settings.md#boundariesdependency-nodes)**) between element types in your project based on the provided configuration. It ensures that dependencies adhere to the defined architectural boundaries.

## Options

```
"boundaries/element-types":
  [<enabled>, { "default": <string>, "message": <string>, "rules": <object> }]
```

**Configuration properties:**

- `enabled`: Enables the rule. `0` = off, `1` = warning, `2` = error
- `default`: `"allow"` or `"disallow"`. Determines the default behavior for imports that don't match any rule
- `message`: Custom error message for rule violations. Note that **the default message provides detailed information about why the error occurred**, so only define a custom message if necessary. See [error messages](#error-messages) for more information
- `rules`: An array of rule objects processed in order to determine whether an import should be allowed. Each rule object contains:
  - `from`: **[`<element selectors>`](../setup/selectors.md)** - If the file being analyzed matches this selector, the rule will be evaluated. Otherwise, it is skipped
  - `disallow`: **[`<element selectors>`](../setup/selectors.md)** - If the imported element matches this selector, the import is disallowed (can be overridden by a subsequent rule returning `"allow"`)
  - `allow`: **[`<element selectors>`](../setup/selectors.md)** - If the imported element matches this selector, the import is allowed (can be overridden by a subsequent rule returning `"disallow"`)
  - `importKind`: `<string>` - Optional. [TypeScript](../guides/typescript-support.md) only. Specifies whether the rule applies to value or type imports. Can be a string, array of strings, or micromatch pattern. Possible values: `"value"`, `"type"`, or `"typeof"`
  - `message`: `<string>` - Custom error message for this specific rule. See [error messages](#error-messages) for more information

### Comparing Captured Values

:::info
This rule uses **[element selectors](../setup/selectors.md)** to define which elements can import which other elements. Element selectors support capturing properties from **[element definitions](../setup/elements.md)**, allowing for more dynamic and flexible rules.
:::

For example: You can use element selector options to ensure components of one `family` can only import helpers of the same `family`, using the special pattern `${capturedKey}` in the `allow` selector. This will be replaced with the corresponding captured value from the `from` element before matching.

**Example:** If the `from` element has captured values `{ family: "atom", elementName: "component-a" }`, the selector `["components", { "family": "!${family}-${elementName}" }]` will match helpers with a `family` value matching `"!atom-component-a"`.

:::tip
Enable [debug mode](../guides/debugging.md) in the plugin configuration to inspect the assigned types and captured values for each file in your project.
:::

### Configuration Example

```json
{
  "rules": {
    "boundaries/element-types": [2, {
      // disallow all local imports by default
      "default": "disallow",
      "rules": [
        {
          // from helper elements
          "from": ["helpers"],
          // allow importing helper elements
          "allow": ["helpers"],
          // allow only importing value, not type (TypeScript only)
          "importKind": "value"
        },
        {
          // from component elements
          "from": ["components"],
          "allow": [
            // allow importing components of the same family
            ["components", { "family": "${family}" }],
            // allow importing helpers with category "data"
            ["helpers", { "category": "data" }]
          ]
        },
        {
          // from components with captured family "molecule"
          "from": [["components", { "family": "molecule" }]],
          "allow": [
            // allow importing components with captured family "atom"
            ["components", { "family": "atom" }]
          ]
        },
        {
          // from modules
          "from": ["modules"],
          // allow importing helpers, components, and modules
          "allow": ["helpers", "components", "modules"]
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
These examples use aliases for the `src/helpers`, `src/components`, and `src/modules` folders. You can also use relative paths, or you can **[configure the plugin to recognize aliases by using resolvers](../guides/custom-resolvers.md).**
:::

## Examples

### Incorrect

Helpers importing components:

```js
// src/helpers/permissions/roles.js
import AtomA from 'components/atoms/atom-a'
```

Helpers importing types from helpers:

```js
// src/helpers/permissions/roles.js
import type { SomeParser } from 'helpers/data/parse'
```

Helpers importing modules:

```js
// src/helpers/permissions/roles.js
import ModuleA from 'modules/module-a'
```

Components importing components from a different family:

```js
// src/components/atoms/atom-a/AtomA.js
import MoleculeA from 'components/molecules/molecule-a'
```

Components importing helpers from a category other than "data":

```js
// src/components/atoms/atom-a/AtomA.js
import { roleHasPermissions } from 'helpers/permissions/roles'
```

Components importing modules:

```js
// src/components/atoms/atom-a/AtomA.js
import ModuleA from 'modules/module-a'
```

### Correct

Helpers importing helpers:

```js
// src/helpers/permissions/roles.js
import { someParser } from 'helpers/data/parse'
```

Components importing components of the same family:

```js
// src/components/atoms/atom-a/AtomA.js
import AtomB from 'components/atoms/atom-b'
```

Components importing helpers from the "data" category:

```js
// src/components/atoms/atom-a/AtomA.js
import { someParser } from 'helpers/data/parse'
```

Molecule components importing atom components:

```js
// src/components/molecules/molecule-a/MoleculeA.js
import AtomA from 'components/atoms/atoms-a'
```

Modules importing helpers:

```js
// src/modules/module-a/ModuleA.js
import { someParser } from 'helpers/data/parse'
```

Modules importing components:

```js
// src/modules/module-a/ModuleA.js
import AtomA from 'components/atoms/atom-a'
```

Modules importing other modules:

```js
// src/modules/module-a/ModuleA.js
import ModuleB from 'modules/module-b'
```

## Error Messages

This rule provides detailed error messages to help you understand and resolve violations.

- **Default disallow message:** When an import is disallowed because it doesn't match any rule and the default is `"disallow"`, the message includes the file type with captured values and the dependency type with captured values:

  `No rule allowing this dependency was found. File is of type 'components' with category 'molecules' and elementName 'molecule-c'. Dependency is of type 'modules' with domain 'domain-a' and elementName 'module-a'`

- **Rule violation message:** When a specific rule disallows an import, the message includes which rule triggered it:

  `Importing elements of type 'components' with category 'atoms' and elementName '*-a' is not allowed in elements of type 'helpers' with elementName 'helper-c'. Disallowed in rule 1`

- **Import kind message:** For TypeScript imports, the message also includes the import kind:

  `Importing kind "value" from elements of type 'components' with category 'atoms' and elementName '*-a' as 'value' is not allowed in elements of type 'helpers' with elementName 'helper-c'. Disallowed in rule 1`

:::tip
You can customize error messages globally or for specific rules. See [Rules Configuration](../setup/rules.md) for details.
:::

## Further Reading

Read next sections to learn more about related topics:

* [Defining Elements](../setup/elements.md) - Learn how to define architectural elements in your project
* [Element Selectors](../setup/selectors.md) - Learn how to define and use element selectors in your rules
* [Rules Configuration](../setup/rules.md) - Learn how to configure common rule options
* [Global Settings](../setup/settings.md) - Learn about global settings that affect all rules
