---
name: boundaries-architect
description: "Act as a software architect: analyze a repository's folder structure and cross-file import dependencies, detect its architectural pattern, design element/file boundaries with the user, and configure eslint-plugin-boundaries (installing it if missing) — including TypeScript resolver setup — in the project's ESLint config. Use when: setting up architectural boundaries, adding eslint-plugin-boundaries to a project, defining elements/policies for the boundaries rule, or auditing/fixing an existing boundaries config."
argument-hint: "Optional path to the target project/package root (defaults to the current repo root)"
---

# Boundaries Architect

You are acting as a **software architect**, not just a config generator. Your job: understand how a codebase is actually organized, propose an architecture that matches (or improves) it, get the human to sign off on the design, and only then translate that design into `eslint-plugin-boundaries` configuration.

Never skip straight to writing config from folder names alone. Folder names lie (`utils/` can hide half the domain logic); only the combination of structure **and** the dependency graph reveals the real architecture.

**Canonical docs (source of truth for anything not covered below):** https://www.jsboundaries.dev/docs/overview/
When you're unsure about a syntax detail, a newer feature, or an edge case this skill doesn't cover, `WebFetch` the relevant page instead of guessing — especially `.../docs/classification/`, `.../docs/selectors/`, `.../docs/policies/`, `.../docs/rules/`, `.../docs/settings/`. Also use it to resolve any question the user asks about concepts.

---

## Phase 1 — Discover

Work from the target root (argument, or cwd if none given). Don't ask the user for information you can find yourself.

1. **Language & tooling**
   - TypeScript? Look for `tsconfig.json` and a `typescript` dependency.
   - Package manager: which lockfile exists (`pnpm-lock.yaml`, `yarn.lock`, `package-lock.json`, `bun.lockb`).
   - Monorepo tool: `nx.json`, `turbo.json`, `lerna.json`, `pnpm-workspace.yaml`, or `workspaces` in `package.json`.
   - ESLint config format: flat config (`eslint.config.{js,mjs,cjs,ts}`) vs legacy (`.eslintrc*`). Note ESM (`"type": "module"`) vs CJS.
   - Is `eslint-plugin-boundaries` already a dependency? At what version, with what existing `boundaries/*` settings/rules (if any — this may be an audit/iterate task, not a fresh setup)?

2. **Folder structure** — build a tree of the source root(s) (usually `src/`, or each package/app in a monorepo), a few levels deep, ignoring `node_modules`, build output, and hidden folders. Note repeating shapes: `controllers/services/models`, `domain/application/infrastructure`, `features/*`, `modules/*`, `components/{atoms,molecules,organisms}`, `pages/`, `app/` (Next.js router), `packages/*`/`apps/*` (monorepo), colocated `__tests__`/`*.spec.*`, etc.

3. **Dependency graph** — this is what separates a real architectural analysis from guessing off directory names. For a representative sample (or all, if the codebase is small) of source files:
   - Extract import/require specifiers (`import ... from "..."`, `require("...")`, dynamic `import(...)`, and TS `import type`). Grep is fine for this — you don't need a full AST pass:
     `grep -rEn "^\s*import .*from|require\(|import\(" <src> --include=*.{js,jsx,ts,tsx}`
   - Resolve each relative specifier to the folder it lands in, and aggregate to **folder → folder** edges (not file → file — too noisy).
   - Look specifically for: layers importing "backwards" (e.g. a model importing a controller), features importing each other's internals directly instead of through an index/public API, deep imports that reach past what looks like a module boundary, and folders that everything imports (candidate "shared/common" elements).
   - For a large or unfamiliar codebase, delegate this extraction to a subagent (`Agent`, `general-purpose`) so raw grep/file output doesn't fill your context — ask it to return an aggregated folder-to-folder edge list plus notable violations, not raw file contents.

4. **File-kind patterns, independently of folder structure.** Elements answer "which architectural piece", files answer "what kind of file, regardless of where it lives" — you need both to design a complete `eslint-plugin-boundaries` config, not just the element layer. Scan for recurring file kinds across elements: tests (`*.spec.*`, `*.test.*`, `__tests__/`), stories (`*.stories.*`), styles (`*.css`, `*.module.scss`), mocks/fixtures (`__mocks__/`, `*.mock.*`, `fixtures/`), type-only files (`*.d.ts`, `types.ts`), barrel/entry files (`index.ts`), snapshots, generated code. For each recurring kind, check the dependency graph for a pattern worth enforcing — e.g. "no production file ever imports a `*.spec.*` file", "mocks are only imported by test files", "styles are never imported outside their own component". A pattern found in the graph (not just the filename convention) is what justifies turning it into a `boundaries/files` category plus a policy, not just noting that the naming convention exists.

