---
id: dependency
title: Legacy Dependency Metadata Selector Syntax
sidebar_label: Dependency Metadata
description: Reference for deprecated dependency metadata selector syntax in eslint-plugin-boundaries, with migration guidance to modern object-based selectors.
tags:
  - configuration
  - deprecated
keywords:
  - eslint-plugin-boundaries
  - legacy
  - selectors
  - deprecated
  - migration
  - string selector
  - tuple selector
  - dependency metadata
---

# Legacy Dependency Metadata Selector Syntax

These formats keep working without changes, but when a rule policy uses them the plugin emits a one-time runtime console warning encouraging migration to object-based selectors. When you are ready to migrate, the [v6 to v7 migration guide](../../releases/migration-guides/v6-to-v7.mdx) covers the full transition, including the [entity selector](../selectors.md#entity-selectors) form.

## Dependency metadata properties

### module

Since v7, the module information is now reachable through the [`module` sub-selector](../module.md). The legacy form keeps working, but it should be migrated to use the `to.module.source` property instead.

| Deprecated | Replacement |
| --- | --- |
| `{ dependency: { module: "react" } }` | `{ to: { module: { source: "react" } } }` |

## Migration guide

For step-by-step migration instructions and examples, see the [v6 to v7 migration guide](../../releases/migration-guides/v6-to-v7.mdx).

## See Also

- [Selectors](../selectors.md) — modern object-based and entity selector reference.
- [Policies](../../policies/policies.mdx) — where selectors are used in `from`/`to`/`dependency`.
- [v6 to v7 Migration Guide](../../releases/migration-guides/v6-to-v7.mdx) — full migration instructions.
