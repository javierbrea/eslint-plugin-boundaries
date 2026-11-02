# AGENTS Instructions — `website`

Package-scoped agent instructions for the `website` package (Nx project `website`), a Docusaurus site publishing `jsboundaries.dev`. See `.agents/rules/docs-authoring.md` for the working-vs-versioned docs split, which applies here.

## Versioning

The website's version and the release steps that change it are in step 2 of "Publishing" in `.github/CONTRIBUTING.md`, run by the `release` skill.

## Structure

- `docs/` is the current, unreleased documentation, organized by topic (`classification`, `guides`, `policies`, `rules`, `selectors`, `settings`, …); `sidebars.ts` defines its navigation.
- `versioned_docs/version-<X.Y.Z>/` + `versioned_sidebars/` + `versions.json` are per-release snapshots created by Docusaurus' own versioning command. The snapshot of the latest release (the first entry in `versions.json`) is the published documentation: a change to it (a fix, a clarification, a missing page) is made in that snapshot and its sidebar, and the same change is made in `docs/`, so both stay aligned and the next release keeps it. A change that only describes unreleased behavior goes in `docs/` alone. Snapshots of older releases are never edited.
- `algolia-config.json` is the configuration of the Algolia search index scraper.

## Source layering

`src/` is split into element types whose allowed imports are lint-enforced with the workspace `eslint-plugin-boundaries`; read `eslint.config.mjs` for the policy in force, and classify a new folder there before using it. Imports inside `src/` are relative; `@site/...` is reserved for MDX docs.
