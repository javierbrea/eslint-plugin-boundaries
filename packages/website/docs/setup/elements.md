---
id: elements
title: Element Descriptors
sidebar_label: Elements
description: Learn how to use element descriptors to classify files in your project for ESLint Plugin Boundaries.
tags:
  - concepts
  - configuration
keywords:
  - eslint-plugin-boundaries
  - JavaScript
  - TypeScript
  - element descriptors
  - file descriptors
  - multi-type elements
  - entity model
  - captured values
  - runtime descriptions
  - patterns
  - path matching
  - architecture enforcement
  - import restrictions
  - dependency constraints
---

# Element Descriptors

Elements are one of the three [classification](./classification.md) layers. **An element is the architectural piece a file belongs to** — usually a folder, such as `components/Button/` or `helpers/data/`. Element descriptors define how to recognize those pieces from file paths.

The other two layers describe a file from different angles: its kind (see [Files](./files.md)) and where its imports resolve to (see [Modules](./modules.md)). This page covers the element layer.

## Defining Element Descriptors

Element descriptors are configured in the `boundaries/elements` setting as an array of objects. Each descriptor defines:

- **What type** of element it represents.
- **What pattern** to match against file paths.
- **What values** to capture from those paths.

```javascript
export default [{
  settings: {
    "boundaries/elements": [
      { type: "helper", pattern: "helpers/*", capture: ["family"] },
      { type: "component", pattern: "components/*/*", capture: ["family", "elementName"] },
      { type: "module", pattern: "modules/*", capture: ["elementName"] }
    ]
  }
}]
```

This is the running example used across the documentation. It maps to the following project structure:

```text
src/
├── components/
│   ├── atoms/atom-a/{index.js, AtomA.js}
│   └── molecules/molecule-a/{index.js, MoleculeA.js}
├── helpers/
│   ├── data/{sort.js, parse.js}
│   └── permissions/roles.js
└── modules/
    ├── module-a/{index.js, ModuleA.js}
    └── module-b/{index.js, ModuleB.js}
```

Here `helpers/data` and `helpers/permissions` are `helper` elements (with `captured.family` equal to `"data"` and `"permissions"`). Individual files inside an element are distinguished by their [`fileInternalPath`](#element-description).

:::tip
Read the [Selectors](./selectors.md) section to learn how to match these elements in rules, and [Captured Values Matching](./selectors.md#captured-values-matching) to use the values you capture here.
:::

During analysis, the plugin transforms descriptors into a runtime **element description** — the element layer of an [entity](./classification.md). It carries the element's `types`, `path`, `captured` values, and `parents`. See [Element Description](#element-description) for the full breakdown, and [Classification](./classification.md#what-the-plugin-sees) for how it combines with the file and module layers.

## Element Descriptor Properties

### `pattern` (required)

**Type:** `<string> | <array of strings>`

A [micromatch pattern](https://github.com/micromatch/micromatch) to match against file paths. An array means OR — the first matching pattern wins.

:::warning
By default, the plugin matches patterns progressively from the **right side** of each file path. You only need to define the last part of the path you want to match, not the full path from the project root.
:::

**Example:** Given a path `src/helpers/data/parse.js`, the plugin tries to match, in order:

- `parse.js`
- `data/parse.js`
- `helpers/data/parse.js`
- and so on…

Once a pattern matches, the plugin assigns the corresponding element, then keeps searching at higher path levels for [parent elements](#hierarchical-elements) using the same logic until the full path has been analyzed.

```js
{ type: "helper", pattern: "helpers/*", capture: ["family"] }
```

### `type` (optional)

**Type:** `<string>`

The element type assigned to files matching the pattern (for example, `"component"`). It is stored in the element's [`types`](#element-description) array.

```js
{ type: "helper" }
```

:::warning
Each descriptor must define at least one of `type` or `category`. Descriptors without a valid `pattern` and one of these are filtered out with a warning.
:::

### `category` (optional)

:::warning[Deprecated]
`category` in element descriptors is kept for backward compatibility but is deprecated and will be removed in a future major version. Use **[file descriptor categories](./files.md)** instead.
:::

**Type:** `<string>`

It keeps working without changes. File descriptors are a better fit because they categorize files independently of elements — one element can contain files in several categories, and a file can have several categories at once.

To migrate, move the category from the element descriptor to a [file descriptor](./files.md):

| Legacy (element descriptor) | Recommended (file descriptor) |
| --- | --- |
| `{ type: "helper", category: "helper", pattern: "helpers/*" }` | `{ type: "helper", pattern: "helpers/*" }` plus `boundaries/files`: `{ pattern: "helpers/**", category: "helper" }` |

See the [v6 to v7 migration guide](../releases/migration-guides/v6-to-v7.mdx) for full details.

### `capture` (optional)

**Type:** `<array of strings>`

Captures named values from path fragments so you can reference them later in [rule selectors](./selectors.md). Uses the [micromatch capture feature](https://github.com/micromatch/micromatch#capture) under the hood.

Each captured fragment is stored under the key from the `capture` array at the same index.

```js
{ type: "component", pattern: "components/*/*", capture: ["family", "elementName"] }
```

For a path `components/atoms/atom-a/AtomA.js`, this captures:

```js
{ family: "atoms", elementName: "atom-a" }
```

:::tip
Captured values can be used in [element selectors](./selectors.md) to create more specific, dynamic rules.
:::

### `basePattern` (optional)

**Type:** `<string>`

A [micromatch pattern](https://github.com/micromatch/micromatch) that the **left side** of the path (from the project root) must also match. Use it when `pattern` only covers the right side of the path but you also need to capture values from earlier path segments (see `baseCapture`).

The effective pattern becomes `[basePattern]/**/[pattern]`.

```js
{
  type: "component",
  pattern: "components/*",
  basePattern: "src/modules/*",
  capture: ["componentName"],
  baseCapture: ["moduleName"]
}
```

### `baseCapture` (optional)

**Type:** `<array of strings>`

Works like `capture`, but for `basePattern`. Both arrays' keys are available in rules.

For a path `src/modules/auth/components/login-form` with the descriptor above, this captures:

```js
{ moduleName: "auth", componentName: "login-form" }
```

:::warning
Keep keys unique across `capture` and `baseCapture`. On a name collision, the value from `capture` wins.
:::

## Element Matching Order

:::danger
Element descriptors are evaluated in **array order**. The descriptor order determines the primary type: the first matching descriptor at a path level sets `types[0]`.
:::

With the default single-type behavior (`boundaries/elements-single-type: true`), only the first matching descriptor at a path level applies. With [multi-type](#multi-type-elements) enabled (`boundaries/elements-single-type: false`), every descriptor that matches the same path level contributes a type, in descriptor order.

**Best practice:** Sort descriptors from most specific to least specific.

```js
"boundaries/elements": [
  // Most specific first
  { type: "react-component", pattern: "components/*/Component.tsx" },
  // Less specific patterns after
  { type: "component", pattern: "components/*" }
]
```

## Hierarchical Elements

The plugin supports elements being children of other elements. This relationship can be used in rules to restrict access based on the relationship (for example, only allow importing from child elements).

After finding the first match, the plugin keeps searching at higher path levels for parent elements.

```js
"boundaries/elements": [
  { type: "component", pattern: "components/*", capture: ["componentName"] },
  { type: "module", pattern: "modules/*", capture: ["moduleName"] }
]
```

For path `src/modules/auth/components/login-form/index.js`:

1. First matches the `component` element (`login-form`).
2. Continues and matches the `module` element (`auth`) as its parent.

Parents are listed in `element.parents`, nearest first. See [Element Description](#element-description).

## Multi-type Elements

By default, each element gets a single type. You can opt in to letting an element have **multiple types** at once, which is useful when the same files belong to more than one architectural concept.

The element's matched types are exposed as the `types` array. The `type` selector matches only the first type (`types[0]`); the `types` selector matches any type in the array.

To enable multi-type matching, set [`boundaries/elements-single-type`](./settings.md#boundarieselements-single-type) to `false`:

```js
export default [{
  settings: {
    "boundaries/elements-single-type": false,
    "boundaries/elements": [
      { type: "component", pattern: "shared/*" },
      { type: "shared", pattern: "shared/*" }
    ]
  }
}]
```

With this configuration, a file under `shared/*` matches both descriptors at the same path level, so its element has `types: ["component", "shared"]`. The types accumulate in descriptor declaration order.

When multiple descriptors match at the same path level, their `captured` values are **merged** into a single object. On a key collision across descriptors, the last matching descriptor wins (i.e., later descriptors in the array override earlier ones). This applies to the main element and to each parent element independently.

:::warning
Multi-type matching is **off by default** in the plugin: `boundaries/elements-single-type` defaults to `true` for backward compatibility. Set it to `false` to opt in. See the [setting reference](./settings.md#boundarieselements-single-type) for the full details, including how this default differs from the underlying library.
:::

Two descriptors match "at the same path level" when they resolve to the same element `path` (the same matched folder). Parents accumulate types the same way. A descriptor that matched with only a deprecated `category` (no `type`) leaves `types` as `null` and does not accumulate later types.

## Element Descriptor `mode`

:::warning[Deprecated]
`mode` is kept for backward compatibility but is deprecated and will be removed in a future major version. Element descriptors now always use folder-like matching, and file classification use cases are covered by **[file descriptors](./files.md)**.
:::

**Type:** `<string>` — one of `"folder"` | `"file"` | `"full"`. **Default:** `"folder"`.

It keeps working without changes. `mode` controlled how a pattern was interpreted:

- **`folder`** (default): the element is a folder. The pattern is expanded internally (effectively adding `/**/*`), so any file under the matched folder belongs to the element. This is the standard behavior — you no longer need to set it.
- **`file`**: the element is the file itself, matched right-to-left without the folder expansion. Use cases that classified individual files this way are now better expressed with [file descriptors](./files.md) and their categories.
- **`full`**: the pattern must match the **entire** file path (relative to [`rootPath`](./settings.md#boundariesroot-path)). It still works and currently has no direct replacement.

If you have configs that relied on `mode: "file"` to classify files, migrate them to file descriptors. See the [v6 to v7 migration guide](../releases/migration-guides/v6-to-v7.mdx).

## Element Description

The plugin resolves each file to a runtime **element description** — the element layer of an [entity](./classification.md). It is accessed as `from.element` / `to.element`, used by [selectors](./selectors.md) to match dependencies and by [message templates](./rules.mdx#message-templating) to render dynamic error messages.

The other two layers have their own tables: [File description](./files.md#file-description) (`categories`) and [Module description](./modules.md#module-description) (`origin`, `source`). See [Classification](./classification.md#what-the-plugin-sees) for how the three combine into one entity.

Properties:

- **`types`** `<array of strings | null>` - All element types matched at the main path level (see [multi-type](#multi-type-elements)), or `null` when the file matches no element descriptor.
- **`path`** `<string | null>` - Path of the element (the matched folder or file). Relative to [`rootPath`](./settings.md#boundariesroot-path) when inside it, absolute when outside, or `null` for unknown elements.
- **`fileInternalPath`** `<string | null>` - Path of the file relative to its element path, or `null` for unknown elements.
- **`captured`** `<object | null>` - Captured values from the matched descriptor, or `null` when there are none.
- **`parents`** `<array>` - Ancestor elements, nearest first. Each parent has:
  - **`types`** `<array of strings | null>` - Parent element types.
  - **`path`** `<string | null>` - Parent element path.
  - **`captured`** `<object | null>` - Parent captured values.
- **`isIgnored`** `<boolean>` - `true` when the file is excluded by [ignore/include](./settings.md#boundariesignore) settings.
- **`isUnknown`** `<boolean>` - `true` when the file matches no element descriptor.

:::note[Deprecated element properties]
The following remain available for backward compatibility but are deprecated:

- *`type`* `<string | null>` - Alias for `types[0]`. Use `types`.
- *`category`* `<string | null>` - Deprecated element category. Use `file.categories`.
- *`elementPath`* `<string | null>` - Legacy alias for `path`.
- *`filePath`* `<string | null>` - Legacy alias kept for the deprecated `mode: "file"`.
- *`internalPath`* - Legacy alias; in V7 it maps to `fileInternalPath` for local elements and to `module.internalPath` for external modules.

Parent elements expose the matching legacy aliases (`type`, `category`, `elementPath`).
:::

## Runtime Description Properties

An element description is one layer of the runtime **entity** the plugin builds for each file. The other layers — the file and the module — are documented with their own layers: see [File description](./files.md#file-description) (`categories`) and [Module description](./modules.md#module-description) (`origin`, `source`, `internalPath`).

For the combined entity and the dependency description (`kind`, `relationship`, `specifiers`), see [Classification](./classification.md).

## Next Steps

- **[Files](./files.md)** - categorize files across elements with file descriptors.
- **[Modules](./modules.md)** - understand module origin for external and core imports.
- **[Selectors](./selectors.md)** - match elements, files, and modules in your rules.
- **[Rules Configuration](./rules.mdx)** - write dependency rules that enforce your architecture.
- **[Settings](./settings.md)** - the full reference for `boundaries/files`, `boundaries/elements-single-type`, and every other global setting.
