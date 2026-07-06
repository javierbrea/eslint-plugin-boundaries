---
id: files
title: File Descriptors
sidebar_label: Files
description: Learn how to use file descriptors to categorize files independently of the elements they belong to in ESLint Plugin Boundaries.
tags:
  - concepts
  - configuration
keywords:
  - eslint-plugin-boundaries
  - JavaScript
  - TypeScript
  - file descriptors
  - file categories
  - boundaries/files
  - entity model
  - classification
  - captured values
  - runtime descriptions
  - patterns
  - path matching
  - no-unknown-files
---

# File Descriptors

File descriptors classify each file **on its own**, independently of the architectural element it belongs to. They answer the question "what kind of file is this?" — a test, a style, a story — regardless of where it lives.

This is the second [classification](./classification.md) layer. [Element descriptors](./elements.md) group files into architectural units (usually folders, such as `components/Button/`). File descriptors cut across those units: a test file is a test file whether it sits inside a `component` or a `helper`. The two layers are orthogonal, so the same file can be element type `component` and file category `test` at the same time.

## Defining File Descriptors

File descriptors are configured in the `boundaries/files` setting as an array of objects. Each descriptor defines a `pattern` to match against file paths and the `category` to assign when it matches.

```js
export default [{
  settings: {
    "boundaries/files": [
      { pattern: "**/*.spec.js", category: "test" },
      { pattern: "**/*.css", category: "style" }
    ]
  }
}]
```

This extends the running example used across the documentation. Test files get the `test` category and stylesheets get the `style` category, no matter which element contains them.

