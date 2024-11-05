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

## [5.0.0] - 2024-11-05

### Changed

- feat([#329](https://github.com/javierbrea/eslint-plugin-boundaries/issues/329)): Modify dependencies, tests and docs to support eslint v9
- chore([#338](https://github.com/javierbrea/eslint-plugin-boundaries/issues/338)): Bump micromatch dependency to 4.0.8
- docs: Clarify include/exclude precedence in docs ([@robw-mercury](https://github.com/robw-mercury))

## [5.0.0-beta.1] - 2024-07-07

### Changed
- chore: Add changes from release [4.2.2](#4-2-2)

## [4.2.2] - 2024-07-07

### Changed
- chore([#334](https://github.com/javierbrea/eslint-plugin-boundaries/issues/334)): Remove is-core-module dependency ([@wojtekmaj](https://github.com/wojtekmaj))
- chore(dependencies): Bump micromatch to 4.0.7
- chore(devDependencies): Bum @typescript-eslint/eslint-plugin" to 7.15.0
- chore(devDependencies): Bump @typescript-eslint/parser to 7.15.0
- chore(devDependencies): Bump eslint to 8.57.0
- chore(devDependencies): Bump eslint-plugin-local-rules to 3.0.2
- chore(devDependencies): Bump lint-staged to 15.2.7
- chore(devDependencies): Bump mindsers/changelog-reader-action action to v2.2.3
- chore(devDependencies): Bumb prettier to 3.3.2
- chore(devDependencies): Bump EndBug/version-check action to v2.1.4

## [5.0.0-beta.0] - 2024-06-17

### Changed
- feat: Modify dependencies and tests to support eslint v9
- feat: Remove `plugins` property from preset configurations, given that eslint v9 does not support defining plugins by using strings in the configuration. Added example to the main readme file to show how the plugin and predefined configurations should be used now.
- chore: Migrate self eslint configuration to v9 format.

### Removed
- chore: Drop support for Node.js versions lower than 18.18


## [4.2.1] - 2024-05-16

### Changed
- chore: Bump eslint-module-utils to 2.8.1
- chore: Update devDependencies
- chore: Upgrade Node.js versions used in pipelines. Remove Node.js 16.x. Add Node.js 22.x
- chore: Bump actions/cache to v4
- chore: Bump actions/upload-artifact to v4
- chore: Bump actions/download-artifact to v4

## [4.2.0] - 2024-01-16

### Added
- feat: Add `require` dependency node, enabling to analyze dependencies in `require(...)` calls
- chore: Lint code using eslint-plugin-boundaries in its own codebase

## [4.1.0] - 2024-01-13

### Changed
- feat(#323): Specify which element type has issues during settings validation (Thanks to [@hmnzr](https://github.com/hmnzr))

## [4.0.1] - 2023-12-01

### Fixed
- fix: Avoid error when rule element matchers define a capture key but some element does not have that capture key

## [4.0.0] - 2023-12-01

### Added

- feat(#213): Add `dependency-nodes` setting to allow analyzing dependencies from additional nodes, such as exports or dynamic imports. ([@gridsane](https://github.com/gridsane))
- feat: Add `additional-dependency-nodes` setting to add custom dependency nodes to the default ones. For example, you could enable to analyze dependencies in `jest.mock(...)`, etc. ([@gridsane](https://github.com/gridsane))

### BREAKING CHANGES

- fix: Fixed the error position in multiline imports. See ["how to migrate from v3 to v4" guide](./docs/guides/how-to-migrate-from-v3-to-v4.md).

## [3.4.1] - 2023-11-01

### Changed

- chore(deps): Update dependencies

## [3.4.0] - 2023-08-26

### Added

- feat(#296): Add `root-path` setting to allow defining the root path of the project. It is useful when executing the eslint command from a different folder than the project root.

## [3.3.0] - 2023-08-19

### Added
- feat(#298): Add `importKind` option to `element-types`, `entry-point` and `external` rules. It allows to define if the rule applies when the dependency is being imported as a value or as a type.
- chore: Add meta name and version to plugin exported object
- chore: Handle concurrency in pipelines

### Fixed
- fix(#295): Replace template values in custom messages using a Regexp, so it replaces all occurrences
- fix: Do not throw error when rule contains matchers for captured values but element has not captured values

### Changed
- chore(deps): Update dependencies
- chore(deps): Use NodeJs 16.x, 18.x and 20.x in pipelines
- refactor: Use optional chain expressions

## [3.2.0] - 2023-07-30

### Changed
- feat(#297): Support matching imported external module path in `external` rule using micromatch patterns

## [3.1.1] - 2023-04-03

### Changed
- chore(deps): Update dependencies

## [3.1.0] - 2022-12-06

### Added
- feat(#243): Support templates in rules main matchers. `${from.X}` and `${target.X}` templates are replaced by corresponding captured values
- feat: Add aliases `from` (file) and `target` (dependency) to custom messages templates

### Changed
- chore(deps): Update dependencies

### Fixed

- fix(#260): Avoid wrong caches in external dependencies. Use the dependency source as cache key in that case.
- chore: Fix check-package-version action

## [3.0.0] - 2022-08-30

### Removed
- chore(deps): Drop support for Node.js 12.x

## [2.10.2] - 2022-08-30

### Changed
- chore(deps): Update devDependencies
- chore(renovate): Avoid upgrading chalk to v5

### Removed
- chore(deps): Drop support for Node.js 12.x. (Affects only to dev scripts)

### Fixed
- docs: Fix typo in readme

## [2.10.1] - 2022-05-30

### Changed
- refactor: Fix Sonar smells

## [2.10.0] - 2022-05-30

### Added
- chore(): Run tests also using Node.js v18.x

### Changed
- chore(deps): Update dependencies
- chore(deps): Update devDependencies

## [2.9.0] - 2022-02-22

### Added
- feat(#170): Support custom messages in `no-external` rule config

### Changed
- docs: Minor changes to contributing guidelines
- chore(deps): Update devDependencies

## [2.8.0] - 2021-11-28

### Added
- feat(#171): Support custom messages in `no-private` rule config

## [2.7.0] - 2021-11-27

### Added
- feat(#169): Support custom messages in `entry-point` rule config

### Fixed
- docs: Fix some typos and links in `element-types` rule docs

### Changed
- chore(deps): Update devDependencies

## [2.6.0] - 2021-11-13

### Added
- feat(#87): Support custom messages in `element-types` rule config

### Changed
- feat(#87): Add context about the specific rule forbidding the import to the `element-types` error message. Add information about file and dependency when import is forbidden due to the default configuration.
- refactor: Add isArray and isString utils
- chore(deps): Support any eslint version greater than 6.x in peerDependencies

### Fixed
- fix: Support array of micromatch patterns when replacing captured values
- docs: Fix broken links

### Removed
- feat: Remove cache traces from debug mode

## [2.5.1] - 2021-11-06

### Fixed
- docs(#160): Fix links to debug mode section
- fix(#133): Remove plugin namespace from rules documentation links
- fix(#133): no-private rule had undefined name

### Removed
- docs: Remove npm dependencies badge because david-dm site is down

## [2.5.0] - 2021-11-01
### Changed
- chore(deps): Update devDependencies
- chore(deps): Support any NodeJs version greater than 12.x. Run tests also with NodeJS 17. Use NodeJS 16 in publish pipelines

## [2.4.2] - 2021-08-22

### Added
- docs(#107): Add usage with TypeScript docs

### Changed
- chore(deps): Update devDependencies


## [2.4.1] - 2021-08-16

### Fixed
- fix: Remove trace when ESLINT_PLUGIN_BOUNDARIES_DEBUG is not set

## [2.4.0] - 2021-08-15

### Added
- feat: Improve performance adding internal cache

### Changed
- chore(deps): Update devDependencies

## [2.3.0] - 2021-07-20

### Added
- feat(#131): Add `boundaries/include` option allowing to ignore all by default except files matching the pattern.

### Changed
- feat(#132): Detect paths from any `node_modules` folder as external
- chore(deps): Update devDependencies

## [2.2.0] - 2021-05-29

### Added
- chore(deps): Add node.js v16.x to engines and add tests using it

### Changed
- chore(deps): Update devDependencies
- chore: Migrate Sonar project
## [2.1.0] - 2021-03-25

### Added
- feat: Add basePattern and baseCapture options to elements settings (#97)

### Changed
- chore(deps): Update dependencies

### Fixed
- fix: Avoid crash when import path is broken (#96)

## [2.0.0] - 2021-02-02

### Added
- feat: Support multiple levels of categorization and any type of project structure (#75)
- feat: Support elements as files (#75)
- feat(settings): Added support for `import/resolver` setting
- feat(options): Support micromatch patterns in rules options (#11, #10)
- feat: Add debug mode
- test: Add more than 500 tests using different project structure examples, with different categorization levels, elements as folders, as files, etc.
- test: Add one test for each rules docs example
- chore: Run tests on Windows OS again (#74)

### Changed
- feat(settings): Deprecated `boundaries/types` setting. `boundaries/elements` should be used instead. If it is not present, `boundaries/types` will be used as fallback
- feat(rules): Rename `allowed-types` rule into `element-types` (now it can be used to allow/disallow). Change the format of rule options
- feat(rules): Rename `no-external` rule into `external` (now it can be used to allow/disallow). Change the format of rule options
- feat(rules): Change the format of `entry-point` rule options (now it support allow/disallow format)
- feat(rules): Rename `no-import-ignored` rule into `no-ignored` (the majority of the plugin rules are referred to `import` statements, so it is not necessary to specify it in the rule name)
- feat(rules): Rename `no-import-not-recognized-types` rule into `no-unknown`
- feat(rules): Rename `prefer-recognized-types` rule into `no-unknown-files`
- refactor(core): Use `eslint-module-utils/resolve` to get files and import paths. Use `micromatch` to match settings and options. Adapt the whole core to this new approach

### Fixed
- fix: Support scoped packages in external rule (#59)

### Removed
- feat(settings): Removed `boundaries/alias` setting

### BREAKING CHANGES
- Removed `boundaries/alias` setting. `import/resolver` has to be used instead
- Renamed `allowed-types` rule into `element-types` (now it can be used to allow/disallow). Changed the format of rule options
- Changed the format of `entry-point` rule options (now it support allow/disallow format)
- Renamed `no-external` rule into `external` (now it can be used to allow/disallow). Changed the format of rule options
- Renamed `no-import-ignored` rule into `no-ignored` (the majority of the plugin rules are referred to `import` statements, so it is not necessary to specify it in the rule name)
- Renamed `no-import-not-recognized-types` rule into `no-unknown`
- Renamed `prefer-recognized-types` rule into `no-unknown-files`

## [2.0.0-beta.4] - 2021-01-30

### Added
- feat: debug files and imports info when ESLINT_PLUGIN_BOUNDARIES_DEBUG environment variable exists
- feat: `mode` option in `elements` setting now also accepts `full` as value. Pattern will try to match the full path in that case.
- feat: support defining multiple micromatch patterns in an array in the `pattern` property of `elements` setting.

## [2.0.0-beta.3] - 2021-01-26

### Fixed
- fix: node_modules packages were being recognized as local

## [2.0.0-beta.2] - 2021-01-26

### Fixed
- fix: Add folder resolver-legacy-alias to npm package

## [2.0.0-beta.1] - 2021-01-26

### Added
- feat: Support multiple levels of categorization and any type of project structure (#75)
- feat: Support elements as files (#75)
- feat(settings): Added support for `import/resolver` setting
- feat(options): Support micromatch patterns in rules options (#11, #10)
- test: Add more than 500 tests using different project structure examples, with different categorization levels, elements as folders, as files, etc.
- test: Add one test for each rules docs example

### Changed
- feat(settings): Deprecated `boundaries/types` setting. `boundaries/elements` should be used instead. If it is not present, `boundaries/types` will be used as fallback
- feat(rules): Rename `allowed-types` rule into `element-types` (now it can be used to allow/disallow). Change the format of rule options
- feat(rules): Rename `no-external` rule into `external` (now it can be used to allow/disallow). Change the format of rule options
- feat(rules): Change the format of `entry-point` rule options (now it support allow/disallow format)
- feat(rules): Rename `no-import-ignored` rule into `no-ignored` (the majority of the plugin rules are referred to `import` statements, so it is not necessary to specify it in the rule name)
- feat(rules): Rename `no-import-not-recognized-types` rule into `no-unknown`
- feat(rules): Rename `prefer-recognized-types` rule into `no-unknown-files`
- refactor(core): Use `eslint-module-utils/resolve` to get files and import paths. Use `micromatch` to match settings and options. Adapt the whole core to this new approach

### Fixed
- fix: Support scoped packages in external rule (#59)

### Removed
- feat(settings): Removed `boundaries/alias` setting

### BREAKING CHANGES
- Removed `boundaries/alias` setting. `import/resolver` has to be used instead
- Renamed `allowed-types` rule into `element-types` (now it can be used to allow/disallow). Changed the format of rule options
- Changed the format of `entry-point` rule options (now it support allow/disallow format)
- Renamed `no-external` rule into `external` (now it can be used to allow/disallow). Changed the format of rule options
- Renamed `no-import-ignored` rule into `no-ignored` (the majority of the plugin rules are referred to `import` statements, so it is not necessary to specify it in the rule name)
- Renamed `no-import-not-recognized-types` rule into `no-unknown`
- Renamed `prefer-recognized-types` rule into `no-unknown-files`

## [1.1.1] - 2020-12-11
### Added
- chore(deps): Add Node.js 10.x support while it is in maintenance

### Changed
- chore(ci-cd): Migrate build and publish pipelines to github actions
- chore(deps): Update dependencies

### Fixed
- fix(#65): Fixed error on dependency scanning when dependencyInfo.name is null (thanks to @skurfuerst)

## [1.1.0] - 2020-11-12
### Added
- feat(no-external): Allow forbid importing external libraries specifiers
- chore(ci-cd): Add github workflows for publishing to gpr and check package version
- chore(engines): Add node v15.x to engines

### Fixed
- fix(no-external): Do not allow importing subfolders of forbidden external libraries

## [1.0.2] - 2020-10-18
### Added
- chore: Run tests on Windows OS in pipelines

### Fixed
- fix: Plugin was not working properly on Windows

## [1.0.1] - 2020-08-27
### Changed
- chore: Update dependencies

### Fixed
- docs: Fix typo

## [1.0.0] - 2020-06-13
### Added
- test(unit): Add unit tests
- test(coverage): Increase coverage threshold to 100
- feat(logs): Add chalk to warning logs

### Changed
- refactor: Remove duplicated code

## [1.0.0-beta.3] - 2020-06-12
### Fixed
- fix(no-external): Fix no-external rule. There was an error reading options, so it was not being applied.
- fix(prefer-recognized-types): Do not apply prefer-recognized-types rule to ignored files.
- fix(rules): Ignore dependencies in all rules (except no-import-ignored) if they are marked as ignored

## [1.0.0-beta.2] - 2020-06-11
### Fixed
- fix(helpers): Avoid error in helper when an element is not recognized

## [1.0.0-beta.1] - 2020-06-11
### Added
- First pre-release
