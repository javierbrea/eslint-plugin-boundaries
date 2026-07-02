---
id: typescript-support
title: TypeScript Support
description: Learn how to enable and configure ESLint Plugin Boundaries for TypeScript projects.
tags:
  - configuration
  - troubleshooting
keywords:
  - eslint-plugin-boundaries
  - TypeScript
  - eslint-import-resolver-typescript
  - path aliases
  - typed config
  - Config type
  - troubleshooting
---

# TypeScript Support

The plugin ships TypeScript type definitions for all configuration objects. This guide explains how to configure a TypeScript project and use the exported types for autocomplete and compile-time checking of your eslint-plugin-boundaries config.

## Prerequisites

To use this plugin in a TypeScript project, you'll need to install the following dependencies:

```bash
npm install --save-dev @typescript-eslint/eslint-plugin @typescript-eslint/parser eslint-import-resolver-typescript
```

These packages provide:
- **@typescript-eslint/parser**: Parses TypeScript code for ESLint
- **@typescript-eslint/eslint-plugin**: Core TypeScript ESLint rules
- **eslint-import-resolver-typescript**: Resolves TypeScript imports and path mappings

## Configuration

Configure your `eslint.config.js` file to use the TypeScript parser and resolver:

```js
import boundaries from "eslint-plugin-boundaries";
import typescriptParser from "@typescript-eslint/parser";
import typescriptEslintPlugin from "@typescript-eslint/eslint-plugin";

export default [{
  languageOptions: {
    parser: typescriptParser,
  },
  plugins: {
    "@typescript-eslint": typescriptEslintPlugin,
    boundaries,
  },
  settings: {
    "import/resolver": {
      typescript: {
        alwaysTryTypes: true,
      },
    },
  },
}];
```

### Path Mapping Support

The `eslint-import-resolver-typescript` automatically detects custom path mappings defined in your `tsconfig.json` file, making it fully compatible with TypeScript path aliases:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@modules/*": ["src/modules/*"],
      "@shared/*": ["src/shared/*"]
    }
  }
}
```

## Type Definitions

The plugin exports comprehensive TypeScript type definitions to provide autocomplete and type safety for your configuration.

### Main Config Type

The primary export is the `Config` type, which represents a fully typed [Flat Config](https://eslint.org/docs/latest/use/core-concepts/glossary#flat-config):

```ts
import type { Config } from "eslint-plugin-boundaries";

const config: Config = {
  plugins: {
    boundaries,
  },
  settings: {
    "boundaries/elements": [],
    "boundaries/ignore": ["**/ignored/**/*.js"],
  },
  rules: {
    "boundaries/dependencies": [
      "error",
      { default: "disallow", rules: [] },
    ],
  },
};
```

:::tip
For a more strongly-typed setup that also registers the plugin and validates rule prefixes for you, use [`createConfig`](../settings/config-helpers.md) imported from `eslint-plugin-boundaries/config`. The manual `Config` object above remains a valid alternative when you need to compose configs by hand.
:::

### Custom Plugin Names

The type system supports renaming the plugin when loading it in the `plugins` property:

```ts
import type { Config } from "eslint-plugin-boundaries";

