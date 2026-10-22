# AGENTS Instructions — `website`

Package-scoped agent instructions for the `website` package (Nx project `website`), a Docusaurus site publishing `jsboundaries.dev`. See `.agents/rules/docs-authoring.md` for the working-vs-versioned docs split, which applies here.

## Versioning

The website's version and the release steps that change it are in step 2 of "Publishing" in `.github/CONTRIBUTING.md`, run by the `release` skill.

## Structure

- `docs/` is the current, unreleased documentation, organized by topic (`classification`, `guides`, `policies`, `rules`, `selectors`, `settings`, …); `sidebars.ts` defines its navigation.
- `versioned_docs/version-<X.Y.Z>/` + `versioned_sidebars/` + `versions.json` are frozen per-release snapshots created by Docusaurus' own versioning command — never hand-edit a file under `versioned_docs/`.
- `algolia-config.json` is the configuration of the Algolia search index scraper.
