# Change Log

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/)
and this project adheres to [Semantic Versioning](https://semver.org/).

## [1.1.0] - 2026-11-24

### Added

- feat(#686): The `Policies` class describes files and dependencies and evaluates policies as the functions of the same name do, with matchers of its own. Its matchers, and the descriptions they cache unless `boundaries/cache` is `false`, are freed with the instance, while those of the functions are kept for the life of the module.

## [1.0.3] - 2026-11-15

### Changed

- chore: Upgrade `@boundaries/elements` to 3.3.4 and `@boundaries/config` to 1.0.3.

## [1.0.2] - 2026-11-12

### Changed

- chore: Upgrade `@boundaries/elements` to 3.3.3 and `@boundaries/config` to 1.0.2.

## [1.0.1] - 2026-11-05

### Changed

- chore: Upgrade `@boundaries/elements` to 3.3.2 and `@boundaries/config` to 1.0.1.

### Fixed

- fix(#622): `getMatcher` and the functions that use it, such as `describeEntity` and `describeDependency`, use the file descriptors of the settings they receive when other settings differ from them only in the `basePattern` or `baseCapture` of a file descriptor. They used the descriptors of the first of those settings.

## [1.0.0] - 2026-11-02

### Added

- feat(#550): First version. Describes files and dependencies, tells whether the `dependencies` rule of `@boundaries/eslint-plugin` checks a dependency, evaluates its policies and builds the message it reports, without ESLint. It runs in Node.js and in browsers.
