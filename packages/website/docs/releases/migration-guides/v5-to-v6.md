---
id: v5-to-v6
title: Migration Guide from v5 to v6
sidebar_label: v5 to v6
description: Guide to migrating ESLint Plugin Boundaries from version 5 to version 6 with object-based selector syntax.
tags:
  - configuration
  - migration
keywords:
  - eslint-plugin-boundaries
  - migration
  - update
  - guide
  - release
  - v5
  - v6
  - selectors
  - object-based
---

# Migrating from v5.x to v6.x

## Overview

Version 6.0.0 introduces **object-based selector syntax** as the recommended way to define element selectors. This provides better readability, type safety, and access to advanced matching features.

:::info Backwards Compatibility
Legacy selector formats (strings and tuples) are still supported in v6.x but are deprecated and will show a warning in your console. They will be removed entirely in v7.0.0.
:::

## Migration Steps

### Step 1: Enable Configuration Checking

Add the `boundaries/check-config` setting to identify all legacy syntax usage:

```js
export default [{
  settings: {
    "boundaries/check-config": true,
    "boundaries/elements": [/* your elements */]
  },
  rules: { /* your rules */ }
}]
```

### Step 2: Run ESLint

Run ESLint to see warnings for rules using legacy syntax:

```bash
npx eslint .
```

You'll see output like:
```
[boundaries/element-types] Detected legacy selector syntax in 3 rule(s) at indices: 0, 2, 5.
[boundaries/element-types] Detected legacy template syntax ${...} in 1 rule(s) at indices: 4.
```

### Step 3: Migrate Each Rule

Use the conversion guide below to update each flagged rule. The warning shows which rules need updating by their index in the `rules` array.

### Step 4: Verify and Disable

Once all warnings are resolved:

```js
export default [{
  settings: {
    "boundaries/check-config": false // Restore default for performance
  }
}]
```

## What Changed

### Deprecation of Legacy Selector Syntax

The following selector formats are now deprecated:

1. **String format**: `"helpers"`
2. **Tuple format**: `["helpers", { category: "data" }]`
3. **Array of legacy selectors**: `["helpers", "components"]`

### Introduction of Object-Based Selectors

The new object-based syntax provides:

- **Modern format**: `{ type: "helpers" }`
- **Clear property names**: Self-documenting code
- **Advanced features**: Access to new matching properties
- **Better composition**: Combine multiple properties easily
- **Future-proof**: New capabilities will only be added to object-based syntax

### Configuration Checking

Version 6.0.0 introduces the `boundaries/check-config` setting (disabled by default) to help with migration. When enabled, you'll see:

```
[boundaries/element-types] Detected legacy selector syntax in 3 rule(s) at indices: 0, 2, 5.
```

The warning shows all affected rules with their array indices, allowing you to migrate incrementally. This setting is designed for migration only and should be disabled once complete for optimal performance.

### Deprecation of Rule-Level `importKind`

Rule-level `importKind` in `element-types`, `entry-point`, and `external` is still supported in v6.x for backward compatibility, but it is deprecated.

When `boundaries/check-config` is enabled, you'll also see warnings like:

```
[boundaries/element-types] Detected deprecated rule-level "importKind" in 2 rule(s) at indices: 1, 3. Use selector-level "kind" instead. When both are defined, selector-level "kind" takes precedence.
```

Use selector-level `kind` in object-based selectors:

- `element-types`: `allow` / `disallow` selectors
- `entry-point`: `target` selectors
- `external`: `from` selectors

If both are present in the same rule, selector-level `kind` has priority over rule-level `importKind`.

## Why Migrate?

### Enhanced Readability

**Before (v5):**
```js
["helpers", { category: "data" }]
```

**After (v6):**
```js
{ type: "helpers", captured: { category: "data" } }
```

The object-based format makes it immediately clear what each property represents.

### Access to Advanced Features

Object-based selectors unlock powerful new matching capabilities:

#### Match by Element Origin

