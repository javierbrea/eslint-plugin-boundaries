---
title: "ADR-0001: Multidimensional Classification via the Entity Model (element, file, module)"
status: "Accepted"
date: "2026-07-04"
authors: "javierbrea (maintainer), with community feedback via GitHub Discussion #369"
tags: ["architecture", "decision", "classification", "eslint-plugin-boundaries"]
supersedes: ""
superseded_by: ""
---

# ADR-0001: Multidimensional Classification via the Entity Model (element, file, module)

## Status

**Accepted**

Shipped in `eslint-plugin-boundaries` v7.0.0. Fully documented in [Overview](../../packages/website/docs/overview.md), [Classification](../../packages/website/docs/classification/classification.md), and the [v6 to v7 migration guide](../../packages/website/docs/releases/migration-guides/v6-to-v7.mdx).

## Context

Before v7, the plugin classified each file through a single flat **element type**, derived from the first `boundaries/elements` descriptor that matched its path. This worked well for grouping files by architectural role (`controllers/*`, `views/*`, `models/*`), but broke down whenever a file legitimately belonged to more than one classification axis at once.

[Issue #348](https://github.com/javierbrea/eslint-plugin-boundaries/issues/348) captured the concrete motivating case: a file such as `person.service.ts` is simultaneously a **service** (identified by name/pattern) and part of a **domain** (identified by folder structure, e.g. `domains/person/*`). Policies needed to reason about both facts at once — e.g. "services may only import services/repositories from the same domain" — but the single-type model could only ever keep the first match. The reporter noted that capture groups could technically approximate this, but become unmaintainable as the number of architectural facets grows, undermining the plugin's core value of organizational clarity.

[Discussion #369](https://github.com/javierbrea/eslint-plugin-boundaries/discussions/369) tracked the RFC across several iterations before converging on the final design:

- **V1 (initial proposal)**: add an opt-in `category` field to element descriptors, allowing an element to accumulate multiple types.
- **V2**: split `elements` and `files` into separate configuration blocks, recognizing that multi-valued classification is a property of *files*, not of the architectural *structure* itself.
- **V3 (final, accepted)**: the **entity model** — three fully independent classification axes (`element`, `file`, `module`) unified under one concept, an **entity**, with a new `file` layer and symmetric **entity selectors**.

Any solution also had to satisfy a hard constraint: the plugin has a large existing user base on v6 configurations. A migration that forced a rewrite of `boundaries/elements` or rule selectors was considered unacceptable friction for a classification refinement.

## Decision

Adopt the **entity model**: every file is described along three orthogonal axes, and a dependency description links two such entities plus dependency metadata.

- **element** — the architectural container a file belongs to (usually a folder), configured via `boundaries/elements`. Single-type by default (`boundaries/elements-single-type: true`); opt-in multi-type by setting it to `false`, in which case an element accumulates every matching descriptor's type into `types`.
- **file** — a cross-cutting category label on the file itself, independent of which element it lives in (e.g. `test`, `style`), configured via the new `boundaries/files` setting. Categories **always accumulate** — a file can match several `boundaries/files` patterns and carry all of their categories simultaneously.
- **module** — where a dependency resolves to (`origin`: `local` / `external` / `core`, plus `source` and `internalPath`). Fully derived from the import; never configured directly (aside from `boundaries/flag-as-external` and `boundaries/root-path` influencing origin detection).

Together, `element` + `file` + `module` form an **entity** — the unit the plugin analyzes. A dependency description becomes `{ from: entity, to: entity, dependency: metadata }`, where `dependency` carries fully computed relationship metadata (`kind`, `relationship`, `specifiers`, …) that is never configured.

Policies match entities through **entity selectors**: `{ element: {...}, file: {...}, module: {...} }`, where every provided sub-selector must match (AND semantics) and omitted sub-selectors match anything. To query the new accumulating arrays (`element.types`, `file.categories`, `element.parents`), the design adds array matching operators: `anyOf`, `allOf`, `noneOf`, `equalsTo`, `atIndex`, `hasLength`.

Adoption is **entirely additive and opt-in**: existing v6 configurations keep working unchanged, legacy flat element selectors (`{ type: "component" }`) are auto-converted internally to entity selectors, and users migrate one layer at a time (add `boundaries/files`, then adopt entity selectors, then opt into multi-type elements) — each step delivering value independently.

## Consequences

### Positive

- **POS-001**: Files can be classified along independent, simultaneous dimensions — solving the exact `person.service.ts` (service + domain) case from #348 — without needing capture-group workarounds.
- **POS-002**: File categories (`test`, `style`, `story`, …) are now reusable across every element, instead of requiring a category to be baked into each element descriptor.
- **POS-003**: External and core dependencies can be matched precisely via `to.module.*` directly inside `boundaries/dependencies`, replacing the need for the separate deprecated `external` rule for most cases.
- **POS-004**: Zero-config upgrade path — v6 users install v7 and get identical enforcement behavior with no required configuration changes.
- **POS-005**: Custom message templates gain full entity access (`{{from.element.types}}`, `{{to.file.categories}}`, `{{to.module.source}}`), enabling richer, more precise error messages.
- **POS-006**: The three-axis model is future-proof: new capabilities can be added to any one axis (or a new axis) without disturbing the other two.

### Negative

- **NEG-001**: Three deprecated surfaces now coexist with their replacements — element-level `category`, `dependency.module`, and `mode` — each triggering console warnings and requiring one-time legacy-pattern detection on every lint pass until `boundaries/legacy-warnings: false` is set.
- **NEG-002**: The conceptual surface area grows: users must now reason about three axes (element/file/module) plus the computed `dependency` metadata layer, versus a single flat element type in v6. This raises the learning curve for new users even though it is optional depth.
- **NEG-003**: Default report messages changed shape (captured values are now formatted as `key="value"`, multi-type elements list all types, external dependencies report origin and source). Projects asserting exact error strings in snapshots or CI must re-record those assertions after upgrading.
- **NEG-004**: Several renames ship alongside the model (`no-unknown` → `no-unknown-dependencies`, `no-ignored` → `no-ignored-dependencies`, `rules` option → `policies`, `rule` template variable → `policy`) to keep terminology consistent with the new model, adding further (backward-compatible but eventually-removed) deprecation surface.

## Alternatives Considered

### V1: Multi-type at the Element Level

- **ALT-001**: **Description**: Add an opt-in `category` field directly to element descriptors, letting a single element accumulate multiple types as more descriptors matched its path.
- **ALT-002**: **Rejection Reason**: Conflated two different concerns — an element's *structural identity* (which architectural container it belongs to) with *file-level labels* that cut across containers. This made parent-element relationships and general architectural reasoning harder to follow, since "what element is this?" and "what labels does this file carry?" became the same mechanism.

### Nested File Selectors Under an Element Sub-Selector

- **ALT-003**: **Description**: An intermediate iteration nested file-matching inside an element selector (e.g. `element: { file: {...} } }`), rather than giving `file` its own top-level sub-selector alongside `element` and `module`.
- **ALT-004**: **Rejection Reason**: Replaced with symmetric, independent entity selectors (`{ element, file, module }` as siblings) so each axis can be inspected and matched on its own terms, without implying a hierarchy between them.

### Single `mode` Knob for Element Matching

- **ALT-005**: **Description**: The pre-existing `mode` property (`"folder"` / `"file"` / `"full"`) controlled whether an element descriptor matched a folder, a single file, or a full path.
- **ALT-006**: **Rejection Reason**: Deprecated in favor of two clearer, single-purpose mechanisms: file descriptors (`boundaries/files`) for file-level classification (replacing `mode: "file"`), and a boolean `partialMatch: false` for full-path folder matching with clear semantics (replacing `mode: "full"`). This separated "classify a file" from "match a full path" instead of overloading one flag with three meanings.

### Capture-Group-Only Workaround (proposed in #348)

- **ALT-007**: **Description**: Use existing `capture` groups on element patterns to encode additional dimensions (e.g. capture both a "kind" and a "domain" fragment from the path) instead of adding a new classification layer.
- **ALT-008**: **Rejection Reason**: Acknowledged as technically possible but explicitly rejected by the issue reporter and maintainer as unmaintainable at scale — every additional architectural facet would require more elaborate capture patterns, eroding the plugin's core promise of clear, declarative boundaries.

## Implementation Notes

- **IMP-001**: Rollout is strictly additive — `boundaries/files` is a new, independent setting; `boundaries/elements-single-type` defaults to `true` to preserve v6 single-type behavior; nothing changes for existing users until they opt in.
- **IMP-002**: Legacy flat element selectors and the deprecated `category` / `dependency.module` / `mode` properties are auto-converted internally and keep functioning identically, each surfacing a deprecation warning (suppressible via `boundaries/legacy-warnings: false` once migration is complete).
- **IMP-003**: `boundaries/dependencies` only checks `local`-origin dependencies by default; matching `external`/`core` modules via `to.module.*` requires opting in with `checkAllOrigins: true`.
- **IMP-004**: Migration is incremental and documented step-by-step in the [v6-to-v7 migration guide](../../packages/website/docs/releases/migration-guides/v6-to-v7.mdx): add file descriptors → adopt entity selectors → optionally enable multi-type elements → adopt module selectors → disable legacy warnings once fully migrated.
- **IMP-005**: Success criterion for the migration path was empirically validated: real v6 configurations run unchanged under v7 with identical lint results (aside from the documented default-message wording changes).

## References

- **REF-001**: [GitHub Issue #348](https://github.com/javierbrea/eslint-plugin-boundaries/issues/348) — the original feature request and motivating use case (service + domain dual classification).
- **REF-002**: [GitHub Discussion #369](https://github.com/javierbrea/eslint-plugin-boundaries/discussions/369) — the RFC thread documenting the V1 → V2 → V3 design evolution and rejected alternatives.
- **REF-003**: [Overview](../../packages/website/docs/overview.md) — high-level introduction to the element/file/module layers and how they compose into dependency descriptions.
- **REF-004**: [Classification](../../packages/website/docs/classification/classification.md) — the full entity and dependency description reference.
- **REF-005**: [Migration Guide v6 to v7](../../packages/website/docs/releases/migration-guides/v6-to-v7.mdx) — complete scope of changes, deprecations, and the incremental adoption path.
