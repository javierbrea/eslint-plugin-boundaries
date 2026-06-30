---
id: selectors
title: Selectors
sidebar_label: Selectors
description: Use selectors to match elements, files, and modules when defining architectural boundaries in eslint-plugin-boundaries.
tags:
  - concepts
  - configuration
keywords:
  - eslint-plugin-boundaries
  - JavaScript
  - TypeScript
  - selectors
  - entity selector
  - element selector
  - file selector
  - module selector
  - dependency selector
  - micromatch
  - rules configuration
---

# Selectors

Selectors describe which files a rule applies to. You write them in the `from`, `to`, and `dependency` keys of your [rules](./rules.mdx), and the plugin matches them against the [runtime descriptions](./classification.md) it builds for every analyzed file.

The top-level selector for `from` and `to` is the **entity selector**. An entity is the unit the plugin analyzes — one file described along three independent axes: its **element**, its **file** classification, and the **module** it resolves to. An entity selector lets you match any combination of those axes.

The smallest selector targets a single axis — for example, one element type:

```js
{ element: { type: "helper" } }
```

That selector matches any file belonging to a `helper` element. You could just as well match a single `file` category or `module` origin instead; no axis takes precedence over the others. From there you can add more conditions to narrow the match.

:::note[Legacy flat selectors]
Earlier versions accepted flat element selectors such as `{ type: "helper" }` (without the `element` wrapper) and bare strings like `"helper"`. They still work and are converted internally, so existing configurations keep running. For new rules, prefer the entity selector form so you can also match against `file` and `module`. The string and tuple formats are documented on the [Legacy Selectors](./selectors/legacy-selectors.md) page.
:::

## How matching works

1. You define [element descriptors](./elements.md) and/or [file descriptors](./files.md) in your settings — at least one of the two.
2. During analysis, the plugin builds a [runtime description](./classification.md) for each file: its element, its file categories, and the module it resolves to.
3. Selectors in your rules match against those descriptions to decide whether a rule applies.

All conditions inside a single selector are combined with **AND** — every property you specify must match. Arrays act as **OR** — the selector matches if any item in the array matches. These two rules apply at every level, from sub-selectors down to individual pattern values.

## Entity selectors

An entity selector has three optional sub-selectors:

```js
{
  element: { /* element sub-selector */ },
  file: { /* file sub-selector */ },
  module: { /* module sub-selector */ }
}
```

- An **omitted** sub-selector matches anything.
- A **present** sub-selector must match for the entity to match.
- Sub-selectors are combined with **AND**: an entity matches only when every provided sub-selector matches.

For example, this matches a file that belongs to a `component` element **and** is categorized as a `test` file:

```js
{
  element: { type: "component" },
  file: { categories: "test" }
}
```

You can also provide an **array of entity selectors**, which matches if any of them matches (OR):

```js
// Match components OR helpers
[
  { element: { type: "component" } },
  { element: { type: "helper" } }
]
```

The three sub-selectors are explained below.

### Element sub-selector

