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

> Enforce dependency constraints in your project.

`boundaries/dependencies` is the canonical rule for restricting dependencies. This page documents the specifics of this rule, such as its options, error messages, and examples.

:::info
This page focuses on how to configure the `boundaries/dependencies` rule options. You should read the [Classification](../classification/classification.md), [Selectors](../selectors/selectors.md), and [Policies](../policies/policies.mdx) sections to understand how to define your architecture, select dependencies, and configure policies and custom messages.
:::

## Rule Details

This rule evaluates dependencies. By default it checks only local-origin dependencies to known, non-internal targets. A dependency is skipped when its target is external or core, when its target is unknown, or when it is internal to the same element. Use `checkAllOrigins`, `checkUnknownLocals`, and `checkInternals` to broaden coverage.

When a dependency is evaluated, the rule decides whether it is allowed or disallowed by matching it against your `rules`, which contains the policies. Policies are processed in order, and the last policy that matches wins. Inside a single policy, `disallow` is evaluated before `allow`.

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

- `default`: `"allow"` or `"disallow"`. Determines the default behavior for dependencies that don't match any policy. When omitted, dependencies that match no policy are disallowed.
- `checkAllOrigins`: Optional. Whether to check dependencies from all origins (including external and core) or only from local elements (default: `false`, only local).
- `checkUnknownLocals`: Optional. Whether to check local dependencies whose target element is unknown (not matching any element descriptor) or to ignore them (default: `false`).
- `checkInternals`: Optional. Whether to check internal dependencies (dependencies within files in the same element) (default: `false`).
- `message`: Custom error message for rule violations. Note that **the default message provides detailed information about why the error occurred**, so only define a custom message if necessary. See [error messages](#error-messages) for more information.
- `rules`: An array of policy objects processed in order to determine whether a dependency should be allowed. Each policy object can contain the following properties:
  - `from`: **[`<entity selector/s>`](../selectors/selectors.md)** - If the file being analyzed matches this selector, the policy is evaluated. Otherwise, it is skipped.
  - `to`: **[`<entity selector/s>`](../selectors/selectors.md)** - If the dependency target matches this selector, the policy is evaluated. Otherwise, it is skipped.
  - `disallow`: **[`<dependency selector/s>`](../selectors/selectors.md)** - If the dependency matches this selector, it is disallowed (can be overridden by a subsequent policy returning `"allow"`).
  - `allow`: **[`<dependency selector/s>`](../selectors/selectors.md)** - If the dependency matches this selector, it is allowed (can be overridden by a subsequent policy returning `"disallow"`).
  - `message`: `<string>` - Custom error message for this specific policy. See [error messages](#error-messages) for more information.
  - _`importKind`_: `<string>` - Optional. **Deprecated** (kept for backward compatibility). Makes sense only for [TypeScript](../guides/typescript-support.md) projects. Use `dependency.kind` instead. If both are defined, `dependency.kind` takes precedence. Possible values: `"value"`, `"type"`, or `"typeof"`. If defined, the rule is only evaluated for dependencies of the specified kind.

:::warning
You must provide at least one of `allow` or `disallow` effect for each policy.
:::

:::tip[Match a specific import kind]
Use the `dependency.kind` property to evaluate only dependencies of a given kind: `"value"`, `"type"`, or `"typeof"`. This is useful in [TypeScript](../guides/typescript-support.md) projects, for example to allow type-only imports while disallowing value imports. See [Selectors](../selectors/selectors.md) for the full dependency selector reference.
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

This rule uses **[selectors](../selectors/selectors.md)** to decide which dependencies a policy applies to. The `from` and `to` selectors locate the two sides of a dependency; the `dependency` selector matches its metadata (kind, relationship, and more).

For example, you can match components of one `family` and allow them to import only components of the same `family`, using a captured value in the selector.

:::tip
Enable [debug mode](../guides/debugging.md) to inspect the descriptions assigned to each file and dependency. This helps you see how selectors match and how to configure your policies.
:::

### Configuration Example

This example uses the entity selector form (`{ element: { ... } }`). It locates each side of a dependency through the [`entity` selector](../selectors/selectors.md), which gives you access to `element`, `file`, and `module` matching.

```js
{
  rules: {
    "boundaries/dependencies": [2, {
      // disallow all local imports by default
      default: "disallow",
      policies: [
        {
          // from helper elements
          from: { element: { type: "helper" } },
          allow: {
            to: {
              element: { type: "helper" },
              // allow only files categorized as "util" and not "internal" (array query)
              file: { categories: { anyOf: ["util"], noneOf: ["internal"] } }
            },
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
        },
        {
          // from any element
          from: { element: { type: "*" } },
          // disallow importing files categorized as "test" (file selector)
          disallow: {
            to: { file: { categories: "test" } }
          }
        }
      ]
    }]
  }
}
```

:::tip[Match file selectors and descriptors]
File selectors (`{ file: { ... } }`) let you target files by pattern-based **categories** instead of by literal path, which is more flexible than `element.fileInternalPath`. Categories are defined with the [`boundaries/files` setting](../classification/files.md) and, unlike element types, they accumulate: a single file can match several patterns and end up with several categories, for example `["util", "public"]`. See the [Settings](#settings) section below for a concrete `boundaries/files` example.
:::

:::tip[Array queries]
When a property holds an array of values (`element.types`, `file.categories`, `element.parents`), a plain value or list checks for **any match** (OR logic). Use an **array query** to express richer conditions: `allOf`, `noneOf`, `equalsTo`, `atIndex`, and `hasLength`. For example, `{ file: { categories: { anyOf: ["util"], noneOf: ["internal"] } } }` matches files categorized as `"util"` as long as they are not also categorized as `"internal"`.

Array queries also support an `expand` helper to spread a templated value (such as a captured value from `from`) into the query at evaluation time:

```js
// Only allow importing elements that share at least one type with the importer
{
  to: { element: { types: { anyOf: [{ expand: "{{ from.element.types }}" }] } } }
}
```

See [Selectors -> Array Query Selectors](../selectors/selectors.md#array-query-selectors) for the full reference.
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
│   │   ├── sort.spec.js
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
    "boundaries/files": [
      // any spec file is categorized as "test"
      { pattern: "**/*.spec.js", category: "test" },
      // any file under helpers/ is categorized as "util"
      { pattern: "helpers/**/*.js", category: "util" },
      // files under helpers/permissions/ are additionally categorized as "internal"
      { pattern: "helpers/permissions/**/*.js", category: "internal" }
    ],
    "import/resolver": {
      "babel-module": {}
    }
  }
}
```

With these descriptors, each `helpers/<family>` folder is one helper element (so `helpers/data` captures `family: "data"`). The files inside, such as `sort.js` and `parse.js`, are distinguished by their `fileInternalPath`.

File categories accumulate: `helpers/data/sort.js` matches only the `helpers/**/*.js` pattern, so its `categories` is `["util"]`, while `helpers/permissions/roles.js` matches both the `helpers/**/*.js` and `helpers/permissions/**/*.js` patterns, so its `categories` is `["util", "internal"]`. This is what the array query policy in the [Configuration Example](#configuration-example) uses to allow importing `"util"` helper files while excluding `"internal"` ones.

:::note
These examples use aliases for the `src/helpers`, `src/components`, and `src/modules` folders for simplicity. In a real project, you can use any folder structure and naming convention.
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

Any element importing a test file (file selector, `file.categories`):

```js
// src/components/atoms/atom-a/AtomA.js
import { sortDescending } from 'helpers/data/sort.spec'
```

Helpers importing another helper's "internal" file (array query, `noneOf: ["internal"]`):

```js
// src/helpers/data/sort.js
import { roleHasPermissions } from 'helpers/permissions/roles'
```

### Correct

Helpers importing "util" (non-"internal") helper files (array query, `anyOf: ["util"], noneOf: ["internal"]`):

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

  **The exact sentence varies depending on which [selector](../selectors/selectors.md) parts were used to match the dependency** (in any of `from`, `to`, `dependency`, `disallow`). For dependencies on external or core modules, messages describe the module instead of an element, for example `module with origin "external" and module source "react"`. This detailed information helps you understand exactly why a dependency is disallowed and how to adjust your rules or code.

### Custom Messages with Templates

:::tip
You can customize error messages globally or for specific policies. Use the [`message` option](#options) in your rule configuration and see [Rules Configuration -> Message Templating](../policies/policies.mdx#message-templating) for more details.
:::

## Further Reading

Read next sections to learn more about related topics:

* [Defining Elements](../classification/elements.md) - Learn how to define architectural elements in your project
* [Defining Files](../classification/files.md) - Learn how to categorize files with the `boundaries/files` setting
* [Selectors](../selectors/selectors.md) - Learn about element, file, and module selectors, including array queries
* [Policies](../policies/policies.mdx) - Learn how to configure common rule options
* [Global Settings](../settings/settings.md) - Learn about global settings that affect all rules