:::tip
Read the [Selectors](../selectors/selectors.md) section to learn how to match categorized files in policies with the [`file` selector](../selectors/selectors.md), and see [`boundaries/files`](../settings/settings.md#boundariesfiles) for the setting schema.
:::

## File Descriptor Properties

### `pattern` (required)

**Type:** `<string> | <array of strings>`

A [micromatch pattern](https://github.com/micromatch/micromatch) matched against the file path. An array means OR — the file is categorized if any pattern matches.

Like element descriptors, patterns are matched relative to [`rootPath`](../settings/settings.md#boundariesroot-path) when the file is inside it.

```js
{ pattern: "**/*.spec.js", category: "test" }
```

### `category` (required)

**Type:** `<string>`

The category assigned to files matching the pattern. It is stored in the file's [`categories`](#file-description) array.

```js
{ pattern: "**/*.css", category: "style" }
```

### `capture` (optional)

**Type:** `<array of strings>`

Captures named values from path fragments so you can reference them later in [file selectors](../selectors/selectors.md). It uses the [micromatch capture feature](https://github.com/micromatch/micromatch#capture), the same way [element descriptors](./elements.md) do.

Each captured fragment is stored under the key from the `capture` array at the same index, and appears at runtime as `file.captured`.

:::note
`capture` maps positionally to each wildcard (`*` or `**`) in `pattern`, in order, left to right — including any `**` used to match nested paths. Count the wildcards in your pattern and provide that many names; naming fewer just leaves the trailing wildcards uncaptured, but naming them in the wrong order (or forgetting one in the middle, such as a `**`) assigns each name to the wrong path fragment.
:::

```js
{ pattern: "**/*.stories.*", category: "story", capture: ["restOfPath", "fileName", "extension"] }
```

For a path `components/Button/Button.stories.tsx`, this captures:

```js
{ restOfPath: "components/Button", fileName: "Button", extension: "tsx" }
```

When several matching descriptors capture values, those values are **merged** into a single `file.captured` object.

## Category Accumulation

Unlike element descriptors by default, file descriptors do not stop at the first match. **Every file descriptor whose pattern matches contributes its category**, so a single file can carry several categories at once.

```js
export default [{
  settings: {
    "boundaries/files": [
      { pattern: "**/*.spec.js", category: "test" },
      { pattern: "**/*.js", category: "source" }
    ]
  }
}]
```

With this configuration, `src/components/atoms/atom-a/AtomA.spec.js` matches both descriptors, so its file `categories` array is `["test", "source"]` — in descriptor declaration order. A plain `AtomA.js` matches only the second descriptor, so its `categories` is `["source"]`.

This is the key difference from element types, which are single by default (you opt in to [multi-type](./elements.md#multi-type-elements)). File categories always accumulate.

| | Element descriptors | File descriptors |
| --- | --- | --- |
| Setting | `boundaries/elements` | `boundaries/files` |
| Answers | Which element does the file belong to? | What kind of file is it? |
| Result | `element.types` (array) | `file.categories` (array) |
| Accumulation | Single type by default; opt in to [multi-type](./elements.md#multi-type-elements) | Always accumulates all matching categories |

## File Description

During analysis, the plugin builds a runtime **file description** for each analyzed file as part of its [entity](./classification.md). Access it as `from.file` / `to.file` in [selectors](../selectors/selectors.md) and [message templates](../policies/policies.mdx#message-templating) (for example, `{{to.file.categories}}`).

| Property | Type | Description |
| --- | --- | --- |
| `categories` | `<array of strings \| null>` | All file categories matched, or `null` when the file matches no file descriptor (unknown) or is ignored. |
| `path` | `<string \| null>` | The file path. Relative to [`rootPath`](../settings/settings.md#boundariesroot-path) when inside it, absolute when outside. Kept even for unknown files. |
| `captured` | `<object \| null>` | Captured values merged from all matching file descriptors, or `null` when there are none. |
| `isIgnored` | `<boolean>` | `true` when the file is excluded by [include/ignore](../settings/settings.md#boundariesignore) settings. |
| `isUnknown` | `<boolean>` | `true` when the file matches no file descriptor. |

:::note
The file dimension is independent from the element dimension. A file can be a **known element** but an **unknown file** (no matching file descriptor), or an **unknown element** but a **known file** (it matched a file descriptor but no element descriptor). See [Classification](./classification.md) for how the three layers combine into one entity.
:::

## Matching Files using Selectors

To target a file, use the [`file` sub-selector](../selectors/file.md) inside a policy's `to`:

```js
// Match files with the "test" category
{ to: { file: { categories: ["test"] } } }
```

See [File Selectors](../selectors/file.md) for the full `file` selector reference.

## Interaction with `no-unknown-files`

The [`no-unknown-files`](../rules/no-unknown-files.md) rule reports files that the plugin does not recognize. A file is reported only when it belongs to no known element **and** matches no file descriptor.

This means defining a file descriptor makes the matching files **known**: a file that matches any `boundaries/files` pattern is no longer flagged, even if it belongs to no element.

This behavior also preserves backward compatibility: configurations that classified files such as tests or styles through element descriptors (the deprecated [`mode: "file"`](./elements/legacy.md) or element [`category`](./elements/legacy.md)) and have since moved them to file descriptors keep passing the rule, instead of being newly reported as unknown.

The default message reflects both layers:

```text
File does not match any file pattern and does not belong to any known element
```

See [`no-unknown-files`](../rules/no-unknown-files.md) for the full rule reference.

## Migrating from the Element `category` Property

File categories are the recommended replacement for the deprecated [`category` property in element descriptors](./elements/legacy.md).

It keeps working without changes; you will see a deprecation warning in your console. File descriptors are a better fit because they categorize files independently of elements: one element can contain files in several categories, and a single file can have several categories at once — neither is possible with the single, element-wide `category`.

To migrate, move the category from the element descriptor to a file descriptor:

| Legacy (element descriptor) | Recommended (file descriptor) |
| --- | --- |
| `{ type: "helper", category: "helper", pattern: "helpers/*" }` | `{ type: "helper", pattern: "helpers/*" }` plus `boundaries/files`: `{ pattern: "helpers/**", category: "helper" }` |

See the [v6 to v7 migration guide](../releases/migration-guides/v6-to-v7.mdx) for full details.

## Next Steps

- **[Classification](./classification.md)** - how elements, files, and modules combine into one entity.
- **[Elements](./elements.md)** - classify files by the architectural element they belong to.
- **[Modules](./modules.md)** - classify dependencies by where they resolve from.
- **[Selectors](../selectors/selectors.md)** - match files (and their categories) in your policies.
- **[Settings](../settings/settings.md)** - the `boundaries/files` setting schema and every other global setting.
