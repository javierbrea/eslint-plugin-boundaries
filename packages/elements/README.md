[![Build status][build-image]][build-url] [![Coverage Status][coveralls-image]][coveralls-url] [![Quality Gate][quality-gate-image]][quality-gate-url]

[![Renovate](https://img.shields.io/badge/renovate-enabled-brightgreen.svg)](https://renovatebot.com) [![Last commit][last-commit-image]][last-commit-url] [![Last release][release-image]][release-url]

[![NPM downloads][npm-downloads-image]][npm-downloads-url] [![License][license-image]][license-url]

# @boundaries/elements

This package provides element descriptors and matchers for the `@boundaries` ecosystem. These means:

- You provide a set of "element descriptors" that define how to identify files in a project (e.g., by looking at file path patterns, you assign certain properties to those elements, such as type, category, etc.).
- Then you can use:
 - "Element matchers": Check if a given path corresponds to an element with specific properties.
 - "Dependency matchers": Check if a given dependency between two paths matches certain criteria based on the properties of the source and target elements.

You can use [Micromatch patterns](https://github.com/micromatch/micromatch) to define flexible matching rules for both dependency and element matchers.

Example:

```ts
import { Elements } from '@boundaries/elements';

const elements = new Elements();

// Define your matcher using element descriptors.
// It will create a unique cache instance for these specific descriptors to improve performance when matching.
const matcher = elements.getMatcher([
  {
    type: "component",
    category: "react",
    pattern: "src/components/*.tsx",
    mode: "file",
    capture: ["fileName"],
  },
  {
    type: "service",
    category: "data",
    pattern: "src/services/*.ts",
    mode: "file",
    capture: ["fileName"],
  },
]);

// Using element matcher
const isComponent = matcher.isMatch("src/components/Button.tsx", { type: "component" }); // true

// Using dependency matcher
const isReactToServiceImportDependency = matcher.isMatch(
  {
    from: "src/components/Button.tsx",
    to: "src/services/Api.ts",
    source: "../services/Api",
    kind: "type",
    nodeKind: "ImportDeclaration",
  },
  {
    from: { category: "react" },
    to: { type: "service", nodeKind: "Import*" },
  }
); // true

```

## Table of Contents

- [Installation](#installation)
- [Contributing](#contributing)
- [License](#license)

## Contributing

Contributors are welcome.
Please read the [contributing guidelines](.github/CONTRIBUTING.md) and [code of conduct](.github/CODE_OF_CONDUCT.md).

## License

MIT, see [LICENSE](./LICENSE) for details.

[coveralls-image]: https://coveralls.io/repos/github/javierbrea/eslint-plugin-boundaries/badge.svg
[coveralls-url]: https://coveralls.io/github/javierbrea/eslint-plugin-boundaries
[build-image]: https://github.com/javierbrea/eslint-plugin-boundaries/workflows/build/badge.svg
[build-url]: https://github.com/javierbrea/eslint-plugin-boundaries/actions?query=workflow%3Abuild+branch%3Amaster
[last-commit-image]: https://img.shields.io/github/last-commit/javierbrea/eslint-plugin-boundaries.svg
[last-commit-url]: https://github.com/javierbrea/eslint-plugin-boundaries/commits
[license-image]: https://img.shields.io/npm/l/eslint-plugin-boundaries.svg
[license-url]: https://github.com/javierbrea/eslint-plugin-boundaries/blob/master/LICENSE
[npm-downloads-image]: https://img.shields.io/npm/dm/@boundaries/elements.svg
[npm-downloads-url]: https://www.npmjs.com/package/@boundaries/elements
[quality-gate-image]: https://sonarcloud.io/api/project_badges/measure?project=javierbrea_eslint-plugin-boundaries_elements&metric=alert_status
[quality-gate-url]: https://sonarcloud.io/dashboard?id=javierbrea_eslint-plugin-boundaries_elements
[release-image]: https://img.shields.io/github/release-date/javierbrea/eslint-plugin-boundaries.svg
[release-url]: https://github.com/javierbrea/eslint-plugin-boundaries/releases
