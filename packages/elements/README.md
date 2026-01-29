[![Build status][build-image]][build-url] [![Coverage Status][coveralls-image]][coveralls-url] [![Quality Gate][quality-gate-image]][quality-gate-url]

[![Renovate](https://img.shields.io/badge/renovate-enabled-brightgreen.svg)](https://renovatebot.com) [![Last commit][last-commit-image]][last-commit-url] [![Last release][release-image]][release-url]

[![NPM downloads][npm-downloads-image]][npm-downloads-url] [![License][license-image]][license-url]

[![Mutation testing badge](https://img.shields.io/endpoint?style=flat&url=https%3A%2F%2Fbadge-api.stryker-mutator.io%2Fgithub.com%2Fjavierbrea%2Feslint-plugin-boundaries%2Fmaster)](https://dashboard.stryker-mutator.io/reports/github.com/javierbrea/eslint-plugin-boundaries/master)

# @boundaries/elements

> Element descriptors and matchers for `@boundaries` tools, such as `@boundaries/eslint-plugin`.

## Table of Contents

- [Introduction](#introduction)
- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Usage](#usage)
  - [Configuration Options](#configuration-options)
  - [Creating a matcher](#creating-a-matcher)
    - [Element Descriptors](#element-descriptors)
  - [Selectors](#selectors)
    - [Template Variables](#template-variables)
  - [Using Matchers](#using-matchers)
    - [Element Matching](#element-matching)
    - [Dependency Matching](#dependency-matching)
  - [Flagging Dependencies as External](#flagging-dependencies-as-external)
- [API Reference](#api-reference)
- [Legacy Selectors](#legacy-selectors)
- [Contributing](#contributing)
- [License](#license)

## Introduction

`@boundaries/elements` provides a powerful and flexible system for defining and enforcing architectural boundaries in your JavaScript and TypeScript projects. It allows you to:

- **Define element types** based on file path patterns (e.g., components, services, helpers)
- **Match elements** against specific criteria
- **Validate dependencies** between different parts of your codebase
- **Enforce architectural rules** by checking if dependencies between elements are allowed

This package is part of the [@boundaries ecosystem](https://github.com/javierbrea/eslint-plugin-boundaries) and uses [Micromatch patterns](https://github.com/micromatch/micromatch) for flexible and powerful pattern matching.

>[!NOTE]
> This package does not read or analyze your codebase directly. It provides the core logic for defining and matching elements and dependencies, which can be integrated into other tools such as linters or build systems.

## Features

- ✨ **Flexible pattern matching** using Micromatch syntax
- 🎯 **Element type and category identification** based on file paths
- 📝 **Template variables** for dynamic selector matching
- ⚡ **Built-in caching** for optimal performance
- 🔄 **Support for multiple file matching modes** (file, folder, full path)
- 🎨 **Capture path fragments** for advanced matching scenarios

## Installation

Install the package via npm:

```bash
npm install @boundaries/elements
```

## Quick Start

Here's a quick example to get you started:

```typescript
import { Elements } from '@boundaries/elements';

// Create an Elements instance
const elements = new Elements();

// Define element descriptors
const matcher = elements.getMatcher([
  {
    type: "component",
    category: "react",
    pattern: "src/components/*.tsx",
    mode: "file",
    capture: ["fileName"],
  },
  {
    type: "service",
    category: "data",
    pattern: "src/services/*.ts",
    mode: "file",
    capture: ["fileName"],
  },
]);

// Match an element
const isComponent = matcher.isMatch("src/components/Button.tsx", { 
  type: "component" 
}); // true

// Match a dependency
const isValidDependency = matcher.isMatch(
  {
    from: "src/components/Button.tsx",
    to: "src/services/Api.ts",
    source: "../services/Api",
    kind: "value",
    nodeKind: "ImportDeclaration",
  },
  {
    from: { category: "react" },
    to: { type: "service" },
  }
); // true
```

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

- **`ignorePaths`**: Micromatch pattern(s) to exclude certain paths from element matching (default: none)
- **`includePaths`**: Micromatch pattern(s) to include only specific paths (default: all paths)
- **`legacyTemplates`**: Whether to enable legacy template syntax support (default: `true`, but it will be `false` in future releases). This allows using `${variable}` syntax in templates for backward compatibility.
- **`cache`**: Whether to enable internal caching to improve performance (default: `true`)
- **`rootPath`**: Absolute path to the project root. When configured, file paths should be provided as absolute paths to allow the package to determine which files are outside the project root (default: `undefined`)
- **`flagAsExternal`**: Configuration for categorizing dependencies as external or local. Multiple conditions can be specified, and dependencies will be categorized as external if ANY condition is met (OR logic). See [Flagging Dependencies as External](#flagging-dependencies-as-external) for details.

> **⚠️ Important:** When using `rootPath`:
> - All **file paths** passed to the API (`describeElement`, `describeDependency`, etc.) must be **absolute paths**. Paths within the `rootPath` should include it as a prefix so the package can correctly identify files outside the project root.
> - However, **matching patterns** in element descriptors remain **relative to the `rootPath`**. The package automatically converts absolute paths to relative paths internally for pattern matching.

### Creating a Matcher

Use the `getMatcher` method to create a matcher with element descriptors:

```typescript
const matcher = elements.getMatcher([
  {
    type: "component",
    pattern: "src/components/*",
    mode: "folder",
  },
  {
    type: "helper",
    pattern: "src/helpers/*.js",
    mode: "file",
  }
]);
```

> **💡 Tip:** Matchers with identical descriptors and options share the same cache instance for improved performance.

You can override the default options when creating a matcher:

```typescript
const matcher = elements.getMatcher(
  [/* descriptors */],
  {
    ignorePaths: ["**/*.test.ts"],
  }
);
```

### Element Descriptors

Element descriptors define how files are identified and categorized. Each descriptor is an object with the following properties:

- **`pattern`** (`string | string[]`): Micromatch pattern(s) to match file paths
- **`type`** (`string`): The element type to assign to matching files
- **`category`** (`string`): Additional categorization for the element, providing another layer of classification
- **`mode`** (`"file" | "folder" | "full"`): Matching mode (default: `"folder"`)
  - `"folder"`: Matches the first folder matching the pattern. The library will add `**/*` to the given pattern for matching files, because it needs to know exactly which folder has to be considered the element. So, you have to provide patterns matching the folder being the element, not the files directly.
  - `"file"`: Matches files directly, but still matches progressively from the right. The provided pattern will not be modified.
  - `"full"`: Matches the complete path.
- **`basePattern`** (`string`): Additional pattern that must match from the project root. Use it when using `file` or `folder` modes and you want to capture fragments from the rest of the path.
- **`capture`** (`string[]`): Array of keys to capture path fragments
- **`baseCapture`** (`string[]`): Array of keys to capture fragments from `basePattern`. If the same key is defined in both `capture` and `baseCapture`, the value from `capture` takes precedence.

### Selectors

Selectors are used to match elements and dependencies against specific criteria. They are objects where each property represents a matching condition.

#### Element Properties

All element selectors support the following properties:

- **`type`** (`string | string[]`): Micromatch pattern(s) for the element type/s
- **`category`** (`string | string[]`): Micromatch pattern(s) for the element category/categories
- **`captured`** (`object`): Object with keys matching captured values. Each key can be a string or an array of strings representing micromatch patterns.
- **`origin`** (`"local" | "external" | "core"`): Element origin
  - `local`: Files within the project
  - `external`: External dependencies (e.g., `node_modules`)
  - `core`: Core modules (e.g., Node.js built-ins)
- **`path`** (`string | string[]`): Micromatch pattern(s) for the file path
- **`elementPath`** (`string | string[]`): Pattern(s) for the element path
- **`internalPath`** (`string | string[]`): Pattern(s) for the path within the element. For file elements, it's the same as `elementPath`; for folder elements, it's relative to the folder.
- **`isIgnored`** (`boolean`): Whether the element is ignored
- **`isUnknown`** (`boolean`): Whether the element type is unknown (i.e., doesn't match any descriptor)

#### Dependency Properties

When matching dependencies, the `to` selector can additionally use:

- **`kind`** (`string | string[]`): Micromatch pattern(s) for the dependency kind
- **`relationship`** (`string | string[]`): Element relationship. Micromatch pattern(s) for the relationship between source and target elements:
  - `internal`: Both files belong to the same element
  - `child`: Target is a child of source
  - `parent`: Target is a parent of source
  - `sibling`: Elements share the same parent
  - `uncle`: Target is a sibling of a source ancestor
  - `nephew`: Target is a child of a source sibling
  - `descendant`: Target is a descendant of source
  - `ancestor`: Target is an ancestor of source
- **`specifiers`** (`string | string[]`): Pattern(s) for import/export specifiers (e.g., named imports)
- **`nodeKind`** (`string | string[]`): Pattern(s) for the AST node type causing the dependency (e.g., `"ImportDeclaration"`)
- **`source`** (`string | string[]`): Pattern(s) to match the source of the dependency. (e.g., the import path).
- **`baseSource`** (`string | string[]`): Pattern(s) for the base module name for external imports.

> **⚠️ Important:** All properties in a selector must match for the selector to be considered a match (AND logic). Use multiple selectors for OR logic.

> **Note:** You can also use the legacy selector syntax, but it’s deprecated and will be removed in a future release. See the [Legacy Selectors section](#legacy-selectors) for more details.

#### Template Variables

Selectors support template variables using [Handlebars syntax](https://handlebarsjs.com/) (`{{ variableName }}`). Templates are resolved at match time using:

- **Element properties** (`type`, `category`, `captured`, etc.)
- **Dependency properties** (`from`, `to`)

#### Available Template Data

When matching, the following data is automatically available:

**For element matching:**
- Properties of the element under match are available in the `element` object (type, category, captured, origin, path, etc.)

**For dependency matching:**
- `from`: Properties of the dependency source element
- `to`: Properties of the dependency target element, and properties of the dependency itself (source, kind, nodeKind, specifiers, etc.)

#### Template Examples

```ts
// Using captured values in templates
const matcher = elements.getMatcher([
  {
    type: "component",
    pattern: "src/modules/(*)/**/*.component.tsx",
    capture: ["module", "elementName", "fileName"],
    mode: "file"
  }
]);

// Match components from specific module using template
const isAuthComponent = matcher.isMatch(
  "src/modules/auth/LoginForm.component.tsx",
  { 
    type: "component",
    captured: { module: "{{ element.captured.module }}" } // This will always match
  },
);

// Using templates in dependency selectors
const isDependencyMatch = matcher.isMatch(
  {
    from: "src/components/Button.tsx",
    to: "src/services/Api.ts",
    source: "../services/Api",
    kind: "type",
    nodeKind: "ImportDeclaration",
    specifiers: ["calculateSum", "calculateAvg"],
  },
  {
    from: { type: "{{ from.type }}", captured: { fileName: "{{ from.captured.fileName }}" } },
    to: { path: "{{ to.path }}", specifiers: "{{ lookup to.specifiers 0 }}", kind: "{{ to.kind }}" },
  }
);
```

#### Using Extra Template Data

You can provide additional template data using the `extraTemplateData` option in `MatcherOptions`:

```ts
// Using templates in selectors
const isMatch = matcher.isMatch(
  "src/components/UserProfile.tsx",
  { type: "{{ componentType }}" },
  {
    extraTemplateData: { componentType: "component" }
  }
);
```

### Using Matchers

You can use element selectors with a created matcher to check if a given path corresponds to an element with specific properties, or if a dependency between two paths matches certain criteria.

#### Element Matching

To match an element, use the `isMatch` method of the matcher, providing the file path and an element selector.

```ts
const isElementMatch = matcher.isMatch("src/components/Button.tsx", { type: "component" });
```

> [!TIP]
> You can also provide an array of selectors to the `isMatch` method. In this case, the method will return `true` if the element matches any of the provided selectors (OR logic).

#### Dependency Matching

To match a dependency, use the `isMatch` method of the matcher, providing the properties of the dependency and a dependency selector.

**Dependency object properties:**

- **`from`** (`string`): Source file path
- **`to`** (`string`): Target file path
- **`source`** (`string`): Import/export source as written in code
- **`kind`** (`string`): Import kind (`"type"`, `"value"`, `"typeof"`)
- **`nodeKind`** (`string`): AST node kind
- **`specifiers`** (`string[]`): Imported/exported names

**Dependency selector:**

- **`from`**: Element selector(s) for the source file
- **`to`**: Dependency selector(s) for the target file

```ts
const isDependencyMatch = matcher.isMatch(
  { // Dependency properties
    from: "src/components/Button.tsx",
    to: "src/services/Api.ts",
    source: "../services/Api",
    kind: "type",
    nodeKind: "ImportDeclaration",
  },
  {
    from: { category: "react" }, // Dependency source selector/s
    to: { type: "service", nodeKind: "Import*" }, // Dependency target selector/s
  }
);
```

> [!TIP]
> You can also provide an array of selectors both to the `from` and `to` properties of the dependency selector. In this case, the method will return `true` if the dependency matches any combination of the provided selectors (OR logic).

### Flagging Dependencies as External

The `flagAsExternal` configuration allows you to control how dependencies are categorized as external or local. This is especially useful in monorepo setups where you may want to treat inter-package dependencies as external even though they're within the same repository.

**Multiple conditions can be specified, and dependencies will be flagged as external if ANY condition is met (OR logic).**

#### Available Options

- **`unresolvableAlias`** (boolean, default: `true`): Non-relative imports whose path cannot be resolved are categorized as external
  
  ```typescript
  const elements = new Elements({
    flagAsExternal: { unresolvableAlias: true },
  });
  const matcher = elements.getMatcher([/* descriptors */]);
  
  // describeDependency({ from, to, source, kind }):
  // to: null, source: 'unresolved-module' -> origin: 'external'
  // to: '/project/src/Button.ts', source: './Button' -> origin: 'local'
  ```

- **`inNodeModules`** (boolean, default: `true`): Non-relative paths that include `node_modules` in the resolved path are categorized as external
  
  ```typescript
  const elements = new Elements({
    flagAsExternal: { inNodeModules: true },
  });
  const matcher = elements.getMatcher([/* descriptors */]);
  
  // describeDependency({ from, to, source, kind }):
  // to: '/project/node_modules/react/index.js', source: 'react' -> origin: 'external'
  // to: '/project/src/utils.ts', source: './utils' -> origin: 'local'
  ```

- **`outsideRootPath`** (boolean, default: `false`): Dependencies whose resolved path is outside the configured `rootPath` are categorized as external. This is particularly useful in monorepo setups.
  
  > **⚠️ Important:** This option requires `rootPath` to be configured. When using this option, all file paths must be absolute and include the `rootPath` prefix for files within the project.
  
  ```typescript
  const elements = new Elements({
    rootPath: '/monorepo/packages/app',
    flagAsExternal: { outsideRootPath: true },
  });
  const matcher = elements.getMatcher([/* descriptors */]);
  
  // describeDependency({ from, to, source, kind }):
  // to: '/monorepo/packages/shared/index.ts', source: '@myorg/shared' -> origin: 'external'
  // to: '/monorepo/packages/app/src/utils/helper.ts', source: './utils/helper' -> origin: 'local'
  ```

- **`customSourcePatterns`** (string[], default: `[]`): Array of micromatch patterns that, when matching the import/export source string, categorize the dependency as external
  
  ```typescript
  const elements = new Elements({
    flagAsExternal: { customSourcePatterns: ['@myorg/*', '~/**'] },
  });
  const matcher = elements.getMatcher([/* descriptors */]);
  
  // describeDependency({ from, to, source, kind }):
  // source: '@myorg/shared' -> origin: 'external' (matches '@myorg/*')
  // source: '~/utils/helper' -> origin: 'external' (matches '~/**')
  // source: '@other/package' -> origin: 'local' (no match, unless inNodeModules is true or other conditions met)
  ```

#### Path Requirements with `rootPath`

When `rootPath` is configured, the package needs absolute paths to correctly determine which files are outside the project root, but matching patterns remain relative to `rootPath`.

```typescript
const elements = new Elements({
  rootPath: '/project/packages/app',
  flagAsExternal: {
    outsideRootPath: true,
  },
});

// Matching patterns are relative to rootPath
const matcher = elements.getMatcher([
  { type: 'component', pattern: 'src/**/*.ts' }, // Relative to /project/packages/app
]);

// ✅ Correct: Using absolute file paths with relative patterns
const dep = matcher.describeDependency({
  from: '/project/packages/app/src/index.ts',      // absolute file path
  to: '/project/packages/shared/index.ts',         // absolute file path
  source: '@myorg/shared',
  kind: 'value',
});
// Result: dep.to.origin === 'external' (outside rootPath)
// Note: Pattern 'src/**/*.ts' matches because the package converts
// absolute paths to relative internally for pattern matching

// ❌ Incorrect: Using relative file paths (won't detect outsideRootPath correctly)
const dep2 = matcher.describeDependency({
  from: 'src/index.ts',                            // relative file path
  to: '../shared/index.ts',                        // relative file path
  source: '@myorg/shared',
  kind: 'value',
});
// Result: Won't correctly detect if outside rootPath
```

> **💡 Key Points:**
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

#### Methods

##### `getMatcher`

Creates a new matcher instance.

- __Parameters__:
  - `descriptors`: `array<ElementDescriptor>` Array of [element descriptors](#element-descriptors) to be used by the matcher.
  - `options`: `ElementsOptions` Optional. [Configuration options](#configuration-options) for the matcher. These options will override the default options set in the `Elements` instance.
- __Returns__: `Matcher` A new matcher instance.

```ts
const matcher = elements.getMatcher([
  {
    type: "component",
    pattern: "src/components/*",
    mode: "folder",
  },
  {
    type: "helper",
    pattern: "src/helpers/*.js",
    mode: "file",
  }
]);
```

##### `clearCache`

Clears all cached matcher instances and shared caches.

```ts
elements.clearCache();
```

##### `serializeCache`

Serializes all cached matcher instances and shared caches to a plain object.

```ts
const cache = elements.serializeCache();
```

##### `setCacheFromSerialized`
Sets the cached matcher instances and shared caches from a serialized object.

```ts
const cache = elements.serializeCache();
elements.setCacheFromSerialized(cache);
```

### Matcher Instance Methods

#### `isMatch`

Checks if a given path matches the specified element or dependency selector.

```ts
const isElementMatch = matcher.isMatch("src/components/Button.tsx", [{ type: "component" }]);

const isDependencyMatch = matcher.isMatch(
  {
    from: "src/components/Button.tsx",
    to: "src/services/Api.ts",
    source: "../services/Api",
    kind: "type",
    nodeKind: "ImportDeclaration",
  },
  {
    from: [{ category: "react" }],
    to: { type: "service", nodeKind: "Import*" },
  }
);
```

- __Parameters__:
  - `path`:
    - `string` The path to check when using an [element selector](#selectors).
    - `DependencyProperties` The [properties of the dependency](#dependency-matching) to check when using a [dependency selector](#selectors).
  - `selector`: `ElementSelector | DependencySelector` The [selector](#selectors) to match against. It can be either an element selector (for path matching) or a dependency selector (for dependency matching).
    - If `path` is a string, `selector` should be an [`ElementSelector`](#selectors) or an array of `ElementSelector`.
    - If `path` are dependency properties, `selector` should be a [`DependencySelector`](#selectors) or an array of `DependencySelector`.
  - `options`: `MatcherOptions` Optional. Additional options for matching:
    - `extraTemplateData`: `object` Optional. Extra data to pass to selector templates. When using [template variables](#template-variables) in selectors, this data will be available for rendering.

#### `getSelectorMatching`

Returns the first matching selector or `null`.

```ts
const matchingSelector = matcher.getSelectorMatching("src/components/Button.tsx", [{ type: "component" }]);
```

Parameters are the same as `isMatch`, but instead of returning a boolean, it returns the first matching selector or `null` if none match.

#### `describeElement`

Returns a detailed description of an element.

```ts
const elementDescription = matcher.describeElement("src/components/Button.tsx");
```

- __Parameters__:
  - `path`: `string` The path of the element to describe.

#### `describeDependency`

Returns a detailed description of a dependency.

```ts
const dependencyDescription = matcher.describeDependency({
  from: "src/components/Button.tsx",
  to: "src/services/Api.ts",
  source: "../services/Api",
  kind: "type",
  nodeKind: "ImportDeclaration",
});
```

- __Parameters__:
  - `dependency`: The [properties of the dependency to describe](#dependency-matching).

#### `getSelectorMatchingDescription`

Matches a description against selectors. As first argument, it should receive the result of `describeElement` or `describeDependency`.

```ts
const elementDescription = matcher.describeElement("src/components/Button.tsx");
const matchingSelector = matcher.getSelectorMatchingDescription(elementDescription, [{ type: "component" }]);
```

#### `clearCache`

Clears the matcher's internal cache.

```ts
matcher.clearCache();
```

> [!WARNING]
> This only clears the internal cache for this matcher instance. Shared cache for micromatch results, regex and captures is not affected. You can clear all caches using `Elements.clearCache()`.

#### `serializeCache`

Serializes the matcher's cache.

```ts
const cache = matcher.serializeCache();
```

#### `setCacheFromSerialized`

Restores the matcher's cache from a serialized object.

```ts
// Serialize cache to a serializable object
const cache = matcher.serializeCache();

// Clear current cache
matcher.clearCache();

// Restore cache from serialized object
matcher.setCacheFromSerialized(cache);
```

## Legacy Selectors

Legacy selectors are defined using a different syntax and are provided for backward compatibility. However, this syntax is deprecated and will be removed in a future release. It is recommended to migrate to the new selector syntax.

Selectors can be defined as either a string or an array of strings representing the element type(s):

```ts
// Legacy selector using a string
const isElementMatch = matcher.isMatch("src/components/Button.tsx", "component");
// Legacy selector using an array of strings
const isElementMatch = matcher.isMatch("src/components/Button.tsx", ["component", "service"]);
```

They can also be defined as an array where the first element is the type and the second element is an object containing captured values:

```ts
// Legacy selector with captured values
const isElementMatch = matcher.isMatch(
  "src/modules/auth/LoginForm.component.tsx",
  ["component", { module: "auth" }]
);
```

> **⚠️ Warning:** Avoid mixing legacy selectors with the new selector syntax in the same project, as this can lead to ambiguity. In particular, if you define a top-level array selector with two elements and the second one is an object containing a `type` or `category` key, it will be interpreted as legacy options rather than two separate selectors.

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
