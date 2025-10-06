# eslint-config

This is a shared configuration for ESLint in the monorepo.

## Installation

This package is not published to npm, so it can be used only in the monorepo, and you should not add the dependency to the `package.json` file. The dependency will be managed by Nx, the monorepo tool.

To use this configuration in other package in the monorepo, add the following to your `package.json`

```json
{
  "scripts": {
    "lint": "eslint ."
  }
}
```

> [!NOTE]
> Nx will automatically detect the task name and add the dependency with the configuration in this package, so, when any file here is modified, the linter will be also executed in the other packages when corresponding.

You should also add the Nx implicit dependency to the `project.json` file:

```json
{
  "implicitDependencies": [
    "eslint-config"
  ]
}
```

Then you should add the following file to the root of your package, and name it `eslint.config.js`:

```js
import eslintConfig from "../eslint-config/index.js";
export default eslintConfig;
```

> [!WARNING]
> Use the appropriated file extension depending on the type of your package. This package is an `esm` module, so, you should use `.mjs` extension if your package is a `commonjs` module, or `.js` if it is a `esm` module.

## Usage

Once you have installed the configuration, you can run the linter in your package by using the following command:

```sh
pnpm nx lint your-package-name
```

It will be also automatically executed before committing any change due to the repository pre-commit hooks.

## Extending the configuration

It is possible to extend the configuration. This module exports separated values for each type of configuration, so you can import them and merge with your own configuration. One common case is to configure TypeScript aliases for your own package.

> [!TIP]
> Check the [`./index.js` file](./index.js) to see the exported configurations.

```js
import path from "path";

import {
  defaultConfigWithoutTypescript,
  typescriptConfig,
  jestConfig,
} from "../eslint-config/index.js";

function packagePath() {
  return path.resolve.apply(null, [import.meta.dirname, ...arguments]);
}

export default [
  ...defaultConfigWithoutTypescript,
  {
    ...typescriptConfig,
    settings: {
      ...typescriptConfig.settings,
      "import/resolver": {
        ...typescriptConfig.settings["import/resolver"],
        alias: {
          map: [["@src", packagePath("src")]],
          extensions: [".ts", ".js", ".jsx", ".json"],
        },
      },
    },
  },
  jestConfig,
];
```

## Contributing

Please read the repository [Contributing Guidelines](../../.github/CONTRIBUTING.md) for details on how to contribute to this project before submitting a pull request.

## License

This package is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.
