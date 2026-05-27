[![Build status][build-image]][build-url] [![Coverage Status][coveralls-image]][coveralls-url] [![Quality Gate][quality-gate-image]][quality-gate-url]

[![Renovate](https://img.shields.io/badge/renovate-enabled-brightgreen.svg)](https://renovatebot.com) [![Last commit][last-commit-image]][last-commit-url] [![Last release][release-image]][release-url]

[![NPM downloads][npm-downloads-image]][npm-downloads-url] [![License][license-image]][license-url]

[![Mutation testing badge](https://img.shields.io/endpoint?style=flat&url=https%3A%2F%2Fbadge-api.stryker-mutator.io%2Fgithub.com%2Fjavierbrea%2Feslint-plugin-boundaries%2Fmaster)](https://dashboard.stryker-mutator.io/reports/github.com/javierbrea/eslint-plugin-boundaries/master)

# @boundaries/elements

> Entity descriptors and matchers for `@boundaries` tools, such as `@boundaries/eslint-plugin`.

## Table of Contents

- [Introduction](#introduction)
- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Core Concepts](#core-concepts)
  - [Entities](#entities)
  - [Elements](#elements)
  - [Files](#files)
  - [Modules](#modules)
- [Usage](#usage)
  - [Configuration Options](#configuration-options)
  - [Creating a Matcher](#creating-a-matcher)
  - [Element Descriptors](#element-descriptors)
  - [File Descriptors](#file-descriptors)
  - [Describing Entities](#describing-entities)
  - [Describing Dependencies](#describing-dependencies)
  - [Matching Entities](#matching-entities)
  - [Matching Dependencies](#matching-dependencies)
  - [Template Variables](#template-variables)
  - [Flagging Dependencies as External](#flagging-dependencies-as-external)
- [API Reference](#api-reference)
  - [Class: Elements](#class-elements)
  - [Matcher Instance Methods](#matcher-instance-methods)
  - [Selector Reference](#selector-reference)
  - [Description Reference](#description-reference)
- [Legacy Selectors](#legacy-selectors)
- [Migration from v2](#migration-from-v2)
- [Contributing](#contributing)
- [License](#license)

## Introduction

`@boundaries/elements` provides a system for describing and matching **entities** in JavaScript and TypeScript projects. An entity is any file or dependency under analysis, described by three complementary facets:

- **Element** — the architectural role (e.g., component, service, helper)
- **File** — per-file metadata and categorization
- **Module** — the origin of a dependency (local, external, or core)

Together, these facets let you define architectural boundaries, validate dependencies between parts of your codebase, and enforce structural rules. This package powers tools like [`@boundaries/eslint-plugin`](https://github.com/javierbrea/eslint-plugin-boundaries) and uses [Micromatch patterns](https://github.com/micromatch/micromatch) for flexible matching.

>[!NOTE]
> This package does not read or analyze your codebase directly. It provides the core logic for defining and matching entities and dependencies, which can be integrated into linters, build systems, or custom tooling.

## Features

- **Entity-based model** — describe files and dependencies as entities with element, file, and module facets
- **Flexible pattern matching** using Micromatch syntax
- **File categorization** independent from elements
- **Module origin detection** — distinguish local, external, and core dependencies
- **Template variables** for dynamic selector matching
- **Built-in caching** for optimal performance
- **Capture path fragments** for advanced matching scenarios

## Installation

Install the package via npm:

```bash
npm install @boundaries/elements
```

## Quick Start

Define how your project is structured, then describe and match entities:

```typescript
import { Elements } from '@boundaries/elements';

const elements = new Elements();

// Define your project structure
const matcher = elements.getMatcher({
  elements: [
    { type: "component", pattern: "src/components/*", mode: "folder", capture: ["name"] },
    { type: "service", pattern: "src/services/*.ts", mode: "file", capture: ["name"] },
  ],
  files: [
    { pattern: "*.spec.ts", category: "test" },
    { pattern: "*.controller.ts", category: "controller" },
  ],
});

// Describe an entity — returns element, file, and module information
const entity = matcher.describeEntity("src/components/Button/Button.spec.ts");

console.log(entity.element.types);    // ["component"]
console.log(entity.element.captured); // { name: "Button" }
console.log(entity.file.categories);  // ["test"]
console.log(entity.module.origin);    // "local"
```

Match entities against selectors:

```typescript
// Does this file belong to a component?
matcher.isEntityMatch("src/components/Button/index.ts", {
  element: { type: "component" },
}); // true

// Is this file a test file inside a component?
matcher.isEntityMatch("src/components/Button/Button.spec.ts", {
  element: { type: "component" },
  file: { categories: "test" },
}); // true

// Validate dependencies between entities
matcher.isDependencyMatch(
  {
    from: "src/components/Button/index.ts",
    to: "src/services/Api.ts",
    source: "../../services/Api",
    kind: "value",
    nodeKind: "ImportDeclaration",
  },
  {
    from: { element: { type: "component" } },
    to: { element: { type: "service" } },
    dependency: { kind: "value" },
  }
); // true
```

## Core Concepts

### Entities

An **entity** is the central abstraction in `@boundaries/elements`. Every file or dependency in your project is an entity, described by three facets:

```
Entity
├── element  — architectural role (component, service, module, ...)
├── file     — per-file metadata (categories, captured values)
└── module   — origin information (local, external, core)
```

When you describe an entity, you get a composite object with all three facets:

```typescript
const entity = matcher.describeEntity("src/modules/auth/auth.controller.ts");
// {
//   element: { types: ["module"], path: "src/modules/auth", captured: { name: "auth" }, ... },
//   file:    { categories: ["controller"], path: "src/.../auth.controller.ts", ... },
//   module:  { origin: "local", source: null, internalPath: null }
// }
```

### Elements

An **element** represents an architectural unit — a meaningful group of files in your project (components, services, modules, helpers, etc.). Elements are defined via [element descriptors](#element-descriptors) that map file path patterns to types.

Key characteristics:
- A file can belong to an element (or be unknown if no descriptor matches)
- Elements form hierarchies: a component inside a module has that module as its parent
- An element can have multiple types (e.g., a file matching both "component" and "widget" descriptors)

### Files

A **file** provides per-file metadata and categorization, independent from which element the file belongs to. Files are categorized via [file descriptors](#file-descriptors).

For example, within a "module" element, you can distinguish between controllers, services, models, and tests — all belonging to the same element but having different file categories.

A file can match multiple file descriptors, accumulating all matched categories.

### Modules

A **module** describes the origin of a dependency:

- **`local`** — files within your project
- **`external`** — external dependencies (e.g., packages from `node_modules`)
- **`core`** — Node.js built-in modules (e.g., `fs`, `path`, `node:crypto`)

For external and core modules, the module description also includes `source` (the base package name, e.g., `"react"`) and `internalPath` (the subpath, e.g., `"hooks/useState"` for `"react/hooks/useState"`).

## Usage

### Configuration Options

When creating an `Elements` instance, you can provide configuration options that will be used as defaults for all matchers:

```typescript
const elements = new Elements({
  ignorePaths: ["**/dist/**", "**/build/**", "**/node_modules/**"],
  includePaths: ["src/**/*"],
  rootPath: "/absolute/path/to/project",
  flagAsExternal: {
    unresolvableAlias: true,
    inNodeModules: true,
    outsideRootPath: true,
    customSourcePatterns: ["@myorg/*"],
  },
});
```

**Available options:**

- **`ignorePaths`**: Micromatch pattern(s) to exclude certain paths from matching (default: none)
- **`includePaths`**: Micromatch pattern(s) to include only specific paths (default: all paths)
- **`legacyTemplates`**: Whether to enable legacy template syntax support (default: `true`, but it will be `false` in future releases). This allows using `${variable}` syntax in templates for backward compatibility.
- **`cache`**: Whether to enable internal caching to improve performance (default: `true`)
- **`rootPath`**: Absolute path to the project root. When configured, file paths should be provided as absolute paths to allow the package to determine which files are outside the project root (default: `undefined`)
- **`flagAsExternal`**: Configuration for categorizing dependencies as external or local. Multiple conditions can be specified, and dependencies will be categorized as external if ANY condition is met (OR logic). See [Flagging Dependencies as External](#flagging-dependencies-as-external) for details.

> [!NOTE]
> **Pattern Matching with `rootPath`:**
> When `rootPath` **is configured**:
> - **Matching patterns** in element descriptors are **relative to the `rootPath`**. The package automatically converts absolute paths to relative paths internally for pattern matching.
> - In **`file` and `folder` modes**, patterns are evaluated **right-to-left** (from the end of the path), so the relativity to `rootPath` is typically less important. For example, a pattern like `*.model.ts` will match any file ending with `.model.ts` regardless of its location within `rootPath`.
> - In **`full` mode**, patterns must match the complete relative path from `rootPath`. Files outside `rootPath` maintain their absolute paths and require absolute patterns to match.

### Creating a Matcher

Use the `getMatcher` method to create a matcher with a descriptors configuration:

```typescript
const matcher = elements.getMatcher({
  elements: [
    { type: "component", pattern: "src/components/*", mode: "folder" },
    { type: "helper", pattern: "src/helpers/*.js", mode: "file" },
  ],
});
```

The `getMatcher` method accepts a `DescriptorsConfig` object with the following properties:

- **`elements`** (`ElementDescriptor[]`): Optional array of [element descriptors](#element-descriptors). If not provided, no element abstraction layer is created and only file descriptors are used.
- **`files`** (`FileDescriptor[]`): Optional array of [file descriptors](#file-descriptors). If not provided, only element descriptors are used to describe files.
- **`elementsSingleType`** (`boolean`): When `true`, only the first matching descriptor's type is used at each path level. When `false` (default), an element can match multiple type descriptors, accumulating all matched types in the `types` array.

You can combine element and file descriptors:

```typescript
const matcher = elements.getMatcher({
  elements: [
    { type: "module", pattern: "src/modules/*", mode: "folder" },
  ],
  files: [
    { pattern: "*.controller.ts", category: "controller", capture: ["name"] },
    { pattern: "*.service.ts", category: "service", capture: ["name"] },
    { pattern: "*.model.ts", category: "model", capture: ["name"] },
  ],
});
```

> **Tip:** Matchers with identical descriptors and options share the same cache instance for improved performance.

You can override the default options when creating a matcher:

```typescript
const matcher = elements.getMatcher(
  { elements: [/* descriptors */] },
  {
    ignorePaths: ["**/*.test.ts"],
  }
);
```

### Element Descriptors

Element descriptors define how files are identified and categorized into architectural elements (e.g., modules, components, services). Each descriptor is an object with the following properties:

- **`pattern`** (`string | string[]`): Micromatch pattern(s) to match file paths
- **`type`** (`string`): The element type to assign to matching files
- **`category`** (`string`): _(Deprecated)_ Additional categorization for the element. Use [file descriptors](#file-descriptors) with `categories` instead for more flexible per-file categorization.
- **`mode`** (`"file" | "folder" | "full"`): _(Deprecated)_ Matching mode (default: `"folder"`)
  - `"folder"`: Matches the first folder matching the pattern. The library will add `**/*` to the given pattern for matching files, because it needs to know exactly which folder has to be considered the element. So, you have to provide patterns matching the folder being the element, not the files directly.
  - `"file"`: Matches files directly, but still matches progressively from the right. The provided pattern will not be modified.
  - `"full"`: Matches the complete path.
- **`basePattern`** (`string`): Additional pattern that must match from the project root. Use it when using `file` or `folder` modes and you want to capture fragments from the rest of the path.
- **`capture`** (`string[]`): Array of keys to capture path fragments
- **`baseCapture`** (`string[]`): Array of keys to capture fragments from `basePattern`. If the same key is defined in both `capture` and `baseCapture`, the value from `capture` takes precedence.

### File Descriptors

File descriptors allow categorizing individual files independently from the element they belong to. This provides more granular control over file classification within elements. Each descriptor is an object with the following properties:

- **`pattern`** (`string | string[]`): Micromatch pattern(s) to match file paths. Patterns match progressively from the right (like element descriptors in `file` mode).
- **`category`** (`string`): The category to assign to matching files (e.g., `"controller"`, `"service"`, `"model"`).
- **`capture`** (`string[]`): Array of keys to capture path fragments from the pattern.

```typescript
const matcher = elements.getMatcher({
  elements: [
    { type: "module", pattern: "src/modules/*", mode: "folder", capture: ["moduleName"] },
  ],
  files: [
    { pattern: "*.controller.ts", category: "controller", capture: ["name"] },
    { pattern: "*.service.ts", category: "service", capture: ["name"] },
    { pattern: "*.spec.ts", category: "test", capture: ["name"] },
  ],
});
```

> [!NOTE]
> A file can match multiple file descriptors, accumulating all matched categories in the `categories` array of the file description.

### Describing Entities

The `describeEntity` method is the primary way to get information about a file or dependency. It returns a unified description combining all three facets:

```typescript
const entity = matcher.describeEntity("src/modules/auth/auth.controller.ts");
```

The result is an `EntityDescription` object:

```ts
{
  element: ElementDescription,  // Architectural role
  file: FileDescription,        // File-level metadata
  module: ModuleDescription,    // Origin information
}
```

**Element facet** — architectural information about the element the file belongs to:

| Property | Type | Description |
|---|---|---|
| `types` | `string[] \| null` | Matched element types (e.g., `["module"]`). Contains multiple types unless `elementsSingleType` is enabled. `null` for unknown/ignored. |
| `path` | `string \| null` | Path representing the detected element boundary |
| `captured` | `object \| null` | Captured values from descriptor patterns |
| `parents` | `ElementParent[]` | Parent element chain. Each parent has `types`, `path`, `category`, and `captured`. |
| `fileInternalPath` | `string \| null` | Path of the file relative to the element it belongs to |
| `isIgnored` | `boolean` | Whether the file was excluded by `ignorePaths` / `includePaths` |
| `isUnknown` | `boolean` | Whether no descriptor matched |

**File facet** — per-file categorization based on [file descriptors](#file-descriptors):

| Property | Type | Description |
|---|---|---|
| `categories` | `string[] \| null` | Matched file categories (e.g., `["controller"]`). `null` for unknown/ignored. |
| `path` | `string \| null` | File path |
| `captured` | `object \| null` | Captured values from file descriptor patterns |
| `isIgnored` | `boolean` | Whether the file was excluded |
| `isUnknown` | `boolean` | Whether no file descriptor matched |

**Module facet** — origin information:

| Property | Type | Description |
|---|---|---|
| `origin` | `"local" \| "external" \| "core"` | Where the dependency comes from |
| `source` | `string \| null` | Base module name for external/core (e.g., `"react"`). `null` for local. |
| `internalPath` | `string \| null` | Path within the module (e.g., `"hooks/useState"`). `null` for local. |

Example:

```typescript
const entity = matcher.describeEntity("src/modules/auth/auth.controller.ts");

console.log(entity.element.types);       // ["module"]
console.log(entity.element.path);        // "src/modules/auth"
console.log(entity.element.captured);    // { moduleName: "auth" }
console.log(entity.file.categories);     // ["controller"]
console.log(entity.file.captured);       // { name: "auth" }
console.log(entity.module.origin);       // "local"
```

For external dependencies, pass a `source` parameter:

```typescript
const entity = matcher.describeEntity("react/hooks", "react/hooks");

console.log(entity.module.origin);       // "external"
console.log(entity.module.source);       // "react"
console.log(entity.module.internalPath); // "hooks"
```

> [!TIP]
> For full details on all description properties and edge cases (ignored, unknown), see the [Description Reference](#description-reference) in the API Reference.

### Describing Dependencies

The `describeDependency` method describes the relationship between two entities:

```typescript
const dep = matcher.describeDependency({
  from: "src/components/Button/index.ts",
  to: "src/services/Api.ts",
  source: "../../services/Api",
  kind: "value",
  nodeKind: "ImportDeclaration",
  specifiers: ["ApiClient"],
});
```

The result contains:

```ts
{
  from: EntityDescription,      // Source entity (the file importing)
  to: EntityDescription,        // Target entity (the file being imported)
  dependency: {
    source: string,             // Raw import/export source string
    kind: "value" | "type" | "typeof",
    nodeKind: string | null,    // AST node type (e.g., "ImportDeclaration")
    specifiers: string[] | null,
    relationship: {
      from: DependencyRelationshipType | null,
      to: DependencyRelationshipType | null,
    }
  }
}
```

Both `from` and `to` are full [entity descriptions](#describing-entities), so you can inspect element, file, and module information for both sides:

```typescript
console.log(dep.from.element.types);     // ["component"]
console.log(dep.to.element.types);       // ["service"]
console.log(dep.to.module.origin);       // "local"
console.log(dep.dependency.source);      // "../../services/Api"
console.log(dep.dependency.kind);        // "value"
```

The `relationship` field describes how the two entities relate to each other structurally. Possible values: `"internal"`, `"child"`, `"parent"`, `"sibling"`, `"descendant"`, `"ancestor"`, `"uncle"`, `"nephew"`, or `null`.

- `relationship.to` — how `to` relates to `from` (e.g., `"child"` means the target is a child of the source)
- `relationship.from` — the inverse perspective

### Matching Entities

To check whether a file matches specific criteria, use `isEntityMatch` with an **entity selector**. An entity selector is an object with optional `element`, `file`, and `module` sub-selectors — all must match for the entity to match:

```typescript
// Match local modules with "controller" file category
matcher.isEntityMatch("src/modules/auth/auth.controller.ts", {
  element: { type: "module" },
  file: { categories: "controller" },
  module: { origin: "local" },
}); // true
```

You only need to specify the sub-selectors you care about:

```typescript
// Just check the element type
matcher.isEntityMatch("src/components/Button/index.ts", {
  element: { type: "component" },
}); // true

// Just check if it's an external dependency
matcher.isEntityMatch("react", {
  module: { origin: "external" },
}, { source: "react" }); // true

// Just check the file category
matcher.isEntityMatch("src/modules/auth/auth.spec.ts", {
  file: { categories: "test" },
}); // true
```

#### Entity Selector Properties

**Element sub-selector** — matches against element description properties:

- **`type`** (`string | string[]`): Micromatch pattern(s) for the element type. Matches the first type in the `types` array.
- **`types`** (`string | string[]`): Micromatch pattern(s) for matching against all element types.
- **`path`** (`string | string[]`): Micromatch pattern(s) for the element path.
- **`captured`** (`object | object[]`): Captured values selector. Object = AND logic (all keys must match). Array of objects = OR logic (any object can match).
- **`parent`** (`object | null`): Selector for the first parent element. Set to `null` to match top-level elements with no parents. Supports `type`, `types`, `path`, and `captured`.
- **`fileInternalPath`** (`string | string[]`): Pattern(s) for the path of the file relative to the element.
- **`isIgnored`** (`boolean`): Whether the element is ignored.
- **`isUnknown`** (`boolean`): Whether no descriptor matched.

**File sub-selector** — matches against file description properties:

- **`path`** (`string | string[]`): Micromatch pattern(s) for the file path.
- **`categories`** (`string | string[]`): Micromatch pattern(s) for file categories.
- **`captured`** (`object | object[]`): Captured values selector (same semantics as element).
- **`isIgnored`** (`boolean`): Whether the file is ignored.
- **`isUnknown`** (`boolean`): Whether no file descriptor matched.

**Module sub-selector** — matches against module description properties:

- **`origin`** (`string | string[]`): Micromatch pattern(s) for the origin (`"local"`, `"external"`, or `"core"`).
- **`source`** (`string | string[]`): Micromatch pattern(s) for the base module name (e.g., `"react"`, `"fs"`).
- **`internalPath`** (`string | string[]`): Micromatch pattern(s) for the path within the module.

> [!NOTE]
> All selector properties are optional and support `null` to match only entities with `null` in the corresponding description property.

> [!NOTE]
> For backward compatibility, entity selectors also accept flat element selectors (without the `element`/`file`/`module` nesting). Properties like `origin`, `elementPath`, and `internalPath` in flat selectors are automatically mapped to their new locations. See [Legacy Selectors](#legacy-selectors) for details.

### Matching Dependencies

To check whether a dependency matches specific criteria, use `isDependencyMatch`. It takes the dependency properties and a dependency selector:

```typescript
matcher.isDependencyMatch(
  {
    from: "src/components/Button/index.ts",
    to: "src/services/Api.ts",
    source: "../../services/Api",
    kind: "value",
    nodeKind: "ImportDeclaration",
  },
  {
    from: { element: { type: "component" } },
    to: { element: { type: "service" } },
    dependency: { kind: "value" },
  }
); // true
```

**Dependency properties** (input):

- **`from`** (`string`): Source file path
- **`to`** (`string`): Target file path
- **`source`** (`string`): Import/export source as written in code
- **`kind`** (`string`): Import kind (`"type"`, `"value"`, `"typeof"`)
- **`nodeKind`** (`string`): AST node kind
- **`specifiers`** (`string[]`): Imported/exported names

**Dependency selector:**

- **`from`** (`entity selector | entity selector[]`): [Entity selector(s)](#matching-entities) for the source entity
- **`to`** (`entity selector | entity selector[]`): [Entity selector(s)](#matching-entities) for the target entity
- **`dependency`** (`object | object[]`): Selector(s) for dependency metadata. When an array is provided, the metadata matches if any selector matches (OR logic). Properties:
  - **`kind`** (`string | string[]`): Micromatch pattern(s) for the dependency kind
  - **`source`** (`string | string[]`): Pattern(s) to match the import/export source
  - **`specifiers`** (`string | string[]`): Pattern(s) for import/export specifiers
  - **`nodeKind`** (`string | string[]`): Pattern(s) for the AST node type
  - **`relationship`** (`object`): Relationship selectors from both perspectives:
    - **`from`** (`string | string[]`): Relationship from the source perspective
    - **`to`** (`string | string[]`): Relationship from the target perspective (e.g., `"internal"`, `"child"`, `"parent"`, `"sibling"`, `"descendant"`, `"ancestor"`, `"uncle"`, `"nephew"`)

> **Important:** All properties within a single selector must match for it to be considered a match (AND logic). Use arrays of selectors for OR logic.

```typescript
// Components can only import from services via type imports
matcher.isDependencyMatch(
  { from: "src/components/Button/index.ts", to: "src/services/Api.ts", source: "../../services/Api", kind: "type", nodeKind: "ImportDeclaration" },
  {
    from: { element: { type: "component" } },
    to: { element: { type: "service" } },
    dependency: { kind: "type" },
  }
); // true

// Match dependencies from external modules
matcher.isDependencyMatch(
  { from: "src/index.ts", to: "react", source: "react", kind: "value", nodeKind: "ImportDeclaration" },
  {
    to: { module: { origin: "external", source: "react*" } },
  }
); // true
```

### Template Variables

Selectors support template variables using [Handlebars syntax](https://handlebarsjs.com/) (`{{ variableName }}`). Templates are resolved at match time using the data available in the matching context.

#### Available Template Data

**For entity matching:**
- Properties of the entity under match are available in the `element` object (types, captured, path, etc.)

**For dependency matching:**
- `from`: Properties of the source entity (with `element`, `file`, `module` sub-objects)
- `to`: Properties of the target entity (with `element`, `file`, `module` sub-objects)
- `dependency`: Dependency metadata (`kind`, `nodeKind`, `specifiers`, `source`, `relationship`, etc.)

#### Template Examples

```ts
const matcher = elements.getMatcher({
  elements: [
    {
      type: "component",
      pattern: "src/modules/(*)/**/*.component.tsx",
      capture: ["module", "elementName", "fileName"],
      mode: "file"
    }
  ],
});

// Match components from specific module using template
matcher.isElementMatch(
  "src/modules/auth/LoginForm.component.tsx",
  { 
    type: "component",
    captured: { module: "{{ element.captured.module }}" }
  },
);

// Using captured array for OR logic
matcher.isElementMatch(
  "src/modules/auth/LoginForm.component.tsx",
  { 
    type: "component",
    captured: [
      { module: "auth" },
      { module: "user", fileName: "UserProfile" },
    ]
  },
);

// Using templates in dependency selectors
matcher.isDependencyMatch(
  {
    from: "src/components/Button.tsx",
    to: "src/services/Api.ts",
    source: "../services/Api",
    kind: "type",
    nodeKind: "ImportDeclaration",
    specifiers: ["calculateSum", "calculateAvg"],
  },
  {
    from: { element: { type: "{{ from.element.types.[0] }}" } },
    to: { element: { path: "{{ to.element.path }}" } },
    dependency: {
      specifiers: "{{ lookup dependency.specifiers 0 }}",
      kind: "{{ dependency.kind }}",
    },
  }
);
```

#### Using Extra Template Data

You can provide additional template data using the `extraTemplateData` option in `MatcherOptions`:

```ts
matcher.isElementMatch(
  "src/components/UserProfile.tsx",
  { type: "{{ componentType }}" },
  {
    extraTemplateData: { componentType: "component" }
  }
);
```

### Flagging Dependencies as External

The `flagAsExternal` configuration allows you to control how dependencies are categorized as external or local. This is especially useful in monorepo setups where you may want to treat inter-package dependencies as external even though they're within the same repository.

**Multiple conditions can be specified, and dependencies will be flagged as external if ANY condition is met (OR logic).**

#### Available Options

- **`unresolvableAlias`** (boolean, default: `true`): Non-relative imports whose path cannot be resolved are categorized as external
  
  ```typescript
  const elements = new Elements({
    flagAsExternal: { unresolvableAlias: true },
  });
  const matcher = elements.getMatcher({ elements: [/* descriptors */] });
  
  // describeDependency({ from, to, source, kind }):
  // to: null, source: 'unresolved-module' -> to.module.origin: 'external'
  // to: '/project/src/Button.ts', source: './Button' -> to.module.origin: 'local'
  ```

- **`inNodeModules`** (boolean, default: `true`): Non-relative paths that include `node_modules` in the resolved path are categorized as external
  
  ```typescript
  const elements = new Elements({
    flagAsExternal: { inNodeModules: true },
  });
  const matcher = elements.getMatcher({ elements: [/* descriptors */] });
  
  // describeDependency({ from, to, source, kind }):
  // to: '/project/node_modules/react/index.js', source: 'react' -> to.module.origin: 'external'
  // to: '/project/src/utils.ts', source: './utils' -> to.module.origin: 'local'
  ```

- **`outsideRootPath`** (boolean, default: `false`): Dependencies whose resolved path is outside the configured `rootPath` are categorized as external. This is particularly useful in monorepo setups.
  
  > **Important:** This option requires `rootPath` to be configured. When using this option, all file paths must be absolute and include the `rootPath` prefix for files within the project.
  
  ```typescript
  const elements = new Elements({
    rootPath: '/monorepo/packages/app',
    flagAsExternal: { outsideRootPath: true },
  });
  const matcher = elements.getMatcher({ elements: [/* descriptors */] });
  
  // describeDependency({ from, to, source, kind }):
  // to: '/monorepo/packages/shared/index.ts', source: '@myorg/shared' -> to.module.origin: 'external'
  // to: '/monorepo/packages/app/src/utils/helper.ts', source: './utils/helper' -> to.module.origin: 'local'
  ```

- **`customSourcePatterns`** (string[], default: `[]`): Array of micromatch patterns that, when matching the import/export source string, categorize the dependency as external
  
  ```typescript
  const elements = new Elements({
    flagAsExternal: { customSourcePatterns: ['@myorg/*', '~/**'] },
  });
  const matcher = elements.getMatcher({ elements: [/* descriptors */] });
  
  // describeDependency({ from, to, source, kind }):
  // source: '@myorg/shared' -> to.module.origin: 'external' (matches '@myorg/*')
  // source: '~/utils/helper' -> to.module.origin: 'external' (matches '~/**')
  // source: '@other/package' -> to.module.origin: 'local' (no match, unless inNodeModules is true or other conditions met)
  ```

#### Path Requirements with `rootPath`

When `rootPath` is configured, the package needs absolute paths to correctly determine which files are outside the project root, but matching patterns must remain relative to `rootPath`, especially in `full` mode (because `file` and `folder` modes match progressively from the right, so they may be less affected by relativity).

```typescript
const elements = new Elements({
  rootPath: '/project/packages/app',
  flagAsExternal: {
    outsideRootPath: true,
  },
});

// Matching patterns are relative to rootPath
const matcher = elements.getMatcher({
  elements: [
    { type: 'component', pattern: 'src/**/*.ts', mode: 'full' }, // Relative to /project/packages/app
  ],
});

// Using absolute file paths with relative patterns
const dep = matcher.describeDependency({
  from: '/project/packages/app/src/index.ts',      // absolute file path
  to: '/project/packages/shared/index.ts',         // absolute file path
  source: '@myorg/shared',
  kind: 'value',
});
// Result: dep.to.module.origin === 'external' (outside rootPath)
// Note: Pattern 'src/**/*.ts' matches because the package converts
// absolute paths to relative internally for pattern matching
```

> **Key Points:**
> - **File paths** in API calls (`from`, `to`, `filePath`) must be **absolute** when using `rootPath`
> - **Matching patterns** in element descriptors stay **relative** to `rootPath`
> - The package handles the conversion internally
> - When not using `rootPath`, the package continues to work with relative paths as before, maintaining backward compatibility.

## API Reference

### Class: Elements

#### Constructor

Creates a new `Elements` instance with optional default configuration.

```ts
new Elements(options?: ConfigurationOptions);
```

#### `getMatcher`

Creates a new matcher instance.

- __Parameters__:
  - `descriptors`: `DescriptorsConfig` — A [descriptors configuration](#creating-a-matcher) object with optional `elements`, `files`, and `elementsSingleType` properties.
  - `options`: `ConfigOptions` — Optional. [Configuration options](#configuration-options) for the matcher. Overrides the defaults set in the `Elements` instance.
- __Returns__: `Matcher`

```ts
const matcher = elements.getMatcher({
  elements: [
    { type: "component", pattern: "src/components/*", mode: "folder" },
  ],
  files: [
    { pattern: "*.spec.ts", category: "test" },
  ],
});
```

#### `clearCache`

Clears all cached matcher instances and shared caches.

```ts
elements.clearCache();
```

#### `serializeCache`

Serializes all cached matcher instances and shared caches to a plain object.

```ts
const cache = elements.serializeCache();
```

#### `setCacheFromSerialized`

Sets the cached matcher instances and shared caches from a serialized object.

```ts
const cache = elements.serializeCache();
elements.setCacheFromSerialized(cache);
```

### Matcher Instance Methods

#### Entity Methods

##### `describeEntity`

Returns a detailed [entity description](#describing-entities) combining element, file, and module information.

- __Parameters__:
  - `filePath`: `string` — Optional. The path of the file to describe.
  - `source`: `string` — Optional. The dependency source string for determining module origin.
- __Returns__: `EntityDescription`

```ts
const entity = matcher.describeEntity("src/components/Button.tsx");
```

##### `isEntityMatch`

Checks if a given path matches an [entity selector](#matching-entities).

- __Parameters__:
  - `filePath`: `string` — The file path to check.
  - `selector`: `EntitySelector` — Entity selector or array of entity selectors.
  - `options`: `EntityMatcherOptions` — Optional. Includes optional `source` for module origin resolution.
- __Returns__: `boolean`

```ts
matcher.isEntityMatch("src/modules/auth/auth.controller.ts", {
  element: { type: "module" },
  file: { categories: "controller" },
});
```

##### `getEntitySelectorMatching`

Returns the first matching entity selector result, or `null`.

- __Parameters__:
  - `filePath`: `string` — The file path to check.
  - `selector`: `EntitySelector` — Entity selector to match against.
  - `options`: `EntityMatcherOptions` — Optional.
- __Returns__: `EntitySingleSelectorMatchResult | null` — Contains matched `element`, `file`, and `module` sub-selectors.

```ts
const result = matcher.getEntitySelectorMatching("src/modules/auth/auth.controller.ts", {
  element: { type: "module" },
  file: { categories: "controller" },
});
```

##### `getEntitySelectorMatchingDescription`

Matches an entity description (from `describeEntity`) against entity selectors.

- __Parameters__:
  - `description`: `EntityDescription` — The entity description to match.
  - `selector`: `EntitySelector` — The entity selector to match against.
  - `options`: `MatcherOptions` — Optional.
- __Returns__: `EntitySingleSelectorMatchResult | null`

```ts
const entity = matcher.describeEntity("src/modules/auth/auth.controller.ts");
const result = matcher.getEntitySelectorMatchingDescription(entity, [{
  element: { type: "module" },
  file: { categories: "controller" },
}]);
```

#### Dependency Methods

##### `describeDependency`

Returns a detailed [dependency description](#describing-dependencies).

- __Parameters__:
  - `dependency`: Object with `from`, `to`, `source`, `kind`, `nodeKind`, and `specifiers` properties.
- __Returns__: `DependencyDescription`

```ts
const dep = matcher.describeDependency({
  from: "src/components/Button.tsx",
  to: "src/services/Api.ts",
  source: "../services/Api",
  kind: "type",
  nodeKind: "ImportDeclaration",
});
```

##### `isDependencyMatch`

Checks if dependency properties match a [dependency selector](#matching-dependencies).

- __Parameters__:
  - `dependency`: Object with `from`, `to`, `source`, `kind`, `nodeKind`, and `specifiers` properties.
  - `selector`: `DependencySelector` — Dependency selector or array of selectors.
- __Returns__: `boolean`

```ts
matcher.isDependencyMatch(
  { from: "src/components/Button.tsx", to: "src/services/Api.ts", source: "../services/Api", kind: "type", nodeKind: "ImportDeclaration" },
  {
    from: { element: { type: "component" } },
    to: { element: { type: "service" } },
    dependency: { nodeKind: "Import*" },
  }
);
```

##### `getDependencySelectorMatching`

Returns the dependency selector matching result (`from`, `to`, `dependency`, `isMatch`).

> [!NOTE]
> When arrays of selectors are provided in the `from`, `to`, or `dependency` properties, the method returns the first matching selector from each group.

- __Parameters__:
  - `dependency`: Dependency properties.
  - `selector`: `DependencySelector`.
- __Returns__: `DependencySelectorMatchResult`

```ts
const result = matcher.getDependencySelectorMatching(
  { from: "src/components/Button.tsx", to: "src/services/Api.ts", source: "../services/Api", kind: "type" },
  { to: { element: { type: "service" } }, dependency: { kind: "type" } }
);
```

##### `getDependencySelectorMatchingDescription`

Matches a dependency description (from `describeDependency`) against dependency selectors.

> [!NOTE]
> When arrays of selectors are provided in the `from`, `to`, or `dependency` properties, the method returns the first matching selector from each group.

- __Parameters__:
  - `description`: `DependencyDescription` — Dependency description to match.
  - `selector`: `DependencySelector` — Array of dependency selectors.
- __Returns__: `DependencySelectorMatchResult`

```ts
const dep = matcher.describeDependency({ from: "src/components/Button.tsx", to: "src/services/Api.ts", source: "../services/Api", kind: "type", nodeKind: "ImportDeclaration" });
const result = matcher.getDependencySelectorMatchingDescription(dep, [{
  to: { element: { type: "service" } },
  dependency: { kind: "type" },
}]);
```

#### Element Methods

These methods operate on the element facet only. They are useful when you only need element-level information without file or module context.

##### `describeElement`

Returns a detailed description of the element a file belongs to.

- __Parameters__:
  - `filePath`: `string` — The path of the file to describe.
- __Returns__: `ElementDescription`

```ts
const element = matcher.describeElement("src/components/Button.tsx");
console.log(element.types);    // ["component"]
console.log(element.captured); // { name: "Button" }
console.log(element.parents);  // []
```

##### `isElementMatch`

Checks if a given path matches an element selector.

- __Parameters__:
  - `filePath`: `string` — The file path to check.
  - `selector`: `ElementSelector` — Element selector or array of element selectors.
- __Returns__: `boolean`

```ts
matcher.isElementMatch("src/components/Button.tsx", [{ type: "component" }]);
```

##### `getElementSelectorMatching`

Returns the first matching element selector, or `null`.

- __Parameters__:
  - `filePath`: `string` — The file path to check.
  - `selector`: `ElementSelector` — Element selector to match against.
- __Returns__: `ElementSingleSelector | null`

```ts
const result = matcher.getElementSelectorMatching("src/components/Button.tsx", [{ type: "component" }]);
```

##### `getElementSelectorMatchingDescription`

Matches an element description (from `describeElement`) against element selectors.

- __Parameters__:
  - `description`: `ElementDescription` — The element description to match.
  - `selector`: `ElementSelector` — Array of element selectors.
- __Returns__: `ElementSingleSelector | null`

```ts
const element = matcher.describeElement("src/components/Button.tsx");
const result = matcher.getElementSelectorMatchingDescription(element, [{ type: "component" }]);
```

#### Module Methods

These methods operate on the module facet only. They are useful for checking the origin of a dependency independently.

##### `describeModule`

Returns the module origin description for a file or dependency.

- __Parameters__:
  - `filePath`: `string` — Optional. The path of the file.
  - `source`: `string` — Optional. The dependency source string.
- __Returns__: `ModuleDescription`

```ts
const mod = matcher.describeModule("react/hooks", "react/hooks");
console.log(mod.origin);       // "external"
console.log(mod.source);       // "react"
console.log(mod.internalPath); // "hooks"
```

##### `isModuleMatch`

Checks if a given path matches a module selector.

- __Parameters__:
  - `filePath`: `string` — The file path to check.
  - `selector`: `ModuleSelector` — Module selector to match against.
  - `options`: `EntityMatcherOptions` — Optional. Includes optional `source`.
- __Returns__: `boolean`

```ts
matcher.isModuleMatch("react", { origin: "external" }, { source: "react" });
matcher.isModuleMatch("node:fs", { origin: "core" }, { source: "node:fs" });
```

##### `getModuleSelectorMatching`

Returns the first matching module selector, or `null`.

- __Parameters__:
  - `filePath`: `string` — The file path to check.
  - `selector`: `ModuleSelector` — Module selector to match against.
  - `options`: `EntityMatcherOptions` — Optional.
- __Returns__: `ModuleSingleSelector | null`

```ts
const result = matcher.getModuleSelectorMatching("react", { origin: "external" }, { source: "react" });
```

##### `getModuleSelectorMatchingDescription`

Matches a module description (from `describeModule`) against module selectors.

- __Parameters__:
  - `description`: `ModuleDescription` — The module description to match.
  - `selector`: `ModuleSelector` — Module selector to match against.
  - `options`: `EntityMatcherOptions` — Optional.
- __Returns__: `ModuleSingleSelector | null`

```ts
const mod = matcher.describeModule("react", "react");
const result = matcher.getModuleSelectorMatchingDescription(mod, { origin: "external" });
```

#### Cache Methods

##### `clearCache`

Clears the matcher's internal cache.

```ts
matcher.clearCache();
```

> [!WARNING]
> This only clears the internal cache for this matcher instance. Shared cache for micromatch results, regex and captures is not affected. You can clear all caches using `Elements.clearCache()`.

##### `serializeCache`

Serializes the matcher's cache.

```ts
const cache = matcher.serializeCache();
```

##### `setCacheFromSerialized`

Restores the matcher's cache from a serialized object.

```ts
const cache = matcher.serializeCache();
matcher.clearCache();
matcher.setCacheFromSerialized(cache);
```

### Selector Reference

This section provides a complete reference of all selector properties.

#### Element Selector

| Property | Type | Description |
|---|---|---|
| `type` | `string \| string[]` | Micromatch pattern(s) for element type. Matches the first type in `types`. |
| `types` | `string \| string[]` | Micromatch pattern(s) for matching against all element types. |
| `path` | `string \| string[]` | Micromatch pattern(s) for the element path. |
| `captured` | `object \| object[]` | Captured values selector. Object = AND, array = OR. |
| `parent` | `object \| null` | Selector for the first parent. `null` matches elements with no parents. Supports `type`, `types`, `path`, `captured`, `category` (deprecated). |
| `fileInternalPath` | `string \| string[]` | Pattern(s) for the file path relative to the element. |
| `category` | `string \| string[]` | _(Deprecated)_ Use file selector `categories` instead. |
| `isIgnored` | `boolean` | Whether the element is ignored. |
| `isUnknown` | `boolean` | Whether the element is unknown. |

#### File Selector

| Property | Type | Description |
|---|---|---|
| `path` | `string \| string[]` | Micromatch pattern(s) for the file path. |
| `categories` | `string \| string[]` | Micromatch pattern(s) for file categories. |
| `captured` | `object \| object[]` | Captured values selector. |
| `isIgnored` | `boolean` | Whether the file is ignored. |
| `isUnknown` | `boolean` | Whether the file is unknown. |

#### Module Selector

| Property | Type | Description |
|---|---|---|
| `origin` | `string \| string[]` | Micromatch pattern(s) for origin (`"local"`, `"external"`, `"core"`). |
| `source` | `string \| string[]` | Micromatch pattern(s) for the base module name. |
| `internalPath` | `string \| string[]` | Micromatch pattern(s) for the path within the module. |

#### Entity Selector

| Property | Type | Description |
|---|---|---|
| `element` | `ElementSelector` | Element sub-selector. |
| `file` | `FileSelector` | File sub-selector. |
| `module` | `ModuleSelector` | Module sub-selector. |

#### Dependency Selector

| Property | Type | Description |
|---|---|---|
| `from` | `EntitySelector \| EntitySelector[]` | Entity selector(s) for the source entity. |
| `to` | `EntitySelector \| EntitySelector[]` | Entity selector(s) for the target entity. |
| `dependency` | `DependencyInfoSelector \| DependencyInfoSelector[]` | Dependency metadata selector(s). OR logic when array. |

**Dependency info selector properties:**

| Property | Type | Description |
|---|---|---|
| `kind` | `string \| string[]` | Micromatch pattern(s) for dependency kind. |
| `source` | `string \| string[]` | Pattern(s) for the import/export source. |
| `specifiers` | `string \| string[]` | Pattern(s) for import/export specifiers. |
| `nodeKind` | `string \| string[]` | Pattern(s) for the AST node type. |
| `relationship` | `object` | `from` and `to` relationship selectors (see [Matching Dependencies](#matching-dependencies)). |

### Description Reference

This section provides a complete reference of all description types returned by `describe*` methods.

#### Element Description

Returned by `describeElement(filePath)`.

| Property | Type | Description |
|---|---|---|
| `types` | `string[] \| null` | Matched element types. Multiple unless `elementsSingleType` is enabled. |
| `path` | `string \| null` | Detected element boundary path. |
| `captured` | `object \| null` | Captured values from descriptor patterns. |
| `parents` | `ElementParent[]` | Parent element chain (each has `types`, `path`, `category`, `captured`). |
| `fileInternalPath` | `string \| null` | File path relative to the element. |
| `category` | `string \| null` | _(Deprecated)_ Element category. Use file `categories`. |
| `filePath` | `string \| null` | _(Deprecated)_ Full file path. Use file description `path`. |
| `isIgnored` | `boolean` | Whether excluded by `ignorePaths`/`includePaths`. |
| `isUnknown` | `boolean` | Whether no descriptor matched. |

#### File Description

Returned by `describeEntity(filePath).file`.

| Property | Type | Description |
|---|---|---|
| `path` | `string \| null` | File path. |
| `categories` | `string[] \| null` | Matched file categories. |
| `captured` | `object \| null` | Captured values from file descriptor patterns. |
| `isIgnored` | `boolean` | Whether excluded. |
| `isUnknown` | `boolean` | Whether no file descriptor matched. |

#### Module Description

Returned by `describeModule(filePath?, source?)` or `describeEntity(filePath, source?).module`.

| Property | Type | Description |
|---|---|---|
| `origin` | `"local" \| "external" \| "core"` | Module origin. |
| `source` | `string \| null` | Base module name for external/core. `null` for local. |
| `internalPath` | `string \| null` | Subpath within the module. `null` for local. |

#### Entity Description

Returned by `describeEntity(filePath, source?)`.

| Property | Type | Description |
|---|---|---|
| `element` | `ElementDescription` | Element facet. |
| `file` | `FileDescription` | File facet. |
| `module` | `ModuleDescription` | Module facet. |

#### Dependency Description

Returned by `describeDependency(options)`.

| Property | Type | Description |
|---|---|---|
| `from` | `EntityDescription` | Source entity. |
| `to` | `EntityDescription` | Target entity. |
| `dependency` | `DependencyInfoDescription` | Dependency metadata (`source`, `kind`, `nodeKind`, `specifiers`, `relationship`). |

## Legacy Selectors

Legacy selectors are defined using a different syntax and are provided for backward compatibility. However, this syntax is deprecated and will be removed in a future release. It is recommended to migrate to the new selector syntax.

Selectors can be defined as either a string or an array of strings representing the element type(s):

```ts
// Legacy selector using a string
const isElementMatch = matcher.isElementMatch("src/components/Button.tsx", "component");
// Legacy selector using an array of strings
const isElementMatch = matcher.isElementMatch("src/components/Button.tsx", ["component", "service"]);
```

They can also be defined as an array where the first element is the type and the second element is an object containing captured values:

```ts
// Legacy selector with captured values
const isElementMatch = matcher.isElementMatch(
  "src/modules/auth/LoginForm.component.tsx",
  ["component", { foo: "auth" }]
);
```

> **Warning:** Avoid mixing legacy selectors with the new selector syntax in the same project, as this can lead to ambiguity. In particular, if you define a top-level array selector with two elements and the second one is an object containing a `type` or `category` key, it will be interpreted as legacy options rather than two separate selectors.

## Migration from v2

This section describes how to migrate from v2 to the latest version. The main changes are:

### 1. Wrap descriptor array in `DescriptorsConfig`

The `getMatcher` method now accepts a `DescriptorsConfig` object instead of a flat array:

```diff
- const matcher = elements.getMatcher([
-   { type: "component", pattern: "src/components/*", mode: "folder" },
- ]);
+ const matcher = elements.getMatcher({
+   elements: [
+     { type: "component", pattern: "src/components/*", mode: "folder" },
+   ],
+ });
```

### 2. Update element description access: `type` -> `types`

Element descriptions now use `types` (array) instead of `type` (string):

```diff
  const desc = matcher.describeElement("src/components/Button.tsx");
- console.log(desc.type);        // "component"
+ console.log(desc.types);       // ["component"]
+ console.log(desc.types[0]);    // "component"
```

### 3. Update dependency description access: flat -> entity structure

Dependency descriptions now use `EntityDescription` objects for `from` and `to`:

```diff
  const dep = matcher.describeDependency({ from, to, source, kind });
- console.log(dep.from.type);     // "component"
- console.log(dep.to.origin);     // "local"
+ console.log(dep.from.element.types[0]);  // "component"
+ console.log(dep.to.module.origin);       // "local"
```

### 4. Move `origin`/`internalPath` to module selectors

Properties that described module origin have moved from element selectors to module selectors (within entity selectors):

```diff
  // Element selector (old)
- { type: "component", origin: "local" }
  // Entity selector (new)
+ { element: { type: "component" }, module: { origin: "local" } }
```

> [!NOTE]
> For backward compatibility, the old flat selector format is still accepted and automatically converted. However, it is deprecated and will be removed in a future version.

### 5. Replace `dependency.module` with `to.module.source`

The `module` property in dependency metadata selectors has been removed. Use `to.module.source` instead:

```diff
  // Old: matching by module name in dependency metadata
- { to: { type: "service" }, dependency: { module: "react" } }
  // New: matching by module source in entity selector
+ { to: { module: { source: "react" } } }
```

### 6. Regenerate serialized cache

The serialized cache format has changed. If you persist cache between runs, you need to regenerate it. Old caches are not compatible with the new format.

## Contributing

Contributors are welcome.
Please read the [contributing guidelines](../../.github/CONTRIBUTING.md) and [code of conduct](../../.github/CODE_OF_CONDUCT.md).

## License

MIT, see [LICENSE](./LICENSE) for details.

[coveralls-image]: https://coveralls.io/repos/github/javierbrea/eslint-plugin-boundaries/badge.svg
[coveralls-url]: https://coveralls.io/github/javierbrea/eslint-plugin-boundaries
[build-image]: https://github.com/javierbrea/eslint-plugin-boundaries/workflows/build/badge.svg
[build-url]: https://github.com/javierbrea/eslint-plugin-boundaries/actions?query=workflow%3Abuild+branch%3Amaster
[last-commit-image]: https://img.shields.io/github/last-commit/javierbrea/eslint-plugin-boundaries.svg
[last-commit-url]: https://github.com/javierbrea/eslint-plugin-boundaries/commits
[license-image]: https://img.shields.io/npm/l/eslint-plugin-boundaries.svg
[license-url]: https://github.com/javierbrea/eslint-plugin-boundaries/blob/master/LICENSE
[npm-downloads-image]: https://img.shields.io/npm/dm/@boundaries/elements.svg
[npm-downloads-url]: https://www.npmjs.com/package/@boundaries/elements
[quality-gate-image]: https://sonarcloud.io/api/project_badges/measure?project=javierbrea_eslint-plugin-boundaries_elements&metric=alert_status
[quality-gate-url]: https://sonarcloud.io/dashboard?id=javierbrea_eslint-plugin-boundaries_elements
[release-image]: https://img.shields.io/github/release-date/javierbrea/eslint-plugin-boundaries.svg
[release-url]: https://github.com/javierbrea/eslint-plugin-boundaries/releases
