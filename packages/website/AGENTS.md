# AGENTS Instructions — `website`

Package-scoped agent instructions for the `website` package (Nx project `website`), a Docusaurus site publishing `jsboundaries.dev`. See `.agents/rules/docs-authoring.md` for the working-vs-versioned docs split, which applies here.

## Versioning tracks `eslint-plugin`, only when docs change

This package's own `package.json` version matches `packages/eslint-plugin`'s version as of the last release that changed `docs/`. A release that doesn't touch `docs/` leaves this package's version, changelog and versioned docs as they are. The steps for a release that does are in `.github/CONTRIBUTING.md` and are run by the `release` skill.

## Structure

- `docs/` is the current, unreleased documentation, organized by topic (`classification`, `guides`, `policies`, `rules`, `selectors`, `settings`, …); `sidebars.ts` defines its navigation.
- `versioned_docs/version-<X.Y.Z>/` + `versioned_sidebars/` + `versions.json` are frozen per-release snapshots created by Docusaurus' own versioning command — never hand-edit a file under `versioned_docs/`.
- `algolia-config.json` is the configuration of the Algolia search index scraper.
