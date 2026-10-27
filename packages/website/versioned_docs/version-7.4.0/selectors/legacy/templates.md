---
id: templates
title: Legacy Templates Syntax
sidebar_label: Templates
description: Reference for legacy template syntax in eslint-plugin-boundaries, with migration guidance to modern templating syntax.
tags:
  - configuration
  - deprecated
keywords:
  - eslint-plugin-boundaries
  - legacy
  - templates
  - deprecated
  - migration
---

# Legacy Template Syntax

The legacy template syntax **`${ property }`** in selectors is kept for backward compatibility but is deprecated and will be removed in a future major version. Use the modern `{{ property }}` syntax instead. See [Templating in selectors](../selectors.md#templating-in-selectors) for the modern form.

It keeps working without changes while [`boundaries/legacy-templates`](../../settings/settings.md#boundarieslegacy-templates) is enabled (its default, planned to change to `false` in the next major version).

With legacy syntax you can also use `${ target.* }` as an alias for `{{ to.* }}`, and access captured values directly:

- `${ from.capturedProperty }`
- `${ to.capturedProperty }`
- `${ target.capturedProperty }`

Migrate these to the `captured` namespace, for example `{{ from.element.captured.capturedProperty }}` and `{{ to.element.captured.capturedProperty }}`. See the [message templating](../../policies/policies.mdx#message-templating) section of the Policies documentation for more on the two syntaxes.

:::caution
When [`boundaries/legacy-templates`](../../settings/settings.md#boundarieslegacy-templates) is enabled (its default), captured values are also injected at the top level of the template data. If a captured value has the same name as a runtime property (for example `path`, `category`, or `origin`), it overwrites that template variable and can cause surprising results. To avoid this, set `boundaries/legacy-templates` to `false` and access captured values only through the `captured` namespace (for example `{{ from.element.captured.path }}`).
:::

## Why migrate?

The new template syntax is more powerful and flexible, and it is the only form that will be supported in future major versions. The modern syntax has several advantages over the legacy form:

- **Compatibility with other templating systems** — The `{{ property }}` syntax is widely used in other tools and frameworks, making it easier to read and understand.
- **All description properties are reachable** — The modern syntax allows access to all properties of the `from` and `to` entities, including `file`, `element`, and `module` sub-selectors.

## Migration guide

For step-by-step migration instructions and examples, see the [v6 to v7 migration guide](../../releases/migration-guides/v6-to-v7.mdx). If you are migrating from an earlier version, the [v5 to v6 migration guide](../../releases/migration-guides/v5-to-v6.mdx).

## See Also

- [Classification](../../classification/classification.md) — To read all properties of the `from` and `to` entities, including `file`, `element`, and `module` sub-selectors.
- [Selectors](../selectors.md) — How templates are used in selectors, with examples of the modern `{{ property }}` syntax.
- [Settings](../../settings/settings.md) — configure `boundaries/legacy-templates`.
- [v6 to v7 Migration Guide](../../releases/migration-guides/v6-to-v7.mdx) — full migration instructions.
