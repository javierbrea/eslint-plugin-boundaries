# AGENTS Instructions — `website`

Package-scoped agent instructions for the `website` package (Nx project `website`), a Docusaurus site publishing `jsboundaries.dev`. See `.agents/rules/docs-authoring.md` for the working-vs-versioned docs split, which applies here.

## Versioning

The website's version and the release steps that change it are in step 2 of "Publishing" in `.github/CONTRIBUTING.md`, run by the `release` skill.

## Structure

- `docs/` is the current, unreleased documentation, organized by topic (`classification`, `guides`, `policies`, `rules`, `selectors`, `settings`, …); `sidebars.ts` defines its navigation.
- `versioned_docs/version-<X.Y.Z>/` + `versioned_sidebars/` + `versions.json` are frozen per-release snapshots created by Docusaurus' own versioning command — never hand-edit a file under `versioned_docs/`.
- `algolia-config.json` is the configuration of the Algolia search index scraper.

## Source layering

`src/` is split into element types (pages, theme overrides, client modules, home sections, site chrome, UI kit, motion, data, Prism theme, MDX components) whose allowed imports are lint-enforced with the workspace `eslint-plugin-boundaries` (`lint` builds `eslint-plugin` first); read `eslint.config.mjs` for the policy in force, and classify a new folder there before using it. Imports inside `src/` are relative, never `@site/src/...` (reserved for MDX docs), because the boundaries rules only see resolvable imports.
