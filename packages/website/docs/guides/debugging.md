---
id: debugging
title: Debugging
description: Learn how to debug ESLint Plugin Boundaries configuration effectively.
tags:
  - troubleshooting
  - advanced
keywords:
  - JS Boundaries
  - ESLint plugin
  - boundaries
  - javaScript
  - typeScript
  - debugging
  - troubleshooting
---

# Debugging

## Overview

When configuring the plugin, it's helpful to **verify that your [`elements`](../setup/elements.md) setting is working as expected**. The debugging feature provides detailed traces about how the plugin analyzes your files and imports, including information such as:

- File paths being analyzed
- Assigned element types
- Captured values and patterns
- Import resolution results

This can help you troubleshoot configuration issues and ensure your element definitions are correct.

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

The environment variable is equivalent to enabling `boundaries/debug.enabled`.

When debug mode is enabled, you will see detailed output in the console for each file and dependency analyzed by the plugin. This includes all the information of **[element and dependency descriptions](../setup/elements.md#runtime-description-properties).**

## Filtering Debug Output

You can **[filter traces using selectors](../setup/selectors.md)** in the `boundaries/debug.filter` setting. This allows you to focus on specific files or dependencies that are relevant to your debugging session.

```js
export default [{
  settings: {
    "boundaries/debug": {
      enabled: true,
      filter: {
        files: [{ type: "component" }],
        dependencies: [
          {
            from: [{ type: "component" }],
            to: [{ source: "@/shared/**" }],
          },
        ],
      },
    },
  },
}];
```

Filter behavior:

- The `files` filter applies both to file traces and to the dependencies found within those files. If a file doesn't match the `files` filter, none of its dependencies will be printed, even if they match the `dependencies` filter.
- If `files` is `undefined`, all file traces are eligible.
- If `files` is an empty array, no file traces are printed.
- If `dependencies` is `undefined`, all dependency traces are eligible.
- If `dependencies` is an empty array, no dependency traces are printed.

## Example Output

When debug mode is enabled, you'll see **[descriptions of files and dependencies](../setup/elements.md#runtime-description-properties)** in the console. This information is based on the properties defined in the **[element descriptors](../setup/elements.md)** in your configuration. For example:

```
[boundaries] [debug]: Description of file "src/Config/Strict.ts":

{
  "path": "src/Config/Strict.ts",
  "type": "config",
  "category": null,
  "captured": {
    "name": "Strict"
  },
  "origin": "local",
  "isIgnored": false,
  "isUnknown": false,
  "elementPath": "src/Config/Strict.ts",
  "internalPath": "Strict.ts",
  "parents": []
}

[boundaries] [debug]: Description of dependency "../Settings" in file "src/Config/Strict.ts":

{
  "from": {
    "path": "src/Config/Strict.ts",
    "type": "config",
    "category": null,
    "captured": {
      "name": "Strict"
    },
    "origin": "local",
    "isIgnored": false,
    "isUnknown": false,
    "elementPath": "src/Config/Strict.ts",
    "internalPath": "Strict.ts",
    "parents": []
  },
  "to": {
    "path": "src/Settings/index.ts",
    "type": "settings",
    "category": null,
    "captured": {
      "name": "index"
    },
    "origin": "local",
    "isIgnored": false,
    "isUnknown": false,
    "elementPath": "src/Settings/index.ts",
    "internalPath": "index.ts",
    "parents": []
  },
  "dependency": {
    "source": "../Settings",
    "module": null,
    "kind": "type",
    "nodeKind": "import",
    "relationship": {
      "from": null,
      "to": null
    },
    "specifiers": [
      "Config"
    ]
  }
}
```

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

- Check your element patterns in the [`boundaries/elements`](../setup/elements.md) setting
- Verify pattern is correct in the element descriptor
- Ensure descriptor patterns are listed in the correct order (first match wins)

### Imports not resolving

- Check [resolver configuration in `import/resolver`](./custom-resolvers.md)
- Try limiting to a single file to isolate the issue
