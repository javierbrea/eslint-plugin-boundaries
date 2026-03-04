---
id: dependencies
title: Rule element-types
sidebar_label: Element Types
description: Documentation for the element-types rule in ESLint Plugin Boundaries.
tags:
  - concepts
  - rules
  - configuration
  - examples
---

# element-types

> Enforce allowed dependencies between **[elements](../setup/elements.md)** in your project.

## Rule Details

This rule validates dependencies between elements in your project based on the provided configuration. It ensures that dependencies adhere to the defined architectural boundaries.

## Options

```
"boundaries/element-types":
  [<enabled>, { "default": <string>, "message": <string>, "rules": <object> }]
```

**Configuration properties:**

- `enabled`: Enables the rule. `0` = off, `1` = warning, `2` = error
- `default`: `"allow"` or `"disallow"`. Determines the default behavior for imports that don't match any rule
- `checkAllOrigins`: Optional. Whether to check dependencies from all origins (including external and core) or only from local elements (default: `false`, only local).
- `checkUnknownLocals`: Optional. Whether to check local dependencies with unknown elements (not matching any element descriptor) or to ignore them. (default: `false`)
- `checkInternals`: Optional. Whether to check internal dependencies (dependencies within files in the same element) (default: `false`).
- `message`: Custom error message for rule violations. Note that **the default message provides detailed information about why the error occurred**, so only define a custom message if necessary. See [error messages](#error-messages) for more information
- `rules`: An array of rule objects processed in order to determine whether an import should be allowed. Each rule object can contain the following properties:
  - `from`: **[`<element selector/s>`](../setup/selectors.md)** - If the file being analyzed matches this selector, the rule will be evaluated. Otherwise, it is skipped
  - `to`: **[`<element selector/s>`](../setup/selectors.md)** - If the dependency target matches this selector, the rule will be evaluated. Otherwise, it is skipped
  - `disallow`: **[`<dependency selector/s>`](../setup/selectors.md)** - If the dependency matches this selector, it is disallowed (can be overridden by a subsequent rule returning `"allow"`)
  - `allow`: **[`<element selector/s>`](../setup/selectors.md)** - If the dependency matches this selector, it is allowed (can be overridden by a subsequent rule returning `"disallow"`)
  - `message`: `<string>` - Custom error message for this specific rule. See [error messages](#error-messages) for more information
  - _`importKind`_: `<string>` - Optional. **Deprecated in v6** (kept for backward compatibility). Makes sense only for [TypeScript](../guides/typescript-support.md) projects. Use `dependency.kind` instead. If both are defined, `dependency.kind` takes precedence. Possible values: `"value"`, `"type"`, or `"typeof"`. If defined, the rule will only be evaluated for dependencies of the specified kind.

:::warning
You must provide at least one of `allow` or `disallow`, and one of `to` or `from` for each rule.
:::

:::tip Start checking external dependencies with this rule
In this version, the new `checkAllOrigins` option allows you to check dependencies from all origins (including external and core) instead of only checking dependencies between local known elements. This means that you can now use this rule to check and enforce boundaries for external dependencies as well, which was previously only possible with the deprecated `boundaries/external` rule. You can also use the new `origin` selector property in your rules to target specific origins (e.g., external, core, or local).

It is recommended to set `checkAllOrigins` to `true` and start defining rules for external dependencies in this rule instead of using the deprecated [`boundaries/external` rule](../rules/external.mdx).
:::

### Using selectors in this rule

This rule uses **[element and dependency selectors](../setup/selectors.md)** to define which elements can depend on other elements.

For example: You can use element selector properties to ensure components of one `type` can only import helpers of the same `type` in the `allow` selector.

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
    "boundaries/element-types": [2, {
      // disallow all local imports by default
      default: "disallow",
      rules: [
        {
          // from helper elements
          from: { type: "helper" },
          // allow importing helper elements
          allow: {
            to: { type: "helper" },
            // allow only importing value, not type (TypeScript only)
            dependency: { kind: "value" }
          },
        },
        {
          // from component elements
          from: { type: "component" },
          allow: {
            to: [
              // allow importing components of the same family
              { type: "component", captured: { family: "{{ family }}" } },
              // allow importing helpers with fileName "sort"
              { type: "helper", captured: { fileName: "sort" } }
            ]
          }
        },
        {
          // from components with captured family "molecule"
          from: { type: "component", captured: { family: "molecule" } },
          allow: {
            // allow importing components with captured family "atom"
            to: { type: "component", captured: { family: "atom" } }
          }
        },
        {
          // from modules
          from: { type: "module" },
          // allow importing helpers, components, and modules
          allow: {
            to: {
               type: ["helper", "component", "module"]
            }
          }
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

Components importing helpers with a fileName different than "sort":

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

Components importing helpers with fileName "sort":

```js
// src/components/atoms/atom-a/AtomA.js
import { someSorter } from 'helpers/data/sort'
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

  `No rule allowing this dependency was found. File is of type 'component' with family 'molecules' and elementName 'molecule-c'. Dependency is of type 'modules' with domain 'domain-a' and elementName 'module-a'`

- **Rule violation message:** When a specific rule disallows an import, the message includes which rule triggered it:

  `Importing elements of type 'component' with family 'atoms' and elementName '*-a' is not allowed in elements of type 'helper' with elementName 'helper-c'. Disallowed in rule 1`

- **Dependency kind message:** For TypeScript imports, the message also includes the dependency kind:

  `Importing kind "value" from elements of type 'component' with family 'atoms' and elementName '*-a' as 'value' is not allowed in elements of type 'helper' with elementName 'helper-c'. Disallowed in rule 1`

### Custom Messages with Templates

:::tip
You can customize error messages globally or for specific rules. See [Rules Configuration](../setup/rules.mdx) for details.
:::

## Further Reading

Read next sections to learn more about related topics:

* [Defining Elements](../setup/elements.md) - Learn how to define architectural elements in your project
* [Element Selectors](../setup/selectors.md) - Learn how to define and use element selectors in your rules
* [Rules Configuration](../setup/rules.mdx) - Learn how to configure common rule options
* [Global Settings](../setup/settings.md) - Learn about global settings that affect all rules
