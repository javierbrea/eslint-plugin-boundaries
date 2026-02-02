[![Netlify Status](https://api.netlify.com/api/v1/badges/19cb4573-7575-4850-abd8-b53f49eac7d1/deploy-status)](https://www.jsboundaries.dev)

# JS Boundaries Website

This package contains the source code for the [JS Boundaries website](https://jsboundaries.dev).

It serves as the primary documentation and learning resource for the project, providing comprehensive guides, examples, and best practices for implementing architectural boundaries in JavaScript applications.

## About

The website is built with [Docusaurus](https://docusaurus.io/), a modern documentation framework that enables fast, maintainable, and SEO-friendly documentation sites.

## Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- Node.js (v20 or higher recommended)
- `pnpm` (v9)

### Installation

First, install all monorepo dependencies by running:

```sh
pnpm i
```

This command will install dependencies for all packages in the monorepo, including the website package.

### Starting the Development Server

To start the development server and preview the website locally:

```sh
pnpm start
```

The website will be available at `http://localhost:3000` with hot-reload enabled for a seamless development experience.

**Alternative approach using Nx:** If you're working from the repository root and prefer using Nx commands (as described in the [Contributing Guidelines](../../.github/CONTRIBUTING.md)), you can also run:

```sh
pnpm nx start website
```

## How to Contribute

We welcome contributions from the community! Whether you're fixing bugs, adding new documentation, or improving existing content, your help is valuable. To get started:

1. **Read the Contributing Guidelines:** Please review our [Contributing guidelines](../../.github/CONTRIBUTING.md) for information on development workflows, commit conventions, and pull request procedures.

2. **Review our Code of Conduct:** Familiarize yourself with our [Code of conduct](../../.github/CODE_OF_CONDUCT.md) to ensure a respectful and inclusive environment for all contributors.

3. **Follow the tagging conventions:** When creating or editing content, please use the appropriate tags from the list below to categorize your content properly.


## Content Organization and Tags

To maintain consistency and improve content discoverability, all documentation should be tagged appropriately. Please use only the following predefined tags:

- **concepts** – Fundamental ideas and architectural principles related to JS Boundaries
- **configuration** – Setup instructions and configuration options
- **rules** – ESLint rules, enforcement strategies, and rule configuration
- **examples** – Code examples and practical implementations
- **eslint** – ESLint-related content and plugin usage
- **typescript** – TypeScript-specific features, configurations, and best practices
- **advanced** – Advanced topics and techniques for experienced users
- **troubleshooting** – Common issues, error messages, and solutions
- **integration** – Integration guides for third-party tools and frameworks

Tags should be added to the front matter of markdown files to enable filtering and organization across the documentation site.

## Project Structure

```
website/
├── docs/               # Documentation pages
├── src/                # React components and custom pages
├── static/             # Static assets (images, etc.)
├── docusaurus.config.js  # Docusaurus configuration
└── package.json        # Package metadata and dependencies
```

## Building for Production

To create a production build of the website:

```sh
pnpm build
```

This command generates a static website optimized for deployment.

> [!TIP]
> You should build the website and check it locally using `pnpm serve` before submitting a PR

## Deployment

The website deployment is fully automated using **[Netlify](https://www.netlify.com/)**, which handles both production deployments and preview environments.

### Production Deployment

When changes are merged to the `master` branch, Netlify automatically:
1. Detects the merge and triggers a build pipeline
2. Installs dependencies and builds the website
3. Deploys the production build to the live site

No manual intervention is required for production deployments.

### Preview Deployments

For every pull request opened against the `master` branch, Netlify automatically generates a **preview deployment** with a unique URL. This allows you to:

- Review changes in a live environment before merging
- Share the preview URL with team members for feedback
- Verify that the build completes successfully
- Test functionality in a production-like environment

> [!WARNING]
> Always check the preview deployment link in your pull request before merging to ensure everything works as expected. The preview URL will be posted as a comment by the Netlify bot on your PR.

## Versioning

The website follows the same versioning strategy as the main JS Boundaries project. Each release of the JS Boundaries library corresponds to a specific version of the documentation.

Read the Docusaurus [versioning documentation](https://docusaurus.io/docs/versioning) for more details.

To create a new version of the documentation, use the following command:

```sh
pnpm nx version website <current-version>
```

Or, if you're in the `website` package directory:

```sh
pnpm run version <current-version>
```

This command will create a new versioned documentation set based on the current content. Then you can update the content of the `docs/` folder to reflect changes in the new version, which will be accessible at `/docs/next/` until the next release.

When the new version is ready to be released, create a new versioned docs set by running the command above with the appropriate version number.

> [!INFO]
> We only create new documentation versions when releasing a new version of the `eslint-plugin` package, following the same version number.

> [!CAUTION]
> Patch releases do not require new documentation versions. In such cases, you should modify both the next version and the corresponding versioned docs as needed.

## Useful Commands

| Command | Description |
|---------|-------------|
| `pnpm start` | Start the development server with hot-reload |
| `pnpm build` | Build the website for production |
| `pnpm serve` | Serve the production build locally for preview |
| `pnpm swizzle` | Customize Docusaurus components |
| `pnpm version` | Bump the version of the website. Read the documentation for details. |

## Additional Resources

- [Docusaurus Documentation](https://docusaurus.io/docs)
- [Contributing Guidelines](../../.github/CONTRIBUTING.md)
- [Code of Conduct](../../.github/CODE_OF_CONDUCT.md)

## License

This project is licensed under the same license as the main JS Boundaries repository. See the LICENSE file in the repository root for details.
