[![License][license-image]][license-url] [![Build status][build-image]][build-url] [![Coverage Status][coveralls-image]][coveralls-url] [![Quality Gate][quality-gate-image]][quality-gate-url]

[![NPM downloads][npm-downloads-image]][npm-downloads-url] [![Last commit][last-commit-image]][last-commit-url] [![Last release][release-image]][release-url]

# @boundaries/config

> Normalization and validation of the settings and rule options of `@boundaries/eslint-plugin`, without ESLint.

## Table of Contents

- [Introduction](#introduction)
- [Features](#features)
- [Installation](#installation)
  - [Browser Support](#browser-support)
- [Quick Start](#quick-start)
- [Core Concepts](#core-concepts)
  - [Diagnostics](#diagnostics)
  - [Diagnostic Paths](#diagnostic-paths)
  - [Normalized Values](#normalized-values)
- [Usage](#usage)
  - [Normalizing a Config](#normalizing-a-config)
  - [Normalizing Settings](#normalizing-settings)
  - [Validating Rule Options](#validating-rule-options)
  - [Normalizing the Dependencies Rule Options](#normalizing-the-dependencies-rule-options)
  - [Getting the Schema of the Rule Options](#getting-the-schema-of-the-rule-options)
- [API Reference](#api-reference)
  - [Functions](#functions)
  - [Type Guards](#type-guards)
  - [Docs Links](#docs-links)
  - [Constants](#constants)
- [Type Reference](#type-reference)
  - [Result Types](#result-types)
  - [Normalized Types](#normalized-types)
  - [Settings and Rule Options Types](#settings-and-rule-options-types)
- [Contributing](#contributing)
- [License](#license)

## Introduction

`@boundaries/config` reads what a user writes in the `boundaries/*` settings and in the rule options of [`@boundaries/eslint-plugin`](https://www.npmjs.com/package/@boundaries/eslint-plugin): it applies their defaults, converts their legacy forms, leaves out the invalid entries and returns every problem as a **diagnostic**, with the path of the entry that causes it.

The ESLint plugin uses it and prints the diagnostics as warnings. A tool without ESLint, such as an editor or a playground, can use it to show the same problems in its own interface.

>[!NOTE]
> This package does not run ESLint, read files or print anything. It receives the config objects as values and returns the normalized values and their problems; showing the problems is up to the host.

## Features

- **Settings normalization** — defaults applied, legacy settings converted and invalid entries left out
- **Rule options validation** against the JSON schema of each rule, as ESLint validates them
- **Policy checks** — unrecognized selector shapes and deprecated syntax in the policies of the rules
- **Diagnostics** with a level, the texts the ESLint plugin prints and the path of each affected entry
- **Pure functions** — results are computed on every call and the input is never mutated
- **Runs in Node.js and in browsers**, without ESLint

## Installation

Install the package via npm:

```bash
npm install @boundaries/config
```

### Browser Support

The package does not depend on ESLint or Node.js, so it also runs in browsers. Bundlers that build for browsers, such as webpack, Vite or esbuild, select its browser build through the `browser` condition of its `exports` field, and that build needs no polyfills of Node.js modules or globals like `process`.

The package never reads environment variables or the working directory: the host resolves the root path of the project and passes it as the `rootPath` option.

## Quick Start

Normalize the boundaries part of an ESLint config and get its problems:

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

// value.settings.elementDescriptors: the valid element descriptors, without the second one
// value.rules.dependencies.severity: "error"
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

## Core Concepts

### Diagnostics

Functions never print or throw because of a problem in their input. They return each problem as a `Diagnostic`:

```ts
{
  level: "warning",
  title: "Please provide a valid value in 'boundaries/cache' setting.",
  detail: "The value should be a boolean. More info: https://www.jsboundaries.dev/docs/settings/",
  paths: [["boundaries/cache"]],
}
```

- **`level`**: how the input is treated.
  - `"error"`: the input is rejected, as ESLint rejects options that fail the rule schema.
  - `"warning"`: the input is ignored or has no effect.
  - `"deprecation"`: the input uses a legacy syntax that still works.
- **`title`** and **`detail`**: the texts that the ESLint plugin prints. `detail` is optional, and it usually ends with a link to the docs.
- **`paths`**: one [path](#diagnostic-paths) per affected entry.

A problem found in several entries is returned once, with the paths of all of them, and the diagnostics come in the order the ESLint plugin prints them.

### Diagnostic Paths

A path is the list of object keys and array indexes that leads to the affected entry, from the root of the input of the function that returns it. An empty path, `[]`, means the whole input.

| Function | Root of the paths | Example |
|---|---|---|
| `normalizeConfig` | The config object | `["rules", "boundaries/dependencies", 1, "default"]` |
| `normalizeSettings` | The settings object | `["boundaries/elements", 1]` |
| `validateRuleOptions` | The options object of the rule entry | `["policies", 0]` |

A host can use the paths to point at the entry in its own interface, such as highlighting it in an editor.

### Normalized Values

`normalizeConfig` and `normalizeSettings` return a [`ConfigResult`](#configresult), `{ value, diagnostics }`. The `value` is always set, whatever the input: missing settings get their defaults, legacy forms are converted and invalid entries are left out, so a host can use it even when there are diagnostics.

## Usage

### Normalizing a Config

`normalizeConfig` takes the boundaries part of an ESLint config object, `{ settings, rules }`. It normalizes the settings with [`normalizeSettings`](#normalizing-settings), and validates each rule entry of the plugin as ESLint validates it, and then as the plugin does:

| Rule entry | Diagnostics | In `value.rules` |
|---|---|---|
| Key without the plugin prefix, such as `import/no-cycle` | None | No |
| Severity other than `0`, `1`, `2`, `"off"`, `"warn"` or `"error"` | An error | No |
| Unknown rule of the plugin | An error, unless the rule is off | No |
| Rule that is off | None, because ESLint does not validate it | Yes, with its options treated as not set when they fail the rule schema |
| Options that fail the rule schema | An error, the only one of the entry | No |
| Valid options | The warnings and deprecations of [`validateRuleOptions`](#validating-rule-options) | Yes |

The severity can be written alone, `"warn"`, or as the first item of an array, `["warn", { ... }]`. The rules are keyed by short name in `value.rules`, and the options of the `dependencies` rule, and of the deprecated `element-types` rule, are normalized with [`normalizeDependenciesRuleOptions`](#normalizing-the-dependencies-rule-options).

```ts
import { normalizeConfig } from "@boundaries/config";

const { value, diagnostics } = normalizeConfig({
  rules: {
    "boundaries/dependencies": ["error", { default: "maybe" }],
    "boundaries/unknown-rule": "warn",
    "boundaries/no-private": "on",
    "import/no-cycle": 2,
  },
});

// value.rules: {}
// diagnostics:
// [
//   {
//     level: "warning",
//     title: "Please provide element descriptors using the 'boundaries/elements' setting, or file descriptors using the 'boundaries/files' setting.",
//     detail: "More info: https://www.jsboundaries.dev/docs/settings/",
//     paths: [["settings"]],
//   },
//   {
//     level: "error",
//     title: "[boundaries/dependencies] Invalid rule options.",
//     detail: 'Value "maybe" should be equal to one of the allowed values.\nMore info: https://www.jsboundaries.dev/docs/rules/dependencies/',
//     paths: [["rules", "boundaries/dependencies", 1, "default"]],
//   },
//   {
//     level: "error",
//     title: 'Key "rules": Key "boundaries/unknown-rule": Could not find "unknown-rule" in plugin "boundaries".',
//     paths: [["rules", "boundaries/unknown-rule"]],
//   },
//   {
//     level: "error",
//     title: 'Key "rules": Key "boundaries/no-private": Expected severity of "off", 0, "warn", 1, "error", or 2.',
//     paths: [["rules", "boundaries/no-private"]],
//   },
// ]
```

When the plugin is registered with another name in the ESLint config, pass it as `pluginName`. Only the rules with that prefix are read:

```ts
const { value } = normalizeConfig(
  {
    settings: { "boundaries/elements": [{ type: "app", pattern: "app/*" }] },
    rules: { "arch/no-private": 1 },
  },
  { pluginName: "arch" }
);

// value.rules: { "no-private": { severity: "warn", options: undefined } }
```

> [!NOTE]
> The settings keep the `boundaries/` prefix whatever the plugin name is, as the ESLint plugin reads them.

### Normalizing Settings

`normalizeSettings` takes the `settings` object of an ESLint config and reads only its `boundaries/*` keys. It applies the default of each missing setting, converts the legacy settings, such as `boundaries/types` or `boundaries/elements-single-type`, into their current form and leaves out the invalid entries. The [settings normalized reference](#settingsnormalized) lists each property and its default.

```ts
import { normalizeSettings } from "@boundaries/config";

const { value, diagnostics } = normalizeSettings(
  {
    "boundaries/elements": [{ type: "component", pattern: "components/*" }],
    "boundaries/ignore": "**/*.spec.js",
    "boundaries/cache": "yes",
  },
  { rootPath: "/project" }
);

// value.ignorePaths: ["**/*.spec.js"]
// value.cache: true
// value.rootPath: "/project"
// diagnostics:
// [
//   {
//     level: "warning",
//     title: "Please provide a valid value in 'boundaries/cache' setting.",
//     detail: "The value should be a boolean. More info: https://www.jsboundaries.dev/docs/settings/",
//     paths: [["boundaries/cache"]],
//   },
// ]
```

The `rootPath` option is the root path of the project, already resolved by the host. The ESLint plugin resolves it from the `boundaries/root-path` setting, the `ESLINT_PLUGIN_BOUNDARIES_ROOT_PATH` environment variable and the working directory. Without the option, the normalized `rootPath` is the `boundaries/root-path` setting as written.

> [!NOTE]
> When the `boundaries/legacy-warnings` setting is `false`, the legacy syntax is not reported: neither in the settings nor, through `normalizeConfig`, in the rule options.

### Validating Rule Options

`validateRuleOptions` validates the options object of a single rule entry, the item after the severity. It validates it against the rule schema, as ESLint does, and then, for the rules with policies, it checks the shape of their selectors and, when `legacyWarnings` is `true`, their deprecated syntax.

```ts
import { validateRuleOptions } from "@boundaries/config";

const diagnostics = validateRuleOptions(
  "boundaries/dependencies",
  {
    default: "disallow",
    policies: [{ from: "component", allow: "helper" }],
  },
  { legacyWarnings: true }
);

// [
//   {
//     level: "deprecation",
//     title: "[boundaries/dependencies] Detected legacy string element selectors in 1 policy at indices: 0.",
//     detail: 'Replace "your-type" with an entity selector, e.g. { element: { type: "your-type" } }. More info: https://www.jsboundaries.dev/docs/releases/migration-guides/v5-to-v6/#object-based-elements-selector-syntax',
//     paths: [["policies", 0]],
//   },
//   {
//     level: "deprecation",
//     title: '[boundaries/dependencies] Detected "allow"/"disallow" entries without a "from"/"to" wrapper in 1 policy at indices: 0.',
//     detail: 'Use allow: [{ to: { element: { type: "your-type" } } }] or [{ from: ... }] instead of a bare element selector. More info: https://www.jsboundaries.dev/docs/releases/migration-guides/v5-to-v6/#to-property-in-allowdisallow-rules-is-now-required',
//     paths: [["policies", 0]],
//   },
// ]
```

When the options fail the rule schema, the schema error is the only diagnostic, because ESLint never runs a rule whose options fail it. A host that already runs ESLint, which validates the schema itself, passes `schema: false` to skip it:

```ts
validateRuleOptions("boundaries/dependencies", { default: "maybe" }, { legacyWarnings: true });
// [{ level: "error", title: "[boundaries/dependencies] Invalid rule options.", ... paths: [["default"]] }]

validateRuleOptions("boundaries/dependencies", { default: "maybe" }, { legacyWarnings: true, schema: false });
// []
```

> [!NOTE]
> The rule name always has the `boundaries/` prefix, whatever name the plugin is registered with in the ESLint config.

### Normalizing the Dependencies Rule Options

`normalizeDependenciesRuleOptions` applies the defaults of the options of the `dependencies` rule and normalizes the selectors of their policies, so a host can match them with [`@boundaries/elements`](https://www.npmjs.com/package/@boundaries/elements). It assumes options that passed the rule schema and reports no problem: validate them first with `validateRuleOptions`.

```ts
import { normalizeDependenciesRuleOptions } from "@boundaries/config";

const options = normalizeDependenciesRuleOptions({
  policies: [
    {
      from: { element: { type: "component" } },
      allow: { to: { element: { type: "helper" } } },
    },
  ],
});

// {
//   default: "disallow",
//   message: undefined,
//   policies: [
//     {
//       from: [{ element: [{ type: "component" }] }],
//       allow: [{ to: [{ element: [{ type: "helper" }] }] }],
//       ...
//     },
//   ],
//   checkAllOrigins: false,
//   checkUnknownLocals: false,
//   checkInternals: false,
// }
```

> [!WARNING]
> The normalized selectors are shared with the memoization of `@boundaries/elements`. Do not mutate them.

### Getting the Schema of the Rule Options

`getRuleOptionsSchema` returns the JSON schema of the options of a rule, as the ESLint plugin declares it in the rule `meta.schema`: an array with the schema of each option, empty when the rule takes no options.

```ts
import { getRuleOptionsSchema } from "@boundaries/config";

getRuleOptionsSchema("boundaries/no-private");
// [
//   {
//     type: "object",
//     properties: {
//       allowUncles: { type: "boolean" },
//       message: { type: "string" },
//     },
//     additionalProperties: false,
//   },
// ]

getRuleOptionsSchema("boundaries/no-unknown-files");
// []
```

> [!WARNING]
> The returned schemas are shared between calls. Do not mutate them.

## API Reference

### Functions

#### `normalizeConfig`

Normalizes the boundaries part of an ESLint config, `{ settings, rules }`. See [Normalizing a Config](#normalizing-a-config).

- __Parameters__:
  - `config`: `unknown` — The config object. Its `settings` and `rules` are optional; any other key is ignored.
  - `options`: `NormalizeConfigOptions` — Optional.
    - `pluginName`: `string` — Optional. The prefix of the rule names in `rules`. Default `"boundaries"`.
    - `rootPath`: `string` — Optional. The root path of the project, already resolved by the host. Without it, the normalized `rootPath` is the `boundaries/root-path` setting as written.
- __Returns__: [`ConfigResult<ConfigNormalized>`](#configresult) — The normalized config and the problems found, with paths from the root of the config object.

```ts
const { value, diagnostics } = normalizeConfig(config, { rootPath: "/project" });
```

#### `normalizeSettings`

Normalizes the `boundaries/*` settings. See [Normalizing Settings](#normalizing-settings).

- __Parameters__:
  - `settings`: `Record<string, unknown> | undefined` — The `settings` object of an ESLint config. Only its `boundaries/*` keys are read.
  - `options`: `NormalizeSettingsOptions` — Optional.
    - `rootPath`: `string` — Optional. The root path of the project, already resolved by the host. Without it, the normalized `rootPath` is the `boundaries/root-path` setting as written.
- __Returns__: [`ConfigResult<SettingsNormalized>`](#configresult) — The normalized settings and the problems found, with paths from the root of the settings object.

```ts
const { value, diagnostics } = normalizeSettings(config.settings, { rootPath: "/project" });
```

#### `validateRuleOptions`

Validates the options of a rule entry. See [Validating Rule Options](#validating-rule-options).

- __Parameters__:
  - `ruleName`: `RuleName` — The name of the rule, with the `boundaries/` prefix, such as `"boundaries/dependencies"`.
  - `options`: `unknown` — The options object of the rule entry, or `undefined` when the entry has no options.
  - `validation`: `RuleOptionsValidation` — What to validate.
    - `legacyWarnings`: `boolean` — Whether to report the deprecated syntax of the policies, as the `boundaries/legacy-warnings` setting does.
    - `schema`: `boolean` — Optional. Whether to validate the options against the rule schema, as ESLint does with the rule `meta.schema`. Default `true`; a host that already runs ESLint passes `false`.
- __Returns__: [`Diagnostic[]`](#diagnostic) — The problems found, with paths from the root of the options object. When the schema validation fails, only its error.

```ts
const diagnostics = validateRuleOptions("boundaries/dependencies", options, {
  legacyWarnings: true,
});
```

#### `normalizeDependenciesRuleOptions`

Applies the defaults of the options of the `dependencies` rule and normalizes the selectors of their policies. See [Normalizing the Dependencies Rule Options](#normalizing-the-dependencies-rule-options).

- __Parameters__:
  - `options`: `DependenciesRuleOptions | undefined` — The options of the `dependencies` rule, or of the deprecated `element-types` rule, already validated against the rule schema.
- __Returns__: [`DependenciesRuleOptionsNormalized`](#dependenciesruleoptionsnormalized) — The options with their defaults applied. The policies come from `policies`, or from the deprecated `rules` when `policies` is not set, and each one keeps its index.

```ts
const options = normalizeDependenciesRuleOptions({ default: "allow", policies: [] });
```

#### `getRuleOptionsSchema`

Returns the JSON schema of the options of a rule. See [Getting the Schema of the Rule Options](#getting-the-schema-of-the-rule-options).

- __Parameters__:
  - `ruleName`: `RuleName` — The name of the rule, with the `boundaries/` prefix.
- __Returns__: `JsonSchema[]` — The schema of each option of the rule, empty when the rule takes no options.

```ts
const schema = getRuleOptionsSchema("boundaries/dependencies");
```

### Type Guards

Each one receives a `value` of type `unknown` and returns `true` when the value is of the type.

| Function | Narrows to | Returns `true` for |
|---|---|---|
| `isSettingsKey` | `SettingsKey` | A key of the plugin settings, such as `"boundaries/elements"`. |
| `isDependencyNodeKey` | `DependencyNodeKey` | A built-in dependency node: `"import"`, `"export"`, `"require"` or `"dynamic-import"`. |
| `isRuleName` | `RuleName` | A rule name with the `boundaries/` prefix, such as `"boundaries/dependencies"`. |
| `isRuleShortName` | `RuleShortName` | A rule name without the prefix, such as `"dependencies"`. |
| `isRuleEffect` | `RuleEffect` | `"allow"` or `"disallow"`. |
| `isRulePolicy` | `RuleEffect` | _(Deprecated)_ Alias of `isRuleEffect`. |

```ts
isRuleName("boundaries/dependencies"); // true
isRuleName("dependencies"); // false
isRuleShortName("dependencies"); // true
```

### Docs Links

Builders of the links to [jsboundaries.dev](https://www.jsboundaries.dev) that the diagnostics carry. Every `anchor` parameter is an optional `string`, added to the URL as `#<anchor>`, and every function returns a `string`.

| Function | Returns |
|---|---|
| `docsUrl(path, anchor?)` | The URL of a docs page: `https://www.jsboundaries.dev/docs/<path>/`. |
| `getRuleDocsPath(ruleName)` | The path of the docs page of a rule, `rules/<short name>`. Deprecated rules get the page of the rule that replaces them. |
| `ruleDocsUrl(ruleName, anchor?)` | The URL of the docs page of a rule. |
| `moreInfoLink(path, anchor?)` | `More info: <url>`, with the URL of a docs page. |
| `moreInfoSettingsLink(anchor?)` | `moreInfoLink` of the settings page. |
| `moreInfoElementsLink(anchor?)` | `moreInfoLink` of the element descriptors page. |
| `moreInfoLegacySettingsLink(anchor?)` | `moreInfoLink` of the legacy settings page. |
| `moreInfoSelectorsLink(anchor?)` | `moreInfoLink` of the element selectors page. |
| `migrationGuideLink(versionFrom, versionTo, anchor?)` | `moreInfoLink` of the migration guide between two major versions. |
| `migrationToV2GuideLink(anchor?)` | `migrationGuideLink` from version 1 to 2. |
| `migrationToV6GuideLink(anchor?)` | `migrationGuideLink` from version 5 to 6. |
| `migrationToV7GuideLink(anchor?)` | `migrationGuideLink` from version 6 to 7. |

`path`, `versionFrom` and `versionTo` are `string`s, and `ruleName` is a `RuleName`.

```ts
ruleDocsUrl("boundaries/no-unknown"); // "https://www.jsboundaries.dev/docs/rules/no-unknown-dependencies/"
moreInfoSettingsLink(); // "More info: https://www.jsboundaries.dev/docs/settings/"
```

### Constants

| Constant | Value |
|---|---|
| `DIAGNOSTIC_LEVELS_MAP` | The levels of a diagnostic: `{ ERROR: "error", WARNING: "warning", DEPRECATION: "deprecation" }`. |
| `RULE_SEVERITIES_MAP` | The severities of a normalized rule entry: `{ OFF: "off", WARN: "warn", ERROR: "error" }`. |
| `RULE_NAMES_MAP`, `RULE_NAMES` | The rule names with the `boundaries/` prefix, as a map and as an array. |
| `RULE_SHORT_NAMES_MAP`, `RULE_SHORT_NAMES` | The rule names without the prefix, as a map and as an array. |
| `SETTINGS_KEYS_MAP` | The keys of the settings, such as `ELEMENTS: "boundaries/elements"`. |
| `SETTINGS` | The keys of the settings and of the rules, the valid element descriptor modes and dependency node kinds, and the selectors of the built-in dependency nodes, `DEFAULT_DEPENDENCY_NODES`. |
| `DEPENDENCY_NODE_KEYS_MAP` | The built-in dependency nodes: `{ REQUIRE: "require", IMPORT: "import", DYNAMIC_IMPORT: "dynamic-import", EXPORT: "export" }`. |
| `RULE_EFFECTS_MAP` | The effects of a policy: `{ ALLOW: "allow", DISALLOW: "disallow" }`. `RULE_POLICIES_MAP` is its deprecated alias. |
| `NO_UNKNOWN_DEPENDENCIES_REQUIRE_MAP` | The values of the `require` option of the `no-unknown-dependencies` rule: `{ ALL: "all", ELEMENT: "element", FILE: "file", ANY: "any" }`. |
| `LEGACY_TEMPLATES_DEFAULT`, `LEGACY_WARNINGS_DEFAULT`, `ELEMENTS_SINGLE_TYPE_DEFAULT`, `CACHE_DEFAULT` | The defaults of the `boundaries/legacy-templates`, `boundaries/legacy-warnings`, `boundaries/elements-single-match` and `boundaries/cache` settings: `true`. |
| `FILES_SINGLE_MATCH_DEFAULT` | The default of the `boundaries/files-single-match` setting: `false`. |
| `PLUGIN_NAME` | `"boundaries"`. |
| `WEBSITE_URL`, `REPO_URL`, `PLUGIN_ISSUES_URL` | The URLs of the website, the repository and its issues. |

The values of the maps are also exported one by one, such as `DEPENDENCIES`, `DEPENDENCY_NODE_IMPORT`, `RULE_EFFECT_ALLOW` or `NO_UNKNOWN_DEPENDENCIES_REQUIRE_ANY`.

## Type Reference

### Result Types

#### `ConfigResult`

Returned by `normalizeConfig` and `normalizeSettings`, as `ConfigResult<T>`.

| Property | Type | Description |
|---|---|---|
| `value` | `T` | The normalized value. Always set: invalid entries are left out. |
| `diagnostics` | `Diagnostic[]` | The problems found, in the order that the ESLint plugin prints them, each one once. |

#### `Diagnostic`

A problem found in the input. See [Diagnostics](#diagnostics).

| Property | Type | Description |
|---|---|---|
| `level` | `DiagnosticLevel` | `"error"`, `"warning"` or `"deprecation"`. |
| `title` | `string` | The title that the ESLint plugin prints. |
| `detail` | `string \| undefined` | The details and the docs link that the ESLint plugin prints under the title. |
| `paths` | `DiagnosticPath[]` | One path per affected entry. `DiagnosticPath` is `(string \| number)[]`. |

### Normalized Types

#### `ConfigNormalized`

The `value` returned by `normalizeConfig`.

| Property | Type | Description |
|---|---|---|
| `settings` | `SettingsNormalized` | The normalized settings. |
| `rules` | `{ [Name in RuleShortName]?: RuleEntryNormalized<Name> }` | The rules of the plugin found in `rules`, by short name. Entries left out by an error are missing. |

#### `RuleEntryNormalized`

A rule entry of `ConfigNormalized`, as `RuleEntryNormalized<Name>`.

| Property | Type | Description |
|---|---|---|
| `severity` | `RuleSeverity` | `"off"`, `"warn"` or `"error"`, whether it was written as a number or as a string. |
| `options` | `DependenciesRuleOptionsNormalized` for `dependencies` and `element-types`, `unknown` for the others | The options of the rule: normalized for the rules with `dependencies` policies, as written for the others. |

#### `SettingsNormalized`

The `value` returned by `normalizeSettings`, and the `settings` of `ConfigNormalized`.

| Property | Type | Description |
|---|---|---|
| `elementDescriptors` | `ElementDescriptors` | The valid descriptors of `boundaries/elements`, or of the deprecated `boundaries/types` when `boundaries/elements` is not set. Legacy string descriptors are converted into objects. Default `[]`. |
| `elementsSingleMatch` | `boolean` | `boundaries/elements-single-match`, or the deprecated `boundaries/elements-single-type` when it is not set. Default `true`. |
| `fileDescriptors` | `FileDescriptors` | The valid descriptors of `boundaries/files`. Default `[]`. |
| `filesSingleMatch` | `boolean` | `boundaries/files-single-match`. Default `false`. |
| `ignorePaths` | `string[] \| undefined` | `boundaries/ignore`, always as an array. Default `undefined`. |
| `includePaths` | `string[] \| undefined` | `boundaries/include`, always as an array. Default `undefined`. |
| `rootPath` | `string \| undefined` | The `rootPath` option, or `boundaries/root-path` as written when the option is not passed. |
| `dependencyNodes` | `DependencyNodeSelector[]` | The selectors of the nodes in `boundaries/dependency-nodes`, followed by the valid `boundaries/additional-dependency-nodes`. By default, the selectors of `import`, `export`, `require` and `dynamic-import`. |
| `legacyTemplates` | `boolean` | `boundaries/legacy-templates`. Default `true`. |
| `cache` | `boolean` | `boundaries/cache`. Default `true`. |
| `legacyWarnings` | `boolean` | `boundaries/legacy-warnings`. Default `true`. |
| `flagAsExternal` | `FlagAsExternalOptions` | `boundaries/flag-as-external`, each valid option over its default: `{ unresolvableAlias: true, inNodeModules: true, outsideRootPath: false, customSourcePatterns: [] }`. |
| `debug` | `DebugSettingNormalized` | `boundaries/debug`, with its defaults. |

`ElementDescriptors`, `FileDescriptors` and `FlagAsExternalOptions` are types of [`@boundaries/elements`](https://www.npmjs.com/package/@boundaries/elements).

#### `DebugSettingNormalized`

| Property | Type | Description |
|---|---|---|
| `enabled` | `boolean` | Whether debug mode is enabled. Default `false`. |
| `messages` | `{ files: boolean; dependencies: boolean; violations: boolean }` | Whether to print the debug messages of files, dependencies and rule violations. Each one is `true` by default. |
| `filter.files` | `FileSelectorNormalized \| EntitySelectorNormalized \| undefined` | The normalized selector that filters the debug messages of files, when valid. |
| `filter.dependencies` | `DependencySelectorNormalized \| undefined` | The normalized selector that filters the debug messages of dependencies, when valid. |

#### `DependenciesRuleOptionsNormalized`

Returned by `normalizeDependenciesRuleOptions`, and the `options` of the `dependencies` and `element-types` entries of `ConfigNormalized`.

| Property | Type | Description |
|---|---|---|
| `default` | `RuleEffect` | The effect when no policy matches: `"allow"`, or `"disallow"` for any other value. |
| `message` | `string \| undefined` | The custom message of all the rule violations, when set. |
| `policies` | `DependenciesPolicyNormalized[]` | `policies`, or the deprecated `rules` when `policies` is not set, with their selectors normalized. Each one keeps the index it has in the options. |
| `checkAllOrigins` | `boolean` | Whether to check the dependencies of every origin, not only the local ones. Default `false`. |
| `checkUnknownLocals` | `boolean` | Whether to check the local dependencies to unknown elements. Default `false`. |
| `checkInternals` | `boolean` | Whether to check the dependencies between files of the same element. Default `false`. |

#### `DependenciesPolicyNormalized`

| Property | Type | Description |
|---|---|---|
| `from` | `EntitySelectorNormalized \| undefined` | The selector of the entities that the dependency comes from. |
| `to` | `EntitySelectorNormalized \| undefined` | The selector of the entities that the dependency goes to. |
| `dependency` | `DependencyInfoSelectorNormalized \| undefined` | The selector of the dependency metadata. |
| `allow` | `DependencySelectorNormalized \| EntitySelectorNormalized \| undefined` | The selector of the allowed dependencies. |
| `disallow` | `DependencySelectorNormalized \| EntitySelectorNormalized \| undefined` | The selector of the disallowed dependencies. |
| `importKind` | `DependencyKind \| undefined` | _(Deprecated)_ The kind of import that the policy applies to, as written. |
| `message` | `string \| undefined` | The custom message of the policy violations, as written. |

The selector types are types of [`@boundaries/elements`](https://www.npmjs.com/package/@boundaries/elements), which describes them in its selector reference.

### Settings and Rule Options Types

The package exports the types of what a user writes, so a host can type its own config objects. The main ones are:

| Type | Describes |
|---|---|
| `Settings` | The `boundaries/*` settings, by key. |
| `IgnoreSetting`, `IncludeSetting`, `RootPathSetting`, `DebugSetting` | The values of the `boundaries/ignore`, `boundaries/include`, `boundaries/root-path` and `boundaries/debug` settings. |
| `DependencyNodeSelector` | An item of `boundaries/additional-dependency-nodes`: `{ selector: string; kind: DependencyKind; name?: string }`. |
| `RuleBaseOptions` | The `default` and `message` options that the rules with policies share. |
| `DependenciesRuleOptions`, `DependenciesPolicy` | The options of the `dependencies` and `element-types` rules, and their policies. |
| `EntryPointRuleOptions`, `EntryPointPolicy` | The options of the `entry-point` rule, and its policies. |
| `ExternalRuleOptions`, `ExternalPolicy`, `ExternalLibrariesSelector` | The options of the `external` rule, its policies and its library selectors. |
| `NoPrivateOptions` | The options of the `no-private` rule. |
| `NoUnknownDependenciesOptions` | The options of the `no-unknown-dependencies` and `no-unknown` rules. |
| `RuleOptions` | The options of any rule. |
| `RuleName`, `RuleShortName`, `SettingsKey`, `RuleEffect`, `DependencyNodeKey` | The unions of the values of the matching [constants](#constants). |
| `NormalizeConfigOptions`, `NormalizeSettingsOptions`, `RuleOptionsValidation` | The options of the [functions](#functions). |
| `JsonSchema` | A JSON schema object, such as the schema of a rule option. |

The `no-ignored-dependencies`, `no-ignored` and `no-unknown-files` rules take no options. `DependenciesRule`, `DependenciesRuleNormalized`, `EntryPointRule`, `ExternalRule`, `ExternalLibrarySelectors`, `RulePolicy` and `AliasSetting` are deprecated.

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
[npm-downloads-image]: https://img.shields.io/npm/dm/@boundaries/config.svg
[npm-downloads-url]: https://www.npmjs.com/package/@boundaries/config
[quality-gate-image]: https://sonarcloud.io/api/project_badges/measure?project=javierbrea_eslint-plugin-boundaries_config&metric=alert_status
[quality-gate-url]: https://sonarcloud.io/dashboard?id=javierbrea_eslint-plugin-boundaries_config
[release-image]: https://img.shields.io/github/release-date/javierbrea/eslint-plugin-boundaries.svg
[release-url]: https://github.com/javierbrea/eslint-plugin-boundaries/releases
