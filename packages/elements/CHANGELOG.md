# Change Log

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/)
and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- feat(#510): The browser build works without polyfills of Node.js modules or globals, such as `path` or `process`, whether it is imported or required. Outside Node.js, dependencies are described as `core` when they are built-in modules of Node.js 24.

### Changed

- chore(#510): Upgrade `picomatch` to 4.0.7, which no longer requires Node.js modules.

### Fixed

- fix(#510): Built-in modules only available with the `node:` prefix, such as `node:test` or `node:sqlite`, are described as `core` instead of `external`.
- fix(#510): Some extglob patterns now match all the paths they describe, as the same patterns without extglobs do. For example, `src/@(foo/**)` now matches `src/foo`, like `src/foo/**`.
- fix(#510): The ES module build for Node.js no longer throws `Dynamic require of "module" is not supported` when a matcher is created.
- fix(#568): With the `cache` option enabled, `describeElement` no longer gives the files of a folder the description of the first one described, such as a dot file, and returns the same descriptions as with the cache disabled: read the [upgrade notes](https://www.jsboundaries.dev/docs/releases/upgrade-notes/v7-4-0/#dot-files-in-element-folders) to find the affected files.

## [3.2.0] - 2026-10-23

### Changed

- perf: Matching is about 2.5 times faster than in 3.1.2: 60% less linting time with flat config and 57% less with legacy config, measured on the `eslint-plugin` E2E performance fixture. Handlebars templates are compiled once per matcher, and selectors are normalized once per selector object (#524). Normalized selectors and match results are now shared objects: treat them as read-only, and do not mutate a selector after its first use.
- perf(#489): `capture` compiles each pattern once and reuses it for every path. ([@joernroeder](https://github.com/joernroeder))
- perf: The `cache` option now disables only the caches of results (descriptions, matches and captures). Compiled patterns and templates are always kept, and `Matcher.clearCache()` clears them.
- chore(#511): Remove the unused `eslint-module-utils` and `eslint-import-resolver-node` dependencies.

### Fixed

- fix(#494): The element `path` is resolved from where the descriptor `pattern` matched, instead of from the first place its folders appear in the file path. Nested elements whose folder name starts with, or equals, the name of an ancestor now get the right `path`, `fileInternalPath` and parent.
- fix(#495): `capture` returns `null` when the path does not match, as its type declares. As a result, descriptors with `basePattern` only match paths whose left side also matches it, as documented. ([@edoroshenko](https://github.com/edoroshenko))

### Security

- fix(#492): Replace `micromatch` with `picomatch` 2.3.2, which removes the transitive `braces` dependency ([GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm), with no patched release). Glob syntax, captures and Windows paths are unchanged. ([@edoroshenko](https://github.com/edoroshenko))

## [3.1.2] - 2026-10-21

### Changed

- chore: Upgrade `eslint-module-utils` to 2.14.0 and `is-core-module` to 2.17.0.
- chore: Update devDependencies to their latest patch and minor versions.

### Security

- chore: Upgrade `handlebars` to 4.7.10, which fixes JavaScript injection advisories affecting 4.0.0 to 4.7.9.

## [3.1.1] - 2026-08-09

### Fixed

- fix(#479): A matching file descriptor without `capture` no longer resets `file.captured`. Captured values are now merged from every matching file descriptor regardless of declaration order, matching the element descriptor behavior. `exclusive` descriptors still reset captured values.

## [3.1.0] - 2026-07-20

### Added

- feat(#466): Add per-descriptor `stopMatching` and `exclusive` options, available on both element and file descriptors. When a `stopMatching` descriptor matches, previously accumulated types/categories at that path level are kept and no further descriptors are evaluated for that level. `exclusive` additionally discards any previously accumulated matches at that level, keeping only its own match, and takes precedence over `stopMatching` when both are set on the same descriptor. Both options apply independently at each path level, so they affect parent elements the same way they affect the main element.
- feat(#466): Add `filesSingleMatch` option to `DescriptorsConfig`. When `true`, only the first matching file descriptor's category is used and matching stops; default `false` preserves the current accumulation behavior.
- feat(#466): Add `elementsSingleMatch` option to `DescriptorsConfig`, sharing vocabulary with the new `filesSingleMatch`. It is the canonical replacement for `elementsSingleType` and takes precedence over it when both are set.

### Changed

- refactor(#466): `elementsSingleType` is now deprecated in favor of `elementsSingleMatch`. It is kept as a backward-compatible alias with no behavior change.

### Fixed

- docs: Fix build badge URL in README

## [3.0.1] - 2026-07-06

### Fixed

- fix(#457): File descriptors now honor a plain `capture` array without requiring `basePattern`. Previously, `capture` on a `boundaries/files` descriptor without `basePattern` always resulted in `file.captured` being `null`.

## [3.0.0] - 2026-07-05

### Breaking Changes

- feat: `getMatcher` now accepts a `DescriptorsConfig` object instead of an `ElementDescriptor[]` array. The first argument changed from a flat array to an object with optional `elements`, `files`, and `elementsSingleType` properties. Existing code must wrap the array: `getMatcher([...])` → `getMatcher({ elements: [...] })`.
- feat: `DependencyDescription.from` and `DependencyDescription.to` are now `EntityDescription` objects (containing `element`, `file`, and `module` sub-objects) instead of flat `ElementDescription` objects. Code accessing properties like `description.from.type` must change to `description.from.element.types[0]`.
- feat: `ElementDescription.type` (single string) has been replaced by `types` (string array). Elements can now match multiple type descriptors at the same path level. Element selectors still support `type` (matches first type) for backward compatibility, but `types` is the canonical property.
- feat: `origin`, `elementPath`, and `internalPath` have been moved out of element descriptions and selectors. `origin` and `internalPath` are now in `ModuleDescription` / module selectors. `elementPath` has been renamed to `path` in element descriptions. These properties still work in element selectors through legacy backward compatibility, but their canonical location is now in entity selectors with `module` and `file` sub-selectors.
- feat: `ElementDescription.category` is now deprecated. It is still present for backward compatibility but will be removed in a future version. Use file descriptor `categories` instead for more flexible file categorization.
- feat: The serialized cache format has changed. `DescriptorsSerializedCache` now includes 5 separate sub-caches (`elements`, `files`, `entities`, `dependencies`, `modules`). Serialized caches from v2 are incompatible and must be regenerated.
- feat: The `module` property in dependency metadata selectors (`dependency.module`) is now deprecated. Use `to.module.source` via entity selectors to match the base module name instead.

### Added

- feat: Add entity abstraction layer. New `EntityDescription` type combines `element`, `file`, and `module` descriptions into a unified representation. New matcher methods: `describeEntity()`, `isEntityMatch()`, `getEntitySelectorMatching()`, `getEntitySelectorMatchingDescription()`.
- feat: Add new selector types: `EntitySelector` with `element`, `file`, and `module` sub-selectors; `FileSelector` with `path`, `categories`, `captured`, `isIgnored`, and `isUnknown`; `ModuleSelector` with `origin`, `source`, and `internalPath`.
- feat: Add file descriptors system. A new `files` property in `DescriptorsConfig` allows categorizing files independently from elements. `FileDescriptor` supports `pattern`, `category`, and `capture` properties. `FileDescription` provides `path`, `categories`, `captured`, `isIgnored`, and `isUnknown` fields.
- feat: Add module origin system. New `ModuleDescription` type with `origin` (`"local"` | `"external"` | `"core"`), `source`, and `internalPath` properties. New matcher methods: `describeModule()`, `isModuleMatch()`, `getModuleSelectorMatching()`, `getModuleSelectorMatchingDescription()`.
- feat: Add multi-type elements support. Elements can now match multiple type descriptors at the same path level. Behavior is controlled by the `elementsSingleType` option in `DescriptorsConfig` (default: `false` — multi-type mode).
- feat: Add the `partialMatch` element descriptor option (default: `true`). When `true`, the pattern only needs to match a suffix of the file path (right-to-left accumulation, the existing default behavior). When `false`, the pattern is matched against the full file path from the project root while keeping folder semantics (the element `path` is the matched folder prefix). It defaults to `true` for backward compatibility, but will most likely default to `false` in a future major version and eventually be removed, because requiring the full pattern is more intuitive and is already how file descriptors match. It is the recommended replacement for the deprecated `mode: "full"`, and when set to `false` the `mode` option has no effect.
- feat: Array-valued selector properties accept a new array query object with `anyOf`, `allOf`, `noneOf`, `equalsTo` (ordered, exact length), `atIndex` (`{ index, matches }`, negative index supported), and `hasLength` operators (AND-combined). The `atIndex.matches` field accepts a single value or an array (OR semantics). Supported by `file` selector `categories` and `element` selector `types`.
- feat: `anyOf`, `allOf`, and `noneOf` items in `element.types`, `file.categories`, and `parent.types` / `parents[*].types` accept `{ expand: "{{ path }}" }` objects in addition to plain micromatch pattern strings. The expand item resolves the Handlebars path against the template data at match time and spreads the resulting string array as individual matchers. This enables dynamic cross-side comparisons such as "to element must not share any type with from element" (`noneOf: [{ expand: "{{ from.element.types }}" }]`). Mixed static + expand items in the same array are supported. Empty-operand rules apply when the path resolves to null/undefined: empty `noneOf` always passes; empty `anyOf` never matches.
- feat: Add `element` selector `parents` property: an array query over the full ancestor chain (`parents[0]` is the closest parent). `parent` is unchanged and still matches the closest parent.
- feat: Add file matcher methods to `Matcher`: `describeFile()`, `isFileMatch()`, `getFileSelectorMatching()`, and `getFileSelectorMatchingDescription()` to work with file descriptions and file selectors directly without going through the entity abstraction layer.
- feat: Add module matcher methods to `Matcher`: `describeModule()`, `isModuleMatch()`, `getModuleSelectorMatching()`, and `getModuleSelectorMatchingDescription()` to work with module descriptions and module selectors directly without going through the entity abstraction layer.

### Changed

- refactor: Reorganize internal architecture into domain-based module structure (Element, File, Entity, Module, Dependency) for better separation of concerns.
- refactor: Enhance cache system to support 5 separate descriptor type caches for improved granularity.

## [2.0.1] - 2026-03-30

### Changed

- chore: Update `handlebars` from `4.7.8` to `4.7.9`. Resolves critical vulnerability [GHSA-2w6w-674q-4c4q](https://github.com/advisories/GHSA-2w6w-674q-4c4q) and multiple High/Medium CVEs in handlebars 4.7.8. See [handlebars 4.7.9 release notes](https://github.com/handlebars-lang/handlebars.js/releases/tag/v4.7.9) for more details.

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
