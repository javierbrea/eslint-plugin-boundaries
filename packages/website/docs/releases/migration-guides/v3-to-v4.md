---
id: v3-to-v4
title: v3 to v4
description: Guide to migrating from ESLint Plugin Boundaries version 3 to version 4.
tags:
  - configuration
keywords:
  - eslint-plugin-boundaries
  - migration
  - update
  - guide
  - release
  - release notes
  - v3
  - v4
---

# Migrating from v3.x to v4.x

## Overview

The v4.0.0 release addresses a critical bug in error position reporting for multiline imports. This fix improves the accuracy of error markers in your code editor and linter output, but requires adjusting any `eslint-disable` directives you may have placed to work around the previous behavior.

## What Changed

v4.0.0 contains **only one breaking change**: a bug fix for incorrect error positioning on multiline imports. Previously, ESLint would mark the error at the beginning of the import statement rather than at the specific import causing the violation.

## Error Position Fix

### Previous Behavior (v3.x)

The error marker incorrectly pointed to the start of the import statement:

```js
import {
// ----^ (start of the error)
    ComponentA
} from './components/component-a';
// -----------------------------^ (end of the error)
```

### Fixed Behavior (v4.x)

The error marker now correctly points to the specific import that violates the rule:

```js
import {
    ComponentA
} from './components/component-a';
// ----^ (start) ---------------^ (end)
```

## Migration Guide

If you used `eslint-disable` comments to suppress errors on multiline imports, you need to move these directives to match the new error position.

### Example Migration

**Old directive (v3.x):**

```js
// eslint-disable-next-line
import {
    ComponentA
} from './components/component-a';
```

**Updated directive (v4.x):**

```js
import {
    ComponentA
// eslint-disable-next-line
} from './components/component-a';
```

The `eslint-disable-next-line` comment should now be placed on the line immediately before the closing brace, aligning with where the error is actually reported.

### Finding Affected Directives

To identify all `eslint-disable` directives that may need updating:

1. Look for `eslint-disable-next-line` or `eslint-disable` comments above multiline import statements
2. Check if the comment is on the first line of the import
3. Move it to the line before the closing brace to maintain error suppression

:::note
Single-line imports are unaffected by this change
:::