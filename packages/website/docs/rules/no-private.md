---
id: no-private
title: Rule no-private
sidebar_label: No Private
description: Documentation for the no-private rule in ESLint Plugin Boundaries.
tags:
  - rules
  - configuration
  - examples
---

# no-private

> Prevent importing private **[elements](../setup/elements.md)** of another element.

## Rule Details

This rule enforces privacy boundaries between nested elements based on the following principles:

- An element becomes **private** when it is nested under another element
- Private elements can only be imported by their parent element
- Private elements can import public elements
- Private elements can import sibling elements (elements with the same parent)
- Private elements can import uncle elements (direct children of a common ancestor) when the `allowUncles` option is enabled

:::info
This rule helps maintain encapsulation by preventing external elements from directly accessing the internal structure of other elements.
:::

:::warning
The boundaries set by this rule can also be achieved with the **[`boundaries/element-types` rule](./dependencies.md)**, which allows you to specify allowed entry points directly in the rules by using the [`relationship` selector property](../setup/selectors.md). This legacy rule will continue working for now to give you more time to migrate your configuration, but it is recommended to migrate to `boundaries/element-types` as soon as possible, as this rule will eventually be removed in oncoming major versions.

Read the **[migration guide below](#migration-to-boundarieselement-types)** for more details and examples on how to migrate your configuration.
:::

## Options

```
"boundaries/no-private":
  [<enabled>, { "allowUncles": <boolean>, "message": <string> }]
```

**Configuration properties:**

- `enabled`: Enables the rule. `0` = off, `1` = warning, `2` = error
- `allowUncles`: Optional. When set to `false`, disallows importing uncle elements. Default is `true`
- `message`: Custom error message for rule violations. Note that **the default message provides detailed information about why the error occurred**, so only define a custom message if necessary. See [error messages](#error-messages) for more information

### Configuration Example

```js
{
  rules: {
    "boundaries/no-private": [2, { allowUncles: true }]
  }
}
```

### Settings

The following examples use this project structure and settings configuration.

**Project structure:**

```text
src/
└── modules/
    ├── module-a/
    │   ├── index.js
    │   └── ModuleA.js
    └── module-b/
        ├── index.js
        ├── ModuleB.js
        └── modules/
            ├── module-c/
            │   ├── index.js
            │   ├── ModuleC.js
            │   └── modules/
            │       └── module-e/
            │           ├── index.js
            │           └── ModuleE.js
            └── module-d/
                ├── index.js
                └── ModuleD.js
```


**Settings configuration:**

```js
{
  settings: {
    "boundaries/elements": [
      {
        type: "module",
        pattern: "modules/*",
        mode: "folder"
      }
    ],
  }
}
```

:::note
Some examples use aliases for the `src/modules` folder. You can also use relative paths, or you can **[configure the plugin to recognize aliases by using resolvers](../guides/custom-resolvers.md).**
:::


## Examples


### Incorrect


`module-a` importing `module-c` (private child of `module-b`):


```js
// src/modules/module-a/ModuleA.js
import ModuleC from 'modules/module-b/modules/module-c'
```


`module-b` importing `module-e` (private grandchild):


```js
// src/modules/module-b/ModuleB.js
import ModuleE from './modules/module-c/modules/module-e'
```


`module-e` importing `module-d` when `allowUncles` is disabled:


```js
// src/modules/module-b/modules/module-c/modules/module-e/ModuleE.js
import ModuleD from 'modules/module-b/modules/module-d'
```


### Correct


`module-b` importing `module-c` (its direct child):


```js
// src/modules/module-b/ModuleB.js
import ModuleC from './modules/module-c'
```


`module-c` importing `module-a` (public element):


```js
// src/modules/module-b/modules/module-c/ModuleC.js
import ModuleA from 'modules/module-a'
```


`module-c` importing `module-d` (sibling element):


```js
// src/modules/module-b/modules/module-c/ModuleC.js
import ModuleD from '../module-d'
```


`module-e` importing `module-d` (uncle element):


```js
// src/modules/module-b/modules/module-c/modules/module-e/ModuleE.js
import ModuleD from 'modules/module-b/modules/module-d'
```

## Error Messages

This rule provides detailed error messages indicating which element owns the private element being imported.

**Example message:**

`Dependency is private of element of type 'modules' with elementName 'module-b'`

### Custom Messages with Templates

:::tip
You can customize error messages globally or for specific rules. See [Rules Configuration](../setup/rules.mdx) for details.
:::

#### `report` in Custom Messages

This rule does not populate the `report` object with rule-specific metadata to handlebars templates.

## Migration to `boundaries/element-types`

The restrictions enforced by this rule can also be achieved with the more flexible and powerful `boundaries/element-types` rule, which allows you to specify allowed relationships directly in the rules by using the `relationship` selector property. It is recommended to migrate your configuration to `boundaries/element-types` as soon as possible, as this legacy rule will eventually be removed in oncoming major versions.

Here you have an example of how to migrate a configuration from `boundaries/no-private` to `boundaries/element-types`:

```js
// Original configuration with boundaries/no-private
{
  rules: {
    "boundaries/no-private": [2, { allowUncles: true }]
  }
}

// Migrated configuration with boundaries/element-types
{
  rules: {
    "boundaries/element-types": [2, {
      default: "allow",
      rules: [
        // Disallow all elements importing children elements of other elements
        {
          from: { type: "*" },
          disallow: {
            dependency: {
              relationship: {
                to: ["child"],
              }
            },
          }
        },
        // Allow all elements importing their own children, siblings, and uncles     
        {
          from: { type: "*" },
          allow: {
            dependency: {
              relationship: {
                to: ["child", "sibling", "uncle"],
              }
            },
          }
        }
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
