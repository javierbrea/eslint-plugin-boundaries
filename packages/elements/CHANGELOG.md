# Change Log
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/)
and this project adheres to [Semantic Versioning](https://semver.org/).

## [unreleased]
### Added
- feat: Add support for `captured` as an array in element selectors, where each element in the array represents an alternative (OR logic). The selector matches if any of the array elements matches.
- feat: Support matching `null` values in selectors.
### Fixed
### Removed
### BREAKING CHANGES
- feat: Remove `source` and `baseSource` properties from the `to` and `from` objects in element descriptions and selectors. Move them to the `dependency` object instead, as they are properties of the dependency rather than the target element. This change may require updates to any custom rules or configurations that reference these properties in the `to` object. Refactor all types, tests, and documentation to reflect this change.

## [1.2.0] - 2026-02-02

### Added

- feat: Add `rootPath` and `flagAsExternal` options to allow better control over external module identification.

## [1.1.2] - 2025-12-06

### Fixed

- fix: Update HANDLEBARS_TEMPLATE_REGEX to fix vulnerability with regex denial of service (ReDoS) attacks.

## [1.1.1] - 2025-11-23

### Fixed

- fix: Add missing `typeof` dependency kind

## [1.1.0] - 2025-11-10

### Added

- feat: Implement cache for micromatch results, regex and captures to improve performance.
- feat: Add `cache` option to allow disabling the cache.

### Changed

- refactor: Overall performance improvements and code optimizations.

### Fixed

- fix: Fix cache performance issues by implementing custom string generation for well-known objects, and removing caching for keys based on complex objects to avoid performance degradation.
- fix: Legacy selectors being an array with only one element now correctly treated as a single string selector.

## [1.0.0] - 2025-11-10 [YANKED]

### Added

- First package version
