[![Build status][build-image]][build-url] [![Coverage Status][coveralls-image]][coveralls-url] [![Quality Gate][quality-gate-image]][quality-gate-url] [![License][license-image]][license-url]

[![Renovate](https://img.shields.io/badge/renovate-enabled-brightgreen.svg)](https://renovatebot.com) [![Last commit][last-commit-image]][last-commit-url] [![Last release][release-image]][release-url] [![NPM downloads][npm-downloads-image]][npm-downloads-url]

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

# ESLint Plugin Boundaries

Enforce architectural boundaries in your JavaScript and TypeScript projects.

**ESLint Plugin Boundaries** is an ESLint plugin that helps you maintain clean architecture by enforcing boundaries between different parts of your codebase. Define your architectural layers, specify how they can interact, and get instant feedback when boundaries are violated.

- **Architectural Enforcement**: Define dependency rules that match your project's architecture
- **Multi-Layer Classification**: Every file or dependency in your project can be described across three independent dimensions simultaneously — its architectural element, its own file category, and its origin. Define rules for any combination.
- **Flexible Configuration**: Adapt the plugin to any project structure. It works with monorepos, modular architectures, layered patterns, and any custom structure you can imagine
- **Real-time Feedback**: Get immediate ESLint errors when imports violate your architectural rules

## Documentation

The full documentation is available on the [JS Boundaries website](https://www.jsboundaries.dev/docs/overview/).

### Key Sections

- **[Overview](https://www.jsboundaries.dev/docs/overview/)** - Introduction to the plugin and its core concepts
- **[Quick Start](https://www.jsboundaries.dev/docs/quick-start/)** - Set up the plugin in 5 minutes
- **[Classification](https://www.jsboundaries.dev/docs/classification/)** - How to classify files and folders for your architecture
- **[Selectors](https://www.jsboundaries.dev/docs/selectors/)** - How to match classified files, elements, and modules in your rules
- **[Policies](https://www.jsboundaries.dev/docs/policies/)** - How to define dependency rules between classified files, elements, and modules
- **[Rules Reference](https://www.jsboundaries.dev/docs/rules/)** - Complete documentation for all available rules
- **[TypeScript Support](https://www.jsboundaries.dev/docs/guides/typescript-support/)** - Use with TypeScript projects

## Quick Example

Install the plugin using npm:

```bash
npm install eslint eslint-plugin-boundaries --save-dev
```

Define your architectural elements:

```javascript
import boundaries from "eslint-plugin-boundaries";

export default [
  {
    plugins: { boundaries },
    settings: {
      "boundaries/elements": [
        { type: "controller", pattern: "controllers/*" },
        { type: "model", pattern: "models/*" },
        { type: "view", pattern: "views/*" }
      ],
      "boundaries/files": [
        { category: "test", pattern: "**/*.test.js" }
      ]
    }
  }
];
```

Define your dependency rules:

```javascript
{
  rules: {
    "boundaries/dependencies": [2, {
      default: "disallow",
      policies: [
        // Allow controllers to depend on models and views
        {
          from: { element: { types: "controller" } },
          allow: {
            to: { element: { types: { anyOf: ["model", "view"] } },
          },
        },
        // Allow views to depend on models
        {
          from: { element: { types: "view" } },
          allow: {
            to: { element: { types: "model" } },
          },
        },
        // Disallow models to depend on anything other than other models
        {
          from: { element: { types: "model" } },
          disallow: {
            to: { element: { types: { noneOf: ["!model"] } },
          },
        },
        // Disallow any element from importing a test file
        {
          disallow: {
            to: { file: { categories: "test" } },
          },
        },
      ]
    }]
  }
}
```

Now ESLint will catch violations:

```javascript
// In src/models/model/index.js
import View from "../../views/view"; // ❌ Error: Architectural boundary violated
```

## Contributing

To everyone who has opened an issue, suggested improvements, fixed bugs, added features, or improved documentation: **Thank you**. Your contributions, no matter how small, make a real difference. Every bug report helps us improve, every feature request guides our roadmap, and every pull request strengthens the project.

Special recognition goes to [those who have contributed code to the project](https://github.com/javierbrea/eslint-plugin-boundaries/graphs/contributors). Your technical contributions are the foundation of what makes this plugin valuable to the community.

Want to contribute? We'd love to have you! Here are some ways to get involved:

- **Report Issues**: [Open an issue](https://github.com/javierbrea/eslint-plugin-boundaries/issues) if you find a bug or have a suggestion
- **Participate in Discussions**: Join the conversation on our [GitHub Discussions](https://github.com/javierbrea/eslint-plugin-boundaries/discussions). Review RFCs, share ideas, and help shape the future of the project.
- **Contribute Code**: Check out our [Contributing Guidelines](https://github.com/javierbrea/eslint-plugin-boundaries/blob/main/.github/CONTRIBUTING.md)

## License

MIT © [javierbrea](https://github.com/javierbrea)
