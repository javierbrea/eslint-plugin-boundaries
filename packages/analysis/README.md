[![License][license-image]][license-url] [![Build status][build-image]][build-url] [![Coverage Status][coveralls-image]][coveralls-url] [![Quality Gate][quality-gate-image]][quality-gate-url] [![Mutation testing badge](https://img.shields.io/endpoint?style=flat&url=https%3A%2F%2Fbadge-api.stryker-mutator.io%2Fgithub.com%2Fjavierbrea%2Feslint-plugin-boundaries%2Fmaster%3Fmodule%3Danalysis)](https://dashboard.stryker-mutator.io/reports/github.com/javierbrea/eslint-plugin-boundaries/master?module=analysis)

[![NPM downloads][npm-downloads-image]][npm-downloads-url] [![Last commit][last-commit-image]][last-commit-url] [![Last release][release-image]][release-url]

# @boundaries/analysis

> Evaluation of a whole project against a boundaries config, without ESLint.

## Table of Contents

- [Introduction](#introduction)
- [Features](#features)
- [Installation](#installation)
  - [Browser Support](#browser-support)
- [Quick Start](#quick-start)
- [Core Concepts](#core-concepts)
  - [The Config](#the-config)
  - [The Evaluated Rule](#the-evaluated-rule)
  - [The Project](#the-project)
  - [Verdicts](#verdicts)
  - [Summaries and Config Paths](#summaries-and-config-paths)
  - [Memoization](#memoization)
- [API Reference](#api-reference)
- [Type Reference](#type-reference)
  - [Project](#project)
  - [Project Analysis](#project-analysis)
  - [Verdicts](#verdicts-1)
  - [Summaries](#summaries)
  - [Config Analysis](#config-analysis)
- [Contributing](#contributing)
- [License](#license)

## Introduction

`@boundaries/analysis` evaluates a whole project against the config of [`@boundaries/eslint-plugin`](https://www.npmjs.com/package/@boundaries/eslint-plugin): it describes every file and every dependency as the plugin does, and decides each dependency as the `dependencies` rule does. It adds what only the whole project shows: how many files each element descriptor and file descriptor matches, and how many dependencies each policy decided.

It takes the config as an object, and the project as the paths of its files and the dependencies of each file. It normalizes the config with [`@boundaries/config`](https://www.npmjs.com/package/@boundaries/config) and decides the dependencies with [`@boundaries/policies`](https://www.npmjs.com/package/@boundaries/policies), so that a tool without ESLint, such as a playground, can show the verdicts of the rule.

>[!NOTE]
> This package does not run ESLint, read files, parse code, resolve modules or print anything. The host passes the files and the dependencies it found, and the problems of the config are returned as diagnostics, with their paths in the config object.

## Features

- **File descriptions**: the element, the file categories and the module of every file, as the plugin describes them
- **Dependency verdicts** with the semantics of the `dependencies` rule: allowed or disallowed, with the deciding policy and the message that the plugin reports, or not checked, with the reason
- **Summaries** of the element types, file categories, rules and policies of the config, with the files that each descriptor matches and the dependencies that each policy decided
- **Config paths**: every diagnostic, summary and deciding policy says where it is written in the config object
- **A config being written**: a policy whose selector cannot be normalized, such as one half written, gives an error diagnostic at its path instead of a throw
- **Runs in Node.js and in browsers**, without ESLint

## Installation

```bash
npm install @boundaries/analysis
```

### Browser Support

The package does not depend on ESLint or Node.js, so it also runs in browsers. Bundlers that build for browsers, such as webpack, Vite or esbuild, select its browser build through the `browser` condition of its `exports` field, and that build needs no polyfills of Node.js modules or globals like `process`.

## Quick Start

Analyze a config, then evaluate a project against it:

```ts
import { analyzeConfig, evaluateProject } from "@boundaries/analysis";

const analysis = analyzeConfig({
  settings: {
    "boundaries/elements": [
      { type: "helper", pattern: "helpers/*" },
      { type: "component", pattern: "components/*" },
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

const result = evaluateProject(analysis, {
  files: ["src/helpers/format/index.js", "src/components/Price/index.js"],
  dependencies: [
    {
      from: "src/components/Price/index.js",
      target: { kind: "file", path: "src/helpers/format/index.js" },
      syntax: "import",
      importKind: "value",
      specifiers: [{ kind: "named", name: "format" }],
      source: "../../helpers/format",
    },
    {
      from: "src/helpers/format/index.js",
      target: { kind: "file", path: "src/components/Price/index.js" },
      syntax: "import",
      importKind: "value",
      specifiers: [{ kind: "named", name: "Price" }],
      source: "../../components/Price",
    },
    {
      from: "src/components/Price/index.js",
      target: { kind: "external", name: "react" },
      syntax: "import",
      importKind: "value",
      specifiers: [{ kind: "named", name: "useState" }],
      source: "react",
    },
  ],
});

for (const { dependency, verdict } of result.dependencies) {
  if (verdict.status === "disallowed") {
    console.log(`${dependency.from} -> ${dependency.source}`);
    console.log(verdict.message);
    console.log(verdict.policy?.path);
  }
}
// src/helpers/format/index.js -> ../../components/Price
// There is no policy allowing dependencies from elements of type "helper" to elements of type "component"
// [ 'rules', 'boundaries/dependencies', 1, 'default' ]

console.log(result.dependencies.map(({ verdict }) => verdict.status));
// [ 'allowed', 'disallowed', 'not-checked' ]

console.log(result.files.get("src/helpers/format/index.js")?.element);
// {
//   types: [ 'helper' ],
//   path: 'src/helpers/format',
//   fileInternalPath: 'index.js',
//   captured: null,
//   parents: [],
//   isIgnored: false,
//   isUnknown: false
// }

console.log(
  result.policies.map(({ index, decided, disallowed }) => ({
    index,
    decided,
    disallowed,
  }))
);
// [
//   { index: 0, decided: 1, disallowed: 0 },
//   { index: null, decided: 1, disallowed: 1 }
// ]
```

The import of `react` is not checked, with the reason `not-local`, because the rule checks external modules only with `checkAllOrigins`. The `default` option decided the disallowed dependency, so its policy is the `default` of the rule options, whose index is `null`.

## Core Concepts

### The Config

`analyzeConfig` takes one config object, such as the entry of a flat config that sets up the plugin, and reads only its `settings` and `rules`: other keys, such as `files` or `plugins`, are ignored. The rules are read with the `boundaries/` prefix, so a rule written under another prefix is neither summarized nor evaluated.

The paths of the files of the project are relative to its root. A relative `boundaries/root-path` is resolved against that root, as the plugin resolves it against the working directory of ESLint. When the setting is not set, is absolute, or points above the root of the project, such as `..`, the root of the project is the root path.

A policy whose selector cannot be normalized, such as one half written, does not make `analyzeConfig` throw: it gets an error diagnostic at its path, and the rules are not valid. When a rule entry that is on makes `normalizeConfig` of `@boundaries/config` throw and none of its policies throws on its own, such as when the schema of the rule options cannot be compiled where code generation from strings is forbidden, `analyzeConfig` throws that error, so that a host does not show a project without problems.

### The Evaluated Rule

The dependencies are decided by the first of `boundaries/dependencies` and the deprecated `boundaries/element-types` that is written and that ESLint runs, so `boundaries/dependencies` when both run. When neither runs, the first that is written is the one marked as `evaluated` in the summaries of the rules, and `notEvaluated` says why no dependency is evaluated, checked in this order:

| Reason | When |
| --- | --- |
| `rules-invalid` | An entry of a rule of the plugin fails its schema or has a policy whose selector cannot be normalized, so ESLint rejects the config |
| `no-rule` | Neither `boundaries/dependencies` nor `boundaries/element-types` is written |
| `rule-off` | The rule is off |
| `no-options` | The rule has no options, such as `"boundaries/dependencies": 2`, so the plugin checks nothing |

Every verdict is then `not-evaluated`, and no policy is summarized. The files are described all the same, and so are the dependencies that are read.

### The Project

The project is the paths of its files and the dependencies of each file. Each dependency gives its file in `from`, its `target`, the `syntax` of its statement, its `importKind`, its `specifiers` and its `source`:

- The `target` is a file of the project, by its path, or a module outside it, by its name.
- The `source` is the source as the statement writes it, such as `../pages/home` or `react`. It is required, because the origin of the target depends on it: an external target is described from its `source`, not from its `name`, so `node:fs` is a `core` module and `react/jsx-runtime` is the module `react` with the internal path `jsx-runtime`.
- The `syntax` is `import`, `export-from`, `require` or `dynamic-import`. Policies match it as the `nodeKind` that the plugin gives it, which is the `name` of the dependency node that reads it, or `null` when that `name` is empty or missing: `import`, `export`, `require` and `dynamic-import` for the built-in nodes.
- The `specifiers` that a policy matches are the `named` ones of an `import` or an `export … from`: the imported name of an `import`, and the exported name of an `export … from`, which is its `alias` when it has one.

The analysis cannot run a selector, so it reads a dependency only through the built-in selectors of its syntax and its `importKind`, such as `ImportDeclaration[importKind=type] > Literal` for an `import type`. A dependency is read when a node of `boundaries/dependency-nodes` or of `boundaries/additional-dependency-nodes` has one of those selectors, whatever its `name` and its `kind`. Otherwise it is `not-checked` with the reason `not-read`, and has no description: a `require` when `boundaries/dependency-nodes` lists only `import`, or an `import type` when the only node of imports is an additional one with the selector of the value imports. The other selectors of `boundaries/additional-dependency-nodes` are not run.

As in the plugin, the last node with a selector is the one that runs, so its `name` is the `nodeKind` of the description, or `null` when that `name` is empty or missing, and its `kind` is the `kind`, or `value` when the node has none. When the nodes of several built-in selectors of the same syntax and import kind disagree, such as one with the selector of `require('x')` and another with the one of `import x = require('x')`, or only some of those selectors have a node, the analysis does not tell the forms of the syntax apart, so it reads every dependency of that syntax and import kind through the node of the first of those selectors that has one, in the order of `SETTINGS.DEFAULT_DEPENDENCY_NODES` of `@boundaries/config`, while ESLint reads each form through the node of its own selector, or not at all.

`dependencyNodesReadAsESLint` of the `ConfigAnalysis`, which the `ProjectAnalysis` repeats, is `false` when a statement may be read differently from ESLint: a node of `boundaries/additional-dependency-nodes` has a selector that is not built-in, or the built-in selectors of a syntax and import kind do not all have the same node, as when only some of them have one, or their nodes differ in `name` or `kind` as the plugin uses them. A host can then warn that the verdicts of some statements may differ from those of ESLint, as the analysis cannot say which statements without parsing the code. It is `true` for the default nodes.

### Verdicts

Each dependency gets a `verdict`, by its `status`:

| Status | When | With |
| --- | --- | --- |
| `allowed` | The rule allows it | `policy`: the policy that allowed it, or the default |
| `disallowed` | The rule disallows it | `policy`, `message`: the message that the plugin reports, and `level`: `error`, or `warning` for the severity `warn` |
| `not-checked` | The rule does not check it, and it counts as no problem | `reason`: one of the [skip reasons of `@boundaries/policies`](https://github.com/javierbrea/eslint-plugin-boundaries/tree/master/packages/policies#skipped-dependencies), or `not-read` |
| `not-evaluated` | No dependency of the project is evaluated | Nothing: `notEvaluated` of the result says why |

ESLint stops with an error when a custom `message` fails to render, or renders to an empty text. The analysis does not stop: the dependency is `disallowed`, and its `message` says what went wrong. When the message fails to render, its `policy` is `undefined`, because nothing says which policy decided, and the dependency counts for no policy in the summaries.

### Summaries and Config Paths

A `ConfigPath` is the path of an entry from the root of the config object, such as `["rules", "boundaries/dependencies", 1, "policies", 0]`, and `[]` for the whole config. Each summary and the `policy` of each verdict carry the path of their entry, and each diagnostic the paths of the entries it is about, so that a host that has the text of the config can point at what the user wrote:

- The policies are read from `policies`, or from the deprecated `rules` when `policies` is not written, and their paths say which.
- The path of the default policy is the `default` of the rule options, also when `default` is not written.
- The element types are read from `boundaries/elements`, or from the deprecated `boundaries/types` when `boundaries/elements` is not set. There is a summary for each element descriptor as written, and those that a diagnostic says are invalid are marked as `ignored`. There is a summary for each valid file descriptor.

The summaries of `evaluateProject` add what depends on the project: the files of the project that each element descriptor and file descriptor gives its type or category to, so that descriptors that share one count their own files, and the dependencies that each policy decided and disallowed.

### Memoization

`analyzeConfig` normalizes the config each time it is called, and `evaluateProject` describes every file and every dependency each time, with the matchers that `@boundaries/policies` builds from the settings of the analysis, which cache the description of each path they describe unless `boundaries/cache` is `false`. The matchers and the descriptions belong to the analysis: its evaluations reuse them, another analysis builds its own even for the same config, and they are freed with the analysis when the host drops it. No result depends on them.

A `ConfigAnalysis` can be evaluated against any number of projects, so a host that evaluates often keeps the analysis of a config while the config does not change, and calls `evaluateProject` with it again. That also keeps the normalized policies by whose identity `@boundaries/policies` memoizes its selectors. An analysis kept alive keeps the descriptions of every path evaluated with it, unless `boundaries/cache` is `false`, so a host that evaluates many projects with other paths analyzes the config again to free them.

## API Reference

| Function | Parameters | Returns |
| --- | --- | --- |
| `analyzeConfig` | `config: ProjectConfig` | A `ConfigAnalysis`: the normalized settings, the diagnostics, the rule whose dependencies are evaluated or why none is, whether the analysis reads statements through the dependency nodes as ESLint does, and the summaries that do not depend on the project |
| `evaluateProject` | `analysis: ConfigAnalysis`, `project: Pick<Project, "files" \| "dependencies">` | A `ProjectAnalysis`: the description of every file, a result for every dependency in the order of the project, and the diagnostics, the validity of the rules, the reason no dependency is evaluated, whether the analysis reads statements through the dependency nodes as ESLint does and the summaries of the analysis, with what depends on the project |

`evaluateProject` does not read the `config` of the project, so a `Project` can be passed as it is. The result holds the diagnostics and the rule summaries of the analysis, the same objects, and each dependency result holds the dependency of the project, the same object.

## Type Reference

### Project

```ts
/** The boundaries part of an ESLint config object, as written */
type ProjectConfig = {
  readonly settings?: unknown;
  readonly rules?: unknown;
};

type Project = {
  readonly config: ProjectConfig;
  /** Paths of its files, from its root, such as `src/components/Price/index.ts` */
  readonly files: readonly string[];
  readonly dependencies: readonly ProjectDependency[];
};

type ProjectDependency = {
  /** Path of the file that has the dependency, from the root of the project */
  readonly from: string;
  readonly target: ProjectDependencyTarget;
  readonly syntax: ProjectDependencySyntax;
  /** Whether the statement imports values or only types */
  readonly importKind: "value" | "type";
  readonly specifiers: readonly ProjectSpecifier[];
  /** The source as the statement writes it, such as `../pages/home` or `react` */
  readonly source: string;
};

type ProjectDependencyTarget =
  | { readonly kind: "file"; readonly path: string }
  | { readonly kind: "external"; readonly name: string };

type ProjectDependencySyntax =
  | "import"
  | "export-from"
  | "require"
  | "dynamic-import";

type ProjectSpecifier = {
  /** `default` for `import x`, `named` for `import { x }`, `namespace` for `import * as x` */
  readonly kind: "default" | "named" | "namespace";
  /** Name in the target module */
  readonly name: string;
  /** Local name, when it differs from `name` */
  readonly alias?: string;
};
```

### Project Analysis

```ts
type ProjectAnalysis = {
  /** Every file of the project, by path */
  readonly files: ReadonlyMap<string, EntityDescription>;
  /** A result for every dependency of the project, in the order of `Project.dependencies` */
  readonly dependencies: readonly DependencyResult[];
  /** The diagnostics of the config, with paths from the root of the config object */
  readonly diagnostics: readonly Diagnostic[];
  /** False when an entry of a rule of the plugin fails its schema or has a policy whose selector cannot be normalized */
  readonly rulesValid: boolean;
  /** The `dependencyNodesReadAsESLint` of the analysis: `ConfigAnalysis.dependencyNodesReadAsESLint` says when it is false */
  readonly dependencyNodesReadAsESLint: boolean;
  /** Why no dependency is evaluated, or `undefined` when they are */
  readonly notEvaluated: NotEvaluatedReason | undefined;
  readonly policies: readonly PolicySummary[];
  readonly elementTypes: readonly ElementTypeSummary[];
  readonly fileCategories: readonly FileCategorySummary[];
  readonly rules: readonly RuleSummary[];
};

type DependencyResult = {
  /** The dependency of the project, the same object */
  readonly dependency: ProjectDependency;
  /** Its file and its position among the dependencies of that file, from 0 */
  readonly ref: DependencyRef;
  /** What the plugin describes of it, or `undefined` when it is not read */
  readonly description: DependencyDescription | undefined;
  readonly verdict: DependencyVerdict;
};

type DependencyRef = {
  readonly path: string;
  readonly index: number;
};
```

`EntityDescription` holds every property that an element, a file or a module selector matches, in its `element`, `file` and `module`, with the names and the values of the plugin, as the [Quick Start](#quick-start) prints. `DependencyDescription` holds `to`, the description of the target, and `dependency`, with the `kind`, `nodeKind`, `source`, `specifiers` and `relationship` that a dependency selector matches. What a dependency comes from is described by its file, in `files`. These are types of this package, not the types of `@boundaries/elements` with the same names, which have more properties.

### Verdicts

```ts
type DependencyVerdict =
  | { readonly status: "allowed"; readonly policy: PolicyRef }
  | {
      readonly status: "disallowed";
      /** `undefined` only when a custom message fails to render */
      readonly policy: PolicyRef | undefined;
      readonly message: string;
      readonly level: "error" | "warning";
    }
  | { readonly status: "not-checked"; readonly reason: SkipReason }
  | { readonly status: "not-evaluated" };

type SkipReason =
  | "from-ignored"
  | "from-unknown"
  | "to-ignored"
  | "not-local"
  | "unknown-local"
  | "internal"
  | "not-read";

type NotEvaluatedReason =
  | "rules-invalid"
  | "no-rule"
  | "rule-off"
  | "no-options";

/** The policy that decided a dependency: one of the policies of the rule, or the default */
type PolicyRef = {
  /** Its index in the options, or `null` for the `default` option */
  readonly index: number | null;
  readonly path: ConfigPath;
};

type ConfigPath = readonly (string | number)[];
```

### Summaries

```ts
type ElementTypeSummary = {
  /** Position in `boundaries/elements`, or in the deprecated `boundaries/types` */
  readonly index: number;
  /** Its `type`, or `#<index>` when it has none */
  readonly type: string;
  /** The patterns its `pattern` writes, or `<type>/*` for a legacy descriptor written as a string */
  readonly patterns: readonly string[];
  /** How many files of the project it gives its type to; 0 when it is ignored */
  readonly files: number;
  /** A diagnostic says it is invalid and ignored */
  readonly ignored: boolean;
  readonly path: ConfigPath;
};

type FileCategorySummary = {
  /** Position in `boundaries/files` */
  readonly index: number;
  readonly category: string;
  readonly patterns: readonly string[];
  /** How many files of the project it gives its category to */
  readonly files: number;
  readonly path: ConfigPath;
};

type RuleSummary = {
  /** As written, such as `boundaries/dependencies` */
  readonly name: string;
  /** Policies of its options, 0 when it has none */
  readonly policies: number;
  /** Its options pass the rule schema, and the selector of every policy can be normalized */
  readonly valid: boolean;
  /** It is the rule that the analysis takes; `notEvaluated` says when its dependencies are not evaluated */
  readonly evaluated: boolean;
  readonly path: ConfigPath;
};

type PolicySummary = {
  /** Its index in the options, or `null` for the default */
  readonly index: number | null;
  /** `allow` or `disallow` when it has only that one, `both` when it has both; the value of `default` for the default */
  readonly action: "allow" | "disallow" | "both";
  /** The element types and file categories that its own `from` and the `from` of the dependency selectors of its `allow` and `disallow` name; empty for the default */
  readonly from: readonly string[];
  /** The same, for its own `to` and the `to` selectors of its `allow` and `disallow` */
  readonly to: readonly string[];
  /** How many dependencies it decided */
  readonly decided: number;
  /** How many of them it disallowed */
  readonly disallowed: number;
  /** How many of the disallowed ones are errors, because the rule has the severity `error` */
  readonly errors: number;
  readonly path: ConfigPath;
};
```

### Config Analysis

```ts
type ConfigAnalysis = {
  readonly settings: SettingsNormalized;
  readonly diagnostics: readonly Diagnostic[];
  readonly rulesValid: boolean;
  /** False when a statement may be read differently from ESLint, because a dependency node has a selector that is not built-in or the built-in selectors of a syntax and import kind do not all have the same node */
  readonly dependencyNodesReadAsESLint: boolean;
  readonly elementTypes: readonly Omit<ElementTypeSummary, "files">[];
  readonly fileCategories: readonly Omit<FileCategorySummary, "files">[];
  readonly rules: readonly RuleSummary[];
  readonly policies: readonly Omit<
    PolicySummary,
    "decided" | "disallowed" | "errors"
  >[];
} & (
  | { readonly rule: EvaluatedRule; readonly notEvaluated: undefined }
  | { readonly rule: undefined; readonly notEvaluated: NotEvaluatedReason }
);

/** The rule whose dependencies are evaluated */
type EvaluatedRule = {
  readonly level: "error" | "warning";
  /** The options of the rule, as `normalizeConfig` normalized them */
  readonly options: DependenciesRuleOptionsNormalized;
  /** One for each policy of the options, in their order */
  readonly policies: readonly PolicyRef[];
  /** The `default` option, which decides when no policy matches */
  readonly defaultPolicy: PolicyRef;
};
```

`Diagnostic`, `SettingsNormalized` and `DependenciesRuleOptionsNormalized` are types of `@boundaries/config`. The package also exports `DependencyRelationship`, `DependencyRelationshipKind` and `ParentDescription`, the types inside the descriptions.

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
[npm-downloads-image]: https://img.shields.io/npm/dm/@boundaries/analysis.svg
[npm-downloads-url]: https://www.npmjs.com/package/@boundaries/analysis
[quality-gate-image]: https://sonarcloud.io/api/project_badges/measure?project=javierbrea_eslint-plugin-boundaries_analysis&metric=alert_status
[quality-gate-url]: https://sonarcloud.io/dashboard?id=javierbrea_eslint-plugin-boundaries_analysis
[release-image]: https://img.shields.io/github/release-date/javierbrea/eslint-plugin-boundaries.svg
[release-url]: https://github.com/javierbrea/eslint-plugin-boundaries/releases
