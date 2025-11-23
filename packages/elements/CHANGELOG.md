# Change Log
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/)
and this project adheres to [Semantic Versioning](https://semver.org/).

## [unreleased]
### Added
### Changed
### Fixed
### Removed
### BREAKING CHANGES

## [unreleased]

- fix: Update HANDLEBARS_TEMPLATE_REGEX to fix vulnerability with regex denial of service (ReDoS) attacks.

## [1.1.1] - 2024-11-23

### Fixed

- fix: Add missing `typeof` dependency kind

## [1.1.0] - 2024-11-10

### Added

- feat: Implement cache for micromatch results, regex and captures to improve performance.
- feat: Add `cache` option to allow disabling the cache.

### Changed

- refactor: Overall performance improvements and code optimizations.

### Fixed

- fix: Fix cache performance issues by implementing custom string generation for well-known objects, and removing caching for keys based on complex objects to avoid performance degradation.
- fix: Legacy selectors being an array with only one element now correctly treated as a single string selector.

## [1.0.0] - 2024-11-10 [YANKED]

### Added

- First package version
