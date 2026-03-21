# Change Log
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/)
and this project adheres to [Semantic Versioning](https://semver.org/).

## [unreleased]
### Added
### Changed
### Fixed
### Removed
### Breaking Changes

## [3.0.0] - 2026-03-21

### Added

- feat: Add `descriptorsMultiMatch` option (default: `true`) to control whether all matching descriptors are collected or only the first match (`false`).
- feat: Add `descriptorsPriority` option (`"first" | "last"`) to control which descriptor wins when multiple descriptors match at the same level.

### Changed

- feat: `describeElement` and `describeDependency` element descriptions now return `type` and `category` as ordered arrays of `string[]`, or `null` when no values are matched for that key.
- feat: Parent element descriptions now return `type` and `category` as ordered arrays of `string[]`, or `null` when no values are matched for that key.
- feat: Element matcher `type` and `category` selector checks now match when any value in the description arrays matches (OR semantics, equivalent to micromatch `some`).
- feat: In `descriptorsMultiMatch=true`, captured values are merged from all matching descriptors and conflict resolution follows `descriptorsPriority`.
- feat: `elementPath` and `internalPath` are resolved from the prioritized descriptor (`first` or `last`) when multiple descriptors match.
- test: Update and extend unit tests to cover multi-match behavior and first-match-only mode.

### Breaking Changes

- feat: `ElementDescription.type` and `ElementDescription.category` changed from `string | null` to `string[] | null`.
- feat: `ElementParent.type` and `ElementParent.category` changed from `string | null` to `string[] | null`.

## [2.0.0] - 2026-03-15

### Added

- feat: Add support for `captured` as an array in element selectors, where each element in the array represents an alternative (OR logic). The selector matches if any of the array elements matches.
- feat: Support matching `null` values in selectors.
- feat: Add support for `parent` selector property to match against first parent (`parents[0]`) properties (`type`, `category`, `elementPath`, and `captured`).

### Changed

- refactor: Improve typing for better maintainability.
- test: Improve test coverage and add more test cases for edge scenarios.
- chore: Update dependencies and devDependencies to their latest versions.

### Breaking Changes

- feat: Remove `source` and `baseSource` properties from the `to` and `from` objects in element descriptions and selectors. Move them to the `dependency` object instead, as they are properties of the dependency rather than the target element. This change may require updates to any custom rules or configurations that reference these properties in the `to` object. Refactor all types, tests, and documentation to reflect this change.
- feat: Rename "baseSource" property to "module" to better reflect its purpose and avoid confusion with the "source" property. Update all types, tests, and documentation to reflect this change.
- feat: Support array of dependency metadata selectors in the `dependency` property of dependency selectors, allowing for more flexible matching of dependencies based on their metadata. Each selector in the array represents an alternative (OR logic), and the dependency matches if any of the selectors in the array matches its metadata.
- feat: Remove external library selectors types and helpers.
- feat: Remove deprecated `dependencySelectorGlobals` option from matching methods and types.
- feat: Remove `getSelectorMatchingDescription` method, as it was too generic and caused confusion. Instead, provide specific methods for matching element and dependency descriptions against their respective selectors (`getElementSelectorMatchingDescription` and `getDependencySelectorMatchingDescription`) to improve clarity and usability.

## [2.0.0-beta.2] - 2026-03-15

### Changed

- refactor: Improve typing for better maintainability.
- test: Improve test coverage and add more test cases for edge scenarios.

## [2.0.0-beta.1] - 2026-03-14

### Added

- feat: Add support for `captured` as an array in element selectors, where each element in the array represents an alternative (OR logic). The selector matches if any of the array elements matches.
- feat: Support matching `null` values in selectors.
- feat: Add support for `parent` selector property to match against first parent (`parents[0]`) properties (`type`, `category`, `elementPath`, and `captured`).

### Changed

- chore: Update dependencies and devDependencies to their latest versions.

### Breaking Changes

- feat: Remove `source` and `baseSource` properties from the `to` and `from` objects in element descriptions and selectors. Move them to the `dependency` object instead, as they are properties of the dependency rather than the target element. This change may require updates to any custom rules or configurations that reference these properties in the `to` object. Refactor all types, tests, and documentation to reflect this change.
- feat: Rename "baseSource" property to "module" to better reflect its purpose and avoid confusion with the "source" property. Update all types, tests, and documentation to reflect this change.
- feat: Support array of dependency metadata selectors in the `dependency` property of dependency selectors, allowing for more flexible matching of dependencies based on their metadata. Each selector in the array represents an alternative (OR logic), and the dependency matches if any of the selectors in the array matches its metadata.
- feat: Remove external library selectors types and helpers.
- feat: Remove deprecated `dependencySelectorGlobals` option from matching methods and types.
- feat: Remove `getSelectorMatchingDescription` method, as it was too generic and caused confusion. Instead, provide specific methods for matching element and dependency descriptions against their respective selectors (`getElementSelectorMatchingDescription` and `getDependencySelectorMatchingDescription`) to improve clarity and usability.

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
