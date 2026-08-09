---
paths:
  - "**/CHANGELOG.md"
  - "**/package.json"
---

# Changelog and versioning

Each package under `packages/`, `examples/`, `support/`, and `test/` is versioned **independently** under [Semantic Versioning](https://semver.org/): MAJOR for incompatible API changes, MINOR for backwards-compatible additions, PATCH for backwards-compatible fixes (including bumping an internal dependency that doesn't change the package's own API).

Every change that affects a published package's behavior adds an entry to that package's `CHANGELOG.md`, under the **"unreleased"** section at the top of the file, following the format already used in the file. Don't create a new dated version section — that happens only during the release process (see the `repo-architecture` skill).

If a change modifies a package that another package in the workspace depends on, bump the dependent package's version too — run `pnpm nx graph` to see the dependency graph if it's unclear which packages are affected.

`packages/website`'s version tracks `packages/eslint-plugin`'s version, but only needs bumping — and a new Docusaurus versioned snapshot generating — when the release actually changes `packages/website/docs`. A release that doesn't touch the website's documentation leaves `packages/website` untouched.
