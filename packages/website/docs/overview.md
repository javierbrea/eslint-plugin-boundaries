---
id: overview
title: Overview
description: Learn what ESLint Plugin Boundaries is and how it can help you enforce architectural boundaries in your JavaScript and TypeScript projects.
tags:
  - concepts
keywords:
  - ESLint plugin
  - boundaries
  - javaScript
  - typeScript
  - architectural layers
  - software architecture
  - module dependencies
  - project structure
  - code quality
  - linting
  - static analysis
  - dependencies
  - architecture
  - clean code
---

# Overview

JSBoundaries is a project that provides a set of tools to help you enforce architectural boundaries in your JavaScript and TypeScript projects.

---

:::info Robert C. Martin's quote
**"Software architecture is the art of drawing lines that I call boundaries. Those boundaries separate software elements from one another, and restrict those on one side from knowing about those on the other."**

[*Clean Architecture: A Craftsman's Guide to Software Structure and Design*](https://www.oreilly.com/library/view/clean-architecture-a/9780134494272/)
:::

---

At the moment, it consists of an ESLint plugin: [eslint-plugin-boundaries](https://www.npmjs.com/package/eslint-plugin-boundaries): It ensures that __your architectural boundaries are respected by the elements in your project__ by checking the folder and file structure and the dependencies between them.

By default, it analyzes `import` statements, but it can also evaluate `require`, `exports` and dynamic imports (`import()`). You can further customize it to inspect any other AST node that creates a dependency, such as `jest.mock()`. See the [configuration guide for more details](./setup/settings.md).

## 1. Define your Element Types

```javascript
const elementDescriptors = [
  { type: "controllers", pattern: "controllers/*" },
  { type: "models", pattern: "models/*" },
  { type: "views", pattern: "views/*" }
];
```

## 2. Define your Rules

<div style={{textAlign: 'center', margin: '2rem 0'}}>
  ![Architecture Boundaries Diagram](./overview-schema.svg)
</div>

```javascript
const rules = [
  {
    from: "controllers",
    allow: ["models", "views"]
  },
  {
    from: "views",
    allow: ["models"]
  },
  {
    from: "models",
    disallow: ["*"]
  }
];
```

## 3. Get Instant Feedback

When a file violates a dependencies rule, ESLint will report an error:

```javascript
// In src/models/model-a.js

import View  from '../views/view-a'; /* Error: Importing elements of type
'views' is not allowed in elements of type 'models'. Disallowed in rule 3 */
```

## Scope

This plugin focuses on enforcing architectural boundaries by analyzing the relationships between abstract elements. It does not inspect import syntax or enforce coding standards unrelated to module dependencies.

:::note
This plugin is not a replacement for [eslint-plugin-import](https://www.npmjs.com/package/eslint-plugin-import). In fact, using both together is recommended.
:::