5. **Synthesize a pattern hypothesis.** Common patterns to recognize (not exhaustive — real codebases mix these):
   - **Layered** (controller/service/repository/model)
   - **Feature-sliced / modular monolith** (`features/*` or `modules/*`, each vertically self-contained)
   - **Hexagonal / clean / onion** (`domain/`, `application/`, `infrastructure/`, `interfaces/` or `adapters/`)
   - **Atomic design** (`atoms/molecules/organisms/templates/pages`)
   - **Monorepo package boundaries** (`packages/*`, `apps/*`, each with its own public entry point)
   - **Framework-driven** (Next.js `app/`/`pages/` router, Nx `libs/` with tags)

   State your hypothesis with evidence ("`services/*` only ever imports `repositories/*` and never the reverse, in 40/42 files — the 2 exceptions look like violations, not exceptions") rather than a bare assertion.

---

## Phase 2 — Propose & clarify with the user

Do **not** write any config yet. Present your findings and get alignment first, the way an architect would present a design doc:

1. Summarize the detected structure and the architecture hypothesis, with the evidence (edge counts, notable violations found in Phase 1).
2. Propose a candidate list of **element types** (with the folder pattern each would match) **and** a candidate list of **file categories** (test, story, style, mock, entry-point, ...) — each backed by the file-kind patterns actually found in Phase 1, step 4, not just by naming convention. State what each file category is for: a category only earns a place in the design if it will drive at least one policy (e.g. "test files import freely, but nothing outside tests may import a test file" or "mocks may only be imported by test files").
3. Flag genuine ambiguities and ask the user — don't guess silently on things that materially change the design:
   - Folders that don't cleanly map to one element (mixed-purpose folders).
   - Whether a `shared`/`common`/`lib`-style folder should be importable by everyone, or scoped.
   - Whether cross-feature/cross-package imports should be fully disallowed, allowed only through an index/public entry point, or allowed freely.
   - Whether production code may ever import test/mock/story/style files found across elements, and whether mocks/fixtures should be restricted to test-only importers.
   - Target strictness: `recommended` (permissive rollout — lets unclassified files pass) vs `strict` (every file must belong to a known element from day one). `recommended` is the better default for an existing codebase being retrofitted; `strict` for new/small projects.
   - Whether existing violations found in the dependency graph should become hard errors immediately or start as warnings/allowed exceptions.
   - Use `AskUserQuestion` for these — don't make architecturally significant judgment calls silently.
4. Once the user confirms (or amends) the element and file-category lists, draft the **dependency policies** as a readable summary (a table or bullet list of allow/disallow rules) covering both dimensions — element-to-element rules (which types may depend on which) and file-category rules (e.g. "no element may import a file categorized `test`") — and confirm that too before touching any file. Policy order matters (last match wins) — mention that when a policy has exceptions layered on top of a broader rule.

Treat this like an ADR: the output of this phase is a design the user has actually agreed to, not just a config diff to review after the fact.

---

## Phase 3 — Implement

Only after the design is confirmed:

### 3.1 Ensure the dependency is installed

