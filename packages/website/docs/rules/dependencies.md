---
id: dependencies
title: Rule dependencies
sidebar_label: Dependencies
description: Documentation for the dependencies rule in ESLint Plugin Boundaries.
tags:
  - rules
  - configuration
  - examples
keywords:
  - eslint-plugin-boundaries
  - dependencies rule
  - dependency constraints
  - allow disallow
  - selectors
  - import restrictions
---

# dependencies

> Enforce allowed dependencies between **[elements](../setup/elements.md)** in your project.

`boundaries/dependencies` is the canonical rule for restricting dependencies between [elements](../setup/elements.md). This page documents the specifics of this rule, such as its options, error messages, and examples.

:::info[Rule configuration]
The shared configuration format for rules — the `rules` array, `allow`/`disallow` policies, [selectors](../setup/selectors.md), and custom message templates — is documented in **[Rules Configuration](../setup/rules.mdx)**. Read that page first to learn how to configure this rule.
:::

## Rule Details

This rule evaluates dependencies between elements. By default it checks only local-origin dependencies to known, non-internal targets. A dependency is skipped when its target is external or core, when its target element is unknown, or when it is internal to the same element. Use `checkAllOrigins`, `checkUnknownLocals`, and `checkInternals` to broaden coverage.

When a dependency is evaluated, the rule decides whether it is allowed or disallowed by matching it against your `rules`. Rules are processed in order, and the last rule that matches wins. Inside a single rule, `disallow` is evaluated before `allow`.

## Options

```text
"boundaries/dependencies": [
  <severity>,
  {
    "default": <string>,
    "message": <string>,
    "rules": <array>,
    "checkAllOrigins": <boolean>,
    "checkUnknownLocals": <boolean>,
    "checkInternals": <boolean>
  }
]
```

The first element is the ESLint severity (`0` = off, `1` = warning, `2` = error). The second element is the options object:

