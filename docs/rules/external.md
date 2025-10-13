# boundaries/external

> Check allowed external dependencies by element type

## Rule details

It checks `import` statements to external modules and allow or disallow them based on the element importing the module and the provided options rules.

### Options

```
"boundaries/external": [<enabled>, { "default": <string>, "rules": <object> }]
```

* `enabled`: for enabling the rule. 0=off, 1=warn, 2=error.
* `default`: `allow` or `disallow`. If no one `rule` matches, the external dependency will be allowed or disallowed based on this value.
* `message`: Custom message for the rule errors. Note that __the rule default message provides a lot of information about why the error was produced__, so you should define a custom message only if you are sure about what you are doing. Read ["error messages"](#error-messages) for further information.
* `rules`: Rules to be processed in order to decide if the `import` statement has to be allowed or not.
  * `from`: `<element selectors>` If the file being analyzed matches with this, then the rule will be executed to know if it allows/disallows the `import`. If not, the rule is skipped.
  * `disallow`: `<external modules selectors>` If the element being imported matches with this, then the result of the rule will be "disallow", and the import will be notified as an `eslint` error (this value can be overwritten by a next rule returning "allow")
  * `allow`: `<external modules selectors>` If the element being imported matches with this, then the result of the rule will be "allow", and the import will not be notified as an `eslint` error (this value can be overwritten by a next rule returning "disallow")
  * `importKind`: `<string>` Optional. It is useful only when using TypeScript, as it allows to define if the rule applies when the dependency is being imported as a value or as a type. It can be also defined as an array of strings, or a micromatch pattern. Note that possible values to match with are `"value"`, `"type"` or `"typeof"`.
  * `message`: `<string>` Custom error message only for this rule. Read ["error messages"](#error-messages) for further info.

##### External modules selectors

`allow` and `disallow` properties in the options should receive one or multiple patterns to match external libraries. Every single pattern can have next formats:

* `<string>`. A [`micromatch` pattern](https://github.com/micromatch/micromatch) to match the name of the module.
* `[<string>, <object>]`. An array containing a [`micromatch` pattern](https://github.com/micromatch/micromatch) as first element, and an options object, which can have next properties:
  * `specifiers`: `<array>` Array of used specifiers when importing the library. Each specifier can be expressed also as a [`micromatch` pattern](https://github.com/micromatch/micromatch). Matching specifiers are available as `${report.specifiers}` when defining custom error messages.
  * `path`: `<string>` or `Array<string>`. Micromatch patterns to match the path of the imported module. If the path is an array, then the module will match if any of the patterns matches. __Note that the path must start with a `/` character__. The path is available as `${report.path}` when defining custom error messages.

When using options, note that:

* If `path` option is provided, then it will only match if the path of the imported module matches with any of the patterns.
* If `specifiers` option is provided, then it will only match if any of the specifiers is used in the `import` statement.

__Examples__

* `"foo-library"`
  * `import "foo-library"` :white_check_mark:
  * `import { Link } from "foo-library"` :white_check_mark:
  * `import { Link, Foo } from "foo-library"` :white_check_mark:
  * `import "another-library"` :x:
* `["foo-library", { specifiers: ["Link"] }]`
  * `import { Link } from "foo-library"` :white_check_mark:
  * `import { Link, Foo } from "foo-library"` :white_check_mark:
  * `import "foo-library"` :x:
  * `import { Foo } from "foo-library"` :x:
  * `import "another-library"` :x:
* `["foo-*", { specifiers: ["L*", "F*"] }]`
  * `import { Link } from "foo-library"` :white_check_mark:
  * `import { Foo } from "foo-another-library"` :white_check_mark:
  * `import { Var, Foo } from "foo-library"` :white_check_mark:
  * `import "foo-library"` :x:
  * `import "another-library"` :x:

##### Further reading:
* [Main format of rules options](../../README.md#main-format-of-rules-options)
* [Element selectors](../../README.md#elements-selectors)

##### Options example

```jsonc
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
            // allow only importing types, not values. Useful only in TypeScript
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
            "from": [[ "components", { "family": "molecules" } ]],
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
              ["@mui/icons-material", { "path": ["/Menu", "/Log*"] }
            ]
          },
        ]
      }
    ]
  }
}
```

### Settings

Examples in the next sections are based on the previous options example and these files and settings.

```txt
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

```jsonc
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

### Examples of **incorrect** code for this rule:

_Helpers can't import value from `moment`:_

```js
// src/helpers/data/parse.js
import moment from 'moment'
```

_Helpers can't import `react`:_

```js
// src/helpers/data/parse.js
import React from 'react'
```

_Components can't import `moment`:_

```js
// src/components/atoms/atom-a/AtomA.js
import moment from 'moment'
```

_Components of family "molecules" can't import `@material-ui/icons`:_

```js
// src/components/molecules/molecule-a/MoleculeA.js
import { Info } from '@material-ui/icons'
```

_Modules can't import `withRouter` from `react-router-dom`:_

```js
// src/modules/module-a/ModuleA.js
import { withRouter } from 'react-router-dom'
```

_Modules can't import `@mui/icons-material`:_

```js
// src/modules/module-a/ModuleA.js
import { Login } from '@mui/icons-material'
```

### Examples of **correct** code for this rule:

_Helpers can import type from `moment`:_

```js
// src/helpers/data/parse.js
import type moment from 'moment'
```

_Components can import `react`:_

```js
// src/components/atoms/atom-a/AtomA.js
import React from 'react'
```

_Components can import `@material-ui/core`:_

```js
// src/components/atoms/atom-a/AtomA.js
import { Button } from '@material-ui/core'
```
_Modules can import `react`:_

```js
// src/modules/module-a/ModuleA.js
import React from 'react'
```

_Modules can import `useHistory` from `react-router-dom`:_

```js
// src/modules/module-a/ModuleA.js
import { useHistory } from 'react-router-dom'
```

_Modules can import `@mui/icons-material/Menu`:_

```js
// src/modules/module-a/ModuleA.js
import Login from '@mui/icons-material/Menu'
```

_Modules can import `@mui/icons-material/Login`:_

```js
// src/modules/module-a/ModuleA.js
import Login from '@mui/icons-material/Login'
```

### Error messages

This rule provides a lot of information about the specific option producing an error, so the user can have enough context to solve it.

* If the error is produced because all imports are disallowed by default, and no rule is specifically allowing it, then the message provides information about the file and the external dependency: `No rule allows the usage of external module 'react' in elements of type 'helper'`.
* If the error is produced by a specific option, then the message includes information about the option producing it: `Usage of external module 'react' is not allowed in elements of type 'helper' with elementName 'helper-a'. Disallowed in rule 2`
* If the error is produced by a specific option including specifiers property, then the message includes information it: `Usage of 'useMemo, useEffect' from external module 'react' is not allowed in elements of type 'helper' with elementName 'helper-a'. Disallowed in rule 2`
* If the error is produced by a specific option including path property, then the message includes information it: `Usage of '/Login' from external module '@mui/icons-material' is not allowed in elements of type 'module' with elementName 'module-a'. Disallowed in rule 3`
* If the rule contains an `importKind` property, then the message also includes information about the import kind: `Usage of type 'useMemo, useEffect' from external module 'react' is not allowed in elements of type 'helper' with elementName 'helper-a'. Disallowed in rule 2`

You can also configure a custom error message for changing this default behavior, or even custom error messages only for a specific rule option. Read ["error messages"](../../README.md#error-messages) in the main docs for further info about how to configure messages.

## Further reading

Read [how to configure the `boundaries/elements` setting](../../README.md#global-settings) to assign an element type to each project's file.
