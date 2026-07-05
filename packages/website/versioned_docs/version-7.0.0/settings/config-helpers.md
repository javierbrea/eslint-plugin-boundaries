---
id: config-helpers
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
  - strict-legacy config
  - settings
  - helpers
---

# Config Helpers

The plugin provides helpers to make ESLint configuration easier and type-safe.

## Predefined Configs

The plugin includes predefined configurations to get started quickly.

### Recommended Config

:::tip[Usage]
**Best for:** Applying the plugin to an existing project
:::

The `recommended` config keeps `boundaries/no-unknown-dependencies`, `boundaries/no-unknown-files`, and `boundaries/no-ignored-dependencies` disabled. This lets parts of the project stay outside your architectural elements, so you can adopt the plugin progressively.

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

### Strict Config

:::tip[Usage]
**Best for:** New projects or enforcing full compliance
:::

The `strict` config extends `recommended` and additionally enables `boundaries/no-unknown-dependencies`, `boundaries/no-unknown-files`, and `boundaries/no-ignored-dependencies` at severity `2`. This ensures every file in the project is recognized by your architecture boundaries.

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

:::note[`no-private` stays disabled in strict]
`strict` does not enable `boundaries/no-private`; it remains disabled even when enforcing full compliance. The `no-private` rule is deprecated. To restrict access to private elements, use [`boundaries/dependencies`](../rules/no-private.mdx#migration-to-boundariesdependencies) with relationship selectors instead.
:::

### Strict Legacy Config

:::tip[Usage]
**Best for:** Projects upgrading from v6 that use the `strict` config and have `eslint-disable` comments referencing the old `boundaries/no-ignored` or `boundaries/no-unknown` rule names
:::

`strict-legacy` is otherwise identical to `strict`, but enables the deprecated `boundaries/no-ignored` and `boundaries/no-unknown` rule names instead of their `boundaries/no-ignored-dependencies` and `boundaries/no-unknown-dependencies` replacements.

Since v7, `strict` enables the new rule names. A pre-existing `// eslint-disable-next-line boundaries/no-ignored` (or `boundaries/no-unknown`) comment does not suppress violations reported under the new rule name, and may itself trigger an "unused eslint-disable directive" error if you have `reportUnusedDisableDirectives` enabled. You have two options:

- **Preferred:** keep using `strict` and update your `eslint-disable` comments to `boundaries/no-ignored-dependencies` / `boundaries/no-unknown-dependencies`. This avoids the deprecation warning the old rule names print, and is the only path forward once those names are removed in a future major version.
- **Temporary:** switch to `strict-legacy` to keep your existing `eslint-disable` comments working unchanged while you migrate them at your own pace.

```js
import boundaries from "eslint-plugin-boundaries";
import { strictLegacy } from "eslint-plugin-boundaries/config";

export default [{
  plugins: {
    boundaries,
  },
  settings: {
    ...strictLegacy.settings,
    "boundaries/elements": [
      {
        type: "helper",
        pattern: "helpers/*"
      },
    ]
  },
  rules: {
    ...strictLegacy.rules,
    "boundaries/dependencies": [2, {
      // Define your rules here
    }],
  }
}]
```

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
    "boundaries/no-unknown-dependencies": 0, // Original prefix still works
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
