---
id: legacy
title: Legacy Element Fields
sidebar_label: Legacy
description: Deprecated element descriptor fields in eslint-plugin-boundaries — the element-level category and mode — with their modern replacements.
tags:
  - configuration
  - deprecated
keywords:
  - eslint-plugin-boundaries
  - legacy
  - deprecated
  - element descriptor
  - category
  - mode
  - file descriptors
  - migration
---

## Legacy Element Descriptor Fields

The following [element descriptor](../elements.md) fields are kept for backward compatibility but are deprecated and will be removed in a future major version.

## `category` (optional)

:::warning[Deprecated]
`category` in element descriptors is kept for backward compatibility but is deprecated and will be removed in a future major version. Use **[file descriptor categories](../files.md)** instead.
:::

**Type:** `<string>`

It keeps working without changes. File descriptors are a better fit because they categorize files independently of elements — one element can contain files in several categories, and a file can have several categories at once.

To migrate, move the category from the element descriptor to a [file descriptor](../files.md):

| Legacy (element descriptor) | Recommended (file descriptor) |
| --- | --- |
| `{ type: "helper", category: "helper", pattern: "helpers/*" }` | `{ type: "helper", pattern: "helpers/*" }` plus `boundaries/files`: `{ pattern: "helpers/**", category: "helper" }` |

A descriptor that matched with only a deprecated category (no type) leaves `types` as `null` and does not accumulate later types.

See the [v6 to v7 migration guide](../../releases/migration-guides/v6-to-v7.mdx) for full details.

## `mode` (optional)

:::warning[Deprecated]
`mode` is kept for backward compatibility but is deprecated and will be removed in a future major version. Element descriptors now always use folder-like matching, and file classification use cases are covered by **[file descriptors](../files.md)**.
:::

**Type:** `<string>` — one of `"folder"` | `"file"` | `"full"`. **Default:** `"folder"`.

It keeps working without changes. `mode` controlled how a pattern was interpreted:

- **`folder`** (default): the element is a folder. The pattern is expanded internally (effectively adding `/**/*`), so any file under the matched folder belongs to the element. This is the standard behavior — you no longer need to set it.
- **`file`**: the element is the file itself, matched right-to-left without the folder expansion. Use cases that classified individual files this way are now better expressed with [file descriptors](../files.md) and their categories.
- **`full`**: the pattern must match the **entire** file path (relative to [`rootPath`](../../settings/settings.md#boundariesroot-path)). It still works. The recommended replacement is [`partialMatch: false`](../elements.md#partialmatch-optional), which provides the same full-path matching but preserves folder semantics for the element `path`.

If you have configs that relied on `mode: "file"` to classify files, migrate them to file descriptors. If you used `mode: "full"`, migrate to `partialMatch: false`. See the [v6 to v7 migration guide](../../releases/migration-guides/v6-to-v7.mdx).

## Legacy Element Description Properties

The following properties of the runtime **element description** remain available for backward compatibility but are deprecated:

- *`type`* `<string | null>` - Alias for `types[0]`. Use `types`.
- *`category`* `<string | null>` - Deprecated element category. Use `file.categories`.
- *`elementPath`* `<string | null>` - Legacy alias for `path`.
- *`filePath`* `<string | null>` - Legacy alias kept for the deprecated `mode: "file"`.
- *`internalPath`* - Legacy alias; in V7 it maps to `fileInternalPath` for local elements and to `module.internalPath` for external modules.

Parent elements expose the matching legacy aliases (`type`, `category`, `elementPath`).

:::warning
Avoid using these deprecated properties in [Element Selectors](../../selectors/selectors.md) and [message templates](../../policies/policies.mdx#message-templating). Use the modern properties instead. Read the [Migration Guide](../../releases/migration-guides/v6-to-v7.mdx) for full details on how to update your configs and templates.
:::

## See Also

- [Elements](../elements.md) — element descriptors and the modern element layer.
- [Files](../files.md) — file descriptors, the replacement for element-level `category`.
- [v6 to v7 Migration Guide](../../releases/migration-guides/v6-to-v7.mdx) — full migration instructions.
