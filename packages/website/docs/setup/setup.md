---
id: setup
label: Setup
title: Setup Overview
description: Setup instructions for ESLint Plugin Boundaries.
tags:
  - configuration
  - concepts
keywords:
  - JS Boundaries
  - ESLint plugin
  - boundaries
  - javaScript
  - typeScript
  - setup
  - overview
---

# Setup Overview

The plugin architecture is built on three main concepts that work together:

### Core Concepts

1. **[Element Descriptors](./elements.md)** - Define what types of elements exist in your project (components, modules, helpers, etc.) and how to recognize them based on file paths. Read more in the [Elements](./elements.md) section.
2. **[Element Selectors](./selectors.md)** - Match specific elements in rules based on their type and captured properties. Read more in the [Selectors](./selectors.md) section.
3. **[Global Settings](./settings.md)** - Configure plugin behavior, define dependencies to analyze, and set include/ignore patterns. Read more in the [Global Settings](./settings.md) section and [Configuration Helpers](./eslint-integration.md).

### Workflow

The typical workflow when setting up the plugin involves three main steps:

1. **Define your element types** using [element descriptors](./elements.md) in `boundaries/elements` setting
2. **Configure rules** using [element selectors](./selectors.md) to specify which elements can interact with each other
3. **Customize global settings** to include/ignore files, define dependency nodes, etc. You can use the helpers in the [Configuration Helpers](./eslint-integration.md) section to simplify this process.

The plugin analyzes each file in your project and assigns it an element type based on your descriptors. Then, when checking dependencies (imports, requires, etc.), it uses your rules with element selectors to determine if the dependency is allowed.

<!-- > **Tip:** Enable [debug mode](#debug-mode) when first configuring the plugin to see which element type is assigned to each file and what properties are captured. -->
