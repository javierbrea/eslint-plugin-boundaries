[![License][license-image]][license-url] [![Build status][build-image]][build-url] [![Coverage Status][coveralls-image]][coveralls-url] [![Quality Gate][quality-gate-image]][quality-gate-url]

[![NPM downloads][npm-downloads-image]][npm-downloads-url] [![Last commit][last-commit-image]][last-commit-url] [![Last release][release-image]][release-url]

# @boundaries/config

> Normalization and validation of the settings and rule options of `@boundaries/eslint-plugin`, without ESLint.

This package reads what a user writes in the `boundaries/*` settings and in the rule options of [`@boundaries/eslint-plugin`](https://www.npmjs.com/package/@boundaries/eslint-plugin): it applies their defaults, converts their legacy forms, leaves out the invalid entries and returns every problem as a diagnostic, with the path of the entry that causes it. It does not depend on ESLint or Node.js, so it also runs in browsers.

The ESLint plugin uses it and prints the diagnostics as warnings. A tool without ESLint, such as an editor or a playground, can use it to show the same problems in its own interface.

## Installation

```bash
npm install @boundaries/config
```

## Usage

```ts
import { normalizeConfig } from "@boundaries/config";

const { value, diagnostics } = normalizeConfig({
  settings: {
    "boundaries/elements": [
      { type: "helper", pattern: "helpers/*" },
      { pattern: "components/*" },
    ],
  },
  rules: {
    "boundaries/dependencies": [
      2,
      {
        default: "disallow",
        policies: [
          {
            from: { element: { type: "component" } },
            allow: { to: { element: { type: "helper" } } },
          },
        ],
      },
    ],
  },
});

// value.settings.elementDescriptors: the valid element descriptors
// value.rules.dependencies.options.policies: the policies with their selectors normalized
// diagnostics:
// [
//   {
//     level: "warning",
//     title: "Some element descriptors are invalid and will be ignored.",
//     detail: 'Invalid descriptors:\n[{"match":"folder","pattern":"components/*"}].\nMore info: https://www.jsboundaries.dev/docs/settings/',
//     paths: [["settings", "boundaries/elements", 1]],
//   },
// ]
```

## API

| Function | What it does |
| --- | --- |
| `normalizeConfig(config, { pluginName?, rootPath? })` | Normalizes the boundaries part of an ESLint config, `{ settings, rules }`. It validates the rule entries of the plugin as ESLint validates them, and then as the plugin does. Keys of other plugins are ignored. |
| `normalizeSettings(settings, { rootPath? })` | Normalizes the `boundaries/*` settings. `rootPath` is the root path of the project, already resolved by the host. |
| `validateRuleOptions(ruleName, options, { legacyWarnings, schema? })` | Validates the options of a rule entry against the rule schema and, for the rules with policies, checks their selectors and deprecated syntax. Pass `schema: false` when ESLint already validates the schema. |
| `normalizeDependenciesRuleOptions(options)` | Applies the defaults of the `dependencies` rule options and normalizes the selectors of their policies. It assumes options that passed the rule schema. |
| `getRuleOptionsSchema(ruleName)` | Returns the JSON schema of the options of a rule, as the ESLint plugin declares it in the rule `meta.schema`. |

`normalizeConfig` and `normalizeSettings` return `{ value, diagnostics }`: the normalized value is always set, and the diagnostics come in the order the ESLint plugin prints them, each one once. A diagnostic has:

- `level`: `"error"` when the input is rejected, as ESLint rejects options that fail the rule schema; `"warning"` when it is ignored or has no effect; `"deprecation"` when it uses a legacy syntax that still works.
- `title` and `detail`: the texts that the ESLint plugin prints.
- `paths`: the object keys and array indexes of each affected entry, from the root of the input. An empty path means the whole input.

The package also exports the types and constants of the settings and rule options, the type guards that the ESLint plugin exports, and the builders of the docs links.

## License

MIT, see [LICENSE](./LICENSE).

[coveralls-image]: https://coveralls.io/repos/github/javierbrea/eslint-plugin-boundaries/badge.svg
[coveralls-url]: https://coveralls.io/github/javierbrea/eslint-plugin-boundaries
[build-image]: https://github.com/javierbrea/eslint-plugin-boundaries/actions/workflows/build.yml/badge.svg
[build-url]: https://github.com/javierbrea/eslint-plugin-boundaries/actions?query=workflow%3Abuild+branch%3Amaster
[last-commit-image]: https://img.shields.io/github/last-commit/javierbrea/eslint-plugin-boundaries.svg
[last-commit-url]: https://github.com/javierbrea/eslint-plugin-boundaries/commits
[license-image]: https://img.shields.io/npm/l/eslint-plugin-boundaries.svg
[license-url]: https://github.com/javierbrea/eslint-plugin-boundaries/blob/master/LICENSE
[npm-downloads-image]: https://img.shields.io/npm/dm/@boundaries/config.svg
[npm-downloads-url]: https://www.npmjs.com/package/@boundaries/config
[quality-gate-image]: https://sonarcloud.io/api/project_badges/measure?project=javierbrea_eslint-plugin-boundaries_config&metric=alert_status
[quality-gate-url]: https://sonarcloud.io/dashboard?id=javierbrea_eslint-plugin-boundaries_config
[release-image]: https://img.shields.io/github/release-date/javierbrea/eslint-plugin-boundaries.svg
[release-url]: https://github.com/javierbrea/eslint-plugin-boundaries/releases
