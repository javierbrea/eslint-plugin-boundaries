# Change Log
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/)
and this project adheres to [Semantic Versioning](http://semver.org/).

## [unreleased]
### Added
### Changed
### Fixed
### Removed
### BREAKING CHANGES

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
