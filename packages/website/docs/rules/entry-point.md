---
id: entry-point
title: Rule entry-point
sidebar_label: Entry Point
description: Documentation for the entry-point rule in ESLint Plugin Boundaries.
tags:
  - rules
  - configuration
  - examples
---

# entry-point


> Enforce entry point restrictions for **[elements](../setup/elements.md)** in your project.

## Rule Details


This rule validates dependencies to ensure that each element is imported only through its defined entry point based on the provided configuration. It helps maintain consistent access patterns across your codebase and prevents bypassing public interfaces.

:::warning
The boundaries set by this rule can also be achieved with the **[`boundaries/element-types` rule](./dependencies.md)**, which allows you to specify allowed entry points directly in the rules by using the [`internalPath` selector property](../setup/selectors.md). This legacy rule will continue working for now to give you more time to migrate your configuration, but it is recommended to migrate to `boundaries/element-types` as soon as possible, as this rule will eventually be removed in oncoming major versions.

Read the **[migration guide below](#migration-to-boundarieselement-types)** for more details and examples on how to migrate your configuration.
:::

## Options

```
"boundaries/entry-point":
  [<enabled>, { "default": <string>, "message": <string>, "rules": <object> }]
```

**Configuration properties:**


- `enabled`: Enables the rule. `0` = off, `1` = warning, `2` = error
- `default`: `"allow"` or `"disallow"`. Determines the default behavior for imports that don't match any rule
- `message`: Custom error message for rule violations. Note that **the default message provides detailed information about why the error occurred**, so only define a custom message if necessary. See [error messages](#error-messages) for more information
- `rules`: An array of rule objects processed in order to determine whether an import should be allowed. Each rule object can have the following properties:
  - `to`: **[`<element selectors>`](../setup/selectors.md)** - If defined, the rule will only be evaluated if the imported element matches this selector.
  - `target`: **Deprecated** - Alias for `to`.
  - `from`: **[`<element selectors>`](../setup/selectors.md)** - If defined, the rule will only be evaluated if the importing element matches this selector.
  - `disallow`: `<string>` - A [micromatch pattern](https://github.com/micromatch/micromatch). If the imported file path matches this pattern, the import is disallowed (can be overridden by a subsequent rule returning `"allow"`)
  - `allow`: `<string>` - A [micromatch pattern](https://github.com/micromatch/micromatch). If the imported file path matches this pattern, the import is allowed (can be overridden by a subsequent rule returning `"disallow"`)
  - `importKind`: `<string>` - Optional. Makes sense when using [TypeScript](../guides/typescript-support.md) only. If defined, the rule will only be evaluated for dependencies of the specified kind. Possible values: `"value"`, `"type"`, or `"typeof"`. If defined, the rule will only be evaluated for dependencies of the specified kind.
  - `message`: `<string>` - Custom error message for this specific rule. See [error messages](#error-messages) for more information

:::warning
You must provide at least one of `allow` or `disallow`, and one of `to`/`target` or `from` for each rule.
:::

:::info
Read the **[rules configuration](../setup/rules.mdx)** documentation to learn about how to use common rule options, use [selectors](../setup/selectors.md) in rule options, and customize error messages with templates.
:::

:::tip
Enable [debug mode](../guides/debugging.md) in the plugin configuration to inspect the descriptions assigned to each file and dependency. This can help you understand how selectors are matching and how to configure your rules effectively.
:::

### Configuration Example


```js
{
  rules: {
    "boundaries/entry-point": [2, {
      // disallow all entry points by default
      default: "disallow",
      rules: [
        {
          // when importing helpers
          to: { type: "helper" },
          // allow any file (helpers are single files)
          allow: "*"
        },
        {
          // when importing components or modules
          to: {
            type: [
              "component",
              "module"
            ]
          },
          // only allow index.js
          allow: "index.js",
          // allow only importing values, not types (TypeScript only)
          importKind: "value"
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
      },
      {
        type: "module",
        pattern: "modules/*",
        mode: "folder",
        capture: ["elementName"]
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


  `No rule allows the entry point 'fooFile.js' in dependencies of type 'component' with family 'molecules' and elementName 'molecule-c'`


- **Rule violation message:** When a specific rule disallows an entry point, the message includes which rule triggered it:


  `The entry point 'fooFile.js' is not allowed in elements of type 'helper' with elementName 'helper-c'. Disallowed in rule 2`


- **Import kind message:** For TypeScript imports, the message also includes the import kind:


  `The entry point 'fooFile.js' is not allowed in elements of type 'helper' with elementName 'helper-c' when importing type. Disallowed in rule 2`

### Custom Messages with Templates

:::tip
You can customize error messages globally or for specific rules. See [Rules Configuration](../setup/rules.mdx) for details.
:::

#### `report` in Custom Messages

This rule does not populate the `report` object with rule-specific metadata to handlebars templates.


## Migration to `boundaries/element-types`

The entry point restrictions enforced by this rule can also be achieved with the more flexible and powerful `boundaries/element-types` rule, which allows you to specify allowed entry points directly in the rules by using the `internalPath` selector property. It is recommended to migrate your configuration to `boundaries/element-types` as soon as possible, as this legacy rule will eventually be removed in oncoming major versions.

Here you have an example of how to migrate a configuration from `boundaries/entry-point` to `boundaries/element-types`:

```js
// Original configuration with boundaries/entry-point
{
  rules: {
    "boundaries/entry-point": [2, {
      default: "disallow",
      rules: [
        {
          to: { type: ["component", "module"] },
          allow: "index.js",
          importKind: "value"
        }
      ]
    }]
  }
}

// Migrated configuration with boundaries/element-types
{
  rules: {
    "boundaries/element-types": [2, {
      rules: [
        {
          // only allow importing index.js files from components and modules
          to: {
            type: ["component", "module"],
            elementPath: "!index.js" 
          },
          disallow: {
            from: {
              type: "*",
            }
          }
        },
      ]
    }]
  }
}
```

## Further Reading


Read next sections to learn more about related topics:


* [Defining Elements](../setup/elements.md) - Learn how to define architectural elements in your project
* [Element Selectors](../setup/selectors.md) - Learn how to define and use element selectors in your rules
* [Rules Configuration](../setup/rules.mdx) - Learn how to configure common rule options
* [Global Settings](../setup/settings.md) - Learn about global settings that affect all rules
