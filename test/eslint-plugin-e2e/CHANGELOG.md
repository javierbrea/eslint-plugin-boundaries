# Change Log
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/)
and this project adheres to [Semantic Versioning](https://semver.org/).

## [unreleased]
### Added

- feat: Add E2E tests for new object-based selector syntax and related typings. These tests cover various scenarios to ensure the new syntax works correctly and does not introduce any regressions.
- feat: Add performance tests to measure the impact of the new object-based selector syntax on linting speed. These tests will help identify any potential performance issues and ensure that the new syntax does not significantly degrade linting performance.

### Changed
### Fixed
### Removed
### BREAKING CHANGES

## [0.0.1]

### Added

- feat: First version of the e2e tests package. It is a private package that will be used to run eslint programmatically with different configurations to test the plugin in real scenarios. It is not intended to be published.
