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

But that’s not all. In addition to the main rule, the plugin includes other complementary rules that further enhance its capabilities and help you maintain the integrity and consistency of your architecture.

Here are the key rules provided by the plugin:

### Element types

This rule ensures that dependencies between the various element types in your project follow the constraints you have defined.

Examples:

* Define the element types in your project as “models”, “views”, and “controllers”. Then enforce that “views” and “models” can only be imported by “controllers”, and that “controllers” are never used by “views” or “models”.
* Define the element types in your project as “components”, “views”, “layouts”, “pages”, and “helpers”. Then enforce that “components” can only import “helpers”; “views” can only import “components” or “helpers”; “layouts” can only import “views”, “components”, or “helpers”; and “pages” can import any other element type.

See the [documentation for the `boundaries/element-types` rule](./dependencies.md) for more details.

### Allowed external modules

This rule checks which external dependencies can be used by each element type. For example, you can configure that “helpers” cannot import `react`, that “components” cannot import `react-router-dom`, or that modules cannot import `{ Link }` from `react-router-dom`.

See the [documentation for the `boundaries/external` rule](./external.md) for more details.

### Private elements

This rule ensures that elements cannot import the children of another element. When element B is a child of element A, B becomes a “private” element of A, and only A is allowed to use it.

See the [documentation for the `boundaries/no-private` rule](./no-private.md) for more details.

### Entry point

This rule ensures that elements cannot import files from another element except through the defined entry point for that type (`index.js` by default).

See the [documentation for the `boundaries/entry-point` rule](./entry-point.md) for more details.