Match the [element](./elements.md) a file belongs to. All values are [micromatch pattern(s)](https://github.com/micromatch/micromatch) unless noted.

- **`type`** — Matches the element's **first** type (`types[0]`). With single-type elements (the default), this is the only type, so `type` is all you need. <small>(`<string | string[] | null>`)</small>
- **`types`** — Matches against the element's type array. Accepts a micromatch pattern (matches if any type matches) or an [array query object](#array-query-selectors) for richer constraints such as `allOf`, `noneOf`, and `hasLength`. <small>(`<string | string[] | null | ArrayQuery>`)</small>
- **`path`** — Matches the element path. <small>(`<string | string[] | null>`)</small>
- **`fileInternalPath`** — Matches the path of the file **within** its element (for example `index.js`). <small>(`<string | string[] | null>`)</small>
- **`captured`** — Match [captured values](#captured-values-matching). <small>(`<object | object[] | null>`)</small>
- **`parent`** — Match the element's [first parent](#parent-matching). `parent` always targets **only `parents[0]`** (the nearest enclosing element). <small>(`<object | object[] | null>`)</small>
- **`parents`** — [Array query](#array-query-selectors) over the **full ancestor chain**. `parents[0]` is the closest parent; the last element is the outermost ancestor. The full `parents` array is always available in templates (e.g. `{{ element.parents.[0].types.[0] }}`). <small>(`<ArrayQuery<ParentSelector>>`)</small>
- **`isIgnored`** — Whether the element is ignored. <small>(`<boolean>`)</small>
- **`isUnknown`** — Whether the file matches no element descriptor. <small>(`<boolean>`)</small>

```js
// Match all helper elements
{ element: { type: "helper" } }

// Match components in a specific path
{ element: { type: "component", path: "**/components/atoms/**" } }

// Match the entry file of any element
{ element: { fileInternalPath: "index.js" } }

// Match files that belong to no known element
{ element: { isUnknown: true } }
```

#### Matching by type

A file can belong to more than one element type at the same path level. When [multi-type elements](./settings.md#boundarieselements-single-type) are enabled (`boundaries/elements-single-type: false`), the runtime description carries every matching type in a `types` array. By default the plugin keeps a single type for backward compatibility, so an element's `types` array usually holds a single type.

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

With single-type elements (the default), each element has exactly one type, so `type` and `types` behave the same. When multi-type elements are enabled, `type` still matches only the first type in the array, while `types` matches any type the element carries. See [`boundaries/elements-single-type`](./settings.md#boundarieselements-single-type) for details.

#### Deprecated element selector properties

The following element selector properties still work but are kept only for backward compatibility. They will be removed in a future major version.

:::warning[Deprecated]
**`category`** on an element selector is deprecated. Use the [`file` sub-selector](#file-sub-selector) with [`categories`](./files.md) instead.
:::

It keeps working without changes. The replacement is a [file descriptor](./files.md) category matched through the `file` sub-selector. File descriptors let you assign multiple categories to different files within the same element.

| Deprecated | Replacement |
| --- | --- |
| `{ element: { category: "test" } }` | `{ file: { categories: "test" } }` |

:::warning[Deprecated]
**`origin`** on an element selector is deprecated. Use the [`module` sub-selector](#module-sub-selector) with [`origin`](#module-sub-selector) instead.
:::

Module origin describes where an imported module comes from, so it now lives on the `module` sub-selector. The legacy form keeps working.

| Deprecated | Replacement |
| --- | --- |
| `{ element: { origin: "external" } }` | `{ module: { origin: "external" } }` |

:::warning[Deprecated]
**`elementPath`** on an element selector is a legacy alias for **`path`**. Use `path` instead.
:::

:::warning[Deprecated]
**`internalPath`** and **`filePath`** on an element selector are legacy properties. Use **`fileInternalPath`** to match the file path within a local element, or the [`module` sub-selector](#module-sub-selector) **`internalPath`** to match the path within an external or core module.
:::

These deprecated properties are covered in full, with migration steps, in the [v6 to v7 migration guide](../releases/migration-guides/v6-to-v7.mdx).

### File sub-selector

Match the file itself, based on the [file descriptors](./files.md) you configure. File descriptors categorize files independently from the element they belong to — a single file can carry several categories.

- **`categories`** — Matches against the file's category array. Accepts a micromatch pattern (matches if any category matches) or an [array query object](#array-query-selectors) for richer constraints. <small>(`<string | string[] | null | ArrayQuery>`)</small>
- **`path`** — Matches the file path. <small>(`<string | string[] | null>`)</small>
- **`captured`** — Match [captured values](#captured-values-matching). <small>(`<object | object[] | null>`)</small>
- **`isIgnored`** — Whether the file is ignored. <small>(`<boolean>`)</small>
- **`isUnknown`** — Whether the file matches no file descriptor. <small>(`<boolean>`)</small>

```js
// Match test files (a file descriptor with category "test")
{ file: { categories: "test" } }

// Match style files
{ file: { categories: "style" } }

// Match files in any category whose name starts with "test"
{ file: { categories: "test*" } }
```

File categories are the recommended replacement for the deprecated element-level `category`. To assign categories, define [`boundaries/files`](./settings.md#boundariesfiles) in your settings.

### Module sub-selector

Match the resolved module an import points to. This is the right sub-selector for matching dependencies on external packages and Node.js core modules, where there is no local element to match.

- **`origin`** — Where the module comes from: `"local"`, `"external"`, or `"core"`. Array = OR. <small>(`<string | string[] | null>`)</small>
- **`source`** — The base module name for external or core modules (for example `"react"`). `null` for local modules. <small>(`<string | string[] | null>`)</small>
- **`internalPath`** — The sub-path inside an external or core module (for example `fp` in `lodash/fp`). <small>(`<string | string[] | null>`)</small>

```js
// Match imports of the "react" package
{ module: { origin: "external", source: "react" } }

// Match any external OR core module
{ module: { origin: ["external", "core"] } }

// Match a sub-path of an external package
{ module: { source: "@mui/material", internalPath: "styles/**" } }

// Match local imports only
{ module: { origin: "local" } }
```

:::note
For **local** files, the meaningful classification lives in the `element` and `file` sub-selectors. For **external** and **core** imports, the file usually matches no element, so use the `module` sub-selector. See [Module Description](./modules.md#module-description) for the full property breakdown.
:::

## Dependency selectors

A dependency selector matches an analyzed dependency between two files. You use it in a [rule](./rules.mdx) to target specific imports and decide the policy that applies to them. It has three optional keys:

- **`from`** — [Entity selector(s)](#entity-selectors) matching the importer (the file that has the dependency). Single selector or array (OR).
- **`to`** — [Entity selector(s)](#entity-selectors) matching the imported entity (the file or module being depended on). Single selector or array (OR).
- **`dependency`** — [Dependency metadata selector(s)](#dependency-metadata-selectors) matching properties of the dependency itself. Single selector or array (OR).

Legacy flat element selectors are still accepted for `from` and `to` and are converted internally, but the entity selector form is preferred because it can also match `file` and `module`.

```js
// Match dependencies of kind "type" to helpers
{
  to: { element: { type: "helper" } },
  dependency: { kind: "type" }
}

// Match dependencies from components to external "react"
{
  from: { element: { type: "component" } },
  to: { module: { origin: "external", source: "react" } }
}
```

:::tip
Dependency selectors live inside your rule configuration. For how rules use `from`/`to`/`dependency` together with `allow`/`disallow` policies, see the [Rules documentation](./rules.mdx).
:::

### Dependency metadata selectors

The `dependency` key matches metadata about the dependency itself — the import kind, the relationship between importer and imported elements, the imported specifiers, and so on.

- **`kind`** — Matches the dependency kind: `"value"`, `"type"`, or `"typeof"`. <small>(`<string | string[]>`)</small>
- **`relationship`** — Match the relationship between both elements. <small>(`<object>`)</small>
  - **`from`** — The relationship from the importer's perspective. <small>(`<string | string[]>`)</small>
  - **`to`** — The relationship from the imported element's perspective. <small>(`<string | string[]>`)</small>
- **`specifiers`** — Matches the imported or exported specifier names. <small>(`<string | string[]>`)</small>
- **`nodeKind`** — Matches the [dependency node](./settings.md#boundariesdependency-nodes) name that produced the dependency. <small>(`<string | string[]>`)</small>
- **`source`** — Matches the literal source string written in the `import`/`export` statement. <small>(`<string | string[]>`)</small>

Relationship values are: `internal`, `child`, `descendant`, `sibling`, `parent`, `uncle`, `nephew`, and `ancestor`. The `from` and `to` perspectives are inverses of each other (a `child` from one side is a `parent` from the other).

```js
// Match type-only dependencies to helpers
{
  to: { element: { type: "helper" } },
  dependency: { kind: "type" }
}

// Match dependencies whose literal source matches "lodash/*"
{
  dependency: { source: "lodash/*" }
}

// Match dependencies to a descendant element
{
  dependency: { relationship: { to: "descendant" } }
}
```

:::warning[Deprecated]
The **`module`** property on a dependency metadata selector is deprecated. Use the [`module` sub-selector](#module-sub-selector) with **`source`** in `to` instead.
:::

It keeps working without changes; the replacement matches the same external and core modules with clearer semantics.

| Deprecated | Replacement |
| --- | --- |
| `{ dependency: { module: "react" } }` | `{ to: { module: { source: "react" } } }` |

The full migration is documented in the [v6 to v7 migration guide](../releases/migration-guides/v6-to-v7.mdx).

:::info
**All selector properties are optional.** You can match on a single property, or combine several to target a more specific case. Remember that combined properties use AND logic — every one you specify must match.
:::

## Combining properties

### AND logic

When a selector object lists several properties, **all** of them must match:

```js
// Element sub-selector: components captured in the "atoms" family
{
  element: {
    type: "component",
    captured: { family: "atoms" }
  }
}

// Entity selector: a component file ALSO categorized as a test file
{
  element: { type: "component" },
  file: { categories: "test" }
}

// Dependency selector: from helpers to components
{
  from: { element: { type: "helper" } },
  to: { element: { type: "component" } }
}
```

### OR logic

There are two ways to express OR:

A **micromatch array** inside one property value matches if any pattern matches:

```js
// Match helpers captured in the "data" OR "permissions" family
{
  element: {
    type: "helper",
    captured: { family: ["data", "permissions"] }
  }
}
```

An **array of selectors** matches if any selector in the array matches. Use this when the alternatives differ in more than one property:

```js
// Match components in the "atoms" family OR any module element
[
  { element: { type: "component", captured: { family: "atoms" } } },
  { element: { type: "module" } }
]
```

The same applies to dependency `to`/`from`:

```js
// Match dependencies from helpers to either components or modules
{
  from: { element: { type: "helper" } },
  to: [
    { element: { type: "component" } },
    { element: { type: "module" } }
  ]
}
```

## Matching null values

Use `null` to match entities that **do not have a value** for a property. This distinguishes an entity whose property has a specific value from one where the property is absent.

```js
// Match elements with no captured values
{ element: { captured: null } }

// Match elements with no parent
{ element: { parent: null } }
```

:::note
Micromatch treats `null` as a non-string value, so a string pattern never matches a `null` value. To match an absent value, write `null` explicitly in your selector. A `null` pattern matches only a `null` value.
:::

## Captured values matching

The `captured` property matches values extracted from file paths by the [`capture`](./elements.md) configuration of a descriptor. It is available on the `element` and `file` sub-selectors.

### Object format (AND logic)

When `captured` is an object, **all** of its keys must match:

```js
// Element descriptor (in boundaries/elements)
{ type: "component", pattern: "components/*/*", capture: ["family", "elementName"] }

// Selector — matches components where family is "atoms" AND elementName is "atom-a"
{
  element: {
    type: "component",
    captured: { family: "atoms", elementName: "atom-a" }
  }
}

// Using micromatch patterns in captured values
{
  element: {
    type: "component",
    captured: { family: "atoms|molecules", elementName: "atom-*" }
  }
}
```

### Array format (OR logic)

When `captured` is an **array of objects**, the entity matches if **any** object matches:

```js
// Match components in the "atoms" OR "molecules" family
{
  element: {
    type: "component",
    captured: [
      { family: "atoms" },
      { family: "molecules" }
    ]
  }
}
```

## Array query selectors

The `types` (element), `categories` (file), and `parents` (element) properties accept an **array query object** that gives you fine-grained control over how the target array is matched, beyond the simple "any element matches" logic of plain pattern strings.

All operators inside the same object are **AND-combined**. An absent operator places no constraint.

| Operator | Shape | Matches when |
| --- | --- | --- |
| `anyOf` | `(string \| { expand: string })[]` | At least one array element matches at least one of the matchers. An empty operand never matches. |
| `allOf` | `(string \| { expand: string })[]` | For every matcher, at least one array element matches it. An empty operand vacuously matches. |
| `noneOf` | `(string \| { expand: string })[]` | No array element matches any of the matchers. An empty operand always matches. |
| `equalsTo` | `string[]` | Array length equals `N` **and** `array[i]` matches `matcher[i]` (ordered, exact length). |
| `atIndex` | `{ index: number; matches: TMatcher \| TMatcher[] }` | Resolves the index (negative counts from end), then that element matches `matches`. When `matches` is an array, OR semantics apply — the element at that index must match at least one of the values. Out-of-range never matches. |
| `hasLength` | `number` | The array length is exactly this value. |

**Rules:**
- When the target array is `null` (unknown/ignored element or file), the entire query returns `false`.
- An empty query object `{}` returns `true` for any non-null array.
- For `equalsTo`, order matters: `["a", "b"]` does not match `["b", "a"]`.
- Negative `atIndex.index` counts from the end: `-1` = last element (e.g. outermost ancestor for `parents`).
- All string matchers are micromatch patterns rendered as Handlebars templates before matching, like all other selector values.

For `types` and `categories`, `TMatcher` is a string (micromatch pattern) or a `{ expand }` item (see [Sourcing operands from a template](#sourcing-operands-from-a-template-expand) below). For `parents`, `TMatcher` is a parent selector object (`type`, `types`, `path`, `category`, `captured`).

```js
// element.types: require exactly one type
{ element: { types: { hasLength: 1 } } }

// element.types: must have "component" but must NOT have "deprecated"
{ element: { types: { allOf: ["component"], noneOf: ["deprecated"] } } }

// file.categories: file has at least two categories
{ file: { categories: { hasLength: 2 } } }

// file.categories: none of these categories
{ file: { categories: { noneOf: ["legacy", "deprecated"] } } }

// element.parents: top-level element (no parents)
{ element: { parents: { hasLength: 0 } } }

// element.parents: closest parent (index 0) is a module
{ element: { parents: { atIndex: { index: 0, matches: { type: "module" } } } } }

// element.parents: outermost ancestor (index -1) is an app
{ element: { parents: { atIndex: { index: -1, matches: { type: "app" } } } } }

// element.parents: closest parent is a module OR an app (OR via array)
{ element: { parents: { atIndex: { index: 0, matches: [{ type: "module" }, { type: "app" }] } } } }

// file.categories: first category is "components" or "ui"
{ file: { categories: { atIndex: { index: 0, matches: ["components", "ui"] } } } }

// element.parents: ancestor chain in exact order (ordered, exact length)
{ element: { parents: { equalsTo: [{ type: "module" }, { type: "app" }] } } }
```

:::note
See [Parent matching](#parent-matching) for the full explanation of `parent` vs `parents`, including how to combine them and their template-data differences.
:::

### Sourcing operands from a template (`expand`)

Inside `anyOf`, `allOf`, and `noneOf` on **`element.types`**, **`file.categories`**, and **`parent.types`** / **`parents[*].types`**, each item can be either a plain string (micromatch pattern) or a special `{ expand: "{{ path }}" }` object. The `expand` item is resolved at match time against the same template data tree used by `{{ }}` templates and its resolved value is spread in place as additional string matchers.

**Why is this useful?**
When the other side's property is an array (for example `from.element.types` when an element can belong to multiple types), a plain `"{{ from.element.types }}"` template renders the array as the string `"type-a,type-b"`, which is not a valid micromatch OR pattern. The `expand` item reads the **raw array** and spreads each entry as an independent matcher, giving you correct `anyOf` / `noneOf` / `allOf` semantics against dynamic values.

**Resolution semantics:**
- The `expand` value must be a single `{{ path }}` expression (e.g. `"{{ from.element.types }}"`).
- If the path resolves to a **string array** → each element becomes a separate matcher.
- If the path resolves to a **scalar string** → a single matcher is produced.
- If the path resolves to **null/undefined**, or the value is not a single `{{ }}` expression → **no matchers** (the item disappears). Combined with the empty-operand rules: empty `noneOf` always passes; empty `anyOf` never matches.

**Mixing static and dynamic items** is allowed — list them in the same array:

```js
// "to element must share at least one type with the importer"
{
  to: { element: { types: { anyOf: [{ expand: "{{ from.element.types }}" }] } } }
}

// "to element must NOT share any type with the importer"
{
  to: { element: { types: { noneOf: [{ expand: "{{ from.element.types }}" }] } } }
}

// "to element must have all of the importer's types"
{
  to: { element: { types: { allOf: [{ expand: "{{ from.element.types }}" }] } } }
}

// Mixed: also exclude "legacy" in addition to any of the importer's types
{
  to: { element: { types: { noneOf: ["legacy", { expand: "{{ from.element.types }}" }] } } }
}

// File categories: to file must not share any category with the importing file
{
  to: { file: { categories: { noneOf: [{ expand: "{{ from.file.categories }}" }] } } }
}
```

**Null / unknown element behavior:**
When `expand` resolves to `null` (e.g. the `from` element is unknown and has no types), the expansion produces zero matchers. Because of the empty-operand rules:
- `noneOf: []` → always passes (unknown from-element never blocks a `noneOf` rule).
- `anyOf: []` → never matches (unknown from-element cannot satisfy an `anyOf` rule).

:::note
The available paths are exactly the same as the template tree documented in [Templating in selectors](#templating-in-selectors): `from.element.types`, `from.file.categories`, `to.element.types`, etc. The `expand` item reads the raw array; no Handlebars rendering is applied to the resolved values.
:::

## Parent matching

Elements form a hierarchy: each element can be nested inside one or more enclosing elements. Two selector properties give you access to this ancestor chain: `parents` for full array query access, and `parent` as a shortcut for the common case of matching only the nearest ancestor.

### Parent selector fields

Both `parents` and `parent` work with **parent selector objects**. A parent selector supports these fields:

- **`type`** — Matches the parent's **first** type (`types[0]`). <small>(`<string | string[] | null>`)</small>
- **`types`** — Matches against the parent's type array. Accepts a micromatch pattern (matches if any type matches) or an [array query object](#array-query-selectors) for richer constraints such as `allOf` or `hasLength`. <small>(`<string | string[] | null | ArrayQuery>`)</small>
- **`path`** — Matches the parent element path. <small>(`<string | string[] | null>`)</small>
- **`captured`** — Matches the parent's [captured values](#captured-values-matching). <small>(`<object | object[] | null>`)</small>

### `parents` — array query over the ancestor chain

`parents` accepts an [array query object](#array-query-selectors) that matches against the full ancestor list. `parents[0]` is the **closest parent** (the immediately enclosing element); the last entry is the **outermost ancestor**.

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

`parent` and `parents` can be used in the same selector — they are AND-combined.

:::warning[Deprecated]
**`elementPath`** on a parent selector is a legacy alias for **`path`**. Use `path` instead.
:::

## Templating in selectors

Selector values support templates, so a rule can adapt to the file it is checking. For example, you can disallow a dependency between two elements of the same type but in different families, without writing a rule per family.

:::note
To use a **whole array** from the template tree (e.g. `from.element.types`) as operands of an `anyOf` / `allOf` / `noneOf` array query, use the [`{ expand }` item](#sourcing-operands-from-a-template-expand) instead of a plain template string. A plain `"{{ from.element.types }}"` renders as the string `"a,b,c"`, which is not a valid micromatch OR pattern.
:::

### Modern template syntax

The modern syntax uses Handlebars-style double curly braces. The data tree mirrors the [runtime descriptions](./classification.md), exposing the three entity sub-descriptions on each side:

- **`{{ from.element.* }}`** / **`{{ to.element.* }}`** — element properties such as `{{ from.element.types }}`, `{{ from.element.captured.family }}`, `{{ from.element.path }}`, and `{{ from.element.parents.[0].types.[0] }}`.
- **`{{ from.file.* }}`** / **`{{ to.file.* }}`** — file properties such as `{{ to.file.categories }}`.
- **`{{ from.module.* }}`** / **`{{ to.module.* }}`** — module properties such as `{{ to.module.origin }}` and `{{ to.module.source }}`.
- **`{{ dependency.* }}`** — properties of the dependency itself, such as `{{ dependency.kind }}` and `{{ dependency.specifiers }}`.

Use the array index syntax to read a single entry, for example `{{ from.element.types.[0] }}` or `{{ from.element.parents.[0].captured.moduleName }}`.

:::note
Legacy flat aliases such as `{{ from.type }}` (equal to `{{ from.element.types.[0] }}`), `{{ from.elementPath }}`, and `{{ from.origin }}` keep working regardless of [`boundaries/legacy-templates`](./settings.md#boundarieslegacy-templates) — they are part of the template data and rendered like any other `{{ }}` path. What that setting governs in selectors is the legacy `${ }` syntax and the top-level captured-value shorthand (for example `{{ family }}` / `${ family }`), not these nested-path aliases. New rules should still prefer the nested paths above.
:::

### Template examples

This rule disallows dependencies between elements of the same type that belong to different families:

```js
{
  disallow: {
    to: {
      element: {
        // Match the same element type as the importer...
        type: "{{ from.element.types.[0] }}",
        // ...but a different family
        captured: { family: "!{{ from.element.captured.family }}" }
      }
    },
    dependency: { kind: "value" }
  }
}
```

:::info
`disallow` is a rule configuration key, not a selector property. The selectors here are the objects inside `from` (matched at the rule level) and inside `disallow`. For the full rule syntax, read the [Rules documentation](./rules.mdx).
:::

**How it works**

Suppose a component file captured with `family: "atoms"` imports another component captured with `family: "molecules"`:

1. `{{ from.element.types.[0] }}` resolves to `"component"`.
2. `{{ from.element.captured.family }}` resolves to `"atoms"`.
3. The selector becomes `{ element: { type: "component", captured: { family: "!atoms" } } }`.
4. The imported component has family `"molecules"`, which matches `"!atoms"`.
5. The rule disallows the import.

**More examples**

```js
// Allow importing helpers that share the importer's family prefix
{
  from: { element: { type: "component", captured: { family: "atoms|molecules" } } },
  allow: [
    {
      element: {
        type: "helper",
        captured: { family: "{{ from.element.captured.family }}-*" }
      }
    }
  ]
}

// Allow importing element types that share the same base type
{
  allow: [{ element: { type: "{{ from.element.types.[0] }}-*" } }]
}
```

:::caution
When [`boundaries/legacy-templates`](./settings.md#boundarieslegacy-templates) is enabled (its default), captured values are also injected at the top level of the template data. If a captured value has the same name as a runtime property (for example `path`, `category`, or `origin`), it overwrites that template variable and can cause surprising results. To avoid this, set `boundaries/legacy-templates` to `false` and access captured values only through the `captured` namespace (for example `{{ from.element.captured.path }}`).
:::

### Legacy template syntax

:::warning[Deprecated]
The legacy template syntax `${ property }` is kept for backward compatibility but is deprecated and will be removed in a future major version. Use the modern `{{ property }}` syntax instead.
:::

It keeps working without changes while [`boundaries/legacy-templates`](./settings.md#boundarieslegacy-templates) is enabled (its default, planned to change to `false` in the next major version). With legacy syntax you can also use `${ target.* }` as an alias for `{{ to.* }}`, and access captured values directly:

- `${ from.capturedProperty }`
- `${ to.capturedProperty }`
- `${ target.capturedProperty }`

Migrate these to the `captured` namespace, for example `{{ from.element.captured.capturedProperty }}` and `{{ to.element.captured.capturedProperty }}`. See the [message templating](./rules.mdx) section of the Rules documentation for more on the two syntaxes.

## Next Steps

- [Classification](./classification.md) — the three layers (element, file, module) that selectors match against.
- [Elements](./elements.md) — define element descriptors and read the element description properties.
- [Files](./files.md) — categorize files for the `file` sub-selector.
- [Modules](./modules.md) — module origin for the `module` sub-selector.
- [Settings](./settings.md) — configure [`boundaries/files`](./settings.md#boundariesfiles), [`boundaries/elements-single-type`](./settings.md#boundarieselements-single-type), and [`boundaries/legacy-templates`](./settings.md#boundarieslegacy-templates).
- [Rules](./rules.mdx) — use selectors in `from`/`to`/`dependency` together with `allow`/`disallow` policies.
- [Legacy Selectors](./selectors/legacy-selectors.md) — string and tuple selector formats and how to migrate them.
