---
id: custom-resolvers
title: Custom Resolvers
description: Learn how to create and use custom resolvers in ESLint Plugin Boundaries.
tags:
  - configuration
  - advanced
  - troubleshooting
keywords:
  - JS Boundaries
  - ESLint plugin
  - boundaries
  - javaScript
  - typeScript
  - webpack
  - babel
  - custom resolvers
  - module resolution
  - setup
  - configuration
  - troubleshooting
---

# Custom Resolvers

Modern JavaScript projects use various module systems, bundlers, and path resolution strategies. As the [`eslint-plugin-import`](https://github.com/import-js/eslint-plugin-import) documentation explains:


> "With the advent of module bundlers and the current state of modules and module syntax specs, it's not always obvious where `import x from 'module'` should look to find the file behind module."


To handle these complexities, Eslint Plugin Boundaries leverages the same resolver infrastructure used by [`eslint-plugin-import`](https://github.com/import-js/eslint-plugin-import) (through the [`eslint-module-utils/resolve`](https://www.npmjs.com/package/eslint-module-utils) module), giving you access to a wide ecosystem of resolvers for different project setups.

## How It Works

The plugin uses `eslint-module-utils/resolve` internally. This means you can configure custom module resolution using the `import/resolver` setting, and `eslint-plugin-boundaries` will respect those same resolution rules.

## Common Resolvers

### Node Resolver

The default Node.js module resolution algorithm. Already included by default.

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

You can configure multiple resolvers simultaneously. ESLint will try each resolver in sequence until one successfully resolves the module:

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

## Benefits of Custom Resolvers

Using the appropriate resolver for your project provides:

- **Accurate Path Resolution**: Matches your build tool's module resolution exactly
- **Alias Support**: Resolves custom path aliases and shortcuts
- **Monorepo Support**: Handles complex workspace structures
- **Framework Integration**: Works with framework-specific module systems
- **Consistent Behavior**: Ensures ESLint sees the same module structure as your bundler

## Learn More

For comprehensive information about available resolvers and their configuration options, see the [Resolvers documentation](https://github.com/import-js/eslint-plugin-import#resolvers) in the `eslint-plugin-import` repository.

## Troubleshooting

### Imports not resolving correctly

- Ensure the resolver package is installed
- Check that resolver configuration matches your project setup
- Verify file extensions are included in the resolver config
- Try adding the Node.js resolver as a fallback

### Custom resolver not found

- Install the resolver package: `npm i --save-dev resolver-package-name`
- Check the package name in your ESLint config
- Verify the resolver package supports your ESLint version
