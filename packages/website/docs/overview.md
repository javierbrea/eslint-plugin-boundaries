---
id: overview
title: Overview
description: Learn what ESLint Plugin Boundaries is and how it can help you enforce architectural boundaries in your JavaScript and TypeScript projects.
tags:
  - concepts
keywords:
  - eslint-plugin-boundaries
  - eslint plugin
  - JavaScript
  - TypeScript
  - architectural layers
  - software architecture
  - module dependencies
  - project structure
  - code quality
  - linting
  - static analysis
  - dependency analysis
  - architecture enforcement
  - clean code
---

# Overview

JS Boundaries is a project that provides a set of tools to help you enforce architectural boundaries in your JavaScript and TypeScript projects.

---

:::info[Robert C. Martin's quote]
**"Software architecture is the art of drawing lines that I call boundaries. Those boundaries separate software elements from one another, and restrict those on one side from knowing about those on the other."**

[*Clean Architecture: A Craftsman's Guide to Software Structure and Design*](https://www.oreilly.com/library/view/clean-architecture-a/9780134494272/)
:::

---

## Purpose

It ensures that __your architectural boundaries are respected by the elements in your project__ by checking the folder and file structure and the dependencies between them. At the moment, it consists of an **ESLint plugin: [eslint-plugin-boundaries](https://www.npmjs.com/package/eslint-plugin-boundaries).**

## How It Works

By default, it analyzes `import` and `export` statements, `require` calls, and dynamic `import()` expressions. You can customize it to inspect any other AST node that creates a dependency, such as `jest.mock()`. See the [configuration guide for more details](./settings/settings.md).

For each dependency it finds, the plugin classifies both the file the dependency comes from and the module it points to. That classification is what your rule policies read to decide whether the dependency is allowed.

:::info[Summary]
1. You classify each file or folder in the project using [**descriptors**](./classification/classification.md) in your configuration.
2. The plugin classifies each dependency at runtime, building a [**description**](./classification/classification.md) for both sides of the dependency.
3. You define [**policies**](./policies/policies.mdx) allowing or disallowing dependencies based on the descriptions. Each policy can combine any of the three layers from both sides of the dependency, and the dependency metadata to express a boundary.
:::

## Usage

### 1. Define the Classification in Your Project through Configuration

The plugin classifies every file along three independent layers. You configure the first two layers to recognize files and the elements they belong to; the third is derived for you.

| Layer | Describes | You configure? | Example |
| --- | --- | --- | --- |
| **element** | The architectural role a file plays. Usually based on the folder it is in. | Yes, with [element descriptors](./classification/elements.md). | `{ type: "controller", pattern: "controllers/*" }` |
| **file** | A cross-cutting category of the file itself, independent of its element. | Yes, with [file descriptors](./classification/files.md). | `{ pattern: "**/*.spec.js", category: "test" }` |
| **module** | Where the imported module resolves from. | No — derived from the import. | `import "react"` resolves to `module.origin: "external"` |

Configuration is done in your `eslint.config.js` file, in the [`boundaries`](./settings/settings.md) settings. For example:

```javascript
const elementDescriptors = [
  { type: "controller", pattern: "controllers/*" },
  { type: "model", pattern: "models/*" },
  { type: "view", pattern: "views/*" },
  { type: "shared", pattern: "shared/*" },
];

const fileDescriptors = [
  { category: "test", pattern: "**/*.spec.js" },
];
```

:::tip[Progressive Layering]
Layering is progressive. Start with one classification layer — elements or files — and one policy, then add the remaining layers when you need them. You only need to configure one of the two; the rest is optional. See [Classification](./classification/classification.md).
:::

### 2. The Plugin Builds a Runtime Description for Each Dependency

Given this configuration, the plugin builds a **description** for each dependency, which includes the three layers for both the `from` and `to` sides of the dependency, and it also carries a fourth, **fully computed** layer: the [dependency metadata](./classification/dependency.md). It describes the nature of the import itself — its `kind` (a value, type, or typeof import), the structural `relationship` between the two elements, and the imported `specifiers`.

| Dependency Property | Description |
| --- | --- |
| **from** | The element, file, and module the dependency comes from. |
| **to** | The element, file, and module the dependency points to. |
| **dependency** | The metadata about the dependency itself: its kind, relationship, specifiers, and so on. |

<details>
<summary>Click to expand an example of a runtime description</summary>

```javascript
// Runtime description for a dependency in src/controllers/controller-a/index.js
{
  from: {
    element: {
      types: ["controller"],
      captured: { elementName: "controller-a" },
    },
    file: { categories: null },
    module: { origin: "local" },
  },
  to: {
    element: {
      types: ["view"],
      captured: { elementName: "view-a" },
    },
    file: { categories: null },
    module: { origin: "local" },
  },
  dependency: {
    kind: "value",
    source: "@views/view-a",
    specifiers: ["ViewA"],
  },
}
```

:::note
This is a simplified view. See **[Classification](./classification/classification.md)** for the full list of properties available in each description.
:::

</details>

### 3. Define your Rule Policies Based on These Descriptions

Based on these **[descriptions](./classification/classification.md)**, you define **[rule policies](./policies/policies.mdx)** to allow or disallow dependencies using **[selectors](./selectors/selectors.md)**.

<div style={{textAlign: 'center', margin: '2rem 0'}}>
  ![Architecture Boundaries Diagram](./overview-schema.svg)
</div>

Each policy can combine any of the three layers from both sides of the dependency, and the dependency metadata to express a boundary. Because the layers are independent, a policy can mix them.

```javascript
const dependencyRulePolicies = [
  // Allow controllers to depend on models and views
  {
    from: { element: { type: "controller" } },
    allow: {
      to: { element: { types: { anyOf: ["model", "view"] } },
    },
  },
  // Allow views to depend on models
  {
    from: { element: { type: "view" } },
    allow: {
      to: { element: { type: "model" } },
    },
  },
  // Disallow models to depend on anything other than other models
  {
    from: { element: { type: "model" } },
    disallow: {
      to: { element: { type: "!model" } },
    },
  },
  // Disallow any element from importing a test file (a file layer match)
  {
    disallow: {
      to: { file: { categories: "test" } },
    },
  },
  // Only shared code may use the `axios` package (a module layer match)
  {
    from: { element: { type: "!shared" } },
    disallow: {
      to: { module: { source: "axios" } },
    },
  },
];
```

:::note
This is a very simplified view. See **[Selectors](./selectors/selectors.md)** for the full syntax and capabilities of selectors, and **[Policies](./policies/policies.mdx)** for the full list of policy properties.
:::

### 4. Get Instant Feedback

When a file violates a dependencies rule policy, ESLint reports an error. For example, a model importing a view:

```javascript
// src/models/model-a/index.js
import View from "../../views/view-a";
```

ESLint reports:

```text
error  Dependencies to elements of type "view" are not allowed in elements of type "model". Denied by policy at index 2  boundaries/dependencies
```

## Scope

This plugin focuses on enforcing architectural boundaries by analyzing the relationships between abstract elements. It does not inspect import syntax or enforce coding standards unrelated to module dependencies.

:::note
This plugin is not a replacement for [eslint-plugin-import](https://www.npmjs.com/package/eslint-plugin-import). In fact, using both together is recommended.
:::

## Quick Start

:::tip
Read the [Quick Start Guide](./quick-start.mdx) for step-by-step instructions on setting up the plugin in your project.
:::
