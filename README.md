[![Build status][travisci-image]][travisci-url] [![Coverage Status][coveralls-image]][coveralls-url] [![Quality Gate][quality-gate-image]][quality-gate-url]

[![NPM dependencies][npm-dependencies-image]][npm-dependencies-url] [![Renovate](https://img.shields.io/badge/renovate-enabled-brightgreen.svg)](https://renovatebot.com) [![Last commit][last-commit-image]][last-commit-url] [![Last release][release-image]][release-url]

[![NPM downloads][npm-downloads-image]][npm-downloads-url] [![License][license-image]][license-url]

# eslint-plugin-boundaries

In words of Robert C. Martin, _"Software architecture is the art of drawing lines that I call boundaries. Those boundaries separate software elements from one another, and restrict those on one side from knowing about those on the other."_ _([\*acknowledgements](#acknowledgements))_

__This plugin ensures that your architecture boundaries are respected by the elements in your project__ checking the folders and files structure and the `import` statements (_Read the [main rules overview chapter](#main-rules-overview) for better comprehension._). __It is not a replacement for [eslint-plugin-import](https://www.npmjs.com/package/eslint-plugin-import), on the contrary, the combination of both plugins is recommended.__

## Installation

This module is distributed via npm which is bundled with node and should be installed as one of your project's devDependencies:

```bash
npm install --save-dev eslint eslint-plugin-boundaries
```

`eslint-plugin-boundaries` does not install ESLint for you. You must install it yourself.

Then, in your `.eslintrc.json` file:

```json
{
  "plugins": ["boundaries"],
  "extends": ["plugin:boundaries/recommended"],
  "settings": {
    "boundaries/types": ["helpers", "models", "views", "controllers"],
  }
}
```

> Each architecture should define its own element types to make the plugin work properly. Otherwise, you will receive a warning and rules won't be applied. Read the [configuration chapter](#configuration) for further info.

## Main rules overview

### Private elements

This rule ensures that elements can't require other element's children. So, when an element B is children of A, B becomes a "private" element of A, and only A can use it. _(Also other descendants of A could use B if "allowUncles" option is enabled in the rule)_.

Read the [docs of the `boundaries/no-private` rule](docs/rules/no-private.md) for further info.

### Entry point

This rule ensures that elements can't import another file from other element than the defined entry point for that type (`index.js` by default)

Read the [docs of the `boundaries/entry-point` rule](docs/rules/entry-point.md) for further info.

### Allowed element types

This rule ensures that dependencies between your project element types are allowed.

Examples of usage:

* Define types in your project as "models", "views" and "controllers". Then ensure that "views" and "models" can be required only by "controllers", and "controllers" will never be used by "views" or "models".
* Define types in your project as "components", "views", "layouts", "pages", "helpers". Then ensure that "components" can only require "helpers", that "views" can only require "components" or "helpers", that "layouts" can only require "views", "components" or "helpers", and that "pages" can require any other element type.

Read the [docs of the `boundaries/allowed-types` rule](docs/rules/allowed-types.md) for further info.

### Forbidden external modules

External dependencies used by each type of element in your project can be checked using this rule. For example, you can define that "helpers" can't import `react`, or "components" can't import  `react-router-dom`.

Read the [docs of the `boundaries/no-external` rule](docs/rules/no-external.md) for further info.

## Requisites

The plugin needs your files and folders to be named and organized in a way that it can recognize the type of an element, and its position in an elements hierarchy _(And this is not necessarily bad, because if the plugin can recognize them, an human developer will do it easily too, and your project will become more organized before even running eslint_ 😉). 

So there are basic rules that have to be followed to make it work:

* __Folder names__: Elements of a certain type must be always allocated under a folder which name should be the type itself (`models/[x]`, `controllers/[y]`, `helpers/[z]`, etc.).
* __Folders hierarchy__: Type folders can also be created inside elements folders. Then these children elements will become "private" ones of the element containing them, and the "private elements" rule will be applied (`controllers/[x]/models/[y]`, `controllers/[x]/views/[z]`, etc.).
* __Unique entry point for each element__: Ideally, each element should expose an unique file as "entry point". By default, the plugin considers this file being the `index.js` one, and will not allow to import any other element file _(using only element folder names in imports statements is the recommended way to work when using this plugin)_, but this behavior can be configured. You can define a different main file pattern or even a different file pattern for each element type. You could also change the configuration to allow importing any element file, but this is strongly not recommended, as it breaks the motivation of the plugin itself.

> The plugin won't apply rules to an element when it does not recognize its type, but you can force all elements in your project to follow these patterns enabling the [boundaries/prefer-recognized-types](docs/rules/prefer-recognized-types.md) rule.

## Rules

* __[boundaries/no-private](docs/rules/no-private.md)__: Enforce elements to not use private elements of another element.
* __[boundaries/entry-point](docs/rules/entry-point.md)__: Prevent other elements importing a file different from the allowed entry point.
* __[boundaries/allowed-types](docs/rules/allowed-types.md)__: Prevent elements of one type to import any other element types not specified in the configuration of this rule.
* __[boundaries/no-external](docs/rules/no-external.md)__: Enforce elements of one type to not use some external dependencies.
* [boundaries/prefer-recognized-types](docs/rules/prefer-recognized-types.md): Prevent creating files not recognized as any of the element types.
* [boundaries/no-import-not-recognized-types](docs/rules/no-import-not-recognized-types.md): Prevent importing not recognized elements from the recognized ones.
* [boundaries/no-import-ignored](docs/rules/no-import-ignored.md): Prevent importing files marked as ignored from the recognized elements.

## Configuration

### Global settings

Each architecture should define its own element types to make the plugin work properly. Otherwise, you will receive a warning and rules won't be applied.

In your `.eslintrc.json` file:

```json
{
  "settings": {
    "boundaries/types": ["helpers", "components", "views", "layouts", "pages", "app"],
    "boundaries/ignore": ["src/**/*.spec.js", "src/**/*.test.js"],
    "boundaries/alias": {
      "components": "src/components",
      "helpers": "src/helpers"
    }
  }
}
```

* __`boundaries/types`__: Folder names containing an specific type of elements. _In the example above, the plugin will recognize all children folders of a folder named helpers" as elements of type "helpers" (`helpers/[x]`, `components/foo/helpers/[y]`, etc.).
* __`boundaries/ignore`__: Files matching these glob expressions will be ignored by the plugin.
* __`boundaries/alias`__: If you are using alias in the project (e.g. [webpack resolve alias](https://webpack.js.org/configuration/resolve/#resolvealias) or [babel-plugin-module-resolver](https://www.npmjs.com/package/babel-plugin-module-resolver)), you'll have to provide those alias also to the plugin configuration.

> NOTE: The plugin uses [globule](https://www.npmjs.com/package/globule) under the hood to do file names and folders matching.

### Rules configuration

Some rules require extra configuration, and it has to be defined in each specific "rule" property of the `.eslintrc.json` file. For example, allowed types relationships has to be provided for the [boundaries/allowed-types rule](docs/rules/allowed-types.md). Rules requiring extra configuration will print a warning in case they are enabled without the needed extra config. Please refer to the docs of each rule for further info.

### Predefined configurations

This plugin is distributed with two different predefined configurations: "recommended" and "strict".


#### Recommended

We recommend to use this setting until you are familiarized with the folders structure required by this plugin and its configuration, or if you are applying the plugin to an already existing project. Rules `boundaries/prefer-recognized-types`, `boundaries/no-import-not-recognized-types` and `boundaries/no-import-ignored` are disabled, so it allows to have parts of the project non-compliant with your element types, allowing refactor the code progressively.

```json
{
  "extends": ["plugin:boundaries/recommended"]
}
```

#### Strict

All rules are enabled, so all elements in the project will be compliant with your architecture boundaries. 😃

```json
{
  "extends": ["plugin:boundaries/strict"]
}
```

### Custom configuration

Settings and specific rules can be configured separately following the [eslint configuration docs](https://eslint.org/docs/user-guide/configuring).

## Acknowledgements

\* Quote from Robert C. Martin's book ["Clean Architecture: A Craftsman's Guide to Software Structure and Design"](https://www.oreilly.com/library/view/clean-architecture-a/9780134494272/). 

## Contributing

Contributors are welcome.
Please read the [contributing guidelines](.github/CONTRIBUTING.md) and [code of conduct](.github/CODE_OF_CONDUCT.md).

## License

MIT, see [LICENSE](./LICENSE) for details.

[coveralls-image]: https://coveralls.io/repos/github/javierbrea/eslint-plugin-boundaries/badge.svg
[coveralls-url]: https://coveralls.io/github/javierbrea/eslint-plugin-boundaries
[travisci-image]: https://travis-ci.com/javierbrea/eslint-plugin-boundaries.svg?branch=master
[travisci-url]: https://travis-ci.com/javierbrea/eslint-plugin-boundaries
[last-commit-image]: https://img.shields.io/github/last-commit/javierbrea/eslint-plugin-boundaries.svg
[last-commit-url]: https://github.com/javierbrea/eslint-plugin-boundaries/commits
[license-image]: https://img.shields.io/npm/l/eslint-plugin-boundaries.svg
[license-url]: https://github.com/javierbrea/eslint-plugin-boundaries/blob/master/LICENSE
[npm-downloads-image]: https://img.shields.io/npm/dm/eslint-plugin-boundaries.svg
[npm-downloads-url]: https://www.npmjs.com/package/eslint-plugin-boundaries
[npm-dependencies-image]: https://img.shields.io/david/javierbrea/eslint-plugin-boundaries.svg
[npm-dependencies-url]: https://david-dm.org/javierbrea/eslint-plugin-boundaries
[quality-gate-image]: https://sonarcloud.io/api/project_badges/measure?project=eslint-plugin-boundaries&metric=alert_status
[quality-gate-url]: https://sonarcloud.io/dashboard?id=eslint-plugin-boundaries
[release-image]: https://img.shields.io/github/release-date/javierbrea/eslint-plugin-boundaries.svg
[release-url]: https://github.com/javierbrea/eslint-plugin-boundaries/releases
