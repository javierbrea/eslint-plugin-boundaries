# Change Log

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/)
and this project adheres to [Semantic Versioning](https://semver.org/).

## [1.0.0] - 2026-11-24

### Added

- feat(#686): First version. Evaluates a whole project against a boundaries config without ESLint: it describes every file and every dependency as `@boundaries/eslint-plugin` does and decides each dependency as its `dependencies` rule does, with the path in the config of each problem and of the deciding policy. It runs in Node.js and in browsers.