```js
// Match only external dependencies
{ type: "helpers", origin: "external" }

// Match only local files
{ type: "components", origin: "local" }
```

#### Match by File Path

```js
// Match components in specific directories
{ type: "component", path: "**/features/auth/**" }

// Match helpers outside test directories
{ type: "helper", path: "!**/__tests__/**" }
```

#### Match by Element Relationship

```js
// Allow importing only from child elements
{ type: "service", relationship: "child" }

// Allow importing from descendants
{ type: "helper", relationship: "descendant" }
```

#### Match by AST Node Kind

```js
// Only match dynamic imports
{ type: "component", nodeKind: "ImportExpression" }

// Match static imports only
{ type: "helper", nodeKind: "ImportDeclaration" }
```

#### Combine Multiple Properties

```js
// Complex matching with multiple conditions
{
  type: "component",
  category: "react",
  origin: "local",
  path: "**/features/**",
  captured: { module: "auth|user" }
}
```

### OR Logic for Captured Values

The new syntax supports arrays of captured value objects for OR logic:

**Before (v5):** Had to use micromatch patterns or multiple rules
```js
{
  from: ["helpers", { category: "data|api" }],
  allow: ["helpers"]
}
```

**After (v6):** Clear OR logic with arrays
```js
{
  from: {
    type: "helpers",
    captured: [
      { category: "data" },
      { category: "api" }
    ]
  },
  allow: [{ type: "helpers" }]
}
```

This is especially powerful for complex conditions:

```js
{
  type: "component",
  captured: [
    { module: "auth" },
    { module: "user", feature: "profile" },
    { module: "admin", feature: "users", scope: "management" }
  ]
}
```

### Better Type Safety

Object-based selectors provide better TypeScript support:

```typescript
import { ElementSelector } from "eslint-plugin-boundaries";

// Full IDE autocompletion and type checking
const selector: ElementSelector = {
  type: "helpers",
  category: "data",
  origin: "local"
};
```

## Migration Guide

### String Selectors → Object Format

**Simple type matching:**

```js
// Before
"helpers"

// After
{ type: "helpers" }
```

**Pattern matching:**

```js
// Before
"*-component"

// After
{ type: "*-component" }
```

### Tuple Selectors → Object Format

**With captured values:**

```js
// Before
["helpers", { category: "data" }]

// After
{ type: "helpers", captured: { category: "data" } }
```

**With multiple captured properties:**

```js
// Before
["components", { family: "molecule", elementName: "card" }]

// After
{
  type: "components",
  captured: { family: "molecule", elementName: "card" }
}
```

### Array of Selectors → Uniform Format

**Mixed legacy selectors:**

```js
// Before
["helpers", "components", ["modules", { category: "core" }]]

// After
[
  { type: "helpers" },
  { type: "components" },
  { type: "modules", captured: { category: "core" } }
]
```

### Complete Rule Example

**Before (v5):**

```js
{
  "boundaries/element-types": [2, {
    "default": "disallow",
    "rules": [
      {
        "from": ["helpers"],
        "allow": ["helpers"]
      },
      {
        "from": ["components"],
        "allow": [
          ["components", { "family": "${family}" }],
          ["helpers", { "category": "data" }]
        ]
      },
      {
        "from": [["components", { "family": "molecule" }]],
        "allow": [["components", { "family": "atom" }]]
      }
    ]
  }]
}
```

**After (v6):**

```js
{
  "boundaries/element-types": [2, {
    "default": "disallow",
    "rules": [
      {
        "from": { "type": "helpers" },
        "allow": [{ "type": "helpers" }]
      },
      {
        "from": { "type": "components" },
        "allow": [
          { "type": "components", "captured": { "family": "{{ family }}" } },
          { "type": "helpers", "captured": { "category": "data" } }
        ]
      },
      {
        "from": { "type": "components", "captured": { "family": "molecule" } },
        "allow": [{ "type": "components", "captured": { "family": "atom" } }]
      }
    ]
  }]
}
```

