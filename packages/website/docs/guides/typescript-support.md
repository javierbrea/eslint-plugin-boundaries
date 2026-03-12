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

Eslint Plugin Boundaries provides first-class TypeScript support, including full type definitions for configuration and seamless integration with TypeScript projects.

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

In addition to the main `Config` type, the plugin exports individual subtypes for fine-grained type safety:

- `Settings` - Plugin settings configuration
- `Rules` - Mapping of rule names to their configurations
- `ElementDescriptor` - Element descriptors, as set in the `boundaries/elements` setting.
- `DependenciesRule` - `dependencies` rule configuration
- `DependenciesRuleOptions` - Options for the `dependencies` rule.
- `ElementSelector` - Element selector syntax
- `IgnoreSetting` - Ignore pattern configuration
- ...

This modular approach allows you to import only what you need while maintaining full autocomplete and type checking:

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
  pattern: "src/modules/*",
  capture: ["module"],
};

const settings: Settings = {
  "boundaries/elements": [elementDescriptor],
};

const dependenciesRuleOptions: DependenciesRuleOptions = {
  default: "disallow",
  rules: [
    {
      from: { type: "controller" },
      allow: { to: { type: ["model", "view"] } },
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

## Benefits of TypeScript Integration

Using the plugin with TypeScript provides several advantages:

- **Type Safety**: Catch configuration errors at development time
- **Autocomplete**: Get intelligent suggestions in your IDE
- **Documentation**: Inline type information serves as documentation
- **Refactoring**: Safely rename and restructure configurations
- **Path Mapping**: Automatic support for TypeScript path aliases

## Example Repository

For a complete working example of TypeScript integration, see the [example TypeScript repository](https://github.com/javierbrea/epb-ts-example), which includes a fully tested configuration.

## Troubleshooting

If you encounter issues with TypeScript support:

1. Ensure all dependencies are installed with compatible versions
2. Verify that `eslint-import-resolver-typescript` is configured in settings
3. Check that your `tsconfig.json` is valid and accessible
4. Confirm that the TypeScript parser is correctly specified in `languageOptions`
5. Refer to the example repository for a known working configuration
