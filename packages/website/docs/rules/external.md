---
id: external
title: External
description: Learn how to manage external dependencies in ESLint Plugin Boundaries rules.
tags:
  - rules
  - configuration
  - examples
---

# external


> Enforce allowed external dependencies by **[element](../setup/elements.md)** type.


## Rule Details


This rule validates `import` statements (or any other **[dependency-creating syntax](../setup/settings.md#boundariesdependency-nodes)**) to external modules and allows or disallows them based on the element importing the module and the provided configuration. It helps maintain consistent dependency management across different architectural layers.


## Options


```
"boundaries/external":
  [<enabled>, { "default": <string>, "message": <string>, "rules": <object> }]
```


**Configuration properties:**


- `enabled`: Enables the rule. `0` = off, `1` = warning, `2` = error
- `default`: `"allow"` or `"disallow"`. Determines the default behavior for external imports that don't match any rule
- `message`: Custom error message for rule violations. Note that **the default message provides detailed information about why the error occurred**, so only define a custom message if necessary. See [error messages](#error-messages) for more information
- `rules`: An array of rule objects processed in order to determine whether an import should be allowed. Each rule object contains:
  - `from`: **[`<element selectors>`](../setup/selectors.md)** - If the file being analyzed matches this selector, the rule will be evaluated. Otherwise, it is skipped
  - `disallow`: **`<external module selectors>`** - If the imported external module matches this selector, the import is disallowed (can be overridden by a subsequent rule returning `"allow"`)
  - `allow`: **`<external module selectors>`** - If the imported external module matches this selector, the import is allowed (can be overridden by a subsequent rule returning `"disallow"`)
  - `importKind`: `<string>` - Optional. [TypeScript](../guides/typescript-support.md) only. Specifies whether the rule applies to value or type imports. Can be a string, array of strings, or micromatch pattern. Possible values: `"value"`, `"type"`, or `"typeof"`
  - `message`: `<string>` - Custom error message for this specific rule. See [error messages](#error-messages) for more information


### External Module Selectors


The `allow` and `disallow` properties support one or multiple patterns to match external libraries. Each pattern can have the following formats:


- **`<string>`** - A [micromatch pattern](https://github.com/micromatch/micromatch) to match the module name
- **`[<string>, <object>]`** - An array containing a [micromatch pattern](https://github.com/micromatch/micromatch) as the first element and an options object with the following properties:
  - `specifiers`: `<array>` - Array of import specifiers to match. Each specifier can be expressed as a [micromatch pattern](https://github.com/micromatch/micromatch). Matching specifiers are available as `${report.specifiers}` in custom error messages
  - `path`: `<string>` or `<array<string>>` - Micromatch patterns to match the imported subpath from the module. If an array is provided, the module matches if any pattern matches. **Note that paths must start with a `/` character**. The path is available as `${report.path}` in custom error messages


:::info
When using options:
- If `path` is provided, the pattern only matches if the imported subpath from the module matches any of the patterns
- If `specifiers` is provided, the pattern only matches if any of the specifiers is used in the import statement
:::


### Pattern Matching Examples


| Pattern | Import Statement | Match |
|---------|-----------------|-------|
| `"foo-library"` | `import "foo-library"` | ✅ |
| `"foo-library"` | `import { Link } from "foo-library"` | ✅ |
| `"foo-library"` | `import { Link, Foo } from "foo-library"` | ✅ |
| `"foo-library"` | `import "another-library"` | ❌ |
| `["foo-library", { specifiers: ["Link"] }]` | `import { Link } from "foo-library"` | ✅ |
| `["foo-library", { specifiers: ["Link"] }]` | `import { Link, Foo } from "foo-library"` | ✅ |
| `["foo-library", { specifiers: ["Link"] }]` | `import "foo-library"` | ❌ |
| `["foo-library", { specifiers: ["Link"] }]` | `import { Foo } from "foo-library"` | ❌ |
| `["foo-library", { specifiers: ["Link"] }]` | `import "another-library"` | ❌ |
| `["foo-*", { specifiers: ["L*", "F*"] }]` | `import { Link } from "foo-library"` | ✅ |
| `["foo-*", { specifiers: ["L*", "F*"] }]` | `import { Foo } from "foo-another-library"` | ✅ |
| `["foo-*", { specifiers: ["L*", "F*"] }]` | `import { Var, Foo } from "foo-library"` | ✅ |
| `["foo-*", { specifiers: ["L*", "F*"] }]` | `import "foo-library"` | ❌ |
| `["foo-*", { specifiers: ["L*", "F*"] }]` | `import "another-library"` | ❌ |
| `["foo-library", { path: "/subpath" }]` | `import "foo-library/subpath"` | ✅ |
| `["foo-library", { path: "/utils/*" }]` | `import "foo-library/utils/helper"` | ✅ |
| `["foo-library", { path: "/utils/*" }]` | `import "foo-library/utils"` | ❌ |
| `["foo-library", { path: ["/subpath", "/utils/*"] }]` | `import "foo-library/another"` | ❌ |


### Configuration Example


```json
{
  "rules": {
    "boundaries/external": [2, {
      // disallow all external imports by default
      "default": "disallow",
      "rules": [
        {
          // from helper elements
          "from": ["helpers"],
          // allow importing moment
          "allow": ["moment"],
          // allow only importing types, not values (TypeScript only)
          "importKind": "type"
        },
        {
          // from component elements
          "from": ["components"],
          "allow": [
            // allow importing react
            "react",
            // allow importing any @material-ui module
            "@material-ui/*"
          ]
        },
        {
          // from components of family "molecules"
          "from": [["components", { "family": "molecules" }]],
          "disallow": [
            // disallow importing @material-ui/icons
            "@material-ui/icons"
          ]
        },
        {
          // from modules
          "from": ["modules"],
          "allow": [
            // allow importing react
            "react",
            // allow importing useHistory, Switch and Route from react-router-dom
            ["react-router-dom", { "specifiers": ["useHistory", "Switch", "Route"] }],
            // allow importing Menu icon and any icon starting with "Log" from @mui/icons-material
            ["@mui/icons-material", { "path": ["/Menu", "/Log*"] }]
          ]
        }
      ]
    }]
  }
}
```


### Settings


The following examples use this project structure and settings configuration.


**Project structure:**


```text
src/
├── components/
│   ├── atoms/
│   │   ├── atom-a/
│   │   │   ├── index.js
│   │   │   └── AtomA.js
│   │   └── atom-b/
│   │       ├── index.js
│   │       └── AtomB.js
│   └── molecules/
│       ├── molecule-a/
│       │   ├── index.js
│       │   └── MoleculeA.js
│       └── molecule-b/
│           ├── index.js
│           └── MoleculeB.js
├── helpers/
│   ├── data/
│   │   ├── sort.js
│   │   └── parse.js
│   └── permissions/
│       └── roles.js
└── modules/
    ├── module-a/
    │   ├── index.js
    │   └── ModuleA.js
    └── module-b/
        ├── index.js
        └── ModuleB.js
```


**Settings configuration:**


```json
{
  "settings": {
    "boundaries/elements": [
      {
        "type": "helpers",
        "pattern": "helpers/*/*.js",
        "mode": "file",
        "capture": ["category", "elementName"]
      },
      {
        "type": "components",
        "pattern": "components/*/*",
        "mode": "folder",
        "capture": ["family", "elementName"]
      },
      {
        "type": "modules",
        "pattern": "modules/*",
        "mode": "folder",
        "capture": ["elementName"]
      }
    ]
  }
}
```


## Examples


### Incorrect


Helpers importing value from `moment`:


```js
// src/helpers/data/parse.js
import moment from 'moment'
```


Helpers importing `react`:


```js
// src/helpers/data/parse.js
import React from 'react'
```


Components importing `moment`:


```js
// src/components/atoms/atom-a/AtomA.js
import moment from 'moment'
```


Molecule components importing `@material-ui/icons`:


```js
// src/components/molecules/molecule-a/MoleculeA.js
import { Info } from '@material-ui/icons'
```


Modules importing `withRouter` from `react-router-dom`:


```js
// src/modules/module-a/ModuleA.js
import { withRouter } from 'react-router-dom'
```


Modules importing non-allowed icons from `@mui/icons-material`:


```js
// src/modules/module-a/ModuleA.js
import { Home } from '@mui/icons-material'
```


### Correct


Helpers importing type from `moment`:


```js
// src/helpers/data/parse.js
import type moment from 'moment'
```


Components importing `react`:


```js
// src/components/atoms/atom-a/AtomA.js
import React from 'react'
```


Components importing `@material-ui/core`:


```js
// src/components/atoms/atom-a/AtomA.js
import { Button } from '@material-ui/core'
```


Modules importing `react`:


```js
// src/modules/module-a/ModuleA.js
import React from 'react'
```


Modules importing `useHistory` from `react-router-dom`:


```js
// src/modules/module-a/ModuleA.js
import { useHistory } from 'react-router-dom'
```


Modules importing `Menu` icon from `@mui/icons-material`:


```js
// src/modules/module-a/ModuleA.js
import Menu from '@mui/icons-material/Menu'
```


Modules importing `Login` icon from `@mui/icons-material`:


```js
// src/modules/module-a/ModuleA.js
import Login from '@mui/icons-material/Login'
```


## Error Messages


This rule provides detailed error messages to help you understand and resolve violations.


- **Default disallow message:** When an external import is disallowed because it doesn't match any rule and the default is `"disallow"`, the message includes the module name and element information:


  `No rule allows the usage of external module 'react' in elements of type 'helper'`


- **Rule violation message:** When a specific rule disallows an external import, the message includes which rule triggered it:


  `Usage of external module 'react' is not allowed in elements of type 'helper' with elementName 'helper-a'. Disallowed in rule 2`


- **Specifiers message:** When the violation involves specific import specifiers:


  `Usage of 'useMemo, useEffect' from external module 'react' is not allowed in elements of type 'helper' with elementName 'helper-a'. Disallowed in rule 2`


- **Path message:** When the violation involves a specific import path:


  `Usage of '/Login' from external module '@mui/icons-material' is not allowed in elements of type 'module' with elementName 'module-a'. Disallowed in rule 3`


- **Import kind message:** For TypeScript imports, the message also includes the import kind:


  `Usage of type 'useMemo, useEffect' from external module 'react' is not allowed in elements of type 'helper' with elementName 'helper-a'. Disallowed in rule 2`


:::tip
You can customize error messages globally or for specific rules. See [Rules Configuration](../setup/rules.md) for details.
:::


## Further Reading


Read next sections to learn more about related topics:


* [Defining Elements](../setup/elements.md) - Learn how to define architectural elements in your project
* [Element Selectors](../setup/selectors.md) - Learn how to define and use element selectors in your rules
* [Rules Configuration](../setup/rules.md) - Learn how to configure common rule options
* [Global Settings](../setup/settings.md) - Learn about global settings that affect all rules
