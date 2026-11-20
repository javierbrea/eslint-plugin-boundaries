# Architecture graph plan

**Status (2026-11-20):** nothing is merged and no RFC or issue exists yet. A first design conversation left decisions, a mockup, a spike and a draft of the RFC. Phase 1, which finishes the analysis and publishes the RFC, is pending. The phases after it are written when the RFC is accepted.

## Where it lives

The plan is committed on the integration branch `feat/architecture-graph`, through an exception in `.gitignore`, and is removed before the branch merges into `release`. The `write-plan` skill says how it is shared ("Where it lives"), how a phase starts ("Starting a phase") and how it ends ("Finishing a phase").

## Files

| File | Read it when |
| --- | --- |
| `architecture-graph/01-rfc.md` | Working on phase 1: what is left to analyze, the open questions and how the RFC is published |
| `architecture-graph/rfc-draft.md` | Writing the RFC: the draft of its body, to complete in phase 1 |
| `architecture-graph/mockup/` | Looking at or changing the mockup: `index.html` and its data, `data.json` |
| `architecture-graph/spike/` | Reading a real project again, or measuring it: the two scripts that produced the data of the mockup |

## Phases

| Phase | Issue | Branch | Depends on | PR target | PR title | PR |
| --- | --- | --- | --- | --- | --- | --- |
| 1. Finish the analysis and publish the RFC | none yet | `feat/architecture-graph` | nothing | none: its result is an RFC and a tracking issue | none | none |

The phases after the first one come from the accepted RFC and are added by phase 1.

## Integration plan

- `feat/architecture-graph` starts from `release` and merges `release`, never rebases. Each later phase is one pull request into it, and it goes into `release` at the end with a pull request that closes the tracking issue.
- An extraction that does not depend on the graph (the engine of the playground, the shared UI) may go straight into `release`, as the extractions of the playground did. Phase 1 decides it with the RFC.
- The branching model and the release procedure are in `.github/CONTRIBUTING.md`.

## Decisions

Taken by the maintainer in the session of 2026-11-20. They have no public link yet: the RFC of phase 1 records them.

1. The graph is first drawn on the website, over the sketch that the user edits in the playground. The local app is out of the RFC.
2. `@boundaries/project` (name to confirm) evaluates a whole project: it takes the config as an object, the files and the dependencies, and returns the descriptions and the verdicts. It is extracted from the playground from the start, so that no later refactor is needed.
3. `@boundaries/graph-data` (name to confirm) aggregates an evaluated project into nodes and edges, by a "group by" and filters. It is pure, with no React, so that the MCP server of [RFC #513](https://github.com/javierbrea/eslint-plugin-boundaries/discussions/513) or a CLI can use it.
4. `@boundaries/graph`, the name [RFC #374](https://github.com/javierbrea/eslint-plugin-boundaries/discussions/374) reserved, is the React component that renders the graph, its filters and its views.
5. The MUI theme, `ThemeRoot` and the ui-kit of `packages/playground/src/ui-kit` are extracted to a shared UI package (name pending), which the playground, the graph and later the local app consume.
6. The evaluation is computed once, in the worker of the playground. The playground emits it through an `onChange` with its status (current or stale); the graph only aggregates, and aggregates again when a filter changes.
7. The website composes the playground and the graph. The playground stays mounted and hidden while the graph is on screen, so that the session and the worker are kept.
8. The playground gets an input to open a target (a file or a dependency), so that a selection in the graph leads back to the editor.
9. The scope of the RFC is the website and the model. The project reader and its snapshot go to a later RFC, and the input type of `@boundaries/graph-data` must not prevent them.
10. The project reader of that later RFC is a command, not a rule or an option of the ESLint plugin, and its first version supports ESLint configs only. Later: oxlint, and projects without ESLint through a config file of our own that can ideally be imported into an ESLint or oxlint config.
11. The mockup uses real data of `packages/playground`, with invented violations marked as invented. Bigger fixtures for extreme cases come later.

## Open questions

All are decided by the maintainer in phase 1, which lists them with what is known about each: `architecture-graph/01-rfc.md`, "Open questions".