- `default`: `"allow"` or `"disallow"`. Determines the default behavior for dependencies that don't match any rule. When omitted, dependencies that match no rule are disallowed.
- `checkAllOrigins`: Optional. Whether to check dependencies from all origins (including external and core) or only from local elements (default: `false`, only local).
- `checkUnknownLocals`: Optional. Whether to check local dependencies whose target element is unknown (not matching any element descriptor) or to ignore them (default: `false`).
- `checkInternals`: Optional. Whether to check internal dependencies (dependencies within files in the same element) (default: `false`).
- `message`: Custom error message for rule violations. Note that **the default message provides detailed information about why the error occurred**, so only define a custom message if necessary. See [error messages](#error-messages) for more information.
- `rules`: An array of rule objects processed in order to determine whether a dependency should be allowed. Each rule object can contain the following properties:
  - `from`: **[`<entity selector/s>`](../setup/selectors.md)** - If the file being analyzed matches this selector, the rule is evaluated. Otherwise, it is skipped.
  - `to`: **[`<entity selector/s>`](../setup/selectors.md)** - If the dependency target matches this selector, the rule is evaluated. Otherwise, it is skipped.
  - `disallow`: **[`<dependency selector/s>`](../setup/selectors.md)** - If the dependency matches this selector, it is disallowed (can be overridden by a subsequent rule returning `"allow"`).
  - `allow`: **[`<dependency selector/s>`](../setup/selectors.md)** - If the dependency matches this selector, it is allowed (can be overridden by a subsequent rule returning `"disallow"`).
  - `message`: `<string>` - Custom error message for this specific rule. See [error messages](#error-messages) for more information.
  - _`importKind`_: `<string>` - Optional. **Deprecated** (kept for backward compatibility). Makes sense only for [TypeScript](../guides/typescript-support.md) projects. Use `dependency.kind` instead. If both are defined, `dependency.kind` takes precedence. Possible values: `"value"`, `"type"`, or `"typeof"`. If defined, the rule is only evaluated for dependencies of the specified kind.

:::note
`from` and `to` accept [entity selectors](../setup/selectors.md) with `element`, `file`, and `module` sub-selectors (for example, `from: { element: { type: "helper" } }`). Flat element selectors such as `{ type: "helper" }` also work and are converted internally. `allow` and `disallow` accept [dependency selectors](../setup/selectors.md) (`{ from?, to?, dependency? }`).
:::

:::warning
You must provide at least one of `allow` or `disallow` for each rule.
:::

:::tip[Match a specific import kind]
Use the `dependency.kind` property to evaluate only dependencies of a given kind: `"value"`, `"type"`, or `"typeof"`. This is useful in [TypeScript](../guides/typescript-support.md) projects, for example to allow type-only imports while disallowing value imports. See [Selectors](../setup/selectors.md) for the full dependency selector reference.
:::

:::tip[Check external dependencies with this rule]
Set `checkAllOrigins` to `true` to evaluate dependencies from all origins (external and core), not only local ones. You can then target external modules through the `module` sub-selector. This lets you enforce external dependency boundaries in this rule instead of the deprecated [`boundaries/external` rule](../rules/external.mdx):

```js
// Disallow components from importing react
{
  from: { element: { type: "component" } },
  disallow: { to: { module: { origin: "external", source: "react" } } }
}
```
:::

### Using selectors in this rule

This rule uses **[selectors](../setup/selectors.md)** to decide which dependencies a rule applies to. The `from` and `to` selectors locate the two sides of a dependency; the `dependency` selector matches its metadata (kind, relationship, and more).

For example, you can match components of one `family` and allow them to import only components of the same `family`, using a captured value in the selector.

:::info
Read the **[rules configuration](../setup/rules.mdx)** documentation to learn how to use common rule options, use [selectors](../setup/selectors.md) in rule options, and customize error messages with templates.
:::

:::tip
Enable [debug mode](../guides/debugging.md) to inspect the descriptions assigned to each file and dependency. This helps you see how selectors match and how to configure your rules.
:::

### Configuration Example

This example uses the entity selector form (`{ element: { ... } }`). It locates each side of a dependency through the `element` sub-selector, which also gives you access to `file` and `module` matching.

```js
{
  rules: {
    "boundaries/dependencies": [2, {
      // disallow all local imports by default
      default: "disallow",
      rules: [
        {
          // from helper elements
          from: { element: { type: "helper" } },
          // allow importing helper elements
          allow: {
            to: { element: { type: "helper" } },
            // allow only importing value, not type (TypeScript only)
            dependency: { kind: "value" }
          }
        },
        {
          // from component elements
          from: { element: { type: "component" } },
          allow: {
            to: [
              // allow importing components of the same family
              { element: { type: "component", captured: { family: "{{ from.element.captured.family }}" } } },
              // allow importing the sort.js file of any helper
              { element: { type: "helper", fileInternalPath: "sort.js" } }
            ]
          }
        },
        {
          // from components with captured family "molecules"
          from: { element: { type: "component", captured: { family: "molecules" } } },
          allow: {
            // allow importing components with captured family "atoms"
            to: { element: { type: "component", captured: { family: "atoms" } } }
          }
        },
        {
          // from modules
          from: { element: { type: "module" } },
          // allow importing helpers, components, and modules
          allow: {
            to: { element: { type: ["helper", "component", "module"] } }
          }
        }
      ]
    }]
  }
}
```

:::note
Flat element selectors such as `from: { type: "helper" }` still work and are converted internally to the entity selector form. Prefer `from: { element: { type: "helper" } }` in new configurations for access to `file` and `module` matching. See [Selectors](../setup/selectors.md).
:::

:::warning[Deprecated]
`{{ family }}` (a shorthand that reads captured values from the root of the template data) relies on `boundaries/legacy-templates` being `true`, which is the current default. Prefer the canonical form `{{ from.element.captured.family }}`. Read more about [message and selector templating](../setup/rules.mdx) and the [`boundaries/legacy-templates` setting](../setup/settings.md).
:::

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
        pattern: "helpers/*",
        capture: ["family"]
      },
      {
        type: "component",
        pattern: "components/*/*",
        capture: ["family", "elementName"]
      },
      {
        type: "module",
        pattern: "modules/*",
        capture: ["elementName"]
      }
    ],
    "import/resolver": {
      "babel-module": {}
    }
  }
}
```

With these descriptors, each `helpers/<family>` folder is one helper element (so `helpers/data` captures `family: "data"`). The files inside, such as `sort.js` and `parse.js`, are distinguished by their `fileInternalPath`.

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

Components importing a helper file other than "sort.js":

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

Components importing the "sort.js" helper file:

```js
// src/components/atoms/atom-a/AtomA.js
import { someSorter } from 'helpers/data/sort'
```

Molecule components importing atom components:

```js
// src/components/molecules/molecule-a/MoleculeA.js
import AtomA from 'components/atoms/atom-a'
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

- **No matching rule message:** When no rule matches a dependency and the default behavior is `"disallow"`, the message starts with:

  `There is no rule allowing dependencies ...`

  Then it describes the elements involved in the dependency. Captured values are listed as `captured values: key="value"`.

  Example:

  `There is no rule allowing dependencies from elements of type "helper" and captured values: family="permissions" to elements of type "component" and captured values: family="atoms", elementName="atom-a"`

- **Denied by rule message:** When a rule matches and denies a dependency, the message describes the denied selector and ends with the rule index:

  `... . Denied by rule at index <n>`

  Example:

  `Dependencies to elements of type "component" and captured values: family="atoms", elementName="atom-a" are not allowed in elements of type "helper" and captured values: family="permissions". Denied by rule at index 1`

  **The exact sentence varies depending on which [selector](../setup/selectors.md) parts were used to match the dependency** (in any of `from`, `to`, `dependency`, `disallow`). For dependencies on external or core modules, messages describe the module instead of an element, for example `module with origin "external" and module source "react"`. This detailed information helps you understand exactly why a dependency is disallowed and how to adjust your rules or code.

### Custom Messages with Templates

:::tip
You can customize error messages globally or for specific rules. Use the [`message` option](#options) in your rule configuration and see [Rules Configuration -> Message Templating](../setup/rules.mdx#message-templating) for more details.
:::

## Further Reading

Read next sections to learn more about related topics:

* [Defining Elements](../setup/elements.md) - Learn how to define architectural elements in your project
* [Selectors](../setup/selectors.md) - Learn about element, file, and module selectors used in rules
* [Rules Configuration](../setup/rules.mdx) - Learn how to configure common rule options
* [Global Settings](../setup/settings.md) - Learn about global settings that affect all rules
