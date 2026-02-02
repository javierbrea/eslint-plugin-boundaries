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

Enable debugging by setting the `ESLINT_PLUGIN_BOUNDARIES_DEBUG` environment variable to `1`:

```bash
ESLINT_PLUGIN_BOUNDARIES_DEBUG=1 npm run lint
```

This will output detailed trace information to your console during linting.

## Example Output

When debug mode is enabled, for each dependency analyzed, you'll see output like:

```
[boundaries]: 
{
  "from": {
    "path": "src/components/molecules/molecule-a/MoleculeA.js",
    "type": "components",
    "category": null,
    "captured": {
      "category": "molecules",
      "elementName": "molecule-a"
    },
    "origin": "local",
    "isIgnored": false,
    "isUnknown": false,
    "elementPath": "src/components/molecules/molecule-a",
    "internalPath": "MoleculeA.js",
    "parents": []
  },
  "to": {
    "path": "src/components/molecules/molecule-a/components/molecules/molecule-c/components/molecules/molecule-d/index.js",
    "type": "components",
    "category": null,
    "captured": {
      "category": "molecules",
      "elementName": "molecule-d"
    },
    "origin": "local",
    "isIgnored": false,
    "isUnknown": false,
    "elementPath": "src/components/molecules/molecule-a/components/molecules/molecule-c/components/molecules/molecule-d",
    "internalPath": "index.js",
    "parents": [
      {
        "type": "components",
        "category": null,
        "elementPath": "src/components/molecules/molecule-a/components/molecules/molecule-c",
        "captured": {
          "category": "molecules",
          "elementName": "molecule-c"
        }
      },
      {
        "type": "components",
        "category": null,
        "elementPath": "src/components/molecules/molecule-a",
        "captured": {
          "category": "molecules",
          "elementName": "molecule-a"
        }
      }
    ],
    "source": "./components/molecules/molecule-c/components/molecules/molecule-d"
  },
  "dependency": {
    "kind": "value",
    "nodeKind": null,
    "relationship": {
      "from": "ancestor",
      "to": "descendant"
    },
    "specifiers": []
  }
}
```

## Best Practices

### Limit the files being linted

When debugging, it's recommended to limit the number of files being linted to avoid overwhelming your console with traces. This makes it easier to find the information you're looking for.

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

## Troubleshooting Common Issues

### No debug output appearing

- Verify the environment variable is set correctly
- Some shells may require `export ESLINT_PLUGIN_BOUNDARIES_DEBUG=1` before the command

### Too much output

- Use the file limiting strategies described above
- Filter output with `grep` or pipe to a file
- Consider temporarily disabling other rules to reduce output

### Unexpected element types

- Check your element patterns in the [`boundaries/elements`](../setup/elements.md) setting
- Verify pattern is correct in the element descriptor
- Ensure patterns are listed in the correct order (first match wins)

### Imports not resolving

- Check [resolver configuration in `import/resolver`](./custom-resolvers.md)
- Try limiting to a single file to isolate the issue

