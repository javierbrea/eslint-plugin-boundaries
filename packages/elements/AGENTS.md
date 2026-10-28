# AGENTS Instructions — `@boundaries/elements`

Package-scoped agent instructions for `@boundaries/elements` (Nx project `elements`). See `.agents/rules/unit-testing.md` and `typescript-conventions.md` for conventions that apply here too. `docs/adr/adr-0001-multidimensional-classification-entity-model.md` is the source of the entity model (element, file, module) this package implements.

## `Descriptor` × `Matcher` grid

`src/Descriptor/` and `src/Matcher/` are the two core axes, each with one subfolder per entity level: `Entity`, `File`, `Module`, `Element`, `Dependency`, `Shared`. A `Descriptor` builds the structured representation of an entity from raw config; the matching `Matcher` decides whether a given input matches a descriptor. Keep new entity-level logic in the matching pair of folders rather than introducing a new axis.

## Other top-level folders

- `Cache` — memoizes matcher/descriptor results; has an explicit `CacheDisabled` variant. Three kinds of cache live in the package, and the `cache` option governs only the first: **result caches** (entity descriptions, matching results, captures) use `CacheManager` when `cache` is true and `CacheManagerDisabled` otherwise, are serializable, and their keys are built from paths and options, so a bug there can be worked around by disabling the cache; **memoization of compiled artifacts** (compiled glob regexps in `Micromatch`, compiled Handlebars templates in `BaseMatcher`) always uses `CacheManager`, is not serializable, and is cleared by `clearCache()` only to free memory, because the value depends only on the key text and can be neither stale nor mismatched; **identity-keyed memoization** (`Matcher/Shared/Memoize.ts`: selector normalization, per-dependency legacy template data) uses `WeakMap`s that ignore the `cache` option and are never cleared, so its results are shared by every caller and must never be mutated, and an input object must not be mutated after its first use. Put a new cache in the right kind instead of copying the nearest one.
- `Config` — normalizes the `ConfigOptions` that `Elements` and the matchers receive.
- `Shared` — cross-cutting helpers (`Paths`, `Platform`, `TypeGuards`, micromatch types) used across both axes.
- `Legacy` — backwards-compatible helpers (e.g. `TemplateHelpers`) kept for older config shapes; don't extend it with new functionality, add new code in the current shape instead.
- `__test__` — cross-module integration specs (`describeElement`, `isDependencyMatch`, …) that exercise the public API end-to-end, distinct from the unit specs colocated with each module.

`src/index.ts` re-exports each folder's `Public.ts`/`*.types.ts` surface — extend a folder's `Public.ts` when a new symbol needs to be externally consumable, don't add a new top-level export elsewhere.

## Build and test shape

- Built with **tsup** (`tsup.config.js`), not raw `tsc`; type-checked separately with `tsc --noEmit` (`tsconfig.json`), while ESLint's type-aware rules use `tsconfig.eslint.json`.
- The browser build (`index.browser.*`) runs without Node.js shims, so `src` imports no Node.js module at runtime and reads Node.js globals only from `globalThis`, like the helpers in `src/Shared/Platform.ts` do (`eslint.config.mjs` enforces the globals). `test:e2e` (`test/e2e/builds.spec.mjs`) bundles every build the way consumers resolve it and checks they return the same results — run it after changing dependencies or platform-dependent code.
- This is the only package with a `test:mutation` target (Stryker) — run it when changing matching/descriptor logic, since branch-level correctness there is easy to break silently.
