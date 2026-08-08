# AGENTS Instructions — `website`

Package-scoped agent instructions for the `website` package (Nx project `website`), a Docusaurus site publishing `jsboundaries.dev`. See `.agents/rules/docs-authoring.md` for the working-vs-versioned docs split, which applies here.

## Versioning is lockstep with `eslint-plugin`

This package's own `package.json` version always matches `packages/eslint-plugin`'s — bump both together during a release (see `.agents/rules/changelog-and-versioning.md`).

## Structure

- `docs/` is the current, unreleased documentation, organized by topic (`classification`, `guides`, `policies`, `rules`, `selectors`, `settings`, …); `sidebars.ts` defines its navigation.
- `versioned_docs/version-<X.Y.Z>/` + `versioned_sidebars/` + `versions.json` are frozen per-release snapshots created by Docusaurus' own versioning command — never hand-edit a file under `versioned_docs/`.
- `_examples/` holds runnable example projects embedded into the docs; keep them in sync with the plugin's actual current API.
- `algolia-config.json` drives the search index; after a docs-affecting release, verify the Algolia index updated (see the "Update Website Search Index" GitHub Actions workflow) — Netlify's deploy webhook can't always pass the auth token the scraper needs, so the update sometimes needs a manual trigger.
