---
id: legacy
title: Deprecated Settings
sidebar_label: Deprecated Settings
description: Deprecated global settings in eslint-plugin-boundaries — boundaries/types and boundaries/alias — with their modern replacements.
tags:
  - configuration
  - deprecated
keywords:
  - eslint-plugin-boundaries
  - legacy
  - deprecated
  - boundaries/types
  - boundaries/alias
  - settings
  - migration
---

# Deprecated Settings

The following settings are kept for backward compatibility. They still work, and migrating to their replacements is recommended.

## `boundaries/types`

:::warning[Deprecated]
`boundaries/types` is kept for backward compatibility but is deprecated and will be removed in a future major version. Use **[`boundaries/elements`](./settings.md#boundarieselements)** instead.
:::

It keeps working without changes; you will see a deprecation warning in your console. It is a legacy alias for `boundaries/elements` and is used only as a fallback when `boundaries/elements` is absent. Rename the key to migrate.

## `boundaries/alias`

:::warning[Deprecated]
`boundaries/alias` is kept for backward compatibility but is deprecated and will be removed in a future major version. Use the **[`import/resolver`](./settings.md#importresolver)** settings instead.
:::

It was a path-alias map. Configure module resolution with `import/resolver`, which gives access to a wide ecosystem of resolvers. See the [Custom Resolvers](../guides/custom-resolvers.md) guide.

## `boundaries/elements-single-type`

:::warning[Deprecated: `boundaries/elements-single-type`]
`boundaries/elements-single-type` is a deprecated alias of [`boundaries/elements-single-match`](./settings.md#boundarieselements-single-match), kept for backward compatibility. It will be removed in a future major version — migrate to `boundaries/elements-single-match`. When both are set, `boundaries/elements-single-match` takes precedence.
:::

## See Also

- [Settings](./settings.md) — the full reference for every active global setting.
- [Config Helpers](./config-helpers.md) — typed configuration helpers.
- [Custom Resolvers](../guides/custom-resolvers.md) — replacing `boundaries/alias` with `import/resolver`.
