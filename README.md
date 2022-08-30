[![Build status][build-image]][build-url] [![Coverage Status][coveralls-image]][coveralls-url] [![Quality Gate][quality-gate-image]][quality-gate-url]

[![Renovate](https://img.shields.io/badge/renovate-enabled-brightgreen.svg)](https://renovatebot.com) [![Last commit][last-commit-image]][last-commit-url] [![Last release][release-image]][release-url]

[![NPM downloads][npm-downloads-image]][npm-downloads-url] [![License][license-image]][license-url]

# eslint-plugin-boundaries

In words of Robert C. Martin, _"Software architecture is the art of drawing lines that I call boundaries. Those boundaries separate software elements from one another, and restrict those on one side from knowing about those on the other."_ _([\*acknowledgements](#acknowledgements))_

__This plugin ensures that your architecture boundaries are respected by the elements in your project__ checking the folders and files structure and the `import` statements (_Read the [main rules overview chapter](#main-rules-overview) for better comprehension._). __It is not a replacement for [eslint-plugin-import](https://www.npmjs.com/package/eslint-plugin-import), on the contrary, the combination of both plugins is recommended.__

## Table of Contents

<details>
<summary><strong>Details</strong></summary>

- [Installation](#installation)
- [Overview](#overview)
- [Main rules overview](#main-rules-overview)
  * [Allowed element types](#allowed-element-types)
  * [Allowed external modules](#allowed-external-modules)
  * [Private elements](#private-elements)
  * [Entry point](#entry-point)
- [Rules](#rules)
- [Configuration](#configuration)
  * [Global settings](#global-settings)
  * [Predefined configurations](#predefined-configurations)
  * [Rules configuration](#rules-configuration)
    * [Main format of rules options](#main-format-of-rules-options)
    * [Elements matchers](#elements-matchers)
    * [Error messages](#error-messages)
    * [Advanced example](#advanced-example)
- [Resolvers](#resolvers)
- [Usage with TypeScript](#usage-with-typescript)
- [Debug mode](#debug-mode)
- [Acknowledgements](#acknowledgements)
- [Contributing](#contributing)
- [License](#license)

</details>

## Installation

This module is distributed via npm which is bundled with node and should be installed as one of your project's devDependencies:

```bash
npm install --save-dev eslint eslint-plugin-boundaries
```

`eslint-plugin-boundaries` does not install `eslint` for you. You must install it yourself.

Activate the plugin and one of the canned configs in your `.eslintrc.(yml|json|js)`:

```json
{
  "plugins": ["boundaries"],
  "extends": ["plugin:boundaries/recommended"]
}
```

## Migrating from v1.x

New v2.0.0 release has introduced many breaking changes. If you were using v1.x, you should [read the "how to migrate from v1 to v2" guide](./docs/guides/how-to-migrate-from-v1-to-v2.md).

## Overview

All of the plugin rules need to be able to identify the elements in the project, so, first of all you have to define your project elements using the `boundaries/elements` setting.

The plugin will use the provided patterns to identify each file or local `import` statement as one of the element types.

```json
{
  "settings": {
    "boundaries/elements": [
      {
        "type": "helpers",
        "pattern": "helpers/*"
      },
      {
        "type": "components",
        "pattern": "components/*"
      },
      {
        "type": "modules",
        "pattern": "modules/*"
      }
    ]
  }
}
```

This is only a basic example of configuration. The plugin can be configured to identify elements being a file, or elements being a folder containing files. It also supports capturing path fragments to be used afterwards on each rule options, etc. __Read the [configuration chapter](#configuration) for further info, as configuring it properly is crucial__ to take advantage of all of the plugin features.

Once your project elements are defined, you can use them to configure each rule using its own options. For example, you could define which elements can be dependencies of other ones configuring the `element-types` rule as in:

```json
{
  "rules": {
    "boundaries/element-types": [2, {
      "default": "disallow",
      "rules": [
        {
          "from": "components",
          "allow": ["helpers", "components"]
        },
        {
          "from": "modules",
          "allow": ["helpers", "components", "modules"]
        }
      ]
    }]
  }
}
```

> The plugin won't apply rules to a file or `import` when it does not recognize its element type, but you can force all files in your project to belong to an element type enabling the [boundaries/no-unknown-files](docs/rules/no-unknown-files.md) rule.

## Main rules overview

### Allowed element types

This rule ensures that dependencies between your project element types are allowed.

Examples of usage:

* Define types in your project as "models", "views" and "controllers". Then ensure that "views" and "models" can be imported only by "controllers", and "controllers" will never be used by "views" or "models".
* Define types in your project as "components", "views", "layouts", "pages", "helpers". Then ensure that "components" can only import "helpers", that "views" can only import "components" or "helpers", that "layouts" can only import "views", "components" or "helpers", and that "pages" can import any other element type.

Read the [docs of the `boundaries/element-types` rule](docs/rules/element-types.md) for further info.

### Allowed external modules

External dependencies used by each type of element in your project can be checked using this rule. For example, you can define that "helpers" can't import `react`, or "components" can't import  `react-router-dom`, or modules can't import `{ Link } from react-router-dom`.

Read the [docs of the `boundaries/external` rule](docs/rules/external.md) for further info.

### Private elements

This rule ensures that elements can't require other element's children. So, when an element B is children of A, B becomes a "private" element of A, and only A can use it.

Read the [docs of the `boundaries/no-private` rule](docs/rules/no-private.md) for further info.

### Entry point

This rule ensures that elements can't import another file from other element than the defined entry point for that type (`index.js` by default)

Read the [docs of the `boundaries/entry-point` rule](docs/rules/entry-point.md) for further info.

## Rules

* __[boundaries/element-types](docs/rules/element-types.md)__: Check allowed dependencies between element types
* __[boundaries/external](docs/rules/external.md)__: Check allowed external dependencies by element type
* __[boundaries/entry-point](docs/rules/entry-point.md)__: Check entry point used for each element type
* [boundaries/no-private](docs/rules/no-private.md): Prevent importing private elements of another element
* [boundaries/no-unknown](docs/rules/no-unknown.md): Prevent importing unknown elements from the known ones
* [boundaries/no-ignored](docs/rules/no-ignored.md): Prevent importing ignored files from recognized elements
* [boundaries/no-unknown-files](docs/rules/no-unknown-files.md): Prevent creating files not recognized as any of the element types

## Configuration

### Global settings

#### __`boundaries/element-types`__

Define patterns to recognize each file in the project as one of this element types. All rules need this setting to be configured properly to work. The plugin tries to identify each file being analyzed or `import` statement in rules as one of the defined element types. The assigned element type will be that with the first matching pattern, in the same order that elements are defined in the array, so you __should sort them from the most accurate patterns to the less ones__. Properties of each `element`:

* __`type`__: `<string>` Element type to be assigned to files or imports matching the `pattern`. This type will be used afterwards in the rules configuration.
* __`pattern`__: `<string>|<array>` [`micromatch` pattern](https://github.com/micromatch/micromatch). __By default the plugin will try to match this pattern progressively starting from the right side of each file path.__ This means that you don't have to define patterns matching from the base project path, but only the last part of the path that you want to be matched. This is made because the plugin supports elements being children of other elements, and otherwise it could wrongly recognize children elements as a part of the parent one. <br/>For example, given a path `src/helpers/awesome-helper/index.js`, it will try to assign the element to a pattern matching `index.js`, then `awesome-helper/index.js`, then `helpers/awesome-helper/index.js`, etc. Once a pattern matches, it assign the correspondent element type, and continues searching for parents elements with the same logic until the full path has been analyzed. __This behavior can be disabled setting the `mode` option to `full`__, then the provided pattern will try to match the full path.
* __`basePattern`__: `<string>` Optional [`micromatch` pattern](https://github.com/micromatch/micromatch). If provided, the left side of the element path must match also with this pattern from the root of the project (like if pattern is `[basePattern]/**/[pattern]`). This option is useful when using the option `mode` with `file` or `folder` values, but capturing fragments from the rest of the full path is also needed (see `baseCapture` option below).
* __`mode`__: `<string> file|folder|full` Optional.
  * When it is set to `folder` (default value), the element type will be assigned to the first file's parent folder matching the pattern. In the practice, it is like adding `**/*` to the given pattern, but the plugin makes it by itself because it needs to know exactly which parent folder has to be considered the element.
  * If it is set to `file`, the given pattern will not be modified, but the plugin will still try to match the last part of the path. So, a pattern like `*.model.js` would match with paths `src/foo.model.js`, `src/modules/foo/foo.model.js`, `src/modules/foo/models/foo.model.js`, etc.
  * If it is set to `full`, the given pattern will only match with patterns matching the full path. This means that you will have to provide patterns matching from the base project path. So, in order to match `src/modules/foo/foo.model.js` you'll have to provide patterns like `**/*.model.js`, `**/*/*.model.js`, `src/*/*/*.model.js`, etc. _(the chosen pattern will depend on what do you want to capture from the path)_
* __`capture`__: `<array>` Optional. This is a very powerful feature of the plugin. It allows to capture values of some fragments in the matching path to use them later in the rules configuration. It uses [`micromatch` capture feature](https://github.com/micromatch/micromatch#capture) under the hood, and stores each value in an object with the given `capture` key being in the same index of the captured array.<br/>For example, given `pattern: "helpers/*/*.js"`, `capture: ["category", "elementName"]`, and a path `helpers/data/parsers.js`, it will result in `{ category: "data", elementName: "parsers" }`.
* __`baseCapture`__: `<array>` Optional. [`micromatch` pattern](https://github.com/micromatch/micromatch). It allows capturing values from `basePattern` as `capture` does with `pattern`. All keys from `capture` and `baseCapture` can be used in the rules configuration.

```json
{
  "settings": {
    "boundaries/elements": [
      {
        "type": "helpers",
        "pattern": "helpers/*/*.js",
        "mode": "file",
        "capture": ["category", "elementName"]
      },
      {
        "type": "components",
        "pattern": "components/*/*",
        "capture": ["family", "elementName"]
      },
      {
        "type": "modules",
        "pattern": "module/*",
        "capture": ["elementName"]
      }
    ]
  }
}
```

> Tip: You can enable the [debug mode](#debug-mode) when configuring the plugin, and you will get information about the type assigned to each file in the project, as well as captured properties and values.

#### __`boundaries/include`__

Files or dependencies not matching these [`micromatch` patterns](https://github.com/micromatch/micromatch) will be ignored by the plugin. If this option is not provided, all files will be included.

```json
{
  "settings": {
    "boundaries/include": ["src/**/*.js"]
  }
}
```

#### __`boundaries/ignore`__

Files or dependencies matching these [`micromatch` patterns](https://github.com/micromatch/micromatch) will be ignored by the plugin.

```json
{
  "settings": {
    "boundaries/ignore": ["**/*.spec.js", "src/legacy-code/**/*"]
  }
}
```

> Note: The `boundaries/include` option has preference over `boundaries/ignore`. If you define `boundaries/include`, use `boundaries/ignore` to ignore subsets of included files.

### Predefined configurations

This plugin is distributed with two different predefined configurations: "recommended" and "strict".


#### Recommended

We recommend to use this setting if you are applying the plugin to an already existing project. Rules `boundaries/no-unknown`, `boundaries/no-unknown-files` and `boundaries/no-ignored` are disabled, so it allows to have parts of the project non-compliant with your element types, allowing to refactor the code progressively.

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

### Rules configuration

Some rules require extra configuration, and it has to be defined in each specific `rule` property of the `.eslintrc..(yml|json|js)` file. For example, allowed element types relationships has to be provided as an option to the [`boundaries/element-types` rule](docs/rules/element-types.md). Rules requiring extra configuration will print a warning in case they are enabled without the needed options.

#### Main format of rules options

The docs of each rule contains an specification of their own options, but __the main rules share the format in which the options have to be defined__. The format described here is valid for options of [`element-types`](docs/rules/element-types.md), [`external`](docs/rules/external.md) and [`entry-point`](docs/rules/entry-point.md) rules.

Options set an `allow` or `disallow` value by default, and provide an array of rules. Each matching rule will override the default value and the value returned by previous matching rules. So, the final result of the options, once processed for each case, will be `allow` or `disallow`, and this value will be applied by the plugin rule in the correspondant way, making it to produce an eslint error or not.

```jsonc
{
  "rules": {
    "boundaries/element-types": [2, {
      // Allow or disallow any dependency by default
      "default": "allow",
      // Define a custom message for this rule
      "message": "${file.type} is not allowed to import ${dependency.type}",
      "rules": [
        {
          // In this type of files...
          "from": ["helpers"],
          // ...disallow importing this type of elements
          "disallow": ["modules", "components"],
          // ...and return this custom error message
          "message": "Helpers must not import other thing than helpers"
        },
        {
          "from": ["components"],
          "disallow": ["modules"]
          // As this rule has not "message" property, it will use the message defined at first level
        }
      ]
    }]
  }
}
```

Remember that:

* All rules are executed, and the resultant value will be the one returned by the last matching one.
* If one rule contains both `allow` and `disallow` properties, the `disallow` one has priority. It will not try to match the `allow` one if `disallow` matches. The result for that rule will be `disallow` in that case.

##### Rules options properties

* __`from/target`__: `<element matchers>` Depending of the rule to which the options are for, the rule will be applied only if the file being analyzed matches with this element matcher (`from`), or the dependency being imported matches with this element matcher (`target`).
* __`disallow/allow`__: `<value matchers>` If the plugin rule target matches with this, then the result of the rule will be "disallow/allow". Each rule will require a type of value here depending of what it is checking. In the case of the `element-types` rule, for example, another `<element matcher>` has to be provided in order to check the type of the local dependency.
* __`message`__: `<string>` Optional. If the rule results in an error, the plugin will return this message instead of the default one. Read [error messages](#error-messages) for further info.

> Tip: Properties `from/target` and `disallow/allow` can receive a single matcher, or an array of matchers.

##### Elements matchers

Elements matchers used in the rules options can have the next formats:

* __`<string>`__: Will return `true` when the element type matches with this [`micromatch` pattern](https://github.com/micromatch/micromatch).
* __`[<string>, <capturedValuesObject>]`__: Will return `true` whe when the element type matches with the first element in the array, and all of the captured values also match. <br/>The `<capturedValuesObject>` has to be an object containing `capture` keys from the [`boundaries/element-types` setting](#boundarieselement-types) of the element as keys, and [`micromatch` patterns](https://github.com/micromatch/micromatch) as values.<br/>For example, for an element of type "helpers" with settings as `{ type: "helpers", pattern": "helpers/*/*.js", "capture": ["category", "elementName"]}`, you could write element matchers as:
  * `["helpers", { category: "data", elementName: "parsers"}]`: Will only match with helpers with category "data" and elementName "parsers" (`helpers/data/parsers.js`).
  * `["helpers", { category: "data" }]`: Will match with all helpers with category "data" (`helpers/data/*.js`)

##### Error messages

The plugin returns a different default message for each rule, check the documentation of each one for further info. But some rules support defining custom messages in their configuration, as seen in ["Main format of rules options"](#main-format-of-rules-options).

When defining custom messages, it is possible to provide information about the current file or dependency. Use `${file.PROPERTY}` or `${dependency.PROPERTY}`, and it will be replaced by the correspondent captured value from the file or the dependency:

```jsonc
{
  "message": "${file.type}s of category ${file.category} are not allowed to import ${dependency.category}s"
  // If the error was produced by a file with type "component" and captured value "category" being "atom", trying to import a dependency with category "molecule", the message would be:
  // "components of category atom are not allowed to import molecules"
}
```

Available properties in error templates both from `file` or `dependency` are:

* `type`: Element's type.
* `internalPath`: File path being analyzed or imported. Relative to the element's root path.
* `source`: Available only for `dependency`. The source of the `import` statement as it is in the code.
* `parent`: If the element is child of another element, it is also available in this property, which contains correspondent `type`, `internalPath` and captured properties as well.
* ...All captured properties are also available

> Tip: Read ["Global settings"](#global-settings) for further info about how to capture values from elements.

Some rules also provide extra information about the reported error. For example, `no-external` rules provides information about detected forbidden specifiers. This information is available using `${report.PROPERTY}`. Check each rule's documentation to know which report properties it provides:

```jsonc
{
  "message": "Do not import ${report.specifiers} from ${dependency.source} in helpers"
}
```

##### Advanced example of a rule configuration

Just to illustrate the high level of customization that the plugin supports, here is an example of advanced options for the `boundaries/element-types` rule based on the previous global `elements` settings example:

```jsonc
{
  "rules": {
    "boundaries/element-types": [2, {
      // disallow importing any element by default
      "default": "disallow",
      "rules": [
        {
          // allow importing helpers files from helpers files
          "from": ["helpers"],
          "allow": ["helpers"]
        },
        {
          // when file is inside an element of type "components"
          "from": ["components"],
          "allow": [
            // allow importing components of the same family
            ["components", { "family": "${family}" }],
            // allow importing helpers with captured category "data"
            ["helpers", { "category": "data" }],
          ]
        },
        {
          // when component has captured family "molecule"
          "from": [["components", { "family": "molecule" }]],
          "allow": [
            // allow importing components with captured family "atom"
            ["components", { "family": "atom" }],
          ],
        },
        {
          // when component has captured family "atom"
          "from": [["components", { "family": "atom" }]],
          "disallow": [
            // disallow importing helpers with captured category "data"
            ["helpers", { "category": "data" }]
          ],
          // Custom message only for this specific error
          "message": "Atom components can't import data helpers"
        },
        {
          // when file is inside a module
          "from": ["modules"],
          "allow": [
            // allow importing any type of component or helper
            "helpers",
            "components"
          ]
        },
        {
          // when module name starts by "page-"
          "from": [["modules", { "elementName": "page-*" }]],
          "disallow": [
            // disallow importing any type of component not being of family layout
            ["components", { "family": "!layout" }]
          ],
          // Custom message only for this specific error
          "message": "Modules with name starting by 'page-' can't import not layout components. You tried to import a component of family ${dependency.family} from a module with name ${file.elementName}"
        }
      ]
    }]
  }
}

```

## Resolvers

_"With the advent of module bundlers and the current state of modules and module syntax specs, it's not always obvious where import x from 'module' should look to find the file behind module."_ ([\**Quote from the `eslint-plugin-import` docs](#acknowledgements))

This plugin uses `eslint-module-utils/resolve` module under the hood, which is a part of the `eslint-plugin-import` plugin. So __the `import/resolver` setting can be used to use custom resolvers for this plugin too__.

[Read the `resolvers` chapter of the `eslint-plugin-import` plugin for further info](https://github.com/benmosher/eslint-plugin-import#resolvers).

```json
{
  "settings": {
    "import/resolver": {
      "eslint-import-resolver-node": {},
      "some-other-custom-resolver": { "someConfig": "value" }
    }
  }
}
```

## Usage with TypeScript

This plugin can be used also in [TypeScript](https://www.typescriptlang.org/) projects using `@typescript-eslint/eslint-plugin`. Follow next steps to configure it:

Install dependencies:

```bash
npm i --save-dev @typescript-eslint/eslint-plugin @typescript-eslint/parser eslint-import-resolver-typescript
```

Configure [`@typescript-eslint/parser`](https://github.com/typescript-eslint/typescript-eslint) as parser, load the [`@typescript-eslint`](https://github.com/typescript-eslint/typescript-eslint) plugin, and setup the [`eslint-import-resolver-typescript`](https://github.com/alexgorbatchev/eslint-import-resolver-typescript) resolver in the `.eslintrc.js` config file:

```js
module.exports = {
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint", "boundaries"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:boundaries/recommended",
  ],
  settings: {
    "import/resolver": {
      typescript: {
        alwaysTryTypes: true,
      },
    },
  },
};
```

> Note that `eslint-import-resolver-typescript` detects even custom paths defined in the `tsconfig.json` file, so its usage is also compatible with this plugin.

In case you face any issue configuring it, you can also [use this repository as a guide](https://github.com/javierbrea/epb-ts-example). It contains a fully working and tested example.

## Debug mode

In order to help during the configuration process, the plugin can trace information about the files and imports being analyzed. The information includes the file path, the assigned element type, the captured values, etc. So, it can help you to check that your `elements` setting works as expected. You can enable it using the `ESLINT_PLUGIN_BOUNDARIES_DEBUG` environment variable.

```bash
ESLINT_PLUGIN_BOUNDARIES_DEBUG=1 npm run lint
```

## Acknowledgements

\* Quote from Robert C. Martin's book ["Clean Architecture: A Craftsman's Guide to Software Structure and Design"](https://www.oreilly.com/library/view/clean-architecture-a/9780134494272/).

\** This plugin uses internally the `eslint-module-utils/resolve` module, which is a part of the [`eslint-plugin-import` plugin](https://github.com/benmosher/eslint-plugin-import). Thanks to the maintainers of that plugin for their awesome work.

## Contributing

Contributors are welcome.
Please read the [contributing guidelines](.github/CONTRIBUTING.md) and [code of conduct](.github/CODE_OF_CONDUCT.md).

## License

MIT, see [LICENSE](./LICENSE) for details.

[coveralls-image]: https://coveralls.io/repos/github/javierbrea/eslint-plugin-boundaries/badge.svg
[coveralls-url]: https://coveralls.io/github/javierbrea/eslint-plugin-boundaries
[build-image]: https://github.com/javierbrea/eslint-plugin-boundaries/workflows/build/badge.svg?branch=master
[build-url]: https://github.com/javierbrea/eslint-plugin-boundaries/actions?query=workflow%3Abuild+branch%3Amaster
[last-commit-image]: https://img.shields.io/github/last-commit/javierbrea/eslint-plugin-boundaries.svg
[last-commit-url]: https://github.com/javierbrea/eslint-plugin-boundaries/commits
[license-image]: https://img.shields.io/npm/l/eslint-plugin-boundaries.svg
[license-url]: https://github.com/javierbrea/eslint-plugin-boundaries/blob/master/LICENSE
[npm-downloads-image]: https://img.shields.io/npm/dm/eslint-plugin-boundaries.svg
[npm-downloads-url]: https://www.npmjs.com/package/eslint-plugin-boundaries
[quality-gate-image]: https://sonarcloud.io/api/project_badges/measure?project=javierbrea_eslint-plugin-boundaries&metric=alert_status
[quality-gate-url]: https://sonarcloud.io/dashboard?id=javierbrea_eslint-plugin-boundaries
[release-image]: https://img.shields.io/github/release-date/javierbrea/eslint-plugin-boundaries.svg
[release-url]: https://github.com/javierbrea/eslint-plugin-boundaries/releases
