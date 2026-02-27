---
id: elements
title: Element Descriptors
sidebar_label: Elements
description: Learn how to use element descriptors to classify files in your project for ESLint Plugin Boundaries.
tags:
  - concepts
  - configuration
keywords:
  - JS Boundaries
  - ESLint plugin
  - boundaries
  - javaScript
  - typeScript
  - element descriptors
  - element types
  - setup
  - configuration
  - patterns
  - path matching
---

# Elements

Element descriptors are the foundation of the plugin. **They define how to recognize and classify files in your project as specific element types.**

## Defining Element Descriptors

Element descriptors are configured in the `boundaries/elements` setting as an array of objects. Each descriptor defines:

- **What type** of element it represents
- **What pattern** to match in file paths
- **What values** to capture from those paths

```javascript
export default [{
  settings: {
    "boundaries/elements": [
      {
        type: "helpers",
        pattern: "helpers/*/*.js",
        mode: "file",
        capture: ["domain", "elementName"]
      },
      {
        type: "components",
        pattern: "components/*/*",
        capture: ["family", "elementName"]
      },
      {
        type: "modules",
        pattern: "module/*",
        capture: ["elementName"]
      }
    ]
  }
}]
```

## From Descriptors to Runtime Descriptions

Element descriptors are configuration inputs. During analysis, the plugin transforms them into **runtime element descriptions**.

- These descriptions include resolved properties such as `type`, `category`, `captured`, `parents`, `origin`, etc.
- When a dependency is analyzed, the plugin builds a **dependency description** containing:
  - `from`: description of the file being analyzed
  - `to`: description of the imported target
  - `dependency`: dependency metadata (`kind`, `relationship`, `specifiers`, etc.)

:::info
Read the [Runtime Descriptions](#runtime-description-properties) for a detailed breakdown of all available properties in runtime descriptions.
:::

These runtime descriptions are used in two key places:

- [Selectors](./selectors.md): to match elements/dependencies in plugin rules.
- [Rule custom messages](./rules.mdx#message): to render dynamic error messages.


## Element Descriptor Properties

### `type` (required)

**Type:** `<string>`

The element type to be assigned to files or imports matching the pattern. This type will be used in rules configuration to define relationships between elements.

```js
{
  type: "helpers"
}
```

### `pattern` (required)

**Type:** `<string> | <array>`

A [micromatch pattern](https://github.com/micromatch/micromatch) to match against file paths.

:::warning
By default, the plugin matches patterns progressively from the right side of each file path. This means you only need to define the last part of the path you want to match, not the full path from the project root (unless using `mode: "full"`).
:::

**Example:** Given a path `src/helpers/awesome-helper/index.js`:
- First tries to match `index.js`
- Then `awesome-helper/index.js`
- Then `helpers/awesome-helper/index.js`
- And so on...

Once a pattern matches, the plugin assigns the corresponding element type and continues searching for parent elements using the same logic until the full path has been analyzed.

This behavior can be disabled by setting `mode` to `full`.

```js
{
  type: "helpers",
  pattern: "helpers/*/*.js"
}
```

### `mode` (optional)

**Type:** `<string>` - One of: `"file"` | `"folder"` | `"full"`

**Default:** `"folder"`

Controls how the pattern matching works:

- **`folder`** (default): When analyzing a file path, the element type is assigned to the first parent folder matching the pattern. Any file within that folder is considered part of the element. In practice, it's like adding `**/*` to your pattern.

  A pattern like `models/*` would match:
  - `src/models/user.js` (assigns type `models` to `user.js` file)
  - `src/modules/foo/bar.js` (assigns type `models` to `bar.js` file)

- **`file`**: The pattern is not modified, but the plugin still tries to match the last part of the path. So, a pattern like `*.model.js` would match:
  - `src/foo.model.js`
  - `src/modules/foo/foo.model.js`
  - `src/modules/foo/models/foo.model.js`

- **`full`**: The pattern only matches against the complete file path from the project root. You must provide patterns matching from the base project path. To match `src/modules/foo/foo.model.js` you need patterns like:
  - `**/*.model.js`
  - `**/*/*.model.js`
  - `src/*/*/*.model.js`

:::note Pattern Matching Modes and rootPath

Patterns in element descriptors are **relative to [`rootPath`](./settings.md#boundariesroot-path)** (which defaults to the current working directory).

The pattern matching behavior differs significantly across modes:

**Example:** Consider a file at `packages/app/src/models/user.model.ts`

With `rootPath` set to `packages/app`:

```js
// file mode - matches right-to-left from end of path
{
  type: "model",
  pattern: "*.model.ts",
  mode: "file"
}
// ✅ Matches! Pattern matches the filename ending

// folder mode - matches folder, adds **/* internally  
{
  type: "model",
  pattern: "models/*",
  mode: "folder"
}
// ✅ Matches! Right-to-left finds "models/user" folder

// full mode - requires complete path match from rootPath
{
  type: "model",
  pattern: "src/models/*.model.ts",
  mode: "full"
}
// ✅ Matches! Full relative path from rootPath matches

// full mode with incomplete pattern
{
  type: "model",
  pattern: "models/*.model.ts",
  mode: "full"
}
// ❌ Doesn't match - missing "src/" prefix in pattern
```

**Key takeaway:** In `file` and `folder` modes, right-to-left evaluation makes patterns more flexible. In `full` mode, you must specify the complete path relative to `rootPath` (unless the file is outside `rootPath`, in which case absolute paths are used, read [monorepo setup](../guides/monorepo-setup.md) for more details).

:::

### `capture` (optional)

**Type:** `<array>`

A powerful feature that allows capturing values from path fragments to use later in rules configuration. Uses [micromatch capture feature](https://github.com/micromatch/micromatch#capture) under the hood.

Each captured value is stored in an object with the key from the `capture` array at the same index as the captured fragment.

**Example:**

```js
{
  type: "helpers",
  pattern: "*/helpers/*.js",
  capture: ["domain", "elementName"]
}
```

For a path `users/helpers/parsers.js`, this captures:
```js
{
  domain: "users",
  elementName: "parsers"
}
```

:::tip
These captured values can then be used in [element selectors](./selectors.md#captured-values-matching) to create more specific and dynamic rules.
:::

### `basePattern` (optional)

**Type:** `<string>`

A [micromatch pattern](https://github.com/micromatch/micromatch) that the left side of the element path must also match from the project root.

This option is useful when using `mode` with `file` or `folder` values, but you also need to capture fragments from other parts of the full path (see `baseCapture` below).

The effective pattern becomes: `[basePattern]/**/[pattern]`

```js
{
  type: "components",
  pattern: "*/component.js",
  basePattern: "src/modules/*",
  baseCapture: ["moduleName"]
}
```

### `baseCapture` (optional)

**Type:** `<array>`

Works like `capture`, but for the `basePattern`. Allows capturing values from the base pattern portion of the path.

All keys from both `capture` and `baseCapture` can be used in rules configuration.

```js
{
  type: "components",
  pattern: "components/*",
  basePattern: "src/modules/*",
  capture: ["componentName"],
  baseCapture: ["moduleName"]
}
```

For a path `src/modules/auth/components/LoginForm`, this captures:
```js
{
  moduleName: "auth",
  componentName: "LoginForm"
}
```

:::warning
Be careful to avoid overlapping captures between `capture` and `baseCapture`. Each key must be unique across both arrays. In case of duplicates, the values from `capture` take precedence.
:::

## Element Matching Order

:::danger
Element descriptors are evaluated in array order. The plugin assigns the element type from the **first matching pattern**.
:::

**Best Practice:** Sort element descriptors from most specific to least specific patterns.

```js
"boundaries/elements": [
  // Most specific first
  {
    type: "react-component",
    pattern: "components/*/Component.tsx"
  },
  // Less specific patterns after
  {
    type: "component",
    pattern: "components/*"
  },
]
```

## Hierarchical Elements

The plugin supports elements being children of other elements. This relationship can be used later in the [`boundaries/no-private`](../rules/no-private.md) rule to restrict access to elements to only their parent elements.

When analyzing a path, it continues searching for parent elements after finding the first match.

**Example:**

```js
"boundaries/elements": [
  {
    type: "component",
    pattern: "components/*",
    capture: ["componentName"]
  },
  {
    type: "module",
    pattern: "modules/*",
    capture: ["moduleName"]
  }
]
```

For path `src/modules/auth/components/LoginForm/index.js`:
1. First matches `component` type (LoginForm)
2. Continues and matches `module` type (auth) as parent

## Runtime Description Properties

Based on the element descriptors, the plugin builds runtime descriptions for each file and dependency. These descriptions contains:

* `from`: description of the file being analyzed
* `to`: description of the imported target
* `dependency`: dependency metadata (`kind`, `relationship`, `specifiers`, etc.)

### Element Description (`from` / `to`)

Element descriptions contain the following properties:

- **`path`**: <small>`<string | null>`</small> - Absolute file path (or `null`, when the dependency source can't be resolved to any file)
- **`elementPath`**: <small>`<string | null>`</small> - Path of the element, relative to the project root path (see [Settings](../setup/settings.md#boundariesroot-path)), or `null` if the file doesn't match any element descriptor
- **`internalPath`**: <small>`<string | null>`</small> - Path of the file relative to the element path (or `null` if the file doesn't match any element descriptor)
- **`type`**: <small>`<string | null>`</small> - Element type according to the matched descriptor (or `null` if the descriptor doesn't define a type or there's no match)
- **`category`**: <small>`<string | null>`</small> - Element category according to the matched descriptor (or `null` if the descriptor doesn't define a category or there's no match)
- **`captured`**: <small>`<object | null>`</small> - Object with captured values from descriptors (or `null` if there are no captures or no match)
- **`parents`**: <small>`<array | null>`</small> - Array of parent elements (or `null`). Each parent contains:
  - **`type`**: <small>`<string | null>`</small> - Parent element type. `null` if the descriptor doesn't define a type.
  - **`category`**: <small>`<string | null>`</small> - Parent element category. `null` if the descriptor doesn't define a category.
  - **`elementPath`**: <small>`<string>`</small> - Parent element path
  - **`captured`**: <small>`<object>`</small> - Captured values for the parent element
- **`origin`**: <small>`<"local" | "external" | "core" | null>`</small> - Origin of the element, or `null` when the dependency source can't be resolved to any file.
- **`isIgnored`**: <small>`<boolean>`</small> - True when the file is ignored due to ignore patterns in the [settings](../setup/settings.md#boundariesignore).
- **`isUnknown`**: <small>`<boolean>`</small> - True when the file or dependency doesn't match any element descriptor.

### Dependency Description (`dependency`)

- **`source`**: <small>`<string>`</small> - The source string of the dependency as it appears in the code (e.g. import source)
- **`baseSource`**: <small>`<string | null>`</small> - The base source without any path modifiers when the dependency is external or a Node.js core dependency (e.g. package name in `node_modules`), or `null` for local dependencies
- **`kind`**: <small>`"value" | "type" | "typeof"`</small>
- **`nodeKind`**: <small>`<string | null>`</small> - AST node kind creating the dependency (or `null`)
- **`specifiers`**: <small>`<array | null>`</small> - imported/exported specifiers array (or `null`)
- **`relationship.from`**: <small>`<string | null>`</small> - relation from importer perspective (or `null`). Possible values:
  - `"internal"` - The dependency is internal to the element
  - `"child"` - The dependency is a child of the element
  - `"descendant"` - The dependency is a descendant of the element
  - `"sibling"` - The dependency is a sibling of the element (both have the same parent)
  - `"parent"` - The dependency is a parent of the element
  - `"uncle"` - The dependency is an uncle of the element
  - `"nephew"` - The dependency is a nephew of the element
  - `"ancestor"` - The dependency is an ancestor of the element
- **`relationship.to`**: relation from imported element perspective (or `null`). Possible values are the inverse of `relationship.from`:
  - `"internal"` ↔ `"internal"`
  - `"child"` ↔ `"parent"`
  - `"descendant"` ↔ `"ancestor"`
  - `"sibling"` ↔ `"sibling"`
  - `"uncle"` ↔ `"nephew"`
