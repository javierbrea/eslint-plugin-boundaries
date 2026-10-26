<!-- cspell:disable -->
# Phase 1: inventory of the plugin and the RFC of `@boundaries/config` and `@boundaries/policies`

Goal: a GitHub Discussion in the RFCs category that fixes the cut between the plugin and the two new packages, their public interfaces, how the plugin consumes them and how they are versioned and released, so that phases 2 and 3 implement it without design decisions of their own; the inventory behind it posted on #539 as research note 2.

Issue: #548, closed. No branch and no PR. Status (2026-10-26): done; the RFC is accepted.

## Outputs

- Research note 2, the symbol-by-symbol inventory: https://github.com/javierbrea/eslint-plugin-boundaries/issues/539#issuecomment-6410354387. It is the source of the "Move" steps of `02-config.md` and `03-policies.md`.
- [RFC #559](https://github.com/javierbrea/eslint-plugin-boundaries/discussions/559), accepted by the maintainer on 2026-10-26: the cut, the interfaces as TypeScript signatures, the plugin adapters, the caches, the layout, browser support, versioning and release. Its decisions are copied into the "Steps" of `02-config.md` and `03-policies.md`; the RFC wins if they disagree.
- Amendment 2 of RFC #538, which links RFC #559 from its "Dependencies" section and from decision 1, and records the renamed interfaces (`describeFile` is `describeEntity`).
- #557 (Playwright as a root devDependency) and #558 (`test/browser-e2e`), decided with the maintainer while reviewing the RFC (index, decisions 10 and 11), as sub-issues of #539 in the milestone.
- #548 links the RFC and has its acceptance criteria ticked; #539 links the RFC; #549 and #550 link it and say that the layering of each package is written in its `AGENTS.md` instead of lint-enforced, and that `build.yml`, not `publish.yml`, gains the packages.

## Acceptance

On 2026-10-26 the maintainer accepted the RFC (`**Status:** ✅ Accepted (2026-10-26)`); #548 is closed and ticked in the `Plan` list of #539, and #549 is unblocked (its `Blocked by` section became `Related`). A later change to the RFC is an amendment (`docs/contributing-workflow.md`, step 1), copied into `02-config.md` and `03-policies.md` with a plan edit shown to the maintainer.

## Findings that later phases rely on

- `Messages/` holds only the messages of the `dependencies` rule and the two helpers that `no-private` uses (`customErrorMessage`, `elementDescriptionMessage`); the other rules build their messages inline.
- `entry-point` and `external` already run on the `dependencies` evaluation: they translate their options into `dependencies` policies and call `evaluatePoliciesAndReport`.
- ESLint validates rule options against `meta.schema` with `ajv@6` before a rule runs; without ESLint nothing would, so `config` validates them itself (RFC decision 3).
- Which dependencies the `dependencies` rule evaluates is decided in two places: `dependencyRule()` skips files that are ignored or unknown, and the rule function skips ignored, non-local, unknown local and internal targets. `evaluateDependency` takes both (RFC decision 4).
- The policy normalization (`normalizeRuleOptions`) and the selector merging live in `Rules/Dependencies.ts`, not in `Settings/Rules.ts`.
- `ValidateRulesOptions` (`DependencyRule.types.ts`) is passed by `entry-point` and `external` but never read.
- `getNormalizedRootPath` reads `process.env.ESLINT_PLUGIN_BOUNDARIES_ROOT_PATH` and `process.cwd()` besides `node:path`.
