# boundaries/element-types

> Check allowed dependencies between element types

## Rule details

It checks `import` statements between the element types of the project based on the provided options rules.

### Options

```
"boundaries/element-types": [<enabled>, { "default": <string>, "message": <string>, "rules": <object> }]
```

* `enabled`: for enabling the rule. 0=off, 1=warn, 2=error.
* `default`: `allow` or `disallow`. If no one `rule` matches, the dependency will be allowed or disallowed based on this value.
* `message`: Custom message for the rule errors. Note that __the rule default message provides a lot of information about why the error was produced__, so you should define a custom message only if you are sure about what you are doing. Read ["error messages"](#error-messages) for further information.
* `rules`: Rules to be processed in order to decide if the `import` statement has to be allowed or not. It must be an array of objects containing:
  * `from`: `<element matchers>` If the file being analyzed matches with this, then the rule will be executed to know if it allows/disallows the `import`. If not, the rule is skipped.
  * `disallow`: `<element matchers>` If the element being imported matches with this, then the result of the rule will be "disallow", and the import will be notified as an `eslint` error (this value can be overwritten by a next rule returning "allow")
  * `allow`: `<element matchers>` If the element being imported matches with this, then the result of the rule will be "allow", and the import will not be notified as an `eslint` error (this value can be overwritten by a next rule returning "disallow")
  * `message`: `<string>` Custom error message only for this rule. Read ["error messages"](#error-messages) for further info.

##### Comparing captures of the file element with captures of the imported element

As a bonus of this rule, the `<capturedValuesObject>` option of the "element matchers" in the `allow`/`disallow` properties supports replacements with the captured values of the `from` element. It sounds complicated, but it can be easy to understand with an example:

Suposse you want that helpers of one category can only import helpers of the same category. Then, you need to compare the value of the `category` captured in `from` with the value of the `category` captured in `allow`. You can use the special pattern `${capturedKey}` in the `allow` options, and it will be replaced by the correspondant captured key in `from` before using `micromatch` to check if the value matches.

So, if the `from` element has captured values `{ family: "atom", elementName: "component-a" }`, then the next element matcher in the `allow` property: `["helpers", { "category": "!${family}-${elementName}" }]` will only match if the helper captured category has a value matching `"!atom-component-a"` _(which may has not sense at all, but is useful to illustrate how the replacement works. An example with a more useful usage of this feature can be seen in the next options example)_

> Tip: You can enable the [debug mode](../../README.md#debug-mode) when configuring the plugin, and you will get information about the type assigned and captured values from each file in the project.

##### Options example

```jsonc
{
  "rules": {
    "boundaries/element-types": [2, {
        // disallow all local imports by default
        "default": "disallow",
        "rules": [
          {
            // from helper elements
            "from": ["helpers"],
            // allow importing helper elements
            "allow": ["helpers"]
          },
          {
            // from component elements
            "from": ["components"],
            "allow": [
              // allow importing components of the same family
              ["components", { "family": "${family}" }],
              // allow importing helpers with captured category "data"
              ["helpers", { "category": "data" }]
            ]
          },
          {
            // from components with captured family "molecule"
            "from": [["components", { "family": "molecule" }]],
            "allow": [
              // allow importing components with captured family "atom"
              ["components", { "family": "atom" }]
            ]
          },
          {
            // from modules
            "from": ["modules"],
            // allow importing helpers, components and modules
            "allow": ["helpers", "components", "modules"]
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
    ],
    "import/resolver": {
      "babel-module": {}
    }
  }
}
```

> Next examples are written as is the project has configured babel aliases for folders `src/helpers`, `src/components` and `src/modules`. This is made for better readability of the examples, but it would work also with relative paths. You can configure the plugin to recognize babel aliases [using `eslint-import-resolver-babel-module` as a resolver](../../README.md#resolvers), as you can see in the settings example.

### Examples of **incorrect** code for this rule:

_Helpers can't import components:_

```js
// src/helpers/permissions/roles.js
import AtomA from 'components/atoms/atom-a'
```

_Helpers can't import modules:_

```js
// src/helpers/permissions/roles.js
import ModuleA from 'modules/module-a'
```

_Components can't import components of another family:_

```js
// src/components/atoms/atom-a/AtomA.js
import MoleculeA from 'components/molecules/molecule-a'
```

_Components can't import helpers of a category different to "data":_

```js
// src/components/atoms/atom-a/AtomA.js
import { roleHasPermissions } from 'helpers/permissions/roles'
```

_Components can't import modules:_

```js
// src/components/atoms/atom-a/AtomA.js
import ModuleA from 'modules/module-a'
```

### Examples of **correct** code for this rule:

_Helpers can import helpers:_

```js
// src/helpers/permissions/roles.js
import { someParser } from 'helpers/data/parse'
```

_Components can import components of the same family:_

```js
// src/components/atoms/atom-a/AtomA.js
import AtomB from 'components/atoms/atom-b'
```

_Components can import helpers of "data" category:_

```js
// src/components/atoms/atom-a/AtomA.js
import { someParser } from 'helpers/data/parse'
```

_Components of family "molecule" can import components of family "atom":_

```js
// src/components/molecules/molecule-a/MoleculeA.js
import AtomA from 'components/atoms/atoms-a'
```

_Modules can import helpers:_

```js
// src/modules/module-a/ModuleA.js
import { someParser } from 'helpers/data/parse'
```

_Modules can import components:_

```js
// src/modules/module-a/ModuleA.js
import AtomA from 'components/atoms/atom-a'
```

_Modules can import another modules:_

```js
// src/modules/module-a/ModuleA.js
import ModuleB from 'modules/module-b'
```

### Error messages

This rule provides a lot of information about the specific option producing an error, so the user can have enough context to solve it.

* If the error is produced because all imports are disallowed by default, and no rule is specificly allowing it, then the message provides information about the file and the dependency types and captured values: `No rule allowing this dependency was found. File is of type 'components' with category 'molecules' and elementName 'molecule-c'. Dependency is of type 'modules' with domain 'domain-a' and elementName 'module-a'`.
* If the error is produced by a specific option, then the message includes information about the option producing it: `Importing elements of type 'components' with category 'atoms' and elementName '*-a' is not allowed in elements of type 'helpers' with elementName 'helper-c'. Disallowed in rule 1`

You can also configure a custom error message for changing this default behaviour, or even custom error messages only for a specific rule option. Read ["error messages"](../../README.md#error-messages) in the main docs for further info about how to configure messages.

## Further reading

Read [how to configure the `boundaries/elements` setting](../../README.md#global-settings) to assign an element type to each project's file.
