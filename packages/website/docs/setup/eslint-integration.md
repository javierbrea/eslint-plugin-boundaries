---
id: eslint-integration
title: Config Helpers
description: Configuration helpers to integrate ESLint Plugin Boundaries with your ESLint setup.
tags:
  - eslint
  - configuration
keywords:
  - eslint-plugin-boundaries
  - JavaScript
  - TypeScript
  - eslint integration
  - flat config
  - createConfig
  - recommended config
  - strict config
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

The `recommended` config keeps `boundaries/no-unknown`, `boundaries/no-unknown-files`, `boundaries/no-ignored`, and `boundaries/no-private` disabled. This lets parts of the project stay outside your architectural elements, so you can adopt the plugin progressively.

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
        type: "helper",
        pattern: "helpers/*"
      },
    ]
  },
  rules: {
    ...recommended.rules,
    "boundaries/dependencies": [2, {
      // Define your rules here
    }],
  }
}]
```

#### Deprecated rules in the presets

Both `recommended` and `strict` also enable [`boundaries/element-types`](../rules/dependencies.md), [`boundaries/entry-point`](../rules/entry-point.mdx), and [`boundaries/external`](../rules/external.mdx) at severity `2`. These rules are deprecated in favor of [`boundaries/dependencies`](../rules/dependencies.md).

:::warning Deprecated rules in the presets
`boundaries/element-types`, `boundaries/entry-point`, and `boundaries/external` are kept for backward compatibility but are deprecated and will be removed in a future major version. They keep working; each prints a one-time deprecation warning in your console.

When you spread `...recommended.rules` (or `...strict.rules`), these rules are enabled. With empty options they produce no extra errors, so the preset is safe to start with. To remove the warnings and rely only on the canonical rule, override them:

```js
rules: {
  ...recommended.rules,
  "boundaries/element-types": 0,
  "boundaries/entry-point": 0,
  "boundaries/external": 0,
  "boundaries/dependencies": [2, { default: "disallow" }],
}
```

See the [v6 to v7 migration guide](../releases/migration-guides/v6-to-v7.mdx) for how to express `entry-point` and `external` with `boundaries/dependencies`.
:::

### Strict Config

:::tip Usage
**Best for:** New projects or enforcing full compliance
:::

The `strict` config extends `recommended` and additionally enables `boundaries/no-unknown`, `boundaries/no-unknown-files`, and `boundaries/no-ignored` at severity `2`. This ensures every file in the project is recognized by your architecture boundaries.

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
        type: "helper",
        pattern: "helpers/*"
      },
    ]
  },
  rules: {
    ...strict.rules,
    "boundaries/dependencies": [2, {
      // Define your rules here
    }],
  }
}]
```

:::note
Because `strict` inherits the rules from `recommended`, it also enables the deprecated `boundaries/element-types`, `boundaries/entry-point`, and `boundaries/external` rules. See [Deprecated rules in the presets](#deprecated-rules-in-the-presets) for how to disable them.
:::

:::warning `no-private` stays disabled in strict
`strict` does not enable `boundaries/no-private`; it remains disabled even when enforcing full compliance. The `no-private` rule is deprecated. To restrict access to private elements, use [`boundaries/dependencies`](../rules/no-private.mdx#migration-to-boundariesdependencies) with relationship selectors instead.
:::

## `createConfig` Helper

The `createConfig` helper builds a type-safe config and automatically:

- Adds the plugin to the `plugins` property
- Includes JavaScript and TypeScript file patterns in the `files` property
- Throws an error if `plugins` is provided, if any settings key is not a recognized `boundaries/` key, or if any rule key is not a recognized plugin rule

:::warning
`createConfig` validates eagerly. It throws an `Error` as soon as it finds a `plugins` field, an unknown settings key (not accepted by `isSettingsKey`), or a rule key that is not a real plugin rule. The error fails the ESLint run immediately, so typos surface early instead of being silently ignored.
:::

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
    "boundaries/dependencies": [2, { default: "disallow" }],
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
    "custom-boundaries/dependencies": [2, { default: "disallow" }], // Renamed prefix
    "boundaries/no-unknown": 0, // Original prefix still works
  }
}, "custom-boundaries");

export default [config];
```

:::warning
Settings must still use the `boundaries/` prefix — ESLint doesn't namespace settings by plugin name.
:::

## Type Constants and Guards

The plugin exports constants and type guard functions for configuration values. Use these when you build tooling that reads or validates plugin configuration programmatically.

```ts
import {
  RULE_NAMES_MAP,
  isRuleName,
  SETTINGS_KEYS_MAP,
  isSettingsKey,
  ELEMENT_DESCRIPTOR_MODES_MAP,
  RULE_POLICIES_MAP,
  isRulePolicy,
} from "eslint-plugin-boundaries/config";
```

`SETTINGS_KEYS_MAP` and `isSettingsKey` recognize every setting, including `boundaries/files` and `boundaries/elements-single-type`. See the [Settings](./settings.md) reference for the full list.

Read more about these in the [TypeScript Support](../guides/typescript-support.md) guide.
