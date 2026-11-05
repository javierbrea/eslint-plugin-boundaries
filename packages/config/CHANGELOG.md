# Change Log

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/)
and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Fixed

- fix(#622): `normalizeSettings` and `normalizeConfig` report an element or file descriptor whose `capture` or `baseCapture` is set and is not an array as invalid, and leave it out.

## [1.0.0] - 2026-11-02

### Added

- feat(#549): First version. Normalizes and validates the settings and rule options of `@boundaries/eslint-plugin` without ESLint, and returns their problems as diagnostics with the path of each affected entry. It runs in Node.js and in browsers.
