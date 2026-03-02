---
id: rules
title: Rules Overview
description: Overview of the rules provided by ESLint Plugin Boundaries to enforce architectural boundaries.
tags:
  - rules
keywords:
  - ESLint plugin
  - boundaries
  - rules
  - summary
---

# Rules Overview

ESLint Plugin Boundaries provides a primary rule (`boundaries/element-types`) that enables you to define and enforce architectural boundaries within your codebase. With this rule, you can specify which types of elements (e.g., modules, components, services) are allowed to interact with each other.

In addition to the main rule, the plugin includes another rule that ensures all files in your project belong to a known element type, preventing the creation of stray files that do not fit into your defined architecture.

Here are the key rules provided by the plugin:

## element-types

This rule ensures that dependencies between the [elements](../setup/elements.md) in your project follow the constraints you have defined.

Example:

* Define the element types in your project as “models”, “views”, and “controllers”. Then enforce that “views” and “models” can only be imported by “controllers”, and that “controllers” are never used by “views” or “models”.

See the [documentation for the `boundaries/element-types` rule](./dependencies.md) for more details.

## no-unknown-files

This rule ensures that all files in your project belong to a known element type (files matching [element descriptors](../setup/elements.md)). It helps maintain a well-defined architecture by preventing stray files from being even created.

See the [documentation for the `boundaries/no-unknown-files` rule](./no-unknown-files.md) for more details.

## no-unknown

This rule ensures that known files cannot import unknown files (files that do not match with any [element descriptor](../setup/elements.md)). It helps maintain clear boundaries by preventing dependencies on unclassified files.

See the [documentation for the `boundaries/no-unknown` rule](./no-unknown.md) for more details.

:::tip
The restriction set by this rule can also be achieved with the **[`boundaries/element-types` rule](./dependencies.md)**, which allows you to specify rules based on the `isUnknown` property of the [elements selector](../setup/selectors.md), but it is provided as a shortcut for this common use case. You can choose to use either this specific rule or the `boundaries/element-types` for more granularity and flexibility based on your preference and needs. 
:::

## no-ignored

This rule ensures that all known files can only import non-ignored files. It helps maintain the integrity of your architecture by preventing dependencies on files that are intentionally excluded from the architectural boundaries.

See the [documentation for the `boundaries/no-ignored` rule](./no-ignored.md) for more details.

## Deprecated legacy rules

Some legacy rules that are not aligned with the new architecture and configuration system will be deprecated in oncoming major versions. They will continue working for now, but it is recommended to migrate them to `boundaries/element-types` as soon as possible, as they will eventually be removed.

### entry-point

This rule ensures that elements cannot import files from another element except through the defined entry point for that type.

:::warning
Now this can also be achieved with the `boundaries/element-types` rule, but this legacy rule will continue working for now to give you more time to migrate your configuration. It helps maintain clear and consistent access points between different architectural layers.
:::

See the [documentation for the `boundaries/entry-point` rule](./entry-point.mdx) for more details.

### external

This rule checks which external dependencies can be used by each element type.

It helps maintain consistent dependency management across different architectural layers. For example, you can configure that “helpers” cannot import `react`, that “components” cannot import `react-router-dom`, or that modules cannot import `{ Link }` from `react-router-dom`.

:::warning
This rule is still available for now, but the recommended way to manage external dependencies is through the `boundaries/element-types` rule, which allows you to specify allowed external dependencies directly in the rules by using the `origin` and `source` properties. This legacy rule will eventually be removed, so it is recommended to migrate your configuration to `boundaries/element-types` as soon as possible.
:::

See the [documentation for the `boundaries/external` rule](./external.mdx) for more details.

### no-private

This rule ensures that elements cannot import the children of another element. When element B is a child of element A, B becomes a “private” element of A, and only A is allowed to use it.

:::warning
This rule is still available for now, but the recommended way to manage private elements is through the `boundaries/element-types` rule, which allows you to define rules based on the relationship between elements, including parent-child relationships. This legacy rule will eventually be removed, so it is recommended to migrate your configuration to `boundaries/element-types` as soon as possible.
:::

See the [documentation for the `boundaries/no-private` rule](./no-private.mdx) for more details.
