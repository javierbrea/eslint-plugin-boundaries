# Change Log
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/)
and this project adheres to [Semantic Versioning](http://semver.org/).

## [unreleased]
### Added
### Changed
- refactor: Use eslint-module-utils/resolve to resolve imports. import/resolver setting can be used for custom resolvers
### Fixed
### Removed

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
