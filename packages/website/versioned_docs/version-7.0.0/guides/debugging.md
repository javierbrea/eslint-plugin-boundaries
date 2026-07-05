---
id: debugging
title: Debugging
description: Learn how to debug ESLint Plugin Boundaries configuration effectively.
tags:
  - troubleshooting
  - advanced
keywords:
  - eslint-plugin-boundaries
  - JavaScript
  - TypeScript
  - debugging
  - troubleshooting
  - debug mode
  - debug filter
  - ESLINT_PLUGIN_BOUNDARIES_DEBUG
---

# Debugging

## Overview

Use debugging to verify that your [`elements`](../classification/elements.md) setting and [policies](../policies/policies.mdx) work as expected. The debugging feature prints detailed traces about how the plugin analyzes your files and imports, including:

- File paths being analyzed
- Assigned descriptions for each file and dependency
- Rule policy violations, and which dependency selectors matched them

Each file description is an [**entity**](../classification/classification.md) — the element the file belongs to, the file's categories (from [file descriptors](../classification/files.md)), and the module origin of each dependency. This breakdown helps you troubleshoot configuration issues and confirm your element definitions and rule policies are correct.

## Enabling Debug Mode

You can enable debugging in two ways:

1. Using settings:

```js
export default [{
  settings: {
    "boundaries/debug": {
      enabled: true,
    },
  },
}];
```

2. Using the `ESLINT_PLUGIN_BOUNDARIES_DEBUG` environment variable:

```bash
ESLINT_PLUGIN_BOUNDARIES_DEBUG=1 npm run lint
```

The environment variable is equivalent to setting `"boundaries/debug": { "enabled": true }`.

When debug mode is enabled, you will see detailed output in the console for each file and dependency analyzed by the plugin. This includes all the information of **[entity and dependency descriptions](../classification/classification.md).**

## Filtering by Message Type

By default, all messages are printed when debug mode is enabled. Messages include:

- File descriptions for each file analyzed
- Dependency descriptions for each dependency analyzed
- Rule policy violation descriptions for each rule policy violation detected

You can enable/disable these message types using the `boundaries/debug.messages` setting:

```js
export default [{
  settings: {
    "boundaries/debug": {
      enabled: true,
      messages: {
        files: true,
        dependencies: true,
        violations: true,
      },
    },
  },
}];
```

:::tip
You may want to disable some message types to reduce noise and focus on specific information relevant to your debugging session. For example, if you're only interested in how files are being categorized, you can disable dependency and violation messages.
:::

## Filtering by File or Dependency

You can **[filter traces using selectors](../selectors/selectors.md)** in the `boundaries/debug.filter` setting. This lets you focus on specific files or dependencies relevant to your debugging session.

The two filter keys accept different selector types:

- `filter.files` accepts a [file selector](../selectors/file.md) or an [entity selector](../selectors/selectors.md#entity-selectors). Use it to match by element type, file category, or module origin.
- `filter.dependencies` accepts a [dependency selector](../selectors/selectors.md#dependency-selectors) with `from`, `to`, and `dependency` keys.

Filters apply to all debug messages (file descriptions, dependency descriptions, and rule policy violation descriptions). If a trace doesn't match the filter, it won't be printed in the console.

```js
export default [{
  settings: {
    "boundaries/debug": {
      enabled: true,
      filter: {
        // Entity selector: only debug files belonging to "component" elements
        files: [{ element: { type: "component" } }],
        // Dependency selector: only debug type-kind dependencies to external "@my-org/*" modules
        dependencies: [{
          to: { module: { origin: "external", source: "@my-org/*" } },
          dependency: { kind: "type" },
        }],
      },
    },
  },
}];
```

:::note[Entity selectors in `filter.files`]
`filter.files` accepts entity selectors, so you can filter by element type (`{ element: { type: "component" } }`), file category (`{ file: { categories: "test" } }`), or module origin (`{ module: { origin: "external" } }`). A bare flat element selector such as `{ type: "component" }` still works and is converted internally, but prefer the entity selector form. See [Selectors](../selectors/selectors.md).
:::

Filter behavior:

| Filter value | Behavior |
| --- | --- |
| `undefined` | All traces for that category are printed. |
| `[]` (empty array) | No traces for that category are printed. |
| `[selector, ...]` | Only traces matching at least one selector are printed. |

The `files` filter also gates the dependencies and rule policy violations found within each file: if a file doesn't match `filter.files`, none of its dependencies or rule policy violations are printed, even when they match `filter.dependencies`.

## Example Output

When debug mode is enabled, you'll see **[descriptions of files, dependencies, and rule policy violations](../classification/classification.md)** in the console. Each file is serialized as an [entity](../classification/classification.md) with three sub-descriptions: `element`, `file`, and `module`. For example, for a `component` that imports a `helper`:

```
[boundaries][debug]: Description of file "src/components/atoms/atom-a/AtomA.js":

{
  "element": {
    "path": "src/components/atoms/atom-a",
    "types": ["component"],
    "category": null,
    "filePath": "src/components/atoms/atom-a/AtomA.js",
    "fileInternalPath": "AtomA.js",
    "captured": {
      "family": "atoms",
      "elementName": "atom-a"
    },
    "parents": [],
    "isIgnored": false,
    "isUnknown": false
  },
  "file": {
    "path": "src/components/atoms/atom-a/AtomA.js",
    "categories": null,
    "captured": null,
    "isIgnored": false,
    "isUnknown": false
  },
  "module": {
    "origin": "local",
    "source": null,
    "internalPath": null
  }
}

[boundaries][debug]: Description of dependency "../../../helpers/data/sort" in file "src/components/atoms/atom-a/AtomA.js":

{
  "from": {
    "element": {
      "path": "src/components/atoms/atom-a",
      "types": ["component"],
      "category": null,
      "filePath": "src/components/atoms/atom-a/AtomA.js",
      "fileInternalPath": "AtomA.js",
      "captured": {
        "family": "atoms",
        "elementName": "atom-a"
      },
      "parents": [],
      "isIgnored": false,
      "isUnknown": false
    },
    "file": {
      "path": "src/components/atoms/atom-a/AtomA.js",
      "categories": null,
      "captured": null,
      "isIgnored": false,
      "isUnknown": false
    },
    "module": {
      "origin": "local",
      "source": null,
      "internalPath": null
    }
  },
  "to": {
    "element": {
      "path": "src/helpers/data",
      "types": ["helper"],
      "category": null,
      "filePath": "src/helpers/data/sort.js",
      "fileInternalPath": "sort.js",
      "captured": {
        "family": "data"
      },
      "parents": [],
      "isIgnored": false,
      "isUnknown": false
    },
    "file": {
      "path": "src/helpers/data/sort.js",
      "categories": null,
      "captured": null,
      "isIgnored": false,
      "isUnknown": false
    },
    "module": {
      "origin": "local",
      "source": null,
      "internalPath": null
    }
  },
  "dependency": {
    "source": "../../../helpers/data/sort",
    "kind": "value",
    "nodeKind": "import",
    "relationship": {
      "from": null,
      "to": null
    },
    "specifiers": [
      "sort"
    ]
  }
}

[boundaries][debug]: dependencies rule violation: Policy at index 1 reported a violation because the following selector matched the dependency:

{
  "policy": {
    // The index of the policy in the configuration that reported the violation
    "index": 1,
    // The selector in that policy that matched the dependency
    "selector": {
      "from": {
        "element": { "type": "helper" }
      },
      "to": {
        "element": { "type": "component" }
      }
    }
  },
  "dependency": {
    // ...the full dependency description for the matched dependency
  }
}
```

:::note[Reading the entity output]
Local source files carry their classification in `element` (the architectural element and its `types`) and in `file` (its `categories`, from [file descriptors](../classification/files.md)). `module` is `{ "origin": "local", "source": null, "internalPath": null }`. For imported external or core dependencies, `element` and `file` are usually unknown — the meaningful classification lives in `module` (`origin`, `source`, `internalPath`). When no [`boundaries/files`](../settings/settings.md#boundariesfiles) descriptors match a file, its `file.categories` is `null`.
:::

## Best Practices

### Limit the files being linted

When debugging, it's recommended to limit the number of files being linted to avoid overwhelming your console with traces. This makes it easier to find the information you're looking for. Apart from using the `boundaries/debug.filter` settings, you can also limit files by specifying paths in your lint command:

Lint a single file:

```bash
ESLINT_PLUGIN_BOUNDARIES_DEBUG=1 npm run lint ./my-file.js
```

Lint files in a specific directory:

```bash
ESLINT_PLUGIN_BOUNDARIES_DEBUG=1 npm run lint ./src/modules/users
```

### Redirect output to a file

For projects with many files, you can save debug output to a file for later analysis:

```bash
ESLINT_PLUGIN_BOUNDARIES_DEBUG=1 npm run lint > debug.log 2>&1
```

By default, color codes are automatically disabled when output is redirected to a file. However, if you want to explicitly disable colors, you can use the `FORCE_COLOR` environment variable:

```bash
FORCE_COLOR=0 ESLINT_PLUGIN_BOUNDARIES_DEBUG=1 npm run lint > debug.log 2>&1
```

This ensures a clean output without ANSI color codes, making it easier to read in text editors or process with other tools.

## Troubleshooting Common Issues

### No debug output appearing

- Verify the setting or environment variable is correctly set to enable debug mode
- Ensure your lint command is running and targeting files that match your configuration
- Some shells may require `export ESLINT_PLUGIN_BOUNDARIES_DEBUG=1` before the command

### Too much output

- Use the file limiting strategies described above
- Filter output with `grep` or pipe to a file
- Consider temporarily disabling other rules to reduce output

### Unexpected element properties or missing captures

- Check your element patterns in the [`boundaries/elements`](../classification/elements.md) setting
- Verify the pattern is correct in the element descriptor
- Ensure descriptor patterns are listed in the correct order (first match wins)

### Unexpected file categories or `file.categories` is `null`

- File categories come from the [`boundaries/files`](../settings/settings.md#boundariesfiles) setting, not from `boundaries/elements`
- If `file.categories` is `null`, no file descriptor pattern matched the file (or none is configured)
- Categories accumulate: every matching file descriptor contributes its category

### Imports not resolving

- Check [resolver configuration in `import/resolver`](./custom-resolvers.md)
- Try limiting to a single file to isolate the issue
