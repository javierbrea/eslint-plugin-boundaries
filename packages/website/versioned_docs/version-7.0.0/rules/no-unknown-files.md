---
id: no-unknown-files
title: Rule no-unknown-files
sidebar_label: No Unknown Files
description: Documentation for the no-unknown-files rule in ESLint Plugin Boundaries.
tags:
  - rules
  - configuration
  - examples
keywords:
  - eslint-plugin-boundaries
  - no-unknown-files rule
  - file classification
  - element descriptors
  - file descriptors
  - file categories
  - boundaries/files
  - architecture enforcement
  - linting policy
  - import restrictions
---

# no-unknown-files

> Prevent creating files not recognized by any **[element](../classification/elements.md)** or **[file descriptor](../classification/files.md)** pattern.

## Rule Details

This rule reports files that your architecture does not recognize at all. A file is reported as an error only when it matches **no [file descriptor](../classification/files.md) pattern** and belongs to **no known [element](../classification/elements.md)**. If either check recognizes the file, it is not reported.

There are two independent ways for a file to be recognized:

- It belongs to an **element** defined in `boundaries/elements` (an [element descriptor](../classification/elements.md)).
- It matches a **file descriptor** defined in [`boundaries/files`](../classification/files.md).

[File descriptors](../classification/files.md) categorize files independently of elements. A file that matches any file descriptor pattern is considered known by this rule even if it belongs to no [element](../classification/elements.md). This is useful for files that are part of your project but do not form an architectural element on their own, such as test files, stylesheets, or configuration files.

:::note
A file that is excluded from analysis through [`boundaries/ignore`](../settings/settings.md#boundariesignore) is never reported, because ignored files are not analyzed.
:::

## Options

```text
"boundaries/no-unknown-files": [<severity>]
```

This rule has no options. The only value is the ESLint severity: `0` = off, `1` = warning, `2` = error.

### Configuration Example

```js
{
  rules: {
    "boundaries/no-unknown-files": [2]
  }
}
```

### Settings

The following examples use this project structure and settings configuration.

**Project structure:**

```text
src/
├── helpers/
│   ├── data/
│   │   ├── sort.js
│   │   └── parse.js
│   └── permissions/
│       └── roles.js
├── setup.spec.js
├── foo.js
└── index.js
```

**Settings configuration:**

This configuration recognizes files in two ways. The `boundaries/elements` setting defines the `helper` element, and the `boundaries/files` setting categorizes `*.spec.js` files as `test` and `src/index.js` as `root`. As a result, the spec file and `index.js` are recognized even though they belong to no element.

```js
{
  settings: {
    "boundaries/elements": [
      {
        type: "helper",
        pattern: "helpers/*",
        capture: ["family"]
      }
    ],
    "boundaries/files": [
      { pattern: "**/*.spec.js", category: "test" },
      { pattern: "src/index.js", category: "root" }
    ]
  }
}
```

## Examples

### Incorrect

Unrecognized `foo.js` file. It matches no element and no file descriptor:

```js
// src/foo.js
```

### Correct

A helper file that belongs to the `helper` element:

```js
// src/helpers/data/sort.js
```

A spec file that belongs to no element, but matches the `test` file descriptor, so it is recognized:

```js
// src/setup.spec.js
```

A file matched by a file descriptor instead of an element. `src/index.js` matches the `root` file descriptor:

```js
// src/index.js
```

## Error Messages

Default error message:

```text
File does not match any file pattern and does not belong to any known element
```

## Further Reading

Read next sections to learn more about related topics:

* [Defining Elements](../classification/elements.md) - Learn how to define architectural elements in your project
* [File Descriptors](../classification/files.md) - Learn how to categorize files independently of elements
* [Selectors](../selectors/selectors.md) - Learn about element, file, and module selectors used in rules
* [Policies](../policies/policies.mdx) - Learn how to configure rule options and custom messages
* [Global Settings](../settings/settings.md) - Learn about global settings, including [`boundaries/files`](../settings/settings.md#boundariesfiles)
