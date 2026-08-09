# AGENTS Instructions — `@boundaries/elements`

Package-scoped agent instructions for `@boundaries/elements` (Nx project `elements`). See `.agents/rules/unit-testing.md` and `typescript-conventions.md` for conventions that apply here too. `docs/adr/adr-0001-multidimensional-classification-entity-model.md` is the source of the entity model (element, file, module) this package implements.

## `Descriptor` × `Matcher` grid

`src/Descriptor/` and `src/Matcher/` are the two core axes, each with one subfolder per entity level: `Entity`, `File`, `Module`, `Element`, `Dependency`, `Shared`. A `Descriptor` builds the structured representation of an entity from raw config; the matching `Matcher` decides whether a given input matches a descriptor. Keep new entity-level logic in the matching pair of folders rather than introducing a new axis.

## Other top-level folders

- `Cache` — memoizes matcher/descriptor results; has an explicit `CacheDisabled` variant.
- `Config` — normalizes and validates the plugin's `settings` shape.
- `Shared` — cross-cutting helpers (`Paths`, `TypeGuards`, micromatch types) used across both axes.
- `Legacy` — backwards-compatible helpers (e.g. `TemplateHelpers`) kept for older config shapes; don't extend it with new functionality, add new code in the current shape instead.
- `__test__` — cross-module integration specs (`describeElement`, `isDependencyMatch`, …) that exercise the public API end-to-end, distinct from the unit specs colocated with each module.

`src/index.ts` re-exports each folder's `Public.ts`/`*.types.ts` surface — extend a folder's `Public.ts` when a new symbol needs to be externally consumable, don't add a new top-level export elsewhere.

## Build and test shape

- Built with **tsup** (`tsup.config.js`), not raw `tsc`; type-checked separately with `tsc --noEmit` against `tsconfig.eslint.json` for linting.
- Specs and `*.types.ts` files are colocated with their source (`src/Cache/Cache.spec.ts` next to `src/Cache/Cache.ts`).
- This is the only package with a `test:mutation` target (Stryker) — run it when changing matching/descriptor logic, since branch-level correctness there is easy to break silently.