## Conversion Table

| Legacy Format | Object-Based Format |
|--------------|---------------------|
| `"type"` | `{ type: "type" }` |
| `["type", { prop: "value" }]` | `{ type: "type", captured: { prop: "value" } }` |
| `"*-pattern"` | `{ type: "*-pattern" }` |

## Template Syntax Changes

### Modern Template Syntax

Version 6 introduces Handlebars-style template syntax:

**Before (v5):**
```js
["helpers", { category: "!${from.category}" }]
```

**After (v6):**
```js
{ type: "helpers", captured: { category: "!{{ from.category }}" } }
```

:::note Legacy Template Support
The old `${property}` syntax is still supported for backwards compatibility but will be deprecated in v7. Update to `{{ property }}` syntax.
:::

### Available Template Variables

// TODO: Add all available template variables here

```js
// Reference properties from the source file
{{ from.type }}
{{ from.category }}
{{ from.capturedProperty }}

// Reference properties from the target dependency
{{ target.type }}
{{ target.category }}
{{ target.capturedProperty }}
```

## Advanced Examples

### Module Boundaries with Multiple Conditions

```js
{
  "boundaries/element-types": [2, {
    "default": "disallow",
    "rules": [
      {
        // From components in specific modules
        "from": {
          "type": "component",
          "captured": [
            { "module": "auth" },
            { "module": "user" },
            { "module": "admin" }
          ]
        },
        "allow": [
          // Allow importing services from the same module
          {
            "type": "service",
            "captured": { "module": "{{ from.module }}" }
          },
          // Allow importing shared UI components
          {
            "type": "component",
            "captured": { "module": "shared", "scope": "ui" }
          },
          // Allow external React libraries
          { "origin": "external", "source": "react*" }
        ]
      }
    ]
  }]
}
```

### Restricting Dynamic Imports

```js
{
  "boundaries/element-types": [2, {
    "default": "allow",
    "rules": [
      {
        // Disallow dynamic imports of components
        "from": { "type": "*" },
        "disallow": [
          {
            "type": "component",
            "nodeKind": "ImportExpression"
          }
        ],
        "message": "Dynamic imports of components are not allowed. Use static imports for better tree-shaking."
      }
    ]
  }]
}
```

## Finding and Fixing Legacy Selectors

### 1. Run ESLint

Legacy selectors will trigger a deprecation warning:

```bash
npm run lint
```

Look for:
```
Detected usage of legacy selector syntax...
```

### 2. Update Systematically

Convert one rule at a time, testing after each change:

1. Update the `from` selector
2. Update the `allow` selectors
3. Update the `disallow` selectors
4. Test with `npm run lint`
5. Repeat for next rule

### 3. Verify Migration

After migration, ensure no warnings appear:

```bash
npm run lint 2>&1 | grep "legacy selector"
```

If this returns nothing, your migration is complete! 🎉

## Migrating Custom Messages

Version 6.1.0 introduces **Handlebars templates** for custom error messages as the recommended approach, while keeping backward compatibility with legacy `${...}` templates.

:::info Backwards Compatibility
Legacy message templates using `${...}` syntax continue to work in v6.x but are deprecated. They will be removed in a future major version.
:::

### What Changed in Messages

The new Handlebars template system provides:

- **Clearer syntax**: Uses `{{...}}` instead of `${...}`
- **Structured access**: Direct access to `from`, `to`, `dependency`, and `report` objects
- **Nested properties**: Access nested data like `{{from.captured.elementName}}`
- **Better readability**: Self-documenting template syntax

### Migration Steps

#### Step 1: Identify Legacy Templates

Find all custom message definitions in your rules:

```bash
grep -r "message:" eslint.config.js
```

Look for templates using `${...}` syntax.

#### Step 2: Update Template Syntax

Replace `${...}` with `{{...}}` and update property paths:

