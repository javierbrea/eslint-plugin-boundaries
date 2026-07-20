---
id: element
title: Element Selector
sidebar_label: Element
description: Match the element an analyzed file belongs to — by type, path, captured values, and ancestor chain — in eslint-plugin-boundaries.
tags:
  - concepts
  - configuration
keywords:
  - eslint-plugin-boundaries
  - JavaScript
  - TypeScript
  - element selector
  - entity selector
  - type
  - types
  - parent
  - parents
  - captured values
  - micromatch
---

# Element Selector

The **element sub-selector** matches the [element](../classification/elements.md) a file belongs to. It is the `element` key of an [entity selector](./selectors.md#entity-selectors):

```js
{ element: { /* element sub-selector */ } }
```

All values are [micromatch pattern(s)](https://github.com/micromatch/micromatch) unless noted. All conditions inside the selector are combined with **AND**; arrays act as **OR**.

## Properties

- **`type`** — Matches the element's **first** type (`types[0]`). With single-type elements (the default), this is the only type, so `type` is all you need. <small>(`<string | string[] | null>`)</small>
- **`types`** — Matches against the element's type array. Accepts a micromatch pattern (matches if any type matches) or an [array query object](./selectors.md#array-query-selectors) for richer constraints such as `allOf`, `noneOf`, and `hasLength`. <small>(`<string | string[] | null | ArrayQuery>`)</small>
- **`path`** — Matches the element path. <small>(`<string | string[] | null>`)</small>
- **`fileInternalPath`** — Matches the path of the file **within** its element (for example `index.js`). It will vary depending on the file that has been analyzed to get the element's information. <small>(`<string | string[] | null>`)</small>
- **`captured`** — Match [captured values](./selectors.md#captured-values-matching). <small>(`<object | object[] | null>`)</small>
- **`parent`** — Match the element's [first parent](#parent-matching). `parent` always targets **only `parents[0]`** (the nearest enclosing element). <small>(`<object | object[] | null>`)</small>
- **`parents`** — [Array query](./selectors.md#array-query-selectors) over the **full ancestor chain**. `parents[0]` is the closest parent; the last element is the outermost ancestor. The full `parents` array is always available in templates (e.g. `{{ element.parents.[0].types.[0] }}`). <small>(`<ArrayQuery<ParentSelector>>`)</small>
- **`isIgnored`** — Whether the element is ignored. <small>(`<boolean>`)</small>
- **`isUnknown`** — Whether the file matches no element descriptor. <small>(`<boolean>`)</small>

```js
// Match all helper elements
{ element: { type: "helper" } }

// Match components in a specific path
{ element: { type: "component", path: "**/components/atoms/**" } }

// Match elements with captured family "data"
{ element: { captured: { family: "data" } } }

// Match elements without any of types "deprecated" or "legacy"
{ element: { types: { noneOf: ["deprecated", "legacy"] } } }

// Match the entry file of any element
{ element: { fileInternalPath: "index.js" } }

// Match files that belong to no known element
{ element: { isUnknown: true } }

// Match element parents that are modules or have captured family "data"
{ element: { parents: { anyOf: [{ type: "module" }, { captured: { family: "data" } }] } } }
```

:::info
**All selector properties are optional.** You can match on a single property, or combine several to target a more specific case. Remember that combined properties use AND logic — every one you specify must match.
:::

## Matching by type

A file can belong to more than one element type at the same path level. When [multi-type elements](../settings/settings.md#boundarieselements-single-match) are enabled (`boundaries/elements-single-match: false`), the runtime description carries every matching type in a `types` array. By default the plugin keeps a single type for backward compatibility, so an element's `types` array usually holds a single type.

The `type` selector property matches the element's **first** type — `types[0]`:

```js
// Matches when the FIRST type is "component"
{ element: { type: "component" } }
```

The `types` selector property matches against the whole array — it matches if the pattern matches **any** of the element's types:

```js
// Matches when ANY type is "component"
{ element: { types: "component" } }
```

:::info[Single-type vs multi-type elements]
With single-type elements (the default), each element has exactly one type, so `type` and `types` behave the same. When multi-type elements are enabled, `type` still matches only the first type in the array, while `types` matches any type the element carries. See [`boundaries/elements-single-match`](../settings/settings.md#boundarieselements-single-match) for details.
:::

## Parent matching

Elements form a hierarchy: each element can be nested inside one or more enclosing elements. Two properties give you access to this ancestor chain: `parents` for full array query access, and `parent` as a shortcut for the common case of matching only the nearest ancestor.

### Parent selector fields

Both `parents` and `parent` work with **parent selector objects**. A parent selector supports these fields:

- **`type`** — Matches the parent's **first** type (`types[0]`). <small>(`<string | string[] | null>`)</small>
- **`types`** — Matches against the parent's type array. Accepts a micromatch pattern (matches if any type matches) or an [array query object](./selectors.md#array-query-selectors) for richer constraints such as `allOf` or `hasLength`. <small>(`<string | string[] | null | ArrayQuery>`)</small>
- **`path`** — Matches the parent element path. <small>(`<string | string[] | null>`)</small>
- **`captured`** — Matches the parent's [captured values](./selectors.md#captured-values-matching). <small>(`<object | object[] | null>`)</small>

### `parents` — array query over the ancestor chain

`parents` accepts an [array query object](./selectors.md#array-query-selectors) that matches against the full ancestor list. `parents[0]` is the **closest parent** (the immediately enclosing element); the last entry is the **outermost ancestor**.

```js
// Top-level element (no parents)
{ element: { parents: { hasLength: 0 } } }

// Closest parent is a module
{ element: { parents: { atIndex: { index: 0, matches: { type: "module" } } } } }

// Outermost ancestor is an app
{ element: { parents: { atIndex: { index: -1, matches: { type: "app" } } } } }

// Closest parent is a module OR an app
{ element: { parents: { atIndex: { index: 0, matches: [{ type: "module" }, { type: "app" }] } } } }

// At least one ancestor is a module
{ element: { parents: { anyOf: [{ type: "module" }] } } }

// No ancestor is deprecated
{ element: { parents: { noneOf: [{ type: "deprecated" }] } } }

// Ancestor chain has exactly two levels in this order (closest first)
{ element: { parents: { equalsTo: [{ type: "module" }, { type: "app" }] } } }

// Closest parent has BOTH "module" AND "lazy" types
{ element: { parents: { atIndex: { index: 0, matches: { types: { allOf: ["module", "lazy"] } } } } } }
```

### `parent` — shortcut for the closest parent

`parent` is a convenience that targets only `parents[0]` (the nearest enclosing element). It accepts a single parent selector object, an array of objects (OR), or `null` to match top-level elements with no parents.

```js
// Closest parent is a module
{ element: { parent: { type: "module" } } }

// Top-level element (equivalent to parents: { hasLength: 0 })
{ element: { parent: null } }
```

:::note
`parent` and `parents` can be used in the same selector — they are AND-combined, as any other properties in the element selector.
:::

## Deprecated element selector properties

:::warning[Deprecated]
Several element selector properties — **`category`**, **`origin`**, **`elementPath`**, **`internalPath`**, **`filePath`**, and the parent-level **`elementPath`** — are kept for backward compatibility but are deprecated. They still work and are converted internally.

Use the modern replacements instead: the [`file` sub-selector](./file.md) `categories`, the [`module` sub-selector](./module.md) `origin`, `element.path`, and `element.fileInternalPath`. The full list, with migration tables, lives on the [Legacy Element Selectors](./legacy/element.md) page.
:::

## Next Steps

- [Selectors](./selectors.md) — the entity/dependency model, array queries, captured values, and templating.
- [File selector](./file.md) — match files by category.
- [Module selector](./module.md) — match external and core module imports.
- [Elements](../classification/elements.md) — define element descriptors and read the element description properties.
- [Legacy Selectors](./legacy/element.md) — string/tuple formats and deprecated element properties.
