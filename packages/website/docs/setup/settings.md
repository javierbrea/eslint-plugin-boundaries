---
id: settings
title: Settings Reference
sidebar_label: Settings
description: Settings to configure ESLint Plugin Boundaries behavior.
tags:
  - eslint
  - configuration
keywords:
  - JS Boundaries
  - ESLint plugin
  - boundaries
  - javaScript
  - typeScript
  - setup
  - configuration
  - settings
  - performance
  - ast
---

# Settings Reference

This section provides a complete reference of all available global settings for the plugin.

## `boundaries/elements`

**Type:** `<array of element descriptors>` - see **[Element Descriptors documentation](./elements.md)**

**Required:** Yes (for rules to work)

Defines **[element descriptors](./elements.md)** to recognize each file in the project as one of the defined element types. All rules need this setting to be configured properly.

```js
export default [{
  settings: {
    "boundaries/elements": [
      {
        type: "helper",
        pattern: "helpers/*/*.js",
        mode: "file",
        capture: ["family", "elementName"]
      }
    ]
  }
}]
```

## `boundaries/include`

**Type:** `<array of strings>`

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

**Type:** `<array of strings>`

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

**Default:** `["import"]`

Modifies which built-in dependency nodes are analyzed. By default, all next nodes are analyzed:

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
For custom dependency nodes (like `jest.mock(...)`), use [`boundaries/additional-dependency-nodes`](#boundariesadditional-dependency-nodes).
:::

## `boundaries/additional-dependency-nodes`

**Type:** `<array of objects>`

**Default:** `[]`

Defines custom dependency nodes to analyze beyond the built-in ones. All plugin rules will be applied to nodes defined here in addition to the built-in ones defined in `boundaries/dependency-nodes`.

**Object structure:**

- **`selector`** - The [esquery selector](https://github.com/estools/esquery) for the `Literal` node where the dependency source is defined
- **`kind`** - The dependency kind: `"value"` or `"type"` (makes sense only for TypeScript projects, where you can have type-only dependencies)
- **`name`** (optional) - A name for the custom node, so you can use it in rules configuration (e.g., to forbid or allow this kind of dependency in some rules or to use it in custom messages templates variables)

**Example:**

```js
export default [{
  settings: {
    "boundaries/additional-dependency-nodes": [
      // jest.requireActual('source')
      {
        selector: "CallExpression[callee.object.name=jest][callee.property.name=requireActual] > Literal",
        kind: "value",
        name: "jest-require-actual"
      },
      // jest.mock('source', ...)
      {
        selector: "CallExpression[callee.object.name=jest][callee.property.name=mock] > Literal:first-child",
        kind: "value",
        name: "jest-mock"
      },
    ],
  }
}]
```

## `boundaries/root-path`

**Type:** `<string>`

**Default:** `process.cwd()`

Defines the root path of the project. By default, the plugin uses the current working directory.

**When to use:** This setting is useful when executing the lint command from a different path than the project root, which may produce unexpected results with `basePattern` or `full` mode in element descriptors.

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

:::note Pattern Matching with rootPath

Matching patterns in [element descriptors](./elements.md) must be **relative to the `rootPath`**. The plugin automatically converts absolute file paths to relative paths internally for pattern matching.

However, in **`file` and `folder` modes**, patterns are evaluated **right-to-left** (from the end of the path), which makes the relativity to `rootPath` less critical for most use cases. For example, a pattern like `*.model.ts` will match any file ending with `.model.ts` regardless of its location within `rootPath`.

In **`full` mode**, patterns must match the complete relative path from `rootPath`. Files outside `rootPath` maintain their absolute paths and require absolute patterns to match.

:::

:::warning
The `rootPath` setting may affect how the plugin assign the `origin` property for files outside the root path, categorizing them as `external` or `local`, but you can customize this behavior with the [`boundaries/flag-as-external` setting](#boundariesflag-as-external).
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

Defines custom rules for categorizing dependencies as external or local. By default, the plugin categorizes dependencies in `node_modules` and unresolvable imports as external. Use this setting to customize this behavior.

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
  filter: {
    files: undefined,
    dependencies: undefined,
  }
}
```

Enables debug traces and optionally filters them with **[Element or Dependency Selectors](../setup/selectors.md).**

- **`enabled`** `<boolean>` - Enables debug output when `true`.
- **`filter.files`** [`<array of element selectors>`](../setup/selectors.md#element-selectors) - Filters file traces.
- **`filter.dependencies`** [`<array of dependency selectors>`](../setup/selectors.md#dependency-selectors) - Filters dependency traces.

:::tip
You can filter debug traces using selectors. See the [Debugging guide](../guides/debugging.md) for complete filtering examples.
:::

## `boundaries/legacy-templates`

**Type:** `<boolean>`
**Default:** `true` <small>(will be `false` in next major version)</small>

Whether to prioritize legacy `${}` templates syntax in selectors over the new Handlebars syntax. When `true`, captured values in selectors will take precedence over Handlebars variables, so there is risk of conflicts between them if you are naming your captured values with any of the properties available in the [Elements Descriptions at runtime](./elements.md#runtime-description-properties) (like `path`, `category`, `origin`, etc.). Set it to `false` if that is not the case, to use the more powerful and flexible Handlebars syntax in all your templates without worrying about conflicts with captured values. Old templates will continue working as they are, without any change, regardless of this setting.

This does not affect the syntax supported in custom messages templates, because old syntax does not have available the new Handlebars variables, so it will continue working as it is, while new templates will support the more powerful and flexible Handlebars syntax without any conflict with captured values.

:::tip Read more
Read more about using templates in selectors in the [Selectors documentation](../setup/selectors.md#templating-in-selectors), and about using custom messages templates in the [Rules documentation](../setup/rules.mdx#message-templating).
:::