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

Element descriptors are configured in the [`boundaries/elements` setting](../settings/settings.md) as an array of objects. Each descriptor defines:

- **What type/s** of element/s it represents.
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

:::note
Here `helpers/data` and `helpers/permissions` are `helper` elements (with `captured.family` equal to `"data"` and `"permissions"`). Individual files inside an element are distinguished by their [`fileInternalPath`](#element-description).
:::

:::tip
Read the [Selectors](../selectors/selectors.md) section to learn how to match these elements in rules, and [Captured Values Matching](../selectors/selectors.md#captured-values-matching) to use the values you capture here.
:::

During analysis, the plugin transforms descriptors into a runtime [Element Descriptions](#element-description). Read the section below for the full breakdown, and [Classification](./classification.md#entity) for how it combines with the file and module layers.

## Element Descriptor Properties

### `pattern` (required)

**Type:** `<string> | <array of strings>`

A [micromatch pattern](https://github.com/micromatch/micromatch) to match against file paths. An array means OR — the first matching pattern wins.

:::tip
Element patterns should match **folders**, not individual files. Do not include file extensions in element patterns. To classify individual files by kind, use [file descriptors](./files.md).
:::

:::warning
By default, the plugin matches patterns progressively from the **right side** of each file path. You only need to define the last part of the path you want to match, not the full path from the project root. To change this behavior, see [`partialMatch`](#partialmatch-optional).
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

<details>
<summary>Why is partial (right-to-left) matching the default?</summary>

The default matching appends `/**/*` to the pattern and tests it against progressively longer path suffixes. This behaves like an implicit `**/` prefix: `components/*` matches `src/components/Button`, `packages/ui/src/components/Button`, and any other path that ends in `components/<something>` — without you having to write the full prefix.

The main benefit is in captures. With `pattern: "components/*", capture: ["componentName"]`, the captured slot maps directly to the folder you care about. No throwaway wildcard is needed for the path prefix. If you also need a value from the left side of the path (e.g. the module that contains the component), use `basePattern` and `baseCapture` for that segment.

This is the default only for backward compatibility, and it is exposed through the [`partialMatch`](#partialmatch-optional) option. Set [`partialMatch: false`](#partialmatch-optional) when the pattern must be anchored at the project root — for example to distinguish two `components/` trees that live under different parent folders. Note that [file descriptors](./files.md) always match the full path, with no equivalent option.

</details>

### `type` (optional)

**Type:** `<string>`

The element type assigned to files matching the pattern (for example, `"component"`). It is stored in the element's [`types`](#element-description) array.

```js
{ type: "helper" }
```

:::warning
Each descriptor must define at least one of `type` or `category`. Descriptors without a valid `pattern` and one of these are filtered out with a warning.
:::

### `category` (deprecated)

:::warning[Deprecated]
`category` in element descriptors is deprecated. Use **[file descriptor categories](./files.md)** instead. It keeps working without changes; the full reference and migration table are on the **[Legacy Element Fields](./elements/legacy.md#category-optional)** page.
:::

### `capture` (optional)

**Type:** `<array of strings>`

Captures named values from path fragments so you can reference them later in [rule selectors](../selectors/selectors.md). Uses the [micromatch capture feature](https://github.com/micromatch/micromatch#capture) under the hood.

Each captured fragment is stored under the key from the `capture` array at the same index.

```js
{ type: "component", pattern: "components/*/*", capture: ["family", "elementName"] }
```

For a path `components/atoms/atom-a/AtomA.js`, this captures:

```js
{ family: "atoms", elementName: "atom-a" }
```

:::tip
Captured values can be used in [element selectors](../selectors/selectors.md) to create more specific, dynamic rules.
:::

<details>
<summary>Combine with `partialMatch` for targeted captures</summary>

Because `partialMatch: true` (the default) matches from the right side of the path, you only need wildcards in the segments you actually want to capture — intermediate directories are traversed automatically. For example, `pattern: "components/*", capture: ["componentName"]` captures the component folder name from any path ending in `components/<something>`, without writing a prefix wildcard.

If you also need a value from the **left** side of the path (for example, which module a component belongs to), add `basePattern` and `baseCapture` instead of expanding the `pattern` with extra wildcards:

```js
{
  type: "component",
  pattern: "components/*",
  basePattern: "src/modules/*",
  capture: ["componentName"],
  baseCapture: ["module"]
}
// For src/modules/auth/components/login-form: captures { module: "auth", componentName: "login-form" }
```

</details>

### `basePattern` (optional)

**Type:** `<string>`

A [micromatch pattern](https://github.com/micromatch/micromatch) that the **left side** of the path (from the project root) must also match. Use it when `pattern` only covers the right side of the path but you also need to capture values from earlier path segments (see `baseCapture`).

The effective pattern becomes `[basePattern]/**/[pattern]`.

:::info
`basePattern` (and `baseCapture`) are only meaningful when `partialMatch: true` (the default). When `partialMatch: false`, the full path is already expressed in `pattern`, so there is no separate left side to constrain.
:::

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

Works like `capture`, but for `basePattern`. Both arrays' keys are available in rules. Because it is the companion to `basePattern`, it is only applicable when `partialMatch: true`.

For a path `src/modules/auth/components/login-form` with the descriptor above, this captures:

```js
{ moduleName: "auth", componentName: "login-form" }
```

:::warning
Keep keys unique across `capture` and `baseCapture`. On a name collision, the value from `capture` wins.
:::

### `partialMatch` (optional)

**Type:** `<boolean>`. **Default:** `true`.

When `true` (the default), the pattern only needs to match a **suffix** of the file path, using right-to-left incremental accumulation: `components/*` matches `src/components/Button`, `packages/ui/src/components/Button`, and any other path ending in `components/<something>`, without writing the full prefix.

When set to `false`, the pattern is matched against the **full file path** from the project root (relative to [`rootPath`](../settings/settings.md#boundariesroot-path)). Unlike the deprecated `mode: "full"`, the descriptor still uses **folder semantics**: the pattern is expanded with `/**/*` internally, and the resolved element `path` is the matched folder prefix, not the full file path. `fileInternalPath` is computed the same way as in folder mode. When `partialMatch: false` is set, `mode` has no effect.

| | `partialMatch: true` (default) | `partialMatch: false` | `mode: "full"` (deprecated) |
|---|---|---|---|
| Pattern suffix | `/**/*` appended | `/**/*` appended | none |
| Match target | Right-to-left accumulated segments | Full file path | Full file path |
| Element `path` | Matched folder | Matched folder prefix | Full file path |

:::info
`partialMatch` defaults to `true` for backward compatibility. It will most likely default to `false` in a future major version, and eventually be removed — requiring the full pattern is more intuitive and is already how [file descriptors](./files.md) match. Prefer setting `partialMatch: false` and writing the full path from the project root when you can.
:::

Use `partialMatch: false` when the pattern must be anchored at the project root — for example to distinguish two `components/` trees that live under different parent folders. With it set, the pattern must specify the full path from the project root; relative patterns that omit the root prefix will not match.

```js
{
  type: "component",
  pattern: "src/ui/components/*",
  partialMatch: false,
  capture: ["componentName"]
}
```

For a file at `src/ui/components/Button/index.tsx`:
- Matches because the full path satisfies `src/ui/components/*/**/*`.
- `element.path` is `src/ui/components/Button`.
- `fileInternalPath` is `index.tsx`.

### `mode` (deprecated)

:::warning[Deprecated]
`mode` is deprecated. Element descriptors now always use folder-like matching; file classification use cases are covered by **[file descriptors](./files.md)**, and full-path matching by [`partialMatch: false`](#partialmatch-optional). It keeps working without changes; the full reference and migration steps are on the **[Legacy Element Fields](./elements/legacy.md#mode-optional)** page.
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

By default, each element gets a single type. You can opt in to letting an element have **multiple types** at once, which is useful when the same folders belong to more than one architectural concept.

The element's matched types are exposed as the `types` array. The `type` selector matches only the first type (`types[0]`); the `types` selector matches any type in the array.

To enable multi-type matching, set [`boundaries/elements-single-type`](../settings/settings.md#boundarieselements-single-type) to `false`:

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
Multi-type matching is **off by default** in the plugin: `boundaries/elements-single-type` defaults to `true` for backward compatibility. Set it to `false` to opt in. See the [setting reference](../settings/settings.md#boundarieselements-single-type) for the full details.
:::

Two descriptors match "at the same path level" when they resolve to the same element `path` (the same matched folder). Parents accumulate types the same way.

## Element Description

Based on element descriptors, the plugin resolves each file to a runtime **element description** — the element layer of an [entity](./classification.md). It is accessed as `from.element` / `to.element`, used by [selectors](../selectors/selectors.md) to match dependencies and by [message templates](../policies/policies.mdx#message-templating) to render dynamic error messages.

The other two layers have their own tables: [File description](./files.md#file-description) (`categories`) and [Module description](./modules.md#module-description) (`origin`, `source`). See [Classification](./classification.md#entity) for how the three combine into one entity.

| Property | Type | Description |
| --- | --- | --- |
| `types` | `<array of strings \| null>` | All element types matched at the main path level (see [multi-type](#multi-type-elements)), or `null` when the file matches no element descriptor. |
| `path` | `<string \| null>` | Path of the element (the matched folder or file when using legacy mode "file"). Relative to [`rootPath`](../settings/settings.md#boundariesroot-path) when inside it, absolute when outside, or `null` for unknown elements. |
| `fileInternalPath` | `<string \| null>` | Path of the file relative to its element path, or `null` for unknown elements. It varies depending on the file that was analyzed to get the element description. |
| `captured` | `<object \| null>` | Captured values from the matched descriptor, or `null` when there are none. |
| `parents` | `<array>` | Ancestor elements, nearest first. Each parent has `types`, `path`, and `captured` (same meaning as above, but for the parent element). |
| `isIgnored` | `<boolean>` | `true` when the file is excluded by [ignore/include](../settings/settings.md#boundariesignore) settings. |
| `isUnknown` | `<boolean>` | `true` when the file matches no element descriptor. |

:::note[Deprecated element properties]
Read the **[Legacy Element Fields](./elements/legacy.md)** page for deprecated element description fields that are still available for backward compatibility.
:::

## Matching Elements using Selectors

To target an element, use the [`element` sub-selector](../selectors/element.md) inside a rule's `to`:

```js
// Match elements with the "helper" type
{ to: { element: { types: ["helper"] } } }
```

See [Element Selectors](../selectors/element.md) for the full `element` selector reference.

## Interaction with `no-unknown-files`

The [`no-unknown-files`](../rules/no-unknown-files.md) rule reports files that the plugin does not recognize. A file is reported only when it belongs to no known element **and** matches no file descriptor.

This means defining an element descriptor makes the matching files **known**: a file that matches any `boundaries/elements` pattern is no longer flagged, even if it does not match any file descriptor.

## Next Steps

- **[Files](./files.md)** - categorize files across elements with file descriptors.
- **[Modules](./modules.md)** - understand module origin for external and core imports.
- **[Selectors](../selectors/selectors.md)** - match elements, files, and modules in your rules.
- **[Policies](../policies/policies.mdx)** - write dependency rules that enforce your architecture.
- **[Settings](../settings/settings.md)** - the full reference for `boundaries/files`, `boundaries/elements-single-type`, and every other global setting.
