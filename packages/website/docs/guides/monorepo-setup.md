---
id: monorepo-setup
title: Monorepo Setup
sidebar_label: Monorepo Setup
description: Configuring ESLint Plugin Boundaries for monorepo environments
tags:
  - configuration
  - advanced
keywords:
  - eslint-plugin-boundaries
  - monorepo
  - configuration
  - setup
  - settings
  - workspace
  - packages
  - pnpm
  - yarn workspaces
  - nx
  - flag-as-external
---

# Monorepo Setup

This guide shows how to configure ESLint Plugin Boundaries in monorepo environments, where you have multiple packages within a single repository.

## Understanding External vs Local Dependencies

When a file does `import { x } from "@myorg/shared"`, the plugin resolves that import and classifies its [`module.origin`](../setup/modules.md#module-origins). By default, the plugin categorizes dependencies as:

- **External**: npm packages in `node_modules` and unresolvable imports
- **Local**: all other resolved file paths within your project

:::info Why does this matter?

Use the [`module.origin` sub-selector](../setup/selectors.md#module-sub-selector) in your rules to target dependencies based on their classification as `"local"` or `"external"`, and decide whether a rule applies to dependencies from all origins or only local ones.

**So you might want to control how inter-package dependencies in a monorepo are categorized to apply the appropriate rules.**

:::

By default, the [`dependencies`](../rules/dependencies.md) rule only evaluates **local** dependencies.

The `checkAllOrigins` option (default `false`) extends the `dependencies` rule to also evaluate external and core dependencies. Set it to `true` when you want a single rule to govern both local and external inter-package imports.

:::warning Deprecated
The [`external`](../rules/external.mdx) rule is kept for backward compatibility but is deprecated and will be removed in a future major version. Use the [`dependencies`](../rules/dependencies.md) rule with `checkAllOrigins: true` and a [`module` sub-selector](../setup/selectors.md#module-sub-selector) instead.
:::

It keeps working without changes; you will see a deprecation warning in your console. To check external inter-package dependencies the current way, use the `dependencies` rule with `checkAllOrigins: true` and target `to: { module: { origin: ["external", "core"] } }`. See the [`external`](../rules/external.mdx) rule page for full migration steps.

In a monorepo, you might want different behavior:

1. **Treat inter-package dependencies as external**
2. **Treat inter-package dependencies as local**
3. **Mix both approaches** - Some packages as external, others as local

The [`boundaries/flag-as-external`](../setup/settings.md#boundariesflag-as-external) setting gives you full control over this categorization.


:::tip Fully customizable

You can control both the categorization of inter-package dependencies (external vs local) and also if the `dependencies` rule should check dependencies from all origins or only local ones, allowing you to mix and match different approaches in the same monorepo.

* To control categorization: Use `boundaries/flag-as-external` setting with `outsideRootPath` and/or `customSourcePatterns` options.
* To control if the `dependencies` rule checks all origins: Use its `checkAllOrigins` option.

:::

### ESLint Execution Context

The path where ESLint is executed from also matters, because the `files` patterns in the config are relative to that path (usually the monorepo root, but it can also be a package directory if ESLint is run from there, such as in an `nx` workspace with ESLint scripts defined per package).

Remember: Even when splitting the eslint configuration per-package, the `files` property is relative to where ESLint is executed (usually the repository root), **not** to the config file location.

:::info Adapting examples if ESLint is run from package directories
All examples in this page **assume eslint is executed from the monorepo root**, so all `files` patterns are relative to that path, but you can easily adapt them if eslint is run from each package directory by changing the `files` patterns accordingly:

- If ESLint runs from monorepo root:
  - `files: ["packages/app/**/*.ts"]`
  - `settings: { "boundaries/root-path": resolve(import.meta.dirname, "packages/app") }`
- If running from package dir:
  - `files: ["**/*.ts"]`
  - `settings: { "boundaries/root-path": resolve(import.meta.dirname) }`
:::

### Pattern matching and `rootPath`

Element descriptor patterns are matched **relative to the [`rootPath` setting](../setup/settings.md#boundariesroot-path)**. Patterns are evaluated **right-to-left** (from the end of the path), so a pattern like `components/*/*` matches files regardless of where the matched folder sits within `rootPath`. This makes the relativity less critical for most patterns. Files resolved outside `rootPath` keep their absolute path for matching.

For how element patterns and captures work, see the [Elements documentation](../setup/elements.md).


## Scenario 1: Inter-package Dependencies as External (Package Isolation)

**Use case:** You want to apply boundary rules only within each package. Inter-package imports should be treated like external dependencies.

**Approach:** Use `outsideRootPath` to flag imports outside the package directory as external.

### Configuration

```js title="packages/app/eslint.config.js - Eslint running from monorepo root"
import { resolve } from "node:path";

export default [{
  // Apply to all files in this package
  files: ["packages/app/**/*.ts"],
  
  settings: {
    // Set root to the specific package directory
    "boundaries/root-path": resolve(import.meta.dirname, "packages/app"),
    
    // Imports outside this package are external
    "boundaries/flag-as-external": {
      outsideRootPath: true
    },
    
    "boundaries/elements": [
      {
        type: "component",
        pattern: "src/components/**/*.ts"
      },
      {
        type: "module",
        pattern: "src/modules/**/*.ts"
      }
    ]
  },
  
  rules: {
    // These rules only apply within the "app" package
    "boundaries/dependencies": ["error", {
      default: "disallow",
      checkAllOrigins: false, // Only check local dependencies
      rules: [
        {
          from: { element: { type: "component" } },
          allow: { to: { element: { type: ["component", "module"] } } }
        }
      ]
    }]
  }
}];
```

### Behavior

```ts
// packages/app/src/components/UserList.ts

// ✅ Local dependency - boundary rules apply
import { Button } from './Button';

// ✅ Local dependency - boundary rules apply  
import { UserModule } from '../modules/UserModule';

// ⚠️  External dependency - boundary rules DON'T apply
import { formatDate } from '@monorepo/shared';

// ⚠️  External dependency - boundary rules DON'T apply
import { map } from 'lodash';
```

## Scenario 2: Inter-package Dependencies as External (Shared rules for all packages)

**Use case:** Similar to Scenario 1, but you want to share the same boundary rules configuration across all packages in the monorepo.

**Approach:** Use `customSourcePatterns` to flag specific import patterns as external.

### Configuration

```js title="eslint.config.js (root level)"
import { resolve } from "node:path";

export default [{
  // Apply to all packages
  files: ["packages/*/src/**/*.ts"],
  
  settings: {
    "boundaries/root-path": resolve(import.meta.dirname),
    
    // Organization packages are external
    "boundaries/flag-as-external": {
      customSourcePatterns: ["@myorg/*"]
    },
    
    "boundaries/elements": [
      {
        type: "component",
        pattern: "packages/*/src/components/**/*.ts",
        capture: ["package"]
      },
      {
        type: "module",
        pattern: "packages/*/src/modules/**/*.ts",
        capture: ["package"]
      }
    ]
  },
  
  rules: {
    "boundaries/dependencies": ["error", {
      default: "disallow",
      checkAllOrigins: false, // Only check local dependencies
      rules: [
        {
          from: { element: { type: "component" } },
          allow: [{
            to: { element: { type: ["component", "module"] } }
          }]
        }
      ]
    }]
  }
}];
```

### Behavior

```ts
// packages/app/src/components/UserList.ts

// ✅ Local dependency - boundary rules apply
import { Button } from './Button';

// ✅ Local dependency - boundary rules apply
import { UserModule } from '../../modules/UserModule';

// ⚠️  External dependency - matches @myorg/* pattern
import { formatDate } from '@myorg/shared';

// ⚠️  External dependency - npm package
import { map } from 'lodash';
```

:::tip Use the `module` sub-selector to target inter-package dependencies
Use the [`module` sub-selector](../setup/selectors.md#module-sub-selector) in a rule's `to` to match dependencies by origin. For example, `to: { module: { origin: "external" } }` matches all external dependencies. To target only `@myorg/` packages: `to: { module: { origin: "external", source: "@myorg/*" } }`. See [Selectors](../setup/selectors.md#module-sub-selector) for the full reference.
:::

## Scenario 3: Inter-package Dependencies as Local (Monorepo-wide Rules)

**Use case:** You want to apply granular boundary rules across all packages in the monorepo. Inter-package imports should be treated as local dependencies.

**Approach:** Keep default settings (or explicitly set `outsideRootPath: false`) and define elements that span multiple packages.

### Configuration

```js title="eslint.config.js (root level)"
import { resolve } from "node:path";

export default [{
  // Apply to all packages
  files: ["packages/*/src/**/*.ts"],
  
  settings: {
    "boundaries/root-path": resolve(import.meta.dirname),
    
    "boundaries/elements": [
      {
        type: "component",
        pattern: "packages/*/src/components/**/*.ts",
        capture: ["package"]
      },
      {
        type: "module",
        pattern: "packages/*/src/modules/**/*.ts",
        capture: ["package"]
      }
    ]
  },
  
  rules: {
    "boundaries/dependencies": ["error", {
      default: "disallow",
      rules: [
        {
          from: { element: { type: "component" } },
          allow: { to: { element: { type: ["component", "module"] } } }
        }
      ]
    }]
  }
}];
```

### Behavior

```ts
// packages/app/src/components/button/Button.ts

// ✅ Local dependency - allowed by rules (component → component)
import { Text } from './components/Text';

// ✅ Local dependency - allowed by rules (component → module)
import { ButtonModule } from '@monorepo/shared/modules/FooModule';

// ❌ Local dependency - BLOCKED by rules (not explicitly allowed)
import { InternalUtil } from '@monorepo/shared/internal-utils';

// ⚠️  External dependency - boundary rules DON'T apply
import { map } from 'lodash';
```

:::info Why This Works
With `outsideRootPath: false`, imports from `packages/shared` are categorized as **local** dependencies. This allows the plugin to:
1. Match them against your element patterns
2. Apply boundary rules between packages
3. Enforce architectural constraints across your monorepo
:::

## Combining Approaches

You can combine multiple configurations with different `files` patterns in the same flat config file, enabling both package-level and monorepo-level rules.

For example, you could combine Scenario 3, defining rules that consider inter-package dependencies as local, and also Scenario 1, defining package-isolated rules.

You could even have different configurations: some treat inter-package dependencies as external to add global constraints with the `dependencies` rule and `checkAllOrigins: true`, while others treat them as local for granular control with the `dependencies` rule between packages that are allowed to interact.

## Common Patterns

### Pattern: Selectively External Packages

Flag specific packages as external while keeping others local:

```js
export default [{
  files: ["packages/**/*.ts"],
  
  settings: {
    "boundaries/flag-as-external": {
      customSourcePatterns: [
        "@myorg/design-system",  // Specific package
        "@myorg/vendor-*"        // All vendor packages
      ]
    }
  }
}];
```

## Troubleshooting

### Problem: Inter-package Imports Not Categorized Correctly

**Check:**
1. `boundaries/root-path` is set correctly
2. Patterns in `customSourcePatterns` use correct glob syntax
3. Enable [debug logging](./debugging.md) to see how imports are categorized
4. Check the `files` patterns is coherent with where ESLint is executed from

### Problem: False Positives with node_modules

If packages are symlinked or hoisted by package managers:

```js
{
  settings: {
    "boundaries/flag-as-external": {
      inNodeModules: false  // Disable node_modules check
    }
  }
}
```

Then use `customSourcePatterns` for more precise control.

## Further Reading

- **[Modules](../setup/modules.md)** - how the plugin classifies each import's origin, source, and internal path.
- **[Settings](../setup/settings.md#boundariesflag-as-external)** - the `flag-as-external` and `root-path` settings.
- **[Selectors](../setup/selectors.md#module-sub-selector)** - the `module` sub-selector for matching by origin and source.
- **[Dependencies rule](../rules/dependencies.md)** - the `checkAllOrigins` option and rule format.
- **[Custom Resolvers](./custom-resolvers.md)** - resolving imports across workspace packages.
- **[Debugging](./debugging.md)** - inspect how each import is categorized.
