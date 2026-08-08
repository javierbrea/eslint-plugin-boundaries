---
paths:
  - "packages/website/docs/**/*.md"
  - "packages/website/docs/**/*.mdx"
  - "docs/**/*.md"
---

# Docs authoring

For reference-doc structure and tone, defer to the `documentation-writer` skill (Diátaxis framework) rather than restating it here.

## `packages/website/docs/`

This is the **current, unreleased** version of the documentation, published from the working tree. `versioned_docs/version-<X.Y.Z>/` and `versioned_sidebars/` are frozen snapshots of past releases plus their entry in `versions.json` — **never hand-edit a file under `versioned_docs/`**; a docs fix applies to `docs/` (and, if it affects a still-supported release, is backported deliberately, not by editing the snapshot in place). Per-rule reference pages live under `docs/rules/` and mirror the rule names in `packages/eslint-plugin/src/Rules/`.

## Repo-root `docs/`

Holds cross-cutting reference material, not consumer-facing docs: `docs/adr/` (Architectural Decision Records — see `create-architectural-decision-record` skill for the template) and `docs/contributing-workflow.md` (the RFC → issue → sub-issue → milestone process referenced from `.github/CONTRIBUTING.md`). `docs/rules/*.md` are deprecated redirect stubs pointing at `jsboundaries.dev` — don't add content there; per-rule documentation belongs in `packages/website/docs/rules/` instead.
