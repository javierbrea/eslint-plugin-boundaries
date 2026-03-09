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

:::info Robert C. Martin's quote
**"Software architecture is the art of drawing lines that I call boundaries. Those boundaries separate software elements from one another, and restrict those on one side from knowing about those on the other."**

[*Clean Architecture: A Craftsman's Guide to Software Structure and Design*](https://www.oreilly.com/library/view/clean-architecture-a/9780134494272/)
:::

---

## Purpose

It ensures that __your architectural boundaries are respected by the elements in your project__ by checking the folder and file structure and the dependencies between them. At the moment, it consists of an **ESLint plugin: [eslint-plugin-boundaries](https://www.npmjs.com/package/eslint-plugin-boundaries).**

## How It Works

By default, it analyzes `import` statements, but it can also evaluate `require`, `exports` and dynamic imports (`import()`). You can further customize it to inspect any other AST node that creates a dependency, such as `jest.mock()`. See the [configuration guide for more details](./setup/settings.md).

## Usage

### 1. Define the Elements in Your Project through Configuration

```javascript
const elementDescriptors = [
  { type: "controller", pattern: "controllers/*" },
  { type: "model", pattern: "models/*" },
  { type: "view", pattern: "views/*" },
  { type: "shared", pattern: "shared/*" },
];
```

### 2. The Plugin Provides Descriptions for Each Dependency

Given this configuration, the plugin will analyze your project in runtime and classify dependencies, providing lots of useful metadata about the files and their relationships. For example:

```javascript
// When analyzing a dependency in src/controllers/controller-a.js
{
  from: {
    path: "src/controllers/controller-a.js",
    type: "controller",
    category: null,
    captured: { elementName: "controller-a" },
    origin: "local",
  },
  to: {
    path: "src/views/view-a.js",
    type: "view",
    category: null,
    captured: { elementName: "view-a" },
    origin: "local",
  },
  dependency: {
    kind: "value",
    source: "@views/view-a.js",
    specifiers: ["ViewA"],
  }
}
```

### 3. Define your Rules Based on These Descriptions

Based on these **[descriptions](./setup/elements.md#runtime-description-properties)**, you can define rules to allow or disallow dependencies between elements using **[selectors](./setup/selectors.md)**. For example:

<div style={{textAlign: 'center', margin: '2rem 0'}}>
  ![Architecture Boundaries Diagram](./overview-schema.svg)
</div>

```javascript
const dependencyRules = [
  // Allow controllers to depend on models and views
  {
    from: {
      type: "controller",
    },
    allow: {
      to: { type: ["model", "view"] },
    },
  },
  // Allow views to depend on models
  {
    from: {
      type: "view",
    },
    allow: {
      to: { type: "model" },
    },
  },
  // Disallow models to depend on anything other than other models
  {
    from: {
      type: "model",
    },
    disallow: {
      to: { type: "!model" },
    },
  },
  // Allow any file to depend on other files of the same element
  {
    from: {
      type: "*",
    },
    allow: {
      dependency: {
        relationship: {
          to: "internal",
        },
      }
    },
  },
  // Allow any file to depend on shared files,
  // but only if it's a type dependency (e.g. TypeScript type imports)
  {
    from: {
      type: "*",
    },
    allow: {
      to: { type: "shared" },
      dependency: {
        kind: "type",
      },
    },
  },
];
```

### 4. Get Instant Feedback

When a file violates a dependencies rule, ESLint will report an error:

```javascript
// In src/models/model-a.js

import View  from '../views/view-a';

/* ❌ Error: Importing elements of type 'views'
is not allowed in elements of type 'models'.
Disallowed in rule 3 */
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

