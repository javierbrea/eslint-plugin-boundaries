---
id: playground
title: Playground
description: Sketch a project in the browser, see how ESLint Plugin Boundaries classifies its files and decides its dependencies, and share it as a link.
tags:
  - configuration
  - troubleshooting
  - examples
keywords:
  - eslint-plugin-boundaries
  - playground
  - browser
  - reproduce
  - share
  - bug report
  - dependencies rule
  - verdicts
---

# Playground

The [playground](/playground/) runs the classification of the plugin and its `boundaries/dependencies` rule in the browser, on a project that you sketch: its files and folders, the dependencies of each file, and the `settings` and `rules` of an ESLint config. Nothing to install. Use it to:

- **Try a config before adding it to a project.** See how each file is classified, which policy decides each dependency, and the message the rule would report.
- **Reproduce a case and share it.** Share copies a link that holds the whole project, so that anyone who opens it, for example from an issue, sees the same files, config and verdicts.

The playground needs a wide screen: on a narrow one, its page shows a note instead. Its Help button, in the top bar, sums up the steps below.

## Sketch a project

With no project in its URL, the playground opens with the example of the [Quick start](../quick-start.mdx), or with the project you left in it when you come back from another page of the site without reloading. Every edit evaluates the project again: there is no run button.

### Files and folders

The `Project` pane shows the files as a tree, with `eslint.config.js` first.

- **`+ File` and `+ Folder`**, at the foot of the pane, add a file or a folder in the selected folder, the folder of the open file or the root, and let you name it.
- **Rename and delete** show at the end of a row (or press F2 and Delete). A name with `/`, such as `utils/format.js`, moves the node into that folder. The dependencies follow a file that is renamed or moved, and the ones from or to a file go with it when it is deleted.

The paths of the tree start at the folder of `eslint.config.js`, which the playground takes as the working directory of ESLint.

### Text mode

The `Tree` / `Text` switch at the foot of the pane shows the same project as text, to write, paste or copy it in one go:

```text
eslint.config.js
src/components/Button/index.js
  import { format } from "../../helpers/format/index.js";
  import React from "react";
src/helpers/format/index.js
src/modules/
```

- One path per line. A folder ends with `/`; only an empty folder needs a line of its own.
- An indented line is a dependency of the file above it, written as a statement. Any indentation works; the playground writes two spaces.
- A source that starts with `./` or `../`, or is `.` or `..`, points to a file of the project, and any other one, such as `react`, to an external module. An absolute source, starting with `/`, is refused.
- The statements it reads are `import`, `import type`, `export … from`, `export type … from`, `require("…")` and `import("…")`, with the names they hold, such as `import format, { round as r } from "…";`, `export * as ns from "…";` or the side-effect `import "…";`. Single quotes, extra spaces and a missing `;` are accepted.

A dependency is written with the full relative path of its file, with its extension and its `index`. Text mode also reads shorter sources, with one rule of its own:

- A source that names a file exactly is that file.
- Otherwise, it is the file that adds one of `.js`, `.jsx`, `.ts`, `.tsx`, `.mjs`, `.cjs`, `.mts`, `.cts` or `.d.ts` to it, or `/index` and one of them.
- A source that ends with `/`, or is `.` or `..`, names a folder and reads only its `index`.
- A source that matches several files is not read: the line asks you to write the one you mean, with its extension.

When the text loses the focus and every line was read, it is written again with every source in full. A line that cannot be read is left out of the project and listed in the problems panel, as `Project text:<line>` with the reason.

### The config

`eslint.config.js` opens an editor that holds one JSON5 object with the `settings` and `rules` of an ESLint config, as you write them in your `eslint.config.js`, so they paste unchanged:

```js
{
  settings: {
    // "boundaries/elements", "boundaries/files", ...
  },
  rules: {
    // "boundaries/dependencies": [2, { ... }],
  },
}
```

