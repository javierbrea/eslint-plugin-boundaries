[![Build status][build-image]][build-url] [![Coverage Status][coveralls-image]][coveralls-url] [![Quality Gate][quality-gate-image]][quality-gate-url]

[![Renovate](https://img.shields.io/badge/renovate-enabled-brightgreen.svg)](https://renovatebot.com) [![Last commit][last-commit-image]][last-commit-url] [![Last release][release-image]][release-url]

[![NPM downloads][npm-downloads-image]][npm-downloads-url] [![License][license-image]][license-url]

# @boundaries/elements

## Table of Contents

- [Introduction](#introduction)
- [Installation](#installation)
- [Usage](#usage)
  - [Options](#options)
  - [Creating a matcher](#creating-a-matcher)
    - [Element Descriptors](#element-descriptors)
  - [Selectors](#selectors)
    - [Template Variables](#template-variables)
  - [Using the matcher](#using-the-matcher)
    - [Elements matcher](#elements-matcher)
    - [Dependency matcher](#dependency-matcher)
- [API Reference](#api-reference)
- [Contributing](#contributing)
- [License](#license)

## Introduction

This package provides element descriptors and matchers for the `@boundaries` ecosystem. These basically means:

- You provide a set of "element descriptors" that define how to identify files in a project (e.g., by looking at file path patterns, you assign certain properties to those elements, such as type, category, etc.).
- Then you can use:
 - "Element matchers": Check if a given path corresponds to an element with specific properties.
 - "Dependency matchers": Check if a given dependency between two paths matches certain criteria based on the properties of the source and target elements.

You can use [Micromatch patterns](https://github.com/micromatch/micromatch) to define flexible matching rules for both dependency and element matchers.

Example:

```ts
import { Elements } from '@boundaries/elements';

const elements = new Elements();

// Define your matcher using element descriptors.
// It will create a unique cache instance for these specific descriptors to improve performance when matching.
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

// Using element matcher
const isComponent = matcher.isMatch("src/components/Button.tsx", { type: "component" }); // true

// Using dependency matcher
const isReactToServiceImportDependency = matcher.isMatch(
  {
    from: "src/components/Button.tsx",
    to: "src/services/Api.ts",
    source: "../services/Api",
    kind: "type",
    nodeKind: "ImportDeclaration",
  },
  {
    from: { category: "react" },
    to: { type: "service", nodeKind: "Import*" },
  }
); // true

```

## Installation

You can install the package via npm:

```bash
npm install @boundaries/elements
```

## Usage

Create an instance of `Elements`.

```ts
import { Elements } from '@boundaries/elements';

const elements = new Elements();
```

You can pass configuration options to the constructor. If done, these options will be used as defaults when creating matchers.

### Options

- `ignorePaths`: Micromatch pattern/s to ignore certain paths when describing elements. If not defined, no paths are ignored by default.
- `includePaths`: Micromatch pattern/s to include only certain paths when describing elements. If not defined, all paths are included by default.

```ts
const elements = new Elements({
  ignorePaths: ["**/dist/**", "**/build/**"],
  includePaths: ["src/**/*"],
});
```

### Creating a matcher

You can create a matcher using the `getMatcher` method, providing an array of element descriptors. This will create a unique cache instance for these specific descriptors to improve performance when matching.

> [!NOTE]
> If you create multiple matchers with the same descriptors, they will share the same cache instance.

```ts
const matcher = elements.getMatcher([
  // Your element descriptors here
  {
    type: "component",
    category: "react",
    pattern: "src/components/*.tsx",
    mode: "file",
    capture: ["fileName"],
  }
]);
```

>[!TIP]
> You can also provide options to the `getMatcher` method as a second argument. These options will override the default options set in the `Elements` instance. Different options will create different cache instances.

### Element Descriptors

Element descriptors define how to identify files in a project and assign properties to them. They are used when creating matchers. Each descriptor is an object with the following properties:

* __`type`__: `string` Type to be assigned to files matching the given pattern.
* __`category`__: `string` Optional. Category to be assigned to files matching the given pattern.
* __`pattern`__: `string|array<string>` [`micromatch` pattern](https://github.com/micromatch/micromatch). __By default the library will try to match this pattern progressively starting from the right side of each file path.__ This means that you don't have to define patterns matching from the base project path, but only the last part of the path that you want to be matched. <br/>For example, given a path `src/helpers/awesome-helper/index.js`, it will try to assign the element to a pattern matching `index.js`, then `awesome-helper/index.js`, then `helpers/awesome-helper/index.js`, etc. Once a pattern matches, it assign the correspondent element type, and continues searching for parents elements with the same logic until the full path has been analyzed. __This behavior can be disabled setting the `mode` option to `full`__, then the provided pattern will try to match the full path.
* __`basePattern`__: `string` Optional [`micromatch` pattern](https://github.com/micromatch/micromatch). If provided, the left side of the element path must match also with this pattern from the root of the project (like if pattern is `[basePattern]/**/[pattern]`). This option is useful when using the option `mode` with `file` or `folder` values, but capturing fragments from the rest of the full path is also needed (see `baseCapture` option below).
* __`mode`__: `file|folder|full` Optional.
  * When it is set to `folder` (default value), the element type will be assigned to the first file's parent folder matching the pattern. In the practice, it is like adding `**/*` to the given pattern, but the library makes it by itself because it needs to know exactly which parent folder has to be considered the element.
  * If it is set to `file`, the given pattern will not be modified, but the library will still try to match the last part of the path. So, a pattern like `*.model.js` would match with paths `src/foo.model.js`, `src/modules/foo/foo.model.js`, `src/modules/foo/models/foo.model.js`, etc.
  * If it is set to `full`, the given pattern will only match with patterns matching the full path. This means that you will have to provide patterns matching from the base project path. So, in order to match `src/modules/foo/foo.model.js` you'll have to provide patterns like `**/*.model.js`, `**/*/*.model.js`, `src/*/*/*.model.js`, etc. _(the chosen pattern will depend on what do you want to capture from the path)_
* __`capture`__: `array<string>` Optional. It allows to capture values of some fragments in the matching path. This information will be available when using matchers. It uses [`micromatch` capture feature](https://github.com/micromatch/micromatch#capture) under the hood, and stores each value in an object with the given `capture` key being in the same index of the captured array.<br/>For example, given `pattern: "helpers/*/*.js"`, `capture: ["category", "elementName"]`, and a path `helpers/data/parsers.js`, it will result in `captured: { category: "data", elementName: "parsers" }`.
* __`baseCapture`__: `array` Optional. [`micromatch` pattern](https://github.com/micromatch/micromatch). It allows capturing values from `basePattern` as `capture` does with `pattern`. If the same key is defined in both `capture` and `baseCapture`, the value from `capture` will take precedence.

### Selectors

When using the matcher to check if a given path corresponds to an element, you can provide a `selector` object to specify the properties that the element must have. A selector is an object where each key corresponds to a property of the element or dependency (like `type`, `category`, etc.), and the value is usually a string or a micromatch pattern to match against that property.

Properties that can be used in all element selectors (both for element matchers and dependency matchers):

* __`type`__: `string|array<string>` Optional. Type of the element.
* __`category`__: `string|array<string>` Optional. Category of the element.
* __`captured`__: `object` Optional. Object with keys and values to match against the captured values from the element descriptor. Each key in this object can be a string or an array of strings representing micromatch patterns.
* __`origin`__: `string|array<string>` Optional. Origin of the element. It can be either:
  * `local` - The element is a file within the project.
  * `external` - The element is an external dependency (e.g., from `node_modules`).
  * `core` - The element is a core module (e.g., `fs`, `path`, etc. in Node.js).
* __`path`__: `string|array<string>` Optional. Micromatch pattern(s) to match the full path of the file.
* __`elementPath`__: `string|array<string>` Optional. Micromatch pattern(s) to match the full path of the element to which the file belongs. For file elements, it would be the same as `path`, but for folder elements, it would be the path of the folder matching the element descriptor.
* __`internalPath`__: `string|array<string>` Optional. Micromatch pattern(s) to match the internal path of the file withing the element (e.g. for a file element, it would be the same as `elementPath`, but for a folder element, it would be the path relative to the folder).
* __`isIgnored`__: `boolean` Optional. Whether the element is ignored.
* __`isUnknown`__: `boolean` Optional. Whether the element is unknown (i.e., it doesn't match any element descriptor).

When using selectors in the `to` property of a dependency matcher, you can also use the following additional properties. In this case, we name it as "dependency selector":

* __`kind`__: `string|array<string>` Optional. Micromatch pattern(s) to match the kind of dependency ( `type` when it is imported using `import type`, `value` when it is imported using `import`, etc.).
* __`relationship`__: `string|array<string>` Optional. Micromatch pattern(s) to match the relationship of the dependency, which can be either:
  * `internal` - Both source and target files belongs to the same element.
  * `child` - The target element is a child of the source element.
  * `parent` - The target element is a parent of the source element.
  * `sibling` - Both source and target elements share the same parent element.
  * `uncle` - The target element is a sibling of an ancestor of the source element.
  * `nephew` - The target element is a child of a sibling of the source element.
  * `descendant` - The target element is a descendant of the source element (child, grandchild, etc.).
  * `ancestor` - The target element is an ancestor of the source element (parent, grandparent, etc.).
* __`specifiers`__: `string|array<string>` Optional. Micromatch patterns to match the specifiers of the dependency (e.g., the imported names).
* __`nodeKind`__: `string|array<string>` Optional. Micromatch pattern(s) to match the AST node kind of the dependency (e.g., `Import`, `CallExpression`, etc.).
* __`source`__: `string|array<string>` Optional. Micromatch pattern(s) to match the source of the dependency. (e.g., the import path).
* __`baseSource`__: `string|array<string>` Optional. Micromatch pattern(s) to match the base source of the dependency (e.g., when importing an specific path from an external module, it would be the module name).

> [!IMPORTANT]
> All properties in selectors are optional. You can provide only the properties you want to match against. But, all provided properties must match for the selector to be considered a match.

#### Template Variables

You can use template variables in selectors to create dynamic matching patterns. Template variables are resolved at match time using data from the element or dependency being matched, plus any extra data provided via `MatcherOptions`.

Templates are defined using **[Handlebars syntax](https://github.com/handlebars-lang/handlebars.js)**: `{{ variableName }}`

#### Available Template Data

When matching, the following data is automatically available:

**For element matching:**
- Element properties (`type`, `category`, `captured`, etc.)

**For dependency matching:**
- `from`: Properties of the source element
- `to`: Properties of the target element  
- `dependency`: Properties of the dependency itself (kind, nodeKind, specifiers, etc.)

#### Template Examples

```ts
// Using captured values in templates
const matcher = elements.getMatcher([
  {
    type: "component",
    pattern: "src/modules/(*)/**/*.component.tsx",
    capture: ["module"],
    mode: "file"
  }
]);

// Match components from specific module using template
const isAuthComponent = matcher.isMatch(
  "src/modules/auth/LoginForm.component.tsx",
  { 
    type: "component",
    captured: { module: "{{ captured.module }}" } // This will always match
  },
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

### Using the matcher

You can use element selectors with a created matcher to check if a given path corresponds to an element with specific properties, or if a dependency between two paths matches certain criteria.

#### Elements matcher

To match an element, use the `isMatch` method of the matcher, providing the path and an element selector.

```ts
const isElementMatch = matcher.isMatch("src/components/Button.tsx", { type: "component" });
```

> [!TIP]
> You can also provide an array of selectors to the `isMatch` method. In this case, the method will return `true` if the element matches any of the provided selectors.

#### Dependency matcher

To match a dependency, use the `isMatch` method of the matcher, providing a the properties of the dependency and a dependency selector.

The __dependency properties__ should be an object with:

* __`from`__: `string` Path of the source file.
* __`to`__: `string` Path of the target file.
* __`source`__: `string` Source of the dependency (e.g the import path).
* __`kind`__: `string` Kind of the dependency ( `type` when it is imported using `import type`, `value` when it is imported using `import`, etc.).
* __`nodeKind`__: `string` Id to identify the AST node kind of the dependency (e.g., `ImportDeclaration`, `CallExpression`, etc.).
* __`specifiers`__: `array<string>` Specifiers of the dependency (e.g., the imported names `import { X, Y } from 'module'` would have specifiers `['X', 'Y']`).

The dependency selector should have __at least one of the following properties, or both__:

* __`from`__: `ElementSelector | array<ElementSelector>` Selector or array of selectors to match the source element of the dependency.
* __`to`__: `ElementSelector | array<ElementSelector>` Selector or array of selectors to match the target element of the dependency.

```ts
const isDependencyMatch = matcher.isMatch(
  {
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
> You can also provide an array of selectors both to the `from` and `to` properties of the dependency selector. In this case, the method will return `true` if the dependency matches any combination of the provided selectors.

#### Selector patterns

When using selectors, you can provide either a single selector with multiple patterns for each property, or an array of selectors with single patterns for each property. Both approaches are valid and will yield the same result, but note that:

__Each selector must match completely__: All properties defined in a selector must match for the selector to be considered a match. If any property does not match, the entire selector is considered not matching. So, you can consider each selector as an __AND condition__ between its properties, and an __OR condition__ between multiple selectors.

> [!TIP]
> When using micromatch patterns in selectors, you can use wildcards (`*`, `**`, `?`, etc.) to create flexible matching rules. For example, a pattern like `service-*` would match any type that starts with `service-`.

## API Reference

### Class: Elements

#### Constructor

Creates a new instance of `Elements`

- __Parameters__:
  - `options`: `ElementsOptions` Optional. [Configuration options](#options) for the matcher. These options will be used as defaults when creating matchers.

```ts
new Elements(options?: ElementsOptions)
```

#### Methods

##### `getMatcher`

Creates a new matcher instance.

- __Parameters__:
  - `descriptors`: `array<ElementDescriptor>` Array of [element descriptors](#element-descriptors) to be used by the matcher.
  - `options`: `ElementsOptions` Optional. [Configuration options](#options) for the matcher. These options will override the default options set in the `Elements` instance.
- __Returns__: `Matcher` A new matcher instance.

```ts
const matcher = elements.getMatcher();
```

##### `clearCache`

Clears all cached matcher instances.

```ts
elements.clearCache();
```

##### `serializeCache`

Serializes all cached matcher instances to a serializable object.

```ts
const cache = elements.serializeCache();
```

##### `setCacheFromSerialized`
Sets the cached matcher instances from a serialized object.

```ts
const cache = elements.serializeCache();
elements.setCacheFromSerialized(cache);
```

### Matcher instance methods

#### `isMatch`

Checks if a given path matches the specified element or dependency selector.

- __Parameters__:
  - `path`:
    - `string` The path to check when using an [element selector](#selectors).
    - `DependencyProperties` The [properties of the dependency](#dependency-matcher) to check when using a [dependency selector](#selectors).
  - `selector`: `ElementSelector | DependencySelector` The [selector](#selectors) to match against. It can be either an element selector (for path matching) or a dependency selector (for dependency matching).
    - If `path` is a string, `selector` should be an [`ElementSelector`](#selectors) or an array of `ElementSelector`.
    - If `path` are dependency properties, `selector` should be a [`DependencySelector`](#selectors) or an array of `DependencySelector`.
  - `options`: `MatcherOptions` Optional. Additional options for matching:
    - `extraTemplateData`: `object` Optional. Extra data to pass to selector templates. When using [template variables](#template-variables) in selectors, this data will be available for rendering.
    - `dependencySelectorsGlobals`: `object` Optional. _(Deprecated)_ Properties to add to all dependency selectors.
- __Returns__: `boolean` `true` if the path or dependency matches the selector, `false` otherwise.

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

#### `getSelectorMatching`

Gets the first selector that matches the given path or dependency.

Parameters are the same as `isMatch`, but instead of returning a boolean, it returns the first matching selector or `null` if none match.

```ts
const matchingSelector = matcher.getSelectorMatching("src/components/Button.tsx", [{ type: "component" }]);
```

#### `describeElement`

Describes an element given its path.

- __Parameters__:
  - `path`: `string` The path of the element to describe.
- __Returns__: `ElementDescription` The description of the element, including its properties and captured values.

```ts
const elementDescription = matcher.describeElement("src/components/Button.tsx");
```

#### `describeDependency`

Describes a dependency given its origin, target paths, source, kind, nodeKind, and specifiers.

- __Parameters__:
  - `dependency`: The [properties of the dependency to describe](#dependency-matcher).
- __Returns__: `DependencyDescription` The description of the dependency, including its properties and captured values.

```ts
const dependencyDescription = matcher.describeDependency({
  from: "src/components/Button.tsx",
  to: "src/services/Api.ts",
  source: "../services/Api",
  kind: "type",
  nodeKind: "ImportDeclaration",
});
```

#### `getSelectorMatchingDescription`

Gets the first selector that matches the description of the given path or dependency.

Parameters are the same as `isMatch`, but instead of returning a boolean, it returns the first matching selector or `null` if none match.

As first argument, it receives the result of `describeElement` or `describeDependency`.

```ts
const elementDescription = matcher.describeElement("src/components/Button.tsx");
const matchingSelector = matcher.getSelectorMatchingDescription(elementDescription, [{ type: "component" }]);
```

#### `clearCache`

Clears the internal cache of the matcher.

```ts
matcher.clearCache();
```

#### `serializeCache`

Serializes the internal cache of the matcher to a serializable object.

```ts
const cache = matcher.serializeCache();
```

#### `setCacheFromSerialized`

Sets the internal cache of the matcher from a serialized object.

```ts
// Serialize cache to a serializable object
const cache = matcher.serializeCache();

// Clear current cache
matcher.clearCache();

// Restore cache from serialized object
matcher.setCacheFromSerialized(cache);
```

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