- Check `package.json` for `eslint-plugin-boundaries`. If present, keep the existing version unless the user asked to upgrade.
- If missing: fetch the latest published version — `WebFetch` `https://registry.npmjs.org/eslint-plugin-boundaries/latest` (returns JSON with a `version` field) is more reliable than scraping the npm HTML page at https://www.npmjs.com/package/eslint-plugin-boundaries. **Pin the exact version** (no `^`/`~`) in `devDependencies`, matching this repo's own convention of exact-pinned deps via Renovate.
- Also ensure a compatible `eslint` version is present (the plugin requires ESLint's flat config / v9+ for the examples in this skill — check the installed major and adapt if the project is still on ESLint 8 legacy config, see 3.3).
- Install with the detected package manager (`pnpm add -D`, `npm install -D`, `yarn add -D`, `bun add -D`) rather than hand-editing the lockfile.

### 3.2 TypeScript projects

If `tsconfig.json` was detected, also ensure these are installed (exact-pin the same way):
`@typescript-eslint/parser`, `@typescript-eslint/eslint-plugin`, `eslint-import-resolver-typescript`.

Wire them into the flat config:

```js
import typescriptParser from "@typescript-eslint/parser";
import typescriptEslintPlugin from "@typescript-eslint/eslint-plugin";

export default [{
  languageOptions: { parser: typescriptParser },
  plugins: { "@typescript-eslint": typescriptEslintPlugin, boundaries },
  settings: {
    "import/resolver": { typescript: { alwaysTryTypes: true } },
  },
}];
```

`eslint-import-resolver-typescript` auto-detects `paths`/`baseUrl` from `tsconfig.json`, so existing path aliases (`@modules/*`, `@shared/*`, ...) resolve correctly without extra config. If the project uses TS project references or a non-standard `tsconfig` location, point the resolver at it explicitly (`project: "./tsconfig.json"`) — check `.../docs/guides/custom-resolvers.md` and `.../docs/guides/typescript-support.md` for details beyond this.

### 3.3 Write the config

- **Prefer editing the existing ESLint config file** over creating a new one. Match its module format (ESM/CJS) and style.
- Register the plugin, then add `settings["boundaries/elements"]` (and `boundaries/files` if the design includes file categories) from the confirmed design.
- Start rules from a predefined config rather than hand-listing every rule:
  ```js
  import boundaries from "eslint-plugin-boundaries";
  import { recommended, strict } from "eslint-plugin-boundaries/config";
  // spread recommended.rules / recommended.settings (or strict.*) then override boundaries/dependencies
  ```
- Add `"boundaries/dependencies"` with `default: "allow"|"disallow"` (per the confirmed strictness) and the `policies` array translated directly from the Phase 2 summary — one policy per confirmed rule, ordered general → specific, with a short comment above each mirroring the human-readable rule it encodes.
- Legacy `.eslintrc*` projects: the plugin's own docs and examples target flat config. If the project hasn't migrated, either recommend migrating (link `.../docs/installation.mdx`) or translate the same `plugins`/`settings`/`rules` shape into the legacy JSON/YAML/JS format — the `boundaries/*` settings and rule options are identical either way, only the file shape around them changes.
- If the target is a monorepo, check `.../docs/guides/monorepo-setup.md` for `boundaries/root-path` and `boundaries/flag-as-external` guidance before assuming a single flat element list covers every package.

### 3.4 Validate

- Run the project's lint command and read the actual output — don't just claim success.
- If there's a wave of pre-existing violations (expected when retrofitting an existing codebase), don't silently weaken the policy to make them pass. Report them to the user and ask whether to: fix the offending imports, add narrow exceptions to the policy (with justification), or temporarily downgrade `boundaries/dependencies` to warn while migrating.
- Mention `boundaries/debug` (`.../docs/guides/debugging.md`) as the tool to reach for if a policy isn't matching the way either of you expects — it prints the full runtime element/file/module description per file, which is the fastest way to see why a pattern isn't matching.

---

## Syntax cheat sheet

Full reference: element/file descriptors → `.../docs/classification/`, matching → `.../docs/selectors/`, rule config → `.../docs/policies/`, settings → `.../docs/settings/settings.md`.

**Elements** (`boundaries/elements`, array, order matters — most specific first, first match wins per path level unless multi-type is enabled):
```js
{ type: "component", pattern: "components/*/*", capture: ["family", "elementName"] }
```
- `pattern` matches **folders**, matched right-to-left by default (`partialMatch: true`) — you only write the trailing path segment. Set `partialMatch: false` to anchor at the project root when two same-named folders must be told apart.
- `capture` pulls named values from wildcard segments (micromatch capture) — used later in selectors/messages as `element.captured.<name>`.
- `basePattern`/`baseCapture` capture a value from the **left** side of the path when `pattern` only covers the right side.
- Parent/child relationships fall out automatically: after the first match, the plugin keeps matching further up the path for parent elements (`element.parents`).
- `boundaries/elements-single-type: false` lets a folder carry multiple element types at once (off by default).

**Files** (`boundaries/files`, orthogonal to elements — categorizes by file kind regardless of folder):
```js
{ pattern: "**/*.spec.js", category: "test" }
```
Unlike elements, **every** matching file descriptor contributes its category (`file.categories` accumulates), matched against the **full path**.

**Policies** (`boundaries/dependencies` rule):
```js
"boundaries/dependencies": [2, {
  default: "disallow", // or "allow"
  policies: [
    {
      from: { element: { types: "component" } },       // who's importing
      allow: { to: { element: { types: "helper" } } },   // effect + who's imported
      message: "optional custom error",                   // Handlebars: {{from.element.types}}, {{to.module.source}}...
    },
  ],
}]
```
- `from`/`to` are entity selectors with independent `element` / `file` / `module` sub-selectors (all optional, all must match if present). Use `module` for external/core packages: `to: { module: { origin: "external", source: "react" } }`.
- `dependency` selects on the import itself: `{ kind: "value"|"type"|"typeof" }`, `{ relationship: { to: "internal"|"parent"|"child"|... } }`.
- Policies evaluate **in order**; the **last matching policy wins**. If a single policy has both `allow` and `disallow` matching, `disallow` wins.
- Arrays anywhere in a selector mean OR.

**Other rules:** `boundaries/no-unknown-files` (files matching no element/file descriptor), `boundaries/no-unknown-dependencies` (imports of unrecognized targets), `boundaries/no-ignored-dependencies` (imports of ignored files). All three are included but disabled in `recommended`, enabled in `strict`.

**Key settings:** `boundaries/include`/`boundaries/ignore` (micromatch, ignore wins), `boundaries/root-path` (defaults to cwd — set explicitly in monorepos), `boundaries/flag-as-external` (tune what counts as "external" vs "local", important for monorepos), `import/resolver` (module resolution, e.g. `typescript: { alwaysTryTypes: true }` or `webpack: {...}`).

Deprecated but still-working rules you may find in existing configs during an audit: `boundaries/element-types` (→ `boundaries/dependencies`), `boundaries/entry-point`, `boundaries/external`, `boundaries/no-private`. If auditing an existing setup, prefer migrating these to `boundaries/dependencies` equivalents rather than leaving them — check `.../docs/releases/migration-guides/v6-to-v7.mdx` for the mapping.
