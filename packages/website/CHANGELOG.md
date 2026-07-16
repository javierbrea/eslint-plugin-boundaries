# Change Log
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/)
and this project adheres to [Semantic Versioning](https://semver.org/).

## [unreleased]
### Added
### Changed
- docs(#440): Point the TypeScript Support guide to the new in-repo `examples/typescript` folder instead of the standalone `epb-ts-example` repository.
### Fixed
### Removed
### Breaking Changes

## [7.0.0] - 2026-07-05

### Added

- feat: Add "v6 to v7" migration guide to the documentation.
- feat: Add `HomepageMultiLayer` section to the home page, showcasing multi-dimensional/multi-layer classification.
- feat: Add "v7-launch" announcement bar highlighting file descriptors, multi-dimensional classification and the zero-breaking-changes upgrade, linking to the "v6 to v7" migration guide.
- feat: Add dedicated "Files", "Modules" and "Dependency" pages to the "Classification" section, and per-type pages to the "Selectors" and "Policies" sections.
- feat: Adapt all content and examples in the documentation to the new file descriptors, multi-dimensional classification, and array queries features.

### Changed

- feat: Restructure the sidebar, flattening the single "Setup" section into four top-level sections: "Classification", "Selectors", "Policies" and "Settings".
- feat: Change links in navigation bar to point to the new "Classifications", "Selectors", and "Policies" sections, instead of the old "Setup" section.
- feat: Change footer link from "Setup" to "Settings" section.
- chore: Upgrade Docusaurus from `3.9.2` to `3.10.1`.

## [6.0.0] - 2026-03-15

### Added

- feat(#401): Publish v6.0.0 documentation website with migration guides, updated rules reference, and new selector syntax documentation.
- feat: Add keywords to all pages to improve searchability and SEO.

### Changed

- feat: Adapt docs to the new `object-based` selectors syntax.
- feat: Add "Deprecated Rules" subsection to the sidebar, and move there the deprecated rules documentation.

## [5.4.0] - 2026-02-02

### Added

- feat: Add `boundaries/flag-as-external` setting to allow better control over external module identification
- feat: Add "Monorepo Setup" guide to the documentation, explaining how to configure the plugin in monorepo projects using `boundaries/flag-as-external` setting.
