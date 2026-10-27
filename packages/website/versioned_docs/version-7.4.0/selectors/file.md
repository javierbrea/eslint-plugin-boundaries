---
id: file
title: File Selector
sidebar_label: File
description: Match files by their category — independently of the element they belong to — in eslint-plugin-boundaries.
tags:
  - concepts
  - configuration
keywords:
  - eslint-plugin-boundaries
  - JavaScript
  - TypeScript
  - file selector
  - entity selector
  - categories
  - file descriptors
  - micromatch
---

# File Selector

The **file sub-selector** matches the file itself, based on the [file descriptors](../classification/files.md) you configure. It is the `file` key of an [entity selector](./selectors.md#entity-selectors):

```js
{ file: { /* file sub-selector */ } }
```

File descriptors categorize files independently from the element they belong to — a single file can carry several categories. All conditions inside the selector are combined with **AND**; arrays act as **OR**.

## Properties

- **`categories`** — Matches against the file's category array. Accepts a micromatch pattern (matches if any category matches) or an [array query object](./selectors.md#array-query-selectors) for richer constraints. <small>(`<string | string[] | null | ArrayQuery>`)</small>
- **`path`** — Matches the file path. <small>(`<string | string[] | null>`)</small>
- **`captured`** — Match [captured values](./selectors.md#captured-values-matching). <small>(`<object | object[] | null>`)</small>
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

:::info
**All selector properties are optional.** You can match on a single property, or combine several to target a more specific case. Remember that combined properties use AND logic — every one you specify must match.
:::

:::note
File categories are the recommended replacement for the deprecated element-level `category`. Read the [Element Selector Legacy Syntax](./legacy/element.md) section for migration guidance.
:::

## Next Steps

- [Selectors](./selectors.md) — the entity/dependency model, array queries, captured values, and templating.
- [Element selector](./element.md) — match the element a file belongs to.
- [Module selector](./module.md) — match external and core module imports.
- [Files](../classification/files.md) — define file descriptors and read the file description properties.
