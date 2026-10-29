[![License][license-image]][license-url] [![Build status][build-image]][build-url] [![Coverage Status][coveralls-image]][coveralls-url] [![Quality Gate][quality-gate-image]][quality-gate-url] 

[![NPM downloads][npm-downloads-image]][npm-downloads-url] [![Renovate](https://img.shields.io/badge/renovate-enabled-brightgreen.svg)](https://renovatebot.com) [![Last commit][last-commit-image]][last-commit-url] [![Last release][release-image]][release-url]

[coveralls-image]: https://coveralls.io/repos/github/javierbrea/eslint-plugin-boundaries/badge.svg
[coveralls-url]: https://coveralls.io/github/javierbrea/eslint-plugin-boundaries
[build-image]: https://github.com/javierbrea/eslint-plugin-boundaries/actions/workflows/build.yml/badge.svg
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

# JS Boundaries

**Lint your architecture, not just your syntax.**

An ESLint plugin for JavaScript and TypeScript projects. Classify your files, write policies for who may depend on whom, and get an ESLint error the moment a boundary is crossed. In your IDE, in CI, with nothing new to run.

**Documentation: [jsboundaries.dev](https://www.jsboundaries.dev/)** · [Quick start](https://www.jsboundaries.dev/docs/quick-start/)

## Installation

```bash
npm install --save-dev eslint eslint-plugin-boundaries
```

<!-- The steps and snippets of this section repeat packages/website/src/components/home/Steps/Steps.tsx; a change to one needs the same change in the other. -->
## How it works

From folder tree to enforced architecture in three edits.

### 1. Classify files and elements

Element descriptors match folders. File descriptors match files on their own, so a file can be a `component` and a `test` at the same time. You only need one of the two to start.

```js
settings: {
  "boundaries/elements": [
    { type: "helper",    pattern: "helpers/*" },
    { type: "component", pattern: "components/*/*" },
    { type: "module",    pattern: "modules/*" },
  ],
  "boundaries/files": [
    { pattern: "**/*.spec.js", category: "test" },
  ],
}
```

### 2. Write the policies

Pick a default, then allow or disallow by any combination of element type, file category, module origin and dependency kind. Captured path fragments let one policy cover a whole family of elements.

```js
"boundaries/dependencies": [2, {
  default: "disallow",
  policies: [
    { from: { element: { type: "component" } },
      allow: { to: { element: { type: "helper" } } } },
    { from: { element: { type: "module" } },
      allow: { to: { element: { types: ["component", "helper"] } } } },
    { disallow: { to: { file: { categories: "test" } } },
      message: "Never import test files from {{ from.element.types.[0] }}s" },
  ],
}]
```

### 3. Read the error where you wrote the import

Violations are ordinary ESLint errors: editor squiggles, CI failures, templated messages with the element types on both sides. Three more rules catch files outside your architecture, unknown dependencies and ignored ones.

```text
src/helpers/format/index.js
  1:22  error  There is no policy allowing dependencies from
         elements of type "helper" to elements of type "component"
         boundaries/dependencies

✖ 1 problem (1 error, 0 warnings)
```

The [quick start](https://www.jsboundaries.dev/docs/quick-start/) puts these pieces together in a complete `eslint.config.js`.

## Packages

This repository holds the packages of JS Boundaries:

| Package | Description |
| --- | --- |
| [`eslint-plugin-boundaries`](https://www.jsboundaries.dev/) | The ESLint plugin, also published as `@boundaries/eslint-plugin`. |
| [`@boundaries/elements`](https://github.com/javierbrea/eslint-plugin-boundaries/tree/master/packages/elements#readme) | Entity descriptors and matchers for `@boundaries` tools. |
| [`@boundaries/config`](https://github.com/javierbrea/eslint-plugin-boundaries/tree/master/packages/config#readme) | Normalization and validation of the settings and rule options of the plugin, without ESLint. |

## Contributing

Thank you to everyone who has reported issues, suggested improvements or [contributed code](https://github.com/javierbrea/eslint-plugin-boundaries/graphs/contributors). To get involved, [open an issue](https://github.com/javierbrea/eslint-plugin-boundaries/issues), join the [discussions](https://github.com/javierbrea/eslint-plugin-boundaries/discussions) or read the [contributing guidelines](https://github.com/javierbrea/eslint-plugin-boundaries/blob/master/.github/CONTRIBUTING.md).

## License

MIT © [javierbrea](https://github.com/javierbrea)