**Legacy templates used flattened properties:**
- `${file.*}` - The importing file
- `${dependency.*}` - The imported dependency
- `${from.*}` - Legacy alias for file
- `${target.*}` - Legacy alias for dependency
- `${*.parent.*}` - Parent element properties
- `${report.*}` - Rule-specific metadata

**Handlebars templates use structured objects:**
- `{{from.*}}` - The importing element
- `{{to.*}}` - The imported element
- `{{dependency.*}}` - Dependency information (kind, specifiers, relationship)
- `{{report.*}}` - Rule-specific metadata

#### Step 3: Convert Common Patterns

**Basic type access:**

```js
// Legacy
"${file.type} cannot import ${dependency.type}"

// Handlebars
"{{from.type}} cannot import {{to.type}}"
```

**Captured values:**

```js
// Legacy (flattened)
"${file.type} with name ${file.elementName} cannot import ${dependency.category}"

// Handlebars (nested)
"{{from.type}} with name {{from.captured.elementName}} cannot import {{to.captured.category}}"
```

**Parent elements:**

```js
// Legacy
"${file.type} in ${file.parent.type} cannot import ${dependency.type}"

// Handlebars
"{{from.type}} in {{from.parents.0.type}} cannot import {{to.type}}"
```

**Import source:**

```js
// Legacy
"Do not import from ${dependency.source}"

// Handlebars
"Do not import from {{to.source}}"
```

**Dependency kind (TypeScript):**

```js
// Legacy
"Cannot import ${file.importKind} from ${dependency.type}"

// Handlebars
"Cannot import {{dependency.kind}} from {{to.type}}"
```

**Rule-specific report data:**

```js
// Legacy
"Do not import ${report.specifiers} from ${dependency.source}"

// Handlebars
"Do not import {{report.specifiers}} from {{to.source}}"
```

### Complete Example

**Before (Legacy):**

```js
export default [{
  rules: {
    "boundaries/element-types": [2, {
      default: "allow",
      message: "${file.type} cannot import ${dependency.type}",
      rules: [
        {
          from: { type: "helpers" },
          disallow: [{ type: "modules" }],
          message: "Helper ${file.elementName} cannot import module ${dependency.elementName}"
        }
      ]
    }]
  }
}]
```

**After (Handlebars):**

```js
export default [{
  rules: {
    "boundaries/element-types": [2, {
      default: "allow",
      message: "{{from.type}} cannot import {{to.type}}",
      rules: [
        {
          from: { type: "helpers" },
          disallow: [{ type: "modules" }],
          message: "Helper {{from.captured.elementName}} cannot import module {{to.captured.elementName}}"
        }
      ]
    }]
  }
}]
```

### Property Reference

For a complete reference of all available properties in `from`, `to`, and `dependency`, see:

- [Elements → Runtime Description Properties](../../setup/elements.md#runtime-description-properties)
- [Rules Configuration → Message Templating](../../setup/rules.md#message-templating)
- [Rules Configuration → Legacy Message Templates](../../setup/rules.md#legacy-message-templates)

### Testing Your Migration

After updating your messages:

1. Run your linter to see the new messages in action
2. Intentionally create violations to test message rendering
3. Verify that all dynamic values are correctly interpolated

```bash
npm run lint
```

### Timeline

- **v6.1.0+**: Handlebars templates introduced, legacy templates deprecated
- **Future major version**: Legacy `${...}` templates will be removed

**Recommendation**: Migrate to Handlebars templates now to future-proof your configuration.

## Timeline

- **v6.x**: Legacy selectors deprecated with warnings
- **v7.0.0**: Legacy selectors removed entirely

**Recommendation**: Migrate to object-based selectors now to avoid breaking changes in v7.

## Need Help?

- See [Object-Based Selectors](../../setup/selectors.md) for complete documentation
- See [Legacy Selectors](../../setup/selectors/legacy-selectors.md) for reference
- Check [Examples](../../rules/dependencies.md) in the rules documentation
- Open an issue on [GitHub](https://github.com/javierbrea/eslint-plugin-boundaries/issues) if you need assistance
