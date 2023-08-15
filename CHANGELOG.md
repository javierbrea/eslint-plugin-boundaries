# Change Log
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/)
and this project adheres to [Semantic Versioning](https://semver.org/).

## [unreleased]
### Added
### Changed
### Fixed
### Removed

## [unreleased]

### Fixed
- fix(#295): Replace template values in custom messages using a Regexp, so it replaces all occurrences

### Changed
- chore(deps): Update dependencies
- chore(deps): Use NodeJs 16.x, 18.x and 20.x in pipelines
- refactor: Use optional chain expressions

### Added
- chore: Add meta name and version to plugin exported object
- chore: Handle concurrency in pipelines

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
