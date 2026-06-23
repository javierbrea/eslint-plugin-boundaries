---
id: classification
title: Classification
sidebar_label: Classification
description: How ESLint Plugin Boundaries classifies every file and dependency through three independent layers — element, file, and module.
tags:
  - concepts
  - configuration
keywords:
  - eslint-plugin-boundaries
  - JavaScript
  - TypeScript
  - classification
  - entity model
  - element descriptors
  - file descriptors
  - module origin
  - runtime descriptions
  - dependency description
  - architecture enforcement
---

# Classification

Before the plugin can enforce a rule, it has to answer one question: *what is this file?* It answers it through three independent layers. Every file, and every dependency it points to, is described by all three at once:

- **Element** — the architectural piece the file belongs to, such as the folder `components/Button/` or `helpers/data/`. An element carries `types` and captured values. **You define elements** with [element descriptors](./elements.md).
- **File** — the file on its own, regardless of which element it lives in. A file carries `categories`, so a test file is a test file whether it sits in a component or a helper. **You define file categories** with [file descriptors](./files.md).
- **Module** — what an import resolves to: a local file, an external package, or a Node.js built-in. A module carries an `origin` and a `source`. **This layer is derived automatically** from the import; you do not configure it.

Together these three layers form an **entity** — the unit the plugin analyzes. The layers are orthogonal: the same file can be element-type `["component"]`, file-categories `["test", "tsx"]`, and module-origin `"local"`, all independently. This page introduces each layer and shows how they combine. Each layer has its own page with the full reference.

## The element layer

An element is a group of files the plugin treats as one architectural unit — usually a folder. You declare elements in the `boundaries/elements` setting, assigning each a `type` and a `pattern` that matches its files. The plugin can also capture path fragments (a component's name, a helper's family) for use in rules.

Define your `helper`, `component`, and `module` elements, then write rules about which may depend on which.

```js
"boundaries/elements": [
  { type: "helper", pattern: "helpers/*", capture: ["family"] },
  { type: "component", pattern: "components/*/*", capture: ["family", "elementName"] },
  { type: "module", pattern: "modules/*", capture: ["elementName"] }
]
```

Read **[Elements](./elements.md)** for descriptor properties, matching order, hierarchical elements, and multi-type elements.

## The file layer

The file layer answers a different question than the element layer: not *which element does this file belong to?* but *what kind of file is this, on its own?* You declare file categories in the `boundaries/files` setting. A file descriptor assigns a `category` to every file matching its `pattern`.

This layer is for cross-cutting file kinds — tests, styles, stories — that appear inside many different elements. Categories accumulate, so one file can carry several at once. Like element descriptors, file descriptors can also `capture` named path fragments for use in rules, exposed at runtime as `file.captured`.

```js
"boundaries/files": [
  { pattern: "**/*.spec.js", category: "test" },
  { pattern: "**/*.css", category: "style" }
]
```

Read **[Files](./files.md)** for file descriptor properties, how categories accumulate, and the migration from the deprecated element-level `category`.

## The module layer

The module layer describes where a dependency resolves to. Unlike the other two, you do not configure it — the plugin derives it from each import. A module has an `origin` of `"local"` (your own project), `"external"` (an installed package), or `"core"` (a Node.js built-in), plus a `source` (the base package name) and an `internalPath` (the sub-path within a package).

This is the layer you use to control imports of packages and built-ins: allow only certain elements to import `react`, or forbid direct imports of Node.js core modules.

```text
import "react"        → { origin: "external", source: "react",  internalPath: null }
import "node:fs"      → { origin: "core",     source: "node:fs", internalPath: null }
import "../helpers"   → { origin: "local",    source: null,      internalPath: null }
```

Read **[Modules](./modules.md)** for the origin determination rules and how `boundaries/flag-as-external` and `boundaries/root-path` influence them.

## Which layer should I use?

The three layers are independent, so the right one depends on the question you are asking. Use this table to choose:

| You want to… | Use | Configured with |
| --- | --- | --- |
| Group code by architectural role (components, helpers, modules) | Elements | [`boundaries/elements`](./elements.md) |
| Tag files across elements (tests, styles, stories) | File categories | [`boundaries/files`](./files.md) |
| Control imports of external packages or Node.js core modules | Modules | derived automatically; see [Modules](./modules.md) |
| Capture path fragments (element name, family) for dynamic rules | Element or file captured values | [`boundaries/elements`](./elements.md) / [`boundaries/files`](./files.md) |
| Match files by both their element and their kind at once | All three, via entity selectors | [Selectors](./selectors.md) |

You rarely use a single layer in isolation. A typical rule combines them: *components may import test files only from helpers*, for example, mixes the element layer with the file layer.

