---
id: v1-to-v2
title: v1 to v2
description: Guide to migrating from ESLint Plugin Boundaries version 1 to version 2.
tags:
  - configuration
keywords:
  - eslint-plugin-boundaries
  - migration
  - update
  - guide
  - release
  - release notes
  - v1
  - v2
---

# Migrating from v1.x to v2.x

## Overview

The migration from eslint-plugin-boundaries v1.x to v2.x introduces significant architectural changes. While v1.x was designed for specific project structures, v2.x is fully configurable for any project layout. This flexibility required changes to both the configuration format and rule options.

## Breaking Changes

### Key Differences

The v2.x release introduces fundamental changes to how the plugin works:

1. **Flexible configuration**: Unlike v1.x, which required a specific folder structure, v2.x can be adapted to any project layout through the `boundaries/elements` setting.

2. **Path resolution**: v2.x uses `eslint-module-utils/resolve` for path resolution, making the plugin more robust and customizable. This change required removing the `boundaries/alias` setting in favor of the standard `import/resolver` configuration.

3. **Renamed rules**: Rules have been renamed to be more descriptive and consistent, and their configuration formats have been updated.

### Summary of Changes

- **Removed**: `boundaries/alias` setting (use `import/resolver` instead)
- **Renamed**: `allowed-types` → `element-types` (with updated options format)
- **Renamed**: `no-external` → `external` (with updated options format)
- **Renamed**: `no-import-ignored` → `no-ignored`
- **Renamed**: `no-import-not-recognized-types` → `no-unknown`
- **Renamed**: `prefer-recognized-types` → `no-unknown-files`
- **Updated**: `entry-point` rule options format

## Migration Guide

This section provides detailed guidance for migrating each setting and rule from v1.x to v2.x.

### Settings

#### boundaries/types

The `boundaries/types` setting is still supported for backward compatibility, but the plugin automatically converts it to the new `boundaries/elements` format. **You should migrate this setting as soon as possible**, as support will be removed in future major versions.

**Example v1.x configuration:**

```json
{
  "settings": {
    "boundaries/types": ["helpers", "components", "modules"]
  }
}
```

**Equivalent v2.x configuration:**

```json
{
  "settings": {
    "boundaries/elements": [
      {
        "type": "helpers",
        "pattern": "helpers/*",
        "mode": "folder",
        "capture": ["elementName"]
      },
      {
        "type": "components",
        "pattern": "components/*",
        "mode": "folder",
        "capture": ["elementName"]
      },
      {
        "type": "modules",
        "pattern": "modules/*",
        "mode": "folder",
        "capture": ["elementName"]
      }
    ]
  }
}
```

:::warning
By migrating manually, you gain the ability to configure file-type elements and use custom capture patterns, which are not available with the automatic conversion.
:::

#### boundaries/alias

The `boundaries/alias` setting has been removed in v2.x. Use the appropriate `import/resolver` configuration instead.

**Recommended approach**: Install a resolver that matches your alias setup. For example, if you use `babel-plugin-module-resolver`, install `eslint-import-resolver-babel-module`:

```json
{
  "settings": {
    "import/resolver": {
      "babel-module": {}
    }
  }
}
```

**Legacy approach**: For backward compatibility, you can use the `resolver-legacy-alias` resolver included with v2.x:

**Old v1.x configuration:**

```json
{
  "settings": {
    "boundaries/alias": {
      "helpers": "src/helpers",
      "components": "src/components",
      "modules": "src/modules"
    }
  }
}
```

**Migrated to v2.x format:**

```json
{
  "settings": {
    "import/resolver": {
      "eslint-import-resolver-node": {},
      "eslint-plugin-boundaries/resolver-legacy-alias": {
        "helpers": "./src/helpers",
        "components": "./src/components",
        "modules": "./src/modules"
      }
    }
  }
}
```

### Rules

#### boundaries/allowed-types

This rule has been renamed to `boundaries/element-types` to better reflect that it can now both allow and disallow imports based on element types.

**Old v1.x configuration:**

```json
{
  "rules": {
    "boundaries/allowed-types": [2, {
      "allow": {
        "helpers": [],
        "components": ["helpers", "components"],
        "modules": ["helpers", "components", "modules"]
      }
    }]
  }
}
```

**Migrated to v2.x format:**

```json
{
  "rules": {
    "boundaries/element-types": [2, {
      "default": "disallow",
      "rules": [
        {
          "from": ["components"],
          "allow": ["helpers", "components"]
        },
        {
          "from": ["modules"],
          "allow": ["helpers", "components", "modules"]
        }
      ]
    }]
  }
}
```

**Note**: The `helpers` type in v1.x didn't allow any imports, so it doesn't require a rule in the v2.x format.

#### boundaries/entry-point

The rule options format has been updated. In v2.x, configuration presets no longer assign a default entry point (v1.x defaulted to `index.js`).

**Old v1.x configuration:**

```json
{
  "rules": {
    "boundaries/entry-point": [2, {
      "default": "main.js",
      "byType": {
        "components": "Component.js",
        "modules": "Module.js"
      }
    }]
  }
}
```

**Migrated to v2.x format:**

```json
{
  "rules": {
    "boundaries/entry-point": [2, {
      "default": "disallow",
      "rules": [
        {
          "target": ["*"],
          "allow": "main.js"
        },
        {
          "target": ["components", "modules"],
          "disallow": "main.js"
        },
        {
          "target": ["components"],
          "allow": "Component.js"
        },
        {
          "target": ["modules"],
          "allow": "Module.js"
        }
      ]
    }]
  }
}
```

:::warning
The v2.x format is more explicit than v1.x. For backward compatibility with v1.x, this example defines a default entry point for all elements, then disallows it specifically in certain elements. We recommend defining entry points explicitly for each element type instead.
:::

#### boundaries/no-external

This rule has been renamed to `boundaries/external` to indicate that it can now allow or disallow external imports.

**Old v1.x configuration:**

```json
{
  "rules": {
    "boundaries/no-external": [2, {
      "forbid": {
        "helpers": ["react"],
        "components": ["react-router-dom"],
        "modules": [
          "material-ui",
          {
            "react-router-dom": ["Link"]
          }
        ]
      }
    }]
  }
}
```

**Migrated to v2.x format:**

```json
{
  "rules": {
    "boundaries/external": [2, {
      "default": "allow",
      "rules": [
        {
          "from": ["helpers"],
          "disallow": ["react"]
        },
        {
          "from": ["components"],
          "disallow": ["react-router-dom"]
        },
        {
          "from": ["modules"],
          "disallow": [["react-router-dom", { "specifiers": ["Link"] }]]
        }
      ]
    }]
  }
}
```

#### boundaries/no-import-ignored

This rule has been renamed to `boundaries/no-ignored` for brevity. Since most plugin rules relate to imports, the `import` prefix is no longer necessary in the rule name.

#### boundaries/no-import-not-recognized-types

This rule has been renamed to `boundaries/no-unknown`.

#### boundaries/prefer-recognized-types

This rule has been renamed to `boundaries/no-unknown-files`.
