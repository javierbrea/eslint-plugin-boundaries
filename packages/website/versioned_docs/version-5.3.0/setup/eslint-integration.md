---
id: eslint-integration
title: Config Helpers
description: Configuration helpers to integrate ESLint Plugin Boundaries with your ESLint setup.
tags:
  - eslint
  - configuration
keywords:
  - JS Boundaries
  - ESLint plugin
  - boundaries
  - javaScript
  - typeScript
  - setup
  - configuration
  - settings
  - helpers
---

# Config Helpers

The plugin provides helpers to make ESLint configuration easier and type-safe.

## Predefined Configs

The plugin includes two predefined configurations to get started quickly.

### Recommended Config

:::tip Usage
**Best for:** Applying the plugin to an existing project
:::

The recommended configuration disables `boundaries/no-unknown`, `boundaries/no-unknown-files`, and `boundaries/no-ignored` rules. This allows parts of the project to be non-compliant with your element types, enabling progressive refactoring.

```js
import boundaries from "eslint-plugin-boundaries";
import { recommended } from "eslint-plugin-boundaries/config";

export default [{
  plugins: {
    boundaries,
  },
  settings: {
    ...recommended.settings,
    "boundaries/elements": [
      {
        type: "helpers",
        pattern: "helpers/*"
      },
    ]
  },
  rules: {
    ...recommended.rules,
    "boundaries/element-types": [2, {
      // Define your rules here
    }],
  }
}]
```

### Strict Config

:::tip Usage
**Best for:** New projects or enforcing full compliance
:::

All rules are enabled by default, ensuring all elements in the project are compliant with your architecture boundaries.

```js
import boundaries from "eslint-plugin-boundaries";
import { strict } from "eslint-plugin-boundaries/config";

export default [{
  plugins: {
    boundaries,
  },
  settings: {
    ...strict.settings,
    "boundaries/elements": [
      {
        type: "helpers",
        pattern: "helpers/*"
      },
    ]
  },
  rules: {
    ...strict.rules,
    "boundaries/element-types": [2, {
      // Define your rules here
    }],
  }
}]
```

## `createConfig` Helper

The `createConfig` helper enforces valid types for settings and rules while automatically:

- Adding the plugin to the `plugins` property
- Including JavaScript and TypeScript file patterns in the `files` property
- Validating that all provided settings and rules belong to the plugin

**Basic usage:**

```js
import { createConfig, recommended } from "eslint-plugin-boundaries/config";

const config = createConfig({
  settings: {
    ...recommended.settings,
    "boundaries/elements": [],
    "boundaries/ignore": ["**/ignored/**/*.js"],
  },
  rules: {
    ...recommended.rules,
    "boundaries/element-types": ["error", { default: "disallow" }],
  }
});

export default [config];
```

### Renaming the Plugin

You can rename the plugin by passing a second argument to `createConfig`. The helper will rename all rules from the `boundaries/` prefix to the provided one.

```js
import { createConfig, recommended } from "eslint-plugin-boundaries/config";

const config = createConfig({
  settings: {
    ...recommended.settings,
    "boundaries/elements": [], // Original prefix in settings
  },
  rules: {
    ...recommended.rules,
    "custom-boundaries/element-types": ["error", { default: "disallow" }], // Renamed prefix
    "boundaries/entry-point": 0, // Original prefix still works
  }
}, "custom-boundaries");

export default [config];
```

:::warning
Settings must still use the `boundaries/` prefix — ESLint doesn't namespace settings by plugin name.
:::

## Type Constants and Guards

The plugin exports constants and type guard methods for configuration values.

```ts
import {
  RULE_NAMES_MAP,
  isRuleName,
  SETTINGS_KEYS_MAP,
  isSettingsKey,
  ELEMENT_DESCRIPTOR_MODES_MAP,
  isElementDescriptorMode,
  RULE_POLICIES_MAP,
  isRulePolicy,
} from "eslint-plugin-boundaries/config";
```

Read more about these in the [TypeScript Support](../guides/typescript-support.md) guide.
