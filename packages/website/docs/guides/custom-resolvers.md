---
id: custom-resolvers
title: Custom Resolvers
description: Learn how to create and use custom resolvers in ESLint Plugin Boundaries.
tags:
  - configuration
  - advanced
  - troubleshooting
keywords:
  - eslint-plugin-boundaries
  - JavaScript
  - TypeScript
  - webpack
  - babel
  - custom resolvers
  - module resolution
  - import resolver
  - eslint-plugin-import
  - alias resolver
  - troubleshooting
---

# Custom Resolvers

This guide explains how to configure custom module resolvers so that eslint-plugin-boundaries resolves imports the same way your bundler does. Different projects use different module systems, bundlers, and path-alias strategies. As the [`eslint-plugin-import`](https://github.com/import-js/eslint-plugin-import) documentation puts it, "it's not always obvious where `import x from 'module'` should look to find the file behind module".

To handle this, eslint-plugin-boundaries reuses the resolver infrastructure of [`eslint-plugin-import`](https://github.com/import-js/eslint-plugin-import) (through the [`eslint-module-utils/resolve`](https://www.npmjs.com/package/eslint-module-utils) module), giving you access to a wide ecosystem of resolvers.

## How It Works

The plugin uses `eslint-module-utils/resolve` internally. Configure module resolution with the `import/resolver` setting, and eslint-plugin-boundaries respects those same resolution rules.

:::warning[Deprecated]
`boundaries/alias` is kept for backward compatibility but is deprecated and will be removed in a future major version. Use **[`import/resolver`](../setup/settings.md#importresolver)** instead.
:::

It keeps working without changes; you will see a deprecation warning in your console. Migrate by moving your path aliases from `boundaries/alias` to a resolver configuration (for example, the [Alias Resolver](#alias-resolver) shown below).

:::note[Resolution affects module origin]
The resolver outcome decides each dependency's [module origin](../setup/modules.md#module-origins). A resolved import that points inside your project is classified as `"local"`; one resolved into `node_modules` is `"external"`. When no configured resolver can resolve an import, the plugin classifies it as `"external"` by default (`unresolvableAlias`, see [`boundaries/flag-as-external`](../setup/settings.md#boundariesflag-as-external)). Configuring the right resolver avoids false positives in rules that match on `to.module.origin`.
:::

## Common Resolvers

### Node Resolver

The default Node.js module resolution algorithm. If you use the legacy `.eslintrc` configuration, this resolver is active by default. With flat config (`eslint.config.js`), no resolver is active automatically, so configure it explicitly if you need it:

```js
export default [{
  settings: {
    "import/resolver": {
      node: {
        extensions: [".js", ".jsx", ".json"]
      }
    }
  }
}];
```

### TypeScript Resolver

For TypeScript projects with path mappings (see [TypeScript Support](./typescript-support.md) for full details):

```bash
npm i eslint-import-resolver-typescript --save-dev
```

```js
export default [{
  settings: {
    "import/resolver": {
      typescript: {
        alwaysTryTypes: true,
        project: "./tsconfig.json"
      }
    }
  }
}];
```

### Webpack Resolver

For projects using Webpack with custom resolve configurations:

```bash
npm i eslint-import-resolver-webpack --save-dev
```

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

### Alias Resolver

For custom path aliases without a bundler:

```bash
npm i eslint-import-resolver-alias --save-dev
```

```js
export default [{
  settings: {
    "import/resolver": {
      alias: {
        map: [
          ["@components", "./src/components"],
          ["@utils", "./src/utils"]
        ],
        extensions: [".js", ".jsx", ".json"]
      }
    }
  }
}];
```

## Multiple Resolvers

You can configure multiple resolvers simultaneously. The plugin tries each resolver in order until one successfully resolves the module:

```js
export default [{
  settings: {
    "import/resolver": {
      node: {},
      typescript: {
        alwaysTryTypes: true
      },
      webpack: {
        config: "webpack.config.js"
      }
    }
  }
}];
```

## Popular Resolver Packages

Here are some commonly used resolver packages you can install:

- **[eslint-import-resolver-node](https://www.npmjs.com/package/eslint-import-resolver-node)** - Default Node.js resolution
- **[eslint-import-resolver-typescript](https://www.npmjs.com/package/eslint-import-resolver-typescript)** - TypeScript and path mapping support
- **[eslint-import-resolver-webpack](https://www.npmjs.com/package/eslint-import-resolver-webpack)** - Webpack configuration integration
- **[eslint-import-resolver-alias](https://www.npmjs.com/package/eslint-import-resolver-alias)** - Simple path alias mapping
- **[eslint-import-resolver-babel-module](https://www.npmjs.com/package/eslint-import-resolver-babel-module)** - Babel module resolver integration

## Learn More

For comprehensive information about available resolvers and their configuration options, see the [Resolvers documentation](https://github.com/import-js/eslint-plugin-import#resolvers) in the `eslint-plugin-import` repository.

## Troubleshooting

### Imports not resolving correctly

- Ensure the resolver package is installed
- Check that resolver configuration matches your project setup
- Verify file extensions are included in the resolver config
- Try adding the Node.js resolver as a fallback

### Imports classified as `external` unexpectedly

If a rule that matches on `to.module.origin` flags a local import as external, the import is probably not resolving. Unresolvable imports are classified as `"external"` by default (`unresolvableAlias` in [`boundaries/flag-as-external`](../setup/settings.md#boundariesflag-as-external)). Configure the resolver that recognizes your aliases, then re-run with [debug mode](./debugging.md) to confirm the new origin.

### Custom resolver not found

- Install the resolver package: `npm i --save-dev resolver-package-name`
- Check the package name in your ESLint config
- Verify the resolver package supports your ESLint version

## Further Reading

- **[Settings](../setup/settings.md)** - the `import/resolver` and `boundaries/flag-as-external` settings.
- **[Selectors](../setup/selectors.md#module-sub-selector)** - matching dependencies by module origin and source.
- **[TypeScript Support](./typescript-support.md)** - the TypeScript resolver and path aliases.
- **[Monorepo Setup](./monorepo-setup.md)** - resolution across workspace packages.
- **[Debugging](./debugging.md)** - inspect how each import is resolved and classified.
