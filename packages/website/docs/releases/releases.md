---
id: releases
title: Releases
description: Information about releases, changelogs, and migration guides for the project.
keywords:
  - eslint-plugin-boundaries
  - releases
  - changelog
  - release notes
  - semantic versioning
  - migration guides
---

# Releases

This project follows [semantic versioning](https://semver.org/). Each package in the ecosystem is versioned independently to allow for more granular updates and better dependency management.

## Packages

### eslint-plugin-boundaries

The main ESLint plugin package.

- [Changelog](https://github.com/javierbrea/eslint-plugin-boundaries/blob/master/packages/eslint-plugin/CHANGELOG.md)
- [Release Notes](https://github.com/javierbrea/eslint-plugin-boundaries/releases)

### @boundaries/elements

The core elements package that powers the plugin.

- [Docs](https://github.com/javierbrea/eslint-plugin-boundaries/tree/master/packages/elements/README.md)
- [Changelog](https://github.com/javierbrea/eslint-plugin-boundaries/blob/master/packages/elements/CHANGELOG.md)
- [Release Notes](https://github.com/javierbrea/eslint-plugin-boundaries/releases)

## Upgrade Notes

Some patch and minor releases fix behaviors that a configuration may rely on. Their upgrade notes explain how to check whether your project is affected, and how to adapt your configuration:

- [Upgrading to v7.2.2](./upgrade-notes/v7-2-2.mdx): nested elements get the right `path` and `fileInternalPath`

## Migration Guides

For breaking changes, we provide detailed migration guides to help you upgrade:

- [Migrating from v6 to v7](./migration-guides/v6-to-v7.mdx)
- [Migrating from v5 to v6](./migration-guides/v5-to-v6.mdx)
- [Migrating from v3 to v4](./migration-guides/v3-to-v4.md)
- [Migrating from v1 to v2](./migration-guides/v1-to-v2.md)