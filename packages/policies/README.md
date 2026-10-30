[![License][license-image]][license-url] [![Build status][build-image]][build-url] [![Coverage Status][coveralls-image]][coveralls-url] [![Quality Gate][quality-gate-image]][quality-gate-url] [![Mutation testing badge](https://img.shields.io/endpoint?style=flat&url=https%3A%2F%2Fbadge-api.stryker-mutator.io%2Fgithub.com%2Fjavierbrea%2Feslint-plugin-boundaries%2Fmaster%3Fmodule%3Dpolicies)](https://dashboard.stryker-mutator.io/reports/github.com/javierbrea/eslint-plugin-boundaries/master?module=policies)

[![NPM downloads][npm-downloads-image]][npm-downloads-url] [![Last commit][last-commit-image]][last-commit-url] [![Last release][release-image]][release-url]

# @boundaries/policies

> Evaluation of the dependency policies of `@boundaries/eslint-plugin` and their messages, without ESLint.

## Table of Contents

- [Introduction](#introduction)
- [Features](#features)
- [Installation](#installation)
  - [Browser Support](#browser-support)
- [Quick Start](#quick-start)
- [Core Concepts](#core-concepts)
  - [Skipped Dependencies](#skipped-dependencies)
  - [Evaluation of the Policies](#evaluation-of-the-policies)
  - [Memoization](#memoization)
- [API Reference](#api-reference)
- [Type Reference](#type-reference)
- [Contributing](#contributing)
- [License](#license)

## Introduction

`@boundaries/policies` decides dependencies exactly as the `dependencies` rule of [`@boundaries/eslint-plugin`](https://www.npmjs.com/package/@boundaries/eslint-plugin) does: it describes files and dependencies from their paths, tells whether the rule checks a dependency, evaluates the policies and builds the message that the rule reports.

It takes the settings and the rule options as [`@boundaries/config`](https://www.npmjs.com/package/@boundaries/config) normalizes them. The ESLint plugin uses it after reading the AST and resolving the imported modules; a tool without ESLint, such as a playground or an MCP server, can use it to explain the same verdicts.

>[!NOTE]
> This package does not run ESLint, read files, resolve modules or print anything. The host passes the paths of the files, and the resolved path of each dependency when it has one; the problems found while evaluating are returned as diagnostics.

## Features

- **File and dependency descriptions** from paths, through the matcher of [`@boundaries/elements`](https://www.npmjs.com/package/@boundaries/elements)
- **The checks of the `dependencies` rule** that decide whether a dependency is evaluated, with the reason when it is not
- **Policy evaluation** with the rule's semantics: the last policy that matches decides, `disallow` takes precedence over `allow` within a policy, and the `default` option decides when no policy matches
- **The deciding policy and match**, for allowed dependencies too
- **The messages the plugin reports**, default and custom, with Handlebars and legacy `${...}` templates
- **Runs in Node.js and in browsers**, without ESLint

## Installation

Install the package, with `@boundaries/config` to normalize the settings and rule options:

```bash
npm install @boundaries/policies @boundaries/config
```

### Browser Support

The package does not depend on ESLint or Node.js, so it also runs in browsers. Bundlers that build for browsers, such as webpack, Vite or esbuild, select its browser build through the `browser` condition of its `exports` field, and that build needs no polyfills of Node.js modules or globals like `process`.

## Quick Start

Normalize a config, then describe and evaluate a dependency:

```ts
import { normalizeConfig } from "@boundaries/config";
import { describeDependency, evaluateDependency } from "@boundaries/policies";

const { settings, rules } = normalizeConfig(
  {
    settings: {
      "boundaries/elements": [
        { type: "helper", pattern: "helpers/*" },
        { type: "component", pattern: "components/*/*" },
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
  },
  { rootPath: "/project" }
).value;

const dependency = describeDependency(settings, {
  from: "/project/src/helpers/format/index.js",
  to: "/project/src/components/atoms/Price/index.js",
  source: "../../components/atoms/Price",
  kind: "value",
  nodeKind: "import",
});

const evaluation = evaluateDependency(
  settings,
  rules.dependencies!.options,
  dependency
);

// {
//   checked: true,
//   allowed: false,
//   policyIndex: null,
//   match: null,
//   message: 'There is no policy allowing dependencies from elements of type "helper" to elements of type "component"',
//   diagnostics: [],
// }
```

## Core Concepts

### Skipped Dependencies

The `dependencies` rule does not evaluate every dependency. `getDependencySkipReason` returns the first reason that applies, in this order, or `null`:

| Reason | When |
| --- | --- |
| `from-ignored` | The importing file is ignored |
| `from-unknown` | The importing file matches no element and no file descriptor |
| `to-ignored` | The target is a local file that is ignored |
| `not-local` | The target is external or core, and `checkAllOrigins` is not `true` |
| `unknown-local` | The target is local and matches no element and no file descriptor, and `checkUnknownLocals` is not `true` |
| `internal` | Both files belong to the same element, and `checkInternals` is not `true` |

It reads only the `check*` options, so it takes the options as the user wrote them or normalized. `evaluateDependency` returns `{ checked: false, reason }` when there is a reason.

### Evaluation of the Policies

`evaluatePolicies` merges the `from`, `to` and `dependency` selectors of each policy with each entry of its `allow` and `disallow`, and matches the dependency against them:

- The last policy that matches decides.
- Within a policy, `allow` is not evaluated when `disallow` matched.
- When no policy matches, the `default` option decides, and `policyIndex` and `match` are `null`.

When the dependency is not allowed, `message` is the message the plugin reports: the custom `message` of the deciding policy, or of the options, rendered with its template, or the default message. The exception is a custom `message` with invalid Handlebars syntax: rendering it throws, as it does in the plugin.

### Memoization

The matcher is memoized by the identity of the normalized settings, and the merged selectors of each policy by the identity of the normalized policy, in `WeakMap`s. Pass the same normalized objects while the config does not change, and new ones when it does; the old entries are collected with them. Results are shared with the memoization of `@boundaries/elements`, so they must not be mutated.

## API Reference

| Function | Parameters | Returns |
| --- | --- | --- |
| `getMatcher` | `settings: SettingsNormalized` | The `Matcher` of `@boundaries/elements` for the settings |
| `describeEntity` | `settings: SettingsNormalized`, `filePath: string` | The `EntityDescription` of the file: element, file categories and module origin |
| `describeDependency` | `settings: SettingsNormalized`, `dependency: DependencyDescriptorOptions` | The `DependencyDescription` of the dependency |
| `getDependencySkipReason` | `options: DependencySkipOptions \| undefined`, `dependency: DependencyDescription` | The first `DependencySkipReason` that applies, or `null` |
| `evaluatePolicies` | `settings: SettingsNormalized`, `options: DependenciesRuleOptionsNormalized`, `dependency: DependencyDescription` | A `PolicyEvaluation` |
| `evaluateDependency` | `settings: SettingsNormalized`, `options: DependenciesRuleOptionsNormalized`, `dependency: DependencyDescription` | A `DependencyEvaluation` |
| `customErrorMessage` | `template: string`, `dependency: DependencyDescription`, `policyIndex?: number \| null`, `match?: DependencySingleSelectorMatchResult \| null` | The custom message rendered with its template |
| `elementDescriptionMessage` | `element: ElementDescription \| ElementParent`, `properties: string[]`, `options?: { singleElement?: boolean; includeNullValues?: boolean }` | A description of an element, as the plugin's messages write it |

`DependencyDescriptorOptions` is the input of `@boundaries/elements`: `from` and `to` are paths (`to` is the resolved path of the target, absent when nothing resolves it), `source` is the import specifier as written, `kind` is `value` or `type`, `nodeKind` is the name of the dependency node (`import`, `export`, `require`, `dynamic-import`, or the `name` of an additional dependency node) and `specifiers` are the named imports or exports. A host without a resolver passes `to` only for the files it knows: with the default `boundaries/flag-as-external` setting, an unresolved non-relative source is external, or core for a Node.js built-in.

## Type Reference

```ts
type DependencySkipReason =
  | "from-ignored"
  | "from-unknown"
  | "to-ignored"
  | "not-local"
  | "unknown-local"
  | "internal";

type DependencySkipOptions = {
  checkAllOrigins?: boolean;
  checkUnknownLocals?: boolean;
  checkInternals?: boolean;
};

type PolicyEvaluation = {
  /** Index in options.policies of the policy that decided, or null when options.default decided */
  policyIndex: number | null;
  /** What the deciding selector matched, or null when options.default decided */
  match: DependencySingleSelectorMatchResult | null;
  /** Problems found while matching, with paths from the root of the options */
  diagnostics: Diagnostic[];
} & (
  | { allowed: true; message?: undefined }
  /** message: the message the plugin reports */
  | { allowed: false; message: string }
);

type DependencyEvaluation =
  | ({ checked: true } & PolicyEvaluation)
  | { checked: false; reason: DependencySkipReason };
```

The types of the context that custom message templates receive are exported too: `CustomMessageTemplateContext`, `CustomMessageTemplatePolicyContext`, `CustomMessageTemplatePolicySelectorContext` and `CustomMessageTemplatePolicyEntitySelectorContext`. `Diagnostic` and the settings and options types are exported by `@boundaries/config`, and the description and selector types by `@boundaries/elements`.

## Contributing

Contributors are welcome.
Please read the [contributing guidelines](../../.github/CONTRIBUTING.md) and [code of conduct](../../.github/CODE_OF_CONDUCT.md).

## License

MIT, see [LICENSE](./LICENSE) for details.

[coveralls-image]: https://coveralls.io/repos/github/javierbrea/eslint-plugin-boundaries/badge.svg
[coveralls-url]: https://coveralls.io/github/javierbrea/eslint-plugin-boundaries
[build-image]: https://github.com/javierbrea/eslint-plugin-boundaries/actions/workflows/build.yml/badge.svg
[build-url]: https://github.com/javierbrea/eslint-plugin-boundaries/actions?query=workflow%3Abuild+branch%3Amaster
[last-commit-image]: https://img.shields.io/github/last-commit/javierbrea/eslint-plugin-boundaries.svg
[last-commit-url]: https://github.com/javierbrea/eslint-plugin-boundaries/commits
[license-image]: https://img.shields.io/npm/l/eslint-plugin-boundaries.svg
[license-url]: https://github.com/javierbrea/eslint-plugin-boundaries/blob/master/LICENSE
[npm-downloads-image]: https://img.shields.io/npm/dm/@boundaries/policies.svg
[npm-downloads-url]: https://www.npmjs.com/package/@boundaries/policies
[quality-gate-image]: https://sonarcloud.io/api/project_badges/measure?project=javierbrea_eslint-plugin-boundaries_policies&metric=alert_status
[quality-gate-url]: https://sonarcloud.io/dashboard?id=javierbrea_eslint-plugin-boundaries_policies
[release-image]: https://img.shields.io/github/release-date/javierbrea/eslint-plugin-boundaries.svg
[release-url]: https://github.com/javierbrea/eslint-plugin-boundaries/releases
