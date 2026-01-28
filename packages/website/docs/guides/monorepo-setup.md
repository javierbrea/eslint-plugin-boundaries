---
id: monorepo-setup
title: Monorepo Setup
sidebar_label: Monorepo Setup
description: Configuring ESLint Plugin Boundaries for monorepo environments
tags:
  - eslint
  - monorepo
keywords:
  - JS Boundaries
  - ESLint plugin
  - boundaries
  - monorepo
  - configuration
  - setup
  - settings
  - workspace
  - packages
  - lerna
  - pnpm
  - yarn workspaces
---

# Monorepo Setup

This guide shows how to configure ESLint Plugin Boundaries in monorepo environments, where you have multiple packages within a single repository.

## Understanding External vs Local Dependencies

By default, the plugin categorizes dependencies as:

- **External**: npm packages in `node_modules` and unresolvable imports
- **Local**: all other resolved file paths within your project

:::warning
This is relevant because [`element-types`](../rules/dependencies.md) rule only applies to **local** dependencies, and [`external`](../rules/dependencies.md) rule only to **external** dependencies.
:::

In a monorepo, you might want different behavior:

1. **Treat inter-package dependencies as external** - Apply boundary rules only within each package
2. **Treat inter-package dependencies as local** - Apply boundary rules across all packages
3. **Mix both approaches** - Some packages as external, others as local

The [`boundaries/flag-as-external`](../setup/settings.md#boundariesflag-as-external) setting gives you full control over this categorization.

### Eslint Execution Context

It is also important the path where ESlint is executed from, as the `files` patterns in the config should be relative to that path (usually the monorepo root, but can also be a package directory if eslint is run from there, such as in an `nx` workspace with eslint scripts defined per package).

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
        type: "service",
        pattern: "src/services/**/*.ts"
      }
    ]
  },
  
  rules: {
    // These rules only apply within the "app" package
    "boundaries/element-types": ["error", {
      default: "disallow",
      rules: [
        {
          from: "component",
          allow: ["component", "service"]
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
import { UserService } from '../services/UserService';

// ⚠️  External dependency - boundary rules DON'T apply
import { formatDate } from '@monorepo/shared';

// ⚠️  External dependency - boundary rules DON'T apply
import { lodash } from 'lodash';
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
        type: "service",
        pattern: "packages/*/src/services/**/*.ts",
        capture: ["package"]
      }
    ]
  },
  
  rules: {
    "boundaries/element-types": ["error", {
      default: "disallow",
      rules: [
        {
          from: "component",
          allow: ["component", "service"]
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
import { UserService } from '../../services/UserService';

// ⚠️  External dependency - matches @myorg/* pattern
import { formatDate } from '@myorg/shared';

// ⚠️  External dependency - npm package
import { map } from 'lodash';
```

:::tip Use external rules to enforce constraints across packages
You can still use the [`boundaries/external`](../rules/dependencies.md) rule to enforce constraints on inter-package dependencies treated as external. For example, you can prevent certain packages from importing others by defining rules based on the external import patterns.
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
        type: "service",
        pattern: "packages/*/src/services/**/*.ts",
        capture: ["package"]
      }
    ]
  },
  
  rules: {
    "boundaries/element-types": ["error", {
      default: "disallow",
      rules: [
        {
          from: "component",
          allow: ["component", "service"]
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

// ✅ Local dependency - allowed by rules (component → service)
import { ButtonService } from '@monorepo/shared/services/FooService';

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

You could even have different configurations considering inter-package dependencies as external to add global constraints using the `external` rule, while also having configurations treating them as local for granular control using the `element-types` rule for packages that are allowed to interact.

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

### Pattern: Different Rules for Tests

Apply different boundary rules to test files:

```js
export default [
  // Production code: strict boundaries
  {
    files: ["packages/*/src/**/*.ts"],
    
    settings: {
      "boundaries/elements": [
        { type: "component", pattern: "packages/*/src/components/**/*.ts" },
        { type: "service", pattern: "packages/*/src/services/**/*.ts" }
      ]
    },
    
    rules: {
      "boundaries/element-types": ["error", {
        default: "disallow",
        rules: [
          { from: "component", allow: ["component", "service"] }
        ]
      }]
    }
  },
  
  // Test files: relaxed boundaries
  {
    files: ["packages/*/test/**/*.ts", "packages/**/*.spec.ts"],
    
    settings: {
      "boundaries/elements": [
        { type: "test", pattern: "**/*.ts" }
      ]
    },
    
    rules: {
      "boundaries/element-types": ["error", {
        default: "allow"  // Tests can import anything
      }]
    }
  }
];
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

## See Also

- [Settings Reference - flag-as-external](../setup/settings.md#boundariesflag-as-external)
- [Settings Reference - root-path](../setup/settings.md#boundariesroot-path)
- [Custom Resolvers Guide](./custom-resolvers.md)