const config: Config<"custom-boundaries"> = {
  plugins: {
    "custom-boundaries": boundaries, // Renamed prefix
  },
  settings: {
    "boundaries/elements": [], // Always uses original prefix in settings
    "boundaries/ignore": ["**/ignored/**/*.js"],
  },
  rules: {
    "custom-boundaries/dependencies": 2, // Must use renamed prefix
  },
};
```

:::warning
Settings always use the `boundaries/` prefix regardless of the plugin name, as ESLint doesn't namespace settings by plugin name.
:::

### Granular Type Exports

In addition to the main `Config` type, the plugin exports individual subtypes for fine-grained type safety. The most common ones:

- `Settings` - the `settings` object (typed `boundaries/*` keys).
- `Rules` - mapping of rule names to their configurations.
- `ElementDescriptor` - an entry of the [`boundaries/elements`](../classification/elements.md) setting.
- `DependenciesRule` - one entry of the [`dependencies`](../rules/dependencies.md) rule's `rules` array.
- `DependenciesRuleOptions` - options for the `dependencies` rule.
- `ElementSelector` - an [element selector](../selectors/selectors.md).
- `DependencyKind` - dependency kind union (`"value" | "type" | "typeof"`); replaces the deprecated `ImportKind`.
- `CapturedValuesSelector` - captured-values selector.
- `DependencyNodeKey`, `DependencyNodeSelector` - dependency-node configuration.
- `IgnoreSetting`, `IncludeSetting`, `RootPathSetting`, `DebugSetting`, `SettingsKey` - other [settings](../settings/settings.md) types.
- `FileDescriptor`, `FileDescriptors` - an entry (or array) of the [`boundaries/files`](../settings/settings.md#boundariesfiles) setting.

The deprecated-rule option types (`EntryPointRule`, `EntryPointRuleOptions`, `ExternalRule`, `ExternalRuleOptions`, `NoPrivateOptions`) and constants/guards (`SETTINGS_KEYS_MAP`, `RULE_NAMES_MAP`, `DEPENDENCY_KINDS_MAP`, `isSettingsKey`, `isDependencyKind`, `isFileDescriptor`, and more) are also exported. See the package types for the complete list.

This modular approach lets you import only what you need while keeping autocomplete and type checking:

```ts
import type {
  Config,
  Settings,
  Rules,
  ElementDescriptor,
  DependenciesRuleOptions,
} from "eslint-plugin-boundaries";

const elementDescriptor: ElementDescriptor = {
  type: "module",
  pattern: "modules/*",
  capture: ["elementName"],
};

const settings: Settings = {
  "boundaries/elements": [elementDescriptor],
};

const dependenciesRuleOptions: DependenciesRuleOptions = {
  default: "disallow",
  rules: [
    {
      from: { element: { type: "module" } },
      allow: { to: { element: { type: "helper" } } },
    },
  ],
};

const rules: Rules = {
  "boundaries/dependencies": ["error", dependenciesRuleOptions],
};

const config: Config = {
  files: ["**/*.js", "**/*.ts"],
  settings,
  rules,
};
```

:::note[Entity selectors]
The example above uses [entity selectors](../selectors/selectors.md) (`from: { element: { type: "..." } }`). Flat element selectors (`from: { type: "..." }`) still work and are converted internally, but the entity selector form also gives you access to `file` and `module` matching.
:::

:::warning[TypeScript breaking changes from v6]
If you are upgrading from v6, the following type exports were removed: `ElementTypesRule`, `ElementTypesRuleOptions`, `ElementSelectors`, `ElementsSelector`, `ElementSelectorWithOptions`, the guards `isElementsSelector`, `isElementDescriptorMode`, `isImportKind`, and the constant `IMPORT_KINDS_MAP`. Replace them with `DependenciesRule`, `DependenciesRuleOptions`, `ElementSelector`, `isDependencyKind`, and `DEPENDENCY_KINDS_MAP`. The deprecated `ImportKind` type still exists but prefer `DependencyKind`. See the [v6 to v7 migration guide](../releases/migration-guides/v6-to-v7.mdx) for details.
:::

## Troubleshooting

If you encounter issues with TypeScript support:

1. Ensure all dependencies are installed with compatible versions
2. Verify that `eslint-import-resolver-typescript` is configured in settings
3. Check that your `tsconfig.json` is valid and accessible
4. Confirm that the TypeScript parser is correctly specified in `languageOptions`
5. Refer to the example repository for a known working configuration

## Further Reading

- **[ESLint integration](../settings/config-helpers.md)** - `createConfig` and typed config helpers.
- **[Elements](../classification/elements.md)** - element descriptors and the entity model.
- **[Selectors](../selectors/selectors.md)** - element, file, and module selector types.
- **[Settings](../settings/settings.md)** - all available settings.
- **[Custom Resolvers](./custom-resolvers.md)** - resolver and path-alias configuration.