## What the plugin sees

When the plugin analyzes a dependency, it builds a runtime **dependency description**:

- `from`: the **entity** of the file being analyzed (the importer).
- `to`: the **entity** of the imported target.
- `dependency`: metadata about the relationship itself (`kind`, `relationship`, `specifiers`, and so on — see [Dependency Description](#dependency-description) below).

Both `from` and `to` are entities, so each exposes all three layers. Here is the full shape for a single dependency, annotated by layer:

```js
{
  // The importer (a known element; an unknown file, since no file descriptor matches AtomA.js)
  from: {
    element: { types: ["component"], path: "components/atoms/atom-a", captured: { family: "atoms", elementName: "atom-a" }, /* ... */ },
    file:    { categories: null, isUnknown: true, path: "components/atoms/atom-a/AtomA.js", /* ... */ },
    module:  { origin: "local", source: null, internalPath: null }
  },
  // The imported target
  to: {
    element: { types: null, isUnknown: true, /* ... */ },
    file:    { categories: null, isUnknown: true, /* ... */ },
    module:  { origin: "external", source: "react", internalPath: null }
  },
  // The relationship between them (null here, since the target is not a known local element)
  dependency: { kind: "value", source: "react", relationship: { from: null, to: null }, /* ... */ }
}
```

Notice how the two entities lean on different layers. The local importer is a known `element` (its `file` is unknown here only because no file descriptor matches `AtomA.js`); the imported package is unknown as an element and a file, and meaningful only in its `module`. This is why you match local files with element and file selectors, and match packages with module selectors.

:::note
A file can be a **known element** and an **unknown file** at the same time — the layers are independent. A file is "known" to the file layer only when it matches a [file descriptor](./files.md).
:::

For the full property list of each layer, see the per-layer reference tables:

- [Element description](./elements.md#element-description) — `types`, `path`, `fileInternalPath`, `captured`, `parents`, and the element states.
- [File description](./files.md#file-description) — `categories`, `path`, `captured`, and the file states.
- [Module description](./modules.md#module-description) — `origin`, `source`, `internalPath`.

[Selectors](./selectors.md) match against these descriptions; [message templates](./rules.mdx#message-templating) read from them to render dynamic error messages.

## Dependency Description

The `dependency` part of a dependency description carries metadata about the relationship itself — independent of the two entities it connects. Accessed as `dependency`. Properties:

- **`source`** `<string>` - The source string of the dependency as written in the code.
- **`kind`** `<"value" | "type" | "typeof">` - The dependency kind.
- **`nodeKind`** `<string | null>` - The `name` of the AST dependency node that produced it (see [`boundaries/additional-dependency-nodes`](./settings.md#boundariesadditional-dependency-nodes)), or `null`.
- **`specifiers`** `<array | null>` - Imported/exported specifier names, or `null`.
- **`relationship.from`** `<string | null>` - The relationship from the importer's perspective. One of `"internal"`, `"child"`, `"descendant"`, `"sibling"`, `"parent"`, `"uncle"`, `"nephew"`, `"ancestor"`.
- **`relationship.to`** `<string | null>` - The relationship from the imported element's perspective, the inverse of `relationship.from`:
  - `"internal"` ↔ `"internal"`
  - `"child"` ↔ `"parent"`
  - `"descendant"` ↔ `"ancestor"`
  - `"sibling"` ↔ `"sibling"`
  - `"uncle"` ↔ `"nephew"`

## Combining layers in a rule

The layers pay off when you combine them. Say you want components to import test files only from helpers. That rule mixes the element layer (the importing element and the target element) with the file layer (the target file's category):

```js
{
  from: { element: { type: "component" } },
  allow: {
    to: {
      element: { type: "helper" },
      file: { categories: "test" }
    }
  }
}
```

The `from`/`to` objects above are **entity selectors**: each sub-key (`element`, `file`, `module`) matches its own layer, and all provided sub-keys must match. Read **[Selectors](./selectors.md)** for the full matching reference, and **[Rules Configuration](./rules.mdx)** for how rules use these selectors to allow or disallow dependencies.

## Next Steps

- **[Elements](./elements.md)** - define the architectural elements your files belong to.
- **[Files](./files.md)** - categorize files across elements with file descriptors.
- **[Modules](./modules.md)** - understand module origin for external and core imports.
- **[Selectors](./selectors.md)** - match elements, files, and modules in your rules.
- **[Rules Configuration](./rules.mdx)** - write the dependency rules that enforce your architecture.
- **[Debugging](../guides/debugging.md)** - inspect the runtime entity description the plugin assigns to each file.