It is the only free text of the playground. Anything else, such as imports, `export default`, spreads or variables, is an error, and a key other than `settings` and `rules` is ignored with a warning. The [predefined configs](../settings/config-helpers.md#predefined-configs) cannot be spread: write out the settings and rules you need from them. Problems are underlined as you type, marked in the gutter and explained under the pointer.

### Dependencies

Open a file and press `+ Dependency`, or the edit button of one of its lines, to open the picker. It builds the statement row by row, and its `Preview` shows it:

- **Target:** `A file of the project`, picked from the paths of the project, each with the element types it belongs to (or `no element`), or `An external module`, by its name.
- **Syntax:** what statement it is, which decides the kinds and the names it can hold:

| Syntax | Kind | Imported names |
| --- | --- | --- |
| `import` | `value`, `type` | `default`, `named`, `namespace` |
| `export … from` | `value`, `type` | `named`, `namespace` |
| `require()` | `value` | none |
| `import()` | `value` | none |

- **Kind:** `value` or `type`, as in `import type`.
- **Imported:** the names, one chip each, such as `default format`, `named round as r` or `namespace ns`. An `import` without names is a side-effect import, and an `export … from` without names is `export * from`.

## Read the results

### The inspector

The inspector, on the right, describes what the middle pane has open.

- **A file:** three sections named as the keys of a policy.
  - `from` is the open file: how many dependencies it has, how many are allowed (✓), disallowed (✕) and not checked (–), and the boxes `element`, `file` and `module` with every property that [selectors](../selectors/selectors.md) match, named and valued as the plugin [describes them](../classification/classification.md).
  - `to` is the file or the external module that the dependency in focus points to, with the same boxes. Click a line of the file to put its dependency in focus.
  - `dependency` is the dependency in focus: `kind`, `nodeKind`, `source`, `specifiers` and `relationship`, the properties of a [dependency selector](../selectors/dependency.md).
- **The config:** its `Element types` and `File categories` with how many files each matches, and its `Policies` with how many dependencies each one decided, then the `default`. Another rule of the plugin reads `not evaluated here`. A row opens its entry in the config.
- **Nothing:** the numbers of the project.

### Verdicts

Each line of the open file ends with its verdict:

| Verdict | Meaning |
| --- | --- |
| `✓ policy N` | Allowed by the policy at index `N` of the rule options, counting from 0. |
| `✓ default` | Allowed by the `default` option: no policy decided. |
| `✕ policy N`, `✕ default` | Disallowed. With the rule at `warn`, a triangle replaces the cross. |
| `✕ custom message` | Disallowed, and the custom message failed to render: the message says why. |
| `– not checked · <reason>` | The rule does not check it. Point at the verdict to read why. |
| `– not evaluated` | No dependency is evaluated, or the evaluation was stopped: the problems panel says why. |

The reasons of `not checked`:

| Reason | The rule does not check it because |
| --- | --- |
| `external` | The dependency is not local; the rule checks external and core modules only with `checkAllOrigins`. |
| `not read` | [`boundaries/dependency-nodes`](../settings/settings.md#boundariesdependency-nodes) leaves its syntax out, so the plugin never reads it. |
| `from-ignored` | The importing file is ignored by `boundaries/ignore` or `boundaries/include`. |
| `from-unknown` | The importing file matches no element and no file category. |
| `to-ignored` | The file it points to is ignored by `boundaries/ignore` or `boundaries/include`. |
| `unknown-local` | The file it points to matches no element and no file category; the rule checks those only with `checkUnknownLocals`. |
| `internal` | Both files belong to the same element; the rule checks those only with `checkInternals`. |

No dependency is evaluated while the config cannot be read, while the rule options are invalid, while neither `boundaries/dependencies` nor `boundaries/element-types` is in the rules, while the rule is off, or while it has no options. The playground evaluates `boundaries/dependencies`, or [`boundaries/element-types`](../rules/rules.md#element-types), its deprecated name, when that one runs and `boundaries/dependencies` does not.

### The problems panel

The problems panel has one tab per level of focus, and the most specific one opens when the focus changes:

- **`Project`**, always: the problems of the config, the lines of text mode that could not be read, and the disallowed dependencies.
- **The open file**, by its folder and name: its disallowed dependencies. With the config open, `eslint.config.js`: its problems.
- **`line N`**, for the dependency in focus: its verdict, where it is, the message the rule reports or why it is not checked and, when a policy decided it, that policy as written in the config, under `Policy`.

A row opens what it points to: a problem of the config opens the config at its place, and a dependency takes the focus. `Open in config`, next to the policy of a dependency, opens the config at that policy and highlights it. The top bar sums it all up, such as `6 files · 9 dependencies · 2 problems`, or reads `config has errors`.

## Share a project

`Share`, in the top bar, copies a link to the playground. The part of the link after `#` holds the whole project, compressed: its config, its files and its dependencies. A browser does not send that part of a URL to the server, so the project is never uploaded: it travels inside the link. The address bar holds the project too, a moment after each edit, so reloading the page keeps it.

The message next to the button says how it went:

- `Link copied`.
- `Long link copied: some apps may cut it`, for a link of more than 8,192 characters. Check that the link you pasted opens the project.
- `The project is too large for a link`, with the reason, for a project with more than 1,000 files and folders, more than 3,000 dependencies, or more than 4 MiB once written as JSON. Nothing is copied.
- `The link could not be copied`, when the browser refuses access to the clipboard.

A link that cannot be read shows why, with a `Reset` button.

### Use it in an issue

To report how the plugin classifies a file or decides a dependency, reproduce it in the playground and paste the link that Share copies in the [issue](https://github.com/javierbrea/eslint-plugin-boundaries/issues). The bug report template asks for one. Keep only what the case needs: the files and dependencies involved, and the parts of the config that decide them.

### Examples and Reset

- **The example picker**, at the start of the top bar, reads `Example` and the name of the example on screen: `Quick start`, `Overview`, `Policies` or `Dependencies rule`, the examples of the [Quick start](../quick-start.mdx), the [Overview](../overview.md), the [Policies](../policies/policies.mdx) page and the [`boundaries/dependencies`](../rules/dependencies.md) rule page.
- **`Reset`** brings back the Quick start example.
- **Open in playground** buttons, next to some examples of the docs, open them in the playground, in place of the project on screen.

The picker and Reset ask first when the project on screen is not one of the examples, because your changes would be lost: copy its link with Share before, to keep it.

## Limits

- **No source code.** A file holds only its dependencies, which you add with the picker or in text mode.
- **No `node_modules`.** An external module is only a name, with no files behind it.
- **One rule.** Only `boundaries/dependencies`, or `boundaries/element-types`, is evaluated.
- **The config is JSON5.** It holds `settings` and `rules`, without imports, spreads or variables.
- **Paths** have at most 1,024 characters and 64 segments.
- **Evaluation time.** The project is evaluated in a web worker, so a slow evaluation does not block the page. When an evaluation takes long, the top bar reads `evaluating…`; after 30 seconds it is stopped, the top bar reads `evaluation stopped`, and the next edit evaluates the project again. A pattern that repeats `**/` is slow on deep paths: one with seven of them takes seconds to match a path of 64 segments.

## Not the same as running ESLint

The playground classifies files and decides dependencies with the packages that the plugin runs, `@boundaries/elements`, `@boundaries/config` and `@boundaries/policies`, but it does not read code or resolve modules, so some results differ from what ESLint reports on your project:

- **Sources are written in full.** A statement of the playground writes the relative path of its file with its extension and its `index`, such as `../helpers/format/index.js`. That full path is what `dependency.source`, the `customSourcePatterns` of [`boundaries/flag-as-external`](../settings/settings.md#boundariesflag-as-external) and the `{{dependency.source}}` template of a message see, while ESLint sees the source as your code writes it, such as `../helpers/format`.
- **Shorter sources follow the rule of text mode,** not your resolvers: the playground does not read [`import/resolver`](../settings/settings.md#importresolver). With `eslint-import-resolver-typescript`, ESLint resolves `./b.js` to a `b.ts` beside it, and `.jsx`, `.mjs` and `.cjs` to `.tsx`, `.mts` and `.cts`; the playground decides the file written, as `eslint-import-resolver-node` does. See [TypeScript Support](./typescript-support.md) and [Custom Resolvers](./custom-resolvers.md).
- **[`boundaries/additional-dependency-nodes`](../settings/settings.md#boundariesadditional-dependency-nodes) is not run.** The playground reads a statement only through the built-in nodes of `boundaries/dependency-nodes`, and warns at that setting in the config problems.
- **Statements that the plugin never reads are shown.** A statement whose syntax `boundaries/dependency-nodes` leaves out reads `not checked · not read`, where ESLint says nothing about it.
- **Other rules are not evaluated,** such as `boundaries/no-unknown-files` or `boundaries/no-ignored-dependencies`.

To check what ESLint sees in your project, [debug the plugin](./debugging.md). To use `@boundaries/config` and `@boundaries/policies` in your own code, read the READMEs of [`@boundaries/config`](https://github.com/javierbrea/eslint-plugin-boundaries/blob/master/packages/config/README.md) and [`@boundaries/policies`](https://github.com/javierbrea/eslint-plugin-boundaries/blob/master/packages/policies/README.md).
