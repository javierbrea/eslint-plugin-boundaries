---
id: setup
label: Setup
title: Setup Overview
description: Setup overview for ESLint Plugin Boundaries — elements, the entity model, selectors, and global settings.
tags:
  - configuration
  - concepts
keywords:
  - eslint-plugin-boundaries
  - eslint setup
  - JavaScript
  - TypeScript
  - setup
  - setup overview
  - configuration
  - element descriptors
  - entity model
  - file descriptors
  - selectors
  - plugin settings
---

# Setup Overview

The plugin is built on a few concepts that work together. Start with elements, then layer the rest as your project grows.

## Core Concepts

1. **[Classification](./classification.md)** - Classify your project along three layers: [elements](./elements.md) (the architectural pieces you define, such as components, modules or helpers), [files](./files.md) (cross-cutting categories such as tests or styles), and [modules](./modules.md) (where each import resolves from, derived automatically). Read more in the [Classification](./classification.md) section.
2. **[Selectors](./selectors.md)** - Match specific elements, files or modules in rules based on their runtime description. Read more in the [Selectors](./selectors.md) section.
3. **[Global Settings](./settings.md)** - Configure plugin behavior: which dependency nodes to analyze, include/ignore patterns, and more. Read more in the [Settings](./settings.md) section and [Configuration Helpers](./eslint-integration.md).

## The Entity Model

When the plugin analyzes a file, it builds a runtime description called an **entity** made of three independent layers: the **element** the file belongs to, the **file** classified on its own (its `categories`), and the **module** each dependency resolves to (`"local"`, `"external"`, or `"core"`). These layers let rules reason about a file along three axes at once.

The [Classification](./classification.md) section is the full introduction to this model and links to a page for each layer: [Elements](./elements.md), [Files](./files.md), and [Modules](./modules.md).

:::note
You do not need all three layers to get started. Elements and one dependencies rule are enough for a working setup — see the [Quick Start](../quick-start.mdx). File descriptors and module matching are there when you need them.
:::

## Workflow

The typical workflow when setting up the plugin has three steps:

1. **Classify your files** using the [Classification](./classification.md) layers: define [elements](./elements.md) in the `boundaries/elements` setting, and optionally categorize files with [file descriptors](./files.md). The [module](./modules.md) layer is derived automatically.
2. **Configure rules** using [selectors](./selectors.md) to specify which elements can interact with each other. Selectors can also match on file categories or module origins when you need them.
3. **Customize global settings** to include or ignore files, define dependency nodes, categorize files, and more. The helpers in [Configuration Helpers](./eslint-integration.md) simplify this process.

The plugin analyzes each file in your project and builds a runtime entity description — the element it belongs to, its file categories, and the module origin of each dependency. Your rules and their selectors then determine whether each dependency is allowed.

:::tip Debug Mode
Enable [debug mode](../guides/debugging.md) when first configuring the plugin to see the full runtime entity description (element, file, and module) assigned to each file.
:::

:::info Custom error messages
Rules can produce dynamic error messages using [message templates](./rules.mdx#message-templating), reading values such as `{{from.element.types}}`, `{{to.file.categories}}`, or `{{to.module.origin}}`.
:::

## Next Steps

- **[Classification](./classification.md)** - the three layers (element, file, module) that describe every file.
  - **[Elements](./elements.md)** - define the architectural elements your files belong to.
  - **[Files](./files.md)** - categorize files across elements with file descriptors.
  - **[Modules](./modules.md)** - understand module origin for external and core imports.
- **[Selectors](./selectors.md)** - match elements, files, and modules in your rules.
- **[Rules Configuration](./rules.mdx)** - write the dependency rules that enforce your architecture.
- **[Settings](./settings.md)** - the full reference for every global setting.
- **[Debugging](../guides/debugging.md)** - inspect the runtime descriptions the plugin assigns.
