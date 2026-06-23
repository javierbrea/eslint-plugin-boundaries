---
id: rules
title: Rules Overview
description: Overview of the rules provided by ESLint Plugin Boundaries to enforce architectural boundaries.
tags:
  - rules
keywords:
  - eslint-plugin-boundaries
  - rules
  - rules overview
  - dependencies
  - no-unknown
  - no-unknown-files
  - no-ignored
  - architecture enforcement
  - import restrictions
  - dependency constraints
---

# Rules Overview

ESLint Plugin Boundaries provides a suite of rules that work together to enforce architectural boundaries in your codebase. The main rule, [`boundaries/dependencies`](./dependencies.md), is the canonical rule for restricting dependencies between [elements](../setup/elements.md) (for example, components importing helpers). The other rules complement it: they catch files that do not belong to your architecture, dependencies on unknown elements, and dependencies on ignored files.

The plugin ships four active rules, plus several deprecated rules kept for backward compatibility. The active rules are described first; the deprecated rules are listed at the end with migration guidance.

:::info[Rule configuration]
This page lists the available rules and links to each rule's reference. The shared configuration format for rules — the `rules` array, `allow`/`disallow` policies, [selectors](../setup/selectors.md), and custom message templates — is documented in **[Rules Configuration](../setup/rules.mdx)**. Read that page first to learn how to configure any rule.
:::

Here are the rules provided by the plugin:

## dependencies

`boundaries/dependencies` is the canonical rule for restricting dependencies between [elements](../setup/elements.md). It ensures that dependencies between the elements in your project follow the constraints you have defined.

Example:

* Define the element types in your project as "helpers", "components", and "modules". Then enforce that "helpers" can only import other "helpers", and that "components" can import "helpers" but not the other way around.

It also works with multi-type elements: when you set [`boundaries/elements-single-type`](../setup/settings.md) to `false`, the rule matches against every type an element has.

See the [documentation for the `boundaries/dependencies` rule](./dependencies.md) for more details.

## no-unknown-files

This rule reports files that your architecture does not recognize at all. A file is reported only when it matches neither an [element descriptor](../setup/elements.md) (`boundaries/elements`) nor a [file descriptor](../setup/files.md) (`boundaries/files`). File descriptors let you categorize files independently of elements, so a file matching any file descriptor pattern is considered known even if it belongs to no element. The default message is `File does not match any file pattern and does not belong to any known element`.

See the [documentation for the `boundaries/no-unknown-files` rule](./no-unknown-files.md) for more details.

## no-unknown

This rule prevents known elements from importing local dependencies whose target does not match any [element descriptor](../setup/elements.md) (an unknown element). It helps maintain clear boundaries by preventing dependencies on unclassified parts of your project.

See the [documentation for the `boundaries/no-unknown` rule](./no-unknown.md) for more details.

:::tip
The restriction set by this rule can also be achieved with the **[`boundaries/dependencies` rule](./dependencies.md)**, which lets you specify rules based on the `isUnknown` property of the [element selector](../setup/selectors.md). This rule is provided as a shortcut for this common use case. Use either this specific rule or `boundaries/dependencies` for more granularity, based on your needs.
:::

## no-ignored

This rule ensures that all known files can only import non-ignored files. It helps maintain the integrity of your architecture by preventing dependencies on files that are intentionally excluded from the architectural boundaries.

See the [documentation for the `boundaries/no-ignored` rule](./no-ignored.md) for more details.

## Deprecated rules

The following rules are deprecated and emit a one-time deprecation warning in your console at runtime. They keep working without changes, so you can migrate to `boundaries/dependencies` at your own pace. They will be removed in a future major version.

### element-types

`boundaries/element-types` is a deprecated alias for [`boundaries/dependencies`](./dependencies.md). It has identical behavior and options.

:::warning[Deprecated]
`boundaries/element-types` is kept for backward compatibility but is deprecated and will be removed in a future major version. Use **[`boundaries/dependencies`](./dependencies.md)** instead.
:::

It keeps working without changes; you will see a deprecation warning in your console. To migrate, rename the rule key from `boundaries/element-types` to `boundaries/dependencies` — the options stay the same.

### entry-point

This rule ensures that elements cannot import files from another element except through the defined entry point for that type.

:::warning[Deprecated]
`boundaries/entry-point` is kept for backward compatibility but is deprecated and will be removed in a future major version. Use **[`boundaries/dependencies`](./dependencies.md)** instead.
:::

It keeps working without changes; you will see a deprecation warning in your console. You can reproduce its behavior with `boundaries/dependencies` by selecting the target element and constraining the importable files through the `fileInternalPath` property.

See the [documentation for the `boundaries/entry-point` rule](./entry-point.mdx) for more details.

### external

This rule checks which external dependencies can be used by each element. For example, you can configure that "helpers" cannot import `react`, that "components" cannot import `react-router-dom`, or that modules cannot import `{ Link }` from `react-router-dom`.

:::warning[Deprecated]
`boundaries/external` is kept for backward compatibility but is deprecated and will be removed in a future major version. Use **[`boundaries/dependencies`](./dependencies.md)** instead.
:::

It keeps working without changes; you will see a deprecation warning in your console. To check external dependencies with `boundaries/dependencies`, set `checkAllOrigins` to `true` and target external modules through the [`module` sub-selector](../setup/selectors.md) (`to.module.origin` and `to.module.source`).

See the [documentation for the `boundaries/external` rule](./external.mdx) for more details.

### no-private

This rule ensures that elements cannot import the children of another element. When element B is a child of element A, B becomes a "private" element of A, and only A is allowed to use it.

:::warning[Deprecated]
`boundaries/no-private` is kept for backward compatibility but is deprecated and will be removed in a future major version. Use **[`boundaries/dependencies`](./dependencies.md)** instead.
:::

It keeps working without changes; you will see a deprecation warning in your console. You can reproduce its behavior with `boundaries/dependencies` by matching the parent-child relationship through the `dependency.relationship` property.

See the [documentation for the `boundaries/no-private` rule](./no-private.mdx) for more details.

## Further Reading

Read next sections to learn more about related topics:

* [Defining Elements](../setup/elements.md) - Learn how to define architectural elements in your project
* [Selectors](../setup/selectors.md) - Learn about element, file, and module selectors used in rules
* [Rules Configuration](../setup/rules.mdx) - Learn how to configure rule options and custom messages
* [Global Settings](../setup/settings.md) - Learn about global settings that affect all rules
