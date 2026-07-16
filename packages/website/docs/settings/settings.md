---
id: settings
title: Settings Reference
sidebar_label: Settings
description: Settings to configure ESLint Plugin Boundaries behavior.
tags:
  - eslint
  - configuration
keywords:
  - eslint-plugin-boundaries
  - JavaScript
  - TypeScript
  - settings
  - configuration
  - include and ignore
  - dependency nodes
  - root path
  - debug settings
  - settings
  - performance
  - ast
---

# Settings Reference

This section provides a complete reference of all available global settings for the plugin.

## `boundaries/elements`

**Type:** `<array of element descriptors>` - see **[Element Descriptors documentation](../classification/elements.md)**

**Required:** No, but at least one classification layer must be configured — this setting or [`boundaries/files`](#boundariesfiles).

Defines **[element descriptors](../classification/elements.md)** that recognize each file in the project as part of one of the defined elements. Rules need at least one classification layer to be configured: `boundaries/elements`, [`boundaries/files`](#boundariesfiles), or both.

```js
export default [{
  settings: {
    "boundaries/elements": [
      { type: "helper", pattern: "helpers/*", capture: ["family"] },
      { type: "component", pattern: "components/*/*", capture: ["family", "elementName"] },
      { type: "module", pattern: "modules/*", capture: ["elementName"] }
    ]
  }
}]
```

See the [Element Descriptors](../classification/elements.md) section for every descriptor property, including `pattern`, `type`, `capture`, `basePattern`, and `baseCapture`.

## `boundaries/files`

**Type:** `<array of file descriptors>` - see **[File Descriptors documentation](../classification/files.md)**

**Default:** `[]`

**Required:** No, but it can be the only classification layer you configure instead of [`boundaries/elements`](#boundarieselements).

Defines **[file descriptors](../classification/files.md)** that categorize files independently of the elements they belong to. The resulting categories appear at runtime as `file.categories` and can be matched in rule policies with the [`file` selector](../selectors/selectors.md) and used in [message templates](../policies/policies.mdx#message-templating) (for example, `{{to.file.categories}}`). This is the recommended replacement for the deprecated element-descriptor `category` property.

```js
export default [{
  settings: {
    "boundaries/files": [
      { pattern: "**/*.spec.js", category: "test" },
      { pattern: "**/*.css", category: "style" }
    ]
  }
}]
```

See the [Files](../classification/files.md) section for the full reference, including how [categories accumulate](../classification/files.md#category-accumulation) across matching descriptors and the migration from the deprecated element `category` property.

## `boundaries/elements-single-type`

**Type:** `<boolean>`

**Default:** `true` <small>(single-type, backward compatible)</small>

Controls whether an element can have multiple [types](../classification/elements.md#multi-type-elements).

- When `true` (default), each element keeps only the **first** matching descriptor's type. This matches the historical single-type behavior.
- When `false`, an element accumulates **all** descriptor types that match at the same path level, in descriptor order. The element's `types` array then holds every matched type.

```js
export default [{
  settings: {
    // Opt in to multi-type elements
    "boundaries/elements-single-type": false
  }
}]
```

:::tip[Multi-type Elements]
The plugin defaults this setting to `true` (single-type) for backward compatibility. Set `boundaries/elements-single-type: false` to opt in to multi-type matching. See [Multi-type Elements](../classification/elements.md#multi-type-elements) for an example and the accumulation rules.
:::

## `boundaries/include`

**Type:** `<string | string[]>`

**Default:** All files included

Files not matching these [micromatch patterns](https://github.com/micromatch/micromatch) will be ignored by the plugin.

```js
export default [{
  settings: {
    "boundaries/include": ["src/**/*.js"]
  }
}]
```

## `boundaries/ignore`

**Type:** `<string | string[]>`

**Default:** No files ignored

Files matching these [micromatch patterns](https://github.com/micromatch/micromatch) will be ignored by the plugin.

```js
export default [{
  settings: {
    "boundaries/ignore": ["**/*.spec.js", "src/legacy-code/**/*"]
  }
}]
```

:::tip
The `boundaries/ignore` option has precedence over `boundaries/include`. If you define `boundaries/include`, use `boundaries/ignore` to ignore subsets of included files.
:::

## `boundaries/dependency-nodes`

**Type:** `<array of strings>`

**Default:** `["import", "export", "require", "dynamic-import"]`

Modifies which built-in dependency nodes are analyzed. By default, all of the following nodes are analyzed:

**Available values:**

- `'import'` - Analyze `import` statements
- `'require'` - Analyze `require` statements
- `'export'` - Analyze `export` statements
- `'dynamic-import'` - Analyze [dynamic import](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/import) statements (`import()`)

All plugin rules will be applied to the nodes defined in this setting. **Modify the default value only if you want to exclude some of the built-in dependency nodes from analysis.**

```js
export default [{
  settings: {
    "boundaries/dependency-nodes": ["import", "dynamic-import"]
  }
}]
```

:::tip
To check also custom dependency nodes (like `jest.mock(...)`), use [`boundaries/additional-dependency-nodes`](#boundariesadditional-dependency-nodes).
:::

## `boundaries/additional-dependency-nodes`

**Type:** `<array of objects>`

**Default:** `[]`

Defines custom dependency nodes to analyze beyond the built-in ones. All plugin rules will be applied to nodes defined here in addition to the built-in ones defined in `boundaries/dependency-nodes`.

**Object structure:**

- **`selector`** - The [esquery selector](https://github.com/estools/esquery) for the `Literal` node where the dependency source is defined
- **`name`** - A name for the custom node, so you can **use it in policy configuration using `dependency.nodeKind`** (e.g., to forbid or allow this kind of dependency node in some rules or to use it in custom messages templates variables)
- **`kind`** - Assigns the **`dependency.kind` property in dependency descriptions**, which you can use in policy configuration or custom message templates to target specific dependency kinds. Possible values are `"value"`, `"type"`, or `"typeof"`.

:::warning
The `name` property is required. Custom dependency nodes defined without a unique `name` cannot be referenced from selectors or custom messages templates, so objects missing it are considered invalid and are ignored (a warning is emitted).
:::

**Example:**

```js
export default [{
  settings: {
    "boundaries/additional-dependency-nodes": [
      // jest.requireActual('source')
      {
        selector: "CallExpression[callee.object.name=jest][callee.property.name=requireActual] > Literal",
        name: "jest-require-actual",
        kind: "value"
      },
      // jest.mock('source', ...)
      {
        selector: "CallExpression[callee.object.name=jest][callee.property.name=mock] > Literal:first-child",
        name: "jest-mock",
        kind: "value"
      },
    ],
  }
}]
```

## `boundaries/root-path`

**Type:** `<string>`

**Default:** `process.cwd()`

Defines the root path of the project. By default, the plugin uses the current working directory.

**When to use:** This setting is useful when executing the lint command from a different path than the project root, which may otherwise produce unexpected results when matching `basePattern` in element descriptors or classifying module origins.

**Example with ESM:**

```js
import { resolve } from "node:path";

export default [{
  settings: {
    "boundaries/root-path": resolve(import.meta.dirname)
  }
}]
```

**Using environment variable:**

```bash
ESLINT_PLUGIN_BOUNDARIES_ROOT_PATH=../../project-root npm run lint
```

You can provide either an absolute path or a relative path to the project root in the environment variable. Relative paths will be resolved from where the lint command is executed.

:::warning
The path should be absolute and resolved before passing it to the plugin. Otherwise, it will be resolved using the current working directory.
:::

:::note[Pattern Matching with rootPath]

Matching patterns in [element descriptors](../classification/elements.md) are **relative to the `rootPath`**. The plugin automatically converts absolute file paths to relative paths internally for pattern matching. Depending on the element descriptor's `partialMatch` property, patterns are evaluated **right-to-left** (from the end of the path) or not, and then, the relativity to `rootPath` is less or more critical. Read the [Element Descriptors](../classification/elements.md) section for more details on how `partialMatch` affects pattern matching.

:::

:::note[Module Origin and rootPath]
The `rootPath` setting may affect the **[module origin](../classification/modules.md)** assigned to dependencies resolved outside the root path, classifying them as `"external"` or `"local"`. You can customize this behavior with the [`boundaries/flag-as-external` setting](#boundariesflag-as-external). See [Modules → How settings influence origin](../classification/modules.md#how-settings-influence-origin) for the full effect.
:::

## `boundaries/cache`

**Type:** `<boolean>`

**Default:** `true`

Enables or disables the cache mechanism used to boost performance.

```js
export default [{
  settings: {
    "boundaries/cache": true // or false to disable
  }
}]
```

:::tip
**Recommendation:** Keep cache enabled unless you experience issues. If you encounter problems, please [open a github issue describing them](https://github.com/javierbrea/eslint-plugin-boundaries/issues).
:::

## `boundaries/flag-as-external`

**Type:** `<object>`

**Default:**

```js
{
  unresolvableAlias: true,
  inNodeModules: true,
  outsideRootPath: false,
  customSourcePatterns: []
}
```

Defines custom rules for categorizing a dependency's [module origin](../classification/modules.md) as external or local. By default, the plugin categorizes dependencies in `node_modules` and unresolvable imports as external. Use this setting to customize this behavior. See [Modules → How settings influence origin](../classification/modules.md#how-settings-influence-origin) for how each condition affects the resulting origin.

:::tip
This setting is especially useful in monorepo environments. Read the [Monorepo Setup guide](../guides/monorepo-setup.md) for detailed examples of different monorepo configurations using this setting.
:::

**Object properties:**

- **`unresolvableAlias`** `<boolean>` - If `true`, non-relative imports that cannot be resolved are categorized as external. **Default:** `true`
- **`inNodeModules`** `<boolean>` - If `true`, imports resolved to paths containing `node_modules` are categorized as external. **Default:** `true`
- **`outsideRootPath`** `<boolean>` - If `true`, imports resolved to paths outside the configured `root-path` are categorized as external. **Default:** `false`
- **`customSourcePatterns`** `<array of strings>` - Import sources matching any of these [micromatch patterns](https://github.com/micromatch/micromatch) are categorized as external. **Default:** `[]`

:::info
All conditions are evaluated with **OR** logic: a dependency is categorized as external if **any** of the enabled conditions is met.
:::

**Example - Treat inter-package imports as external in a monorepo:**

```js
import { resolve } from "node:path";

export default [{
  files: ["packages/app/**/*.js"],
  settings: {
    "boundaries/root-path": resolve(import.meta.dirname, "packages/app"),
    "boundaries/flag-as-external": {
      outsideRootPath: true  // Imports outside packages/app have `external` origin
    }
  }
}]
```

**Example - Treat specific import patterns as external:**

```js
export default [{
  files: ["packages/**/*.js"],
  settings: {
    "boundaries/flag-as-external": {
      customSourcePatterns: ["@myorg/*", "~/**"] 
      // Organization packages are considered external
    }
  }
}]
```

**Example - Treat all resolved imports as local, even if outside rootPath (for granular boundary rules between packages):**

```js
export default [{
  files: ["packages/**/*.js"],
  settings: {
    "boundaries/flag-as-external": {
      unresolvableAlias: true,   // Still treat unresolvable as external
      inNodeModules: true,        // npm packages remain external
      outsideRootPath: false,     // Inter-package imports are local, even if outside rootPath
      customSourcePatterns: []    // No custom patterns
    }
  }
}]
```

:::tip
See the [Monorepo Setup Guide](../guides/monorepo-setup.md) for detailed examples of different monorepo configurations.
:::

## `import/resolver`

**Type:** `<object>`

Configures custom module resolution for the plugin, leveraging the same resolver infrastructure used by [`eslint-plugin-import`](https://github.com/import-js/eslint-plugin-import) (through the [`eslint-module-utils/resolve`](https://www.npmjs.com/package/eslint-module-utils) module), giving you access to a wide ecosystem of resolvers for different project setups.

:::info
Read more about configuring custom resolvers in the [Custom Resolvers](../guides/custom-resolvers.md) guide.
:::

```js
export default [{
  settings: {
    "import/resolver": {
      webpack: {
        config: "webpack.config.js"
      }
    }
  }
}];
```

## `boundaries/debug`

**Type:** `<object>`

**Default:**

```js
{
  enabled: false,
  messages: {
    files: true,
    dependencies: true,
    violations: true,
  },
  filter: {
    files: undefined,
    dependencies: undefined,
  }
}
```

Enables debug traces and optionally filters them with [selectors](../selectors/selectors.md). When enabled, debug prints the full runtime **entity** description (element, file, and module) for each analyzed file.

- **`enabled`** `<boolean>` - Enables debug output when `true`. Default `false`. Debug also turns on via the `ESLINT_PLUGIN_BOUNDARIES_DEBUG` environment variable.
- **`messages`** `<object>` - Configures which message types to print (file descriptions, dependency descriptions, and policy violation descriptions). All are enabled by default.
  - **`files`** `<boolean>` - Prints file descriptions for each file analyzed.
  - **`dependencies`** `<boolean>` - Prints dependency descriptions for each dependency analyzed.
  - **`violations`** `<boolean>` - Prints policy violation descriptions for each rule policy violation detected.
- **`filter`** `<object>` - Configures filters to apply to debug traces. See the sub-properties for the accepted selector types. By default, no filters are applied, and all debug traces are printed when debug mode is enabled.
  - **`filter.files`** - Filters file traces. Accepts **both [file selectors](../selectors/selectors.md) and [entity selectors](../selectors/selectors.md)** (an array means OR).
  - **`filter.dependencies`** - Filters dependency traces. Accepts [dependency selectors](../selectors/selectors.md) — `{ from?, to?, dependency? }` objects (an array means OR).

:::tip
You can filter debug traces using selectors. See the **[Debugging guide](../guides/debugging.md)** for complete filtering examples.
:::

## `boundaries/legacy-templates`

**Type:** `<boolean>`

**Default:** `true` <small>(will be `false` in a future major version)</small>

Whether to prioritize the legacy `${}` template syntax in selectors over the Handlebars `{{}}` syntax.

When `true`, captured values are injected at the top level of the template data, so they take precedence over the built-in legacy aliases. There is a risk of conflict if you name a captured value the same as one of those aliases: `type`, `elementPath`, `internalPath`, `origin`, or `parents`. Set this to `false` to avoid the risk and use the Handlebars syntax in all your templates. Old templates keep working without changes regardless of this setting.

This setting only affects selectors. It does not change the syntax available in custom message templates: the legacy syntax there does not expose the Handlebars variables, so it keeps working as-is, while new templates can use the full Handlebars data tree.

:::info[Read more]
Read more about legacy templates in the [Legacy Message Templates](../policies/legacy.mdx#legacy-message-templates) section.
:::

## `boundaries/legacy-warnings`

**Type:** `<boolean>`

**Default:** `true`

When `false`, skips all legacy-pattern detection work and suppresses the associated runtime deprecation warnings, reducing overhead at lint time. Turn it off in case you don't want to see the warnings anymore, or to improve performance (but be aware to activate it again before you upgrade to a future major version, as some legacy patterns will be removed).

```js
export default [{
  settings: {
    "boundaries/legacy-warnings": false
  }
}]
```

## Deprecated Settings

:::warning[Deprecated]
The `boundaries/types` and `boundaries/alias` settings are kept for backward compatibility but are deprecated. Use **[`boundaries/elements`](#boundarieselements)** and the **[`import/resolver`](#importresolver)** settings instead. They are documented, with migration guidance, on the **[Deprecated Settings](./legacy.md)** page.
:::

## Next Steps

- **[Elements](../classification/elements.md)** - element descriptors in context.
- **[Files](../classification/files.md)** - file descriptor properties and category accumulation.
- **[Selectors](../selectors/selectors.md)** - the selectors used by policies and debug filters.
- **[Policies](../policies/policies.mdx)** - message templates referenced by `legacy-templates`.
- **[Debugging](../guides/debugging.md)** - debug filter examples.
- **[Monorepo Setup](../guides/monorepo-setup.md)** - `flag-as-external` usage in monorepos.