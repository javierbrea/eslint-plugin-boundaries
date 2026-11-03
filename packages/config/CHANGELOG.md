# Change Log

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/)
and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Changed

- feat(#430): The `name` property is now required in `boundaries/additional-dependency-nodes`. Objects without a valid `name` are considered invalid and ignored, emitting a warning, instead of being accepted with a soft suggestion.
- chore(#584): The `DebugSetting`, `DebugFilterSetting`, `EntryPointRule` and `ExternalRule` types have a TSDoc description, so editors describe them.

### BREAKING CHANGES

- Custom dependency nodes defined in `boundaries/additional-dependency-nodes` without a `name` property were previously accepted; now they are ignored, and the `name` property of the `DependencyNodeSelector` type is required. Add a unique `name` to each custom dependency node.

## [1.0.0] - 2026-11-02

### Added

- feat(#549): First version. Normalizes and validates the settings and rule options of `@boundaries/eslint-plugin` without ESLint, and returns their problems as diagnostics with the path of each affected entry. It runs in Node.js and in browsers.
