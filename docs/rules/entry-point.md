# boundaries/entry-point

> Check entry point used for each element type

## Rule details

It checks `import` statements to the elements of the project and ensure that each element is imported only by its defined entry-point based on the provided options rules.

### Options

```
"boundaries/entry-point": [<enabled>, { "default": <string>, "rules": <object> }]
```

* `enabled`: for enabling the rule. 0=off, 1=warn, 2=error.
* `default`: `allow` or `disallow`. If no one `rule` matches, the dependency will be allowed or disallowed based on this value.
* `message`: Custom message for the rule errors. Note that __the rule default message provides a lot of information about why the error was produced__, so you should define a custom message only if you are sure about what you are doing. Read ["error messages"](#error-messages) for further information.
* `rules`: Rules to be processed in order to decide if the `import` statement has to be allowed or not.
  * `target`: `<element matchers>` If the element being imported matches with this, then the rule will be executed to know if it allows/disallows the `import`. If not, the rule is skipped.
  * `disallow`: `<string>` A [`micromatch` pattern](https://github.com/micromatch/micromatch). If the element being imported matches with this, then the result of the rule will be "disallow", and the import will be notified as an `eslint` error (this value can be overwritten by a next rule returning "allow")
  * `allow`: `<string>` A [`micromatch` pattern](https://github.com/micromatch/micromatch). If the element being imported matches with this, then the result of the rule will be "allow", and the import will not be notified as an `eslint` error (this value can be overwritten by a next rule returning "disallow")
  * `message`: `<string>` Custom error message only for this rule. Read ["error messages"](#error-messages) for further info.

##### Options example

```jsonc
{
  "rules": {
    "boundaries/entry-point": [2, {
        // disallow all entry-points by default
        "default": "disallow",
        "rules": [
          {
            // when importing helpers
            "target": ["helpers"],
            // allow file (helpers are single files)
            "allow": "*"
          },
          {
            // when importing components or modules
            "target": ["components", "modules"],
            // only allow index.js
            "allow": "index.js"
          }
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

_Any other file than index.js can't be imported from components_

```js
// modules/module-a/ModuleA.js
import AtomA from 'components/atoms/atom-a/AtomA'

```

_Any other file than index.js can't be imported from modules_

```js
// modules/module-a/ModuleA.js
import ModuleB from 'modules/module-b/ModuleB'

```

### Examples of **correct** code for this rule:

_Helper file can be imported:_

```js
// src/components/atoms/atom-a/AtomA.js
import { someParser } from 'helpers/data/parse'

```

_index.js from components can be imported:_

```js
// src/components/atoms/atom-a/AtomA.js
import ComponentB from 'components/atoms/atom-b'

```

_index.js from components can be imported:_

```js
// src/components/atoms/atom-a/AtomA.js
import ComponentB from 'components/atoms/atom-b/index.js'

```

_index.js from modules can be imported:_

```js
// src/modules/module-a/ModuleA.js
import ModuleB from 'modules/module-b'

```

### Error messages

This rule provides a lot of information about the specific option producing an error, so the user can have enough context to solve it.

* If the error is produced because all entry points are disallowed by default, and no rule is specificly allowing it, then the message provides information about the dependency type and captured values: `No rule allows the entry point 'fooFile.js' in dependencies of type 'components' with category 'molecules' and elementName 'molecule-c'`.
* If the error is produced by a specific option, then the message includes information about the option producing it: `The entry point 'fooFile.js' is not allowed in elements of type 'helpers' with elementName 'helper-c'. Disallowed in rule 2`

You can also configure a custom error message for changing this default behaviour, or even custom error messages only for a specific rule option. Read ["error messages"](../../README.md#error-messages) in the main docs for further info about how to configure messages.

## Further reading

Read [how to configure the `boundaries/elements` setting](../../README.md#global-settings) to assign an element type to each project's file.
