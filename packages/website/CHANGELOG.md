# Change Log

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/)
and this project adheres to [Semantic Versioning](https://semver.org/).

> [!INFO]
> Versions marked as `-docs` are documentation-only releases that do not include any code changes. Other versions are code releases that may include documentation changes as well, and are paired with a corresponding release in the `eslint-plugin-boundaries` package.

## [7.4.0] - 2026-10-27

### Added

- docs(#510): Add the v7.4.0 upgrade notes: how to find the imports of Node.js built-in modules with the `node:` prefix and the extglob patterns that the fixes affect, and how to adapt the configuration.
- docs(#568): Add the dot files in element folders section to the v7.4.0 upgrade notes.

### Changed

- docs(#510): The Modules classification page says that the built-in modules that only exist with the `node:` prefix are `core` only with it.
- feat: New visual foundation for the site: color palette, self-hosted Sora and IBM Plex typefaces, smaller base type. The navbar and footer now follow the light or dark theme.
- feat: New home page: blueprint hero with a live-drawn architecture sheet, the three-step walkthrough, feature specification, live GitHub and npm numbers, and a playground preview. The navbar shows the live GitHub stars and a "Get started" button.
- feat: Documentation pages adopt the new design: blueprint code blocks in both themes, semantic admonitions, restyled sidebar, table of contents, tables, search and 404 page.
- feat: Links to the site show a new preview image, in the new design.
- chore(#570): Document every prop of the site components in their TSDoc.

### Removed

- feat: Remove the "Version 7 is here" announcement bar.

### Fixed

- fix: Wide tables and diff code blocks in the docs can be scrolled with the keyboard.
- fix(#572): The element relationship table of the Dependency Metadata page had `relationship.from` and `relationship.to` swapped. It now matches what the plugin returns, and both pages that describe the properties say which side each one describes.

## [7.3.0] - 2026-10-23

### Added

- docs(#495): Add the Upgrade Notes section to the Releases docs, starting with the v7.3.0 notes: how to find the files affected by the `basePattern` fix, and how to adapt the configuration.
- docs(#494): Add the nested element paths section to the v7.3.0 upgrade notes.

### Changed

- docs(#492): The `capture` sections of the Elements and Files classification pages now say that captures use picomatch.
- docs: The `boundaries/cache` setting now explains that it disables only the caches of results, and that compiled patterns and templates are always reused.

## [7.1.0] - 2026-07-20

### Added

- docs(#467): Document `boundaries/files-single-match`, `boundaries/elements-single-match` (canonical replacement for the deprecated `boundaries/elements-single-type`), and the per-descriptor `stopMatching`/`exclusive` options on file and element descriptors, in the Settings reference and the Files/Elements classification pages.
- docs(#431): Add Oxlint integration guide to the documentation, showing how to use the plugin with Oxlint instead of ESLint.

## [7.0.0-docs.1] - 2026-07-17

- docs(#440): Point the TypeScript Support guide to the new in-repo `examples/typescript` folder instead of the standalone `epb-ts-example` repository.

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
