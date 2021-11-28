# boundaries/no-private

> Prevent importing private elements of another element

## Rule details

This rule follow the next principles:

* An element becomes private when it is under another element.
* Private elements can't be used by anyone except its parent. _(and any other descendant of the parent when `allowUncles` option is enabled)_
* Private elements can import public elements.
* Private elements can import another private element when both have the same parent _("brother elements")_
* Private elements can import another private element if it is a direct child of a common ancestor, and the `allowUncles` option is enabled.

### Options

```
"boundaries/no-private": [<enabled>, { "allowUncles": <boolean>, "message": <string> }]
```

* `enabled`: for enabling the rule. 0=off, 1=warn, 2=error.
* `allowUncles`: Optional. If set to `false`, it disallows importing "uncle elements". Default is `true`.
* `message`: Custom message for the rule errors. Note that __the rule default message provides enough information about why the error was produced__, so you should define a custom message only if you are sure about what you are doing. Read ["error messages"](#error-messages) for further information.

##### Options example

```jsonc
{
  "rules": {
    "boundaries/no-private": [2, { "allowUncles": true }]
  }
}
```

### Settings

Examples in the next sections are based on the previous options example and these files and settings.

```txt
src/
└── modules/
    ├── module-a/
    │   ├── index.js
    │   └── ModuleA.js
    └── module-b/
        ├── index.js
        ├── ModuleB.js
        └── modules
            ├── module-c
            │   ├── index.js
            │   ├── ModuleC.js
            │   └── modules
            │       └── module-e
            │           ├── index.js
            │           └── ModuleE.js
            └── module-d
                ├── index.js
                └── ModuleD.js
```

```jsonc
{
  "settings": {
    "boundaries/elements": [
      {
        "type": "modules",
        "pattern": "modules/*",
        "mode": "folder"
      }
    ],
    "import/resolver": {
      "babel-module": {}
    }
  }
}
```

> Some of the next examples are written as is the project has configured a babel alias for the folder `src/modules`. This is made for better readability of the examples, but it would work also with relative paths. You can configure the plugin to recognize babel aliases [using `eslint-import-resolver-babel-module` as a resolver](../../README.md#resolvers), as you can see in the settings example.

### Examples of **incorrect** code for this rule:

_`module-a` can't import `module-c` because it is child of `module-b`_

```js
// src/modules/module-a/moduleA.js
import ModuleC from 'modules/module-b/modules/module-c'
```

_`module-b` can't import `module-e` because it is child of `module-c` (even when it is his grandchild)_

```js
// src/modules/module-b/moduleB.js
import ModuleE from './modules/module-c/modules/module-e'
```

_`module-e` can't import `module-d` when `allowUncles` option is disabled_

```js
// src/modules/module-b/modules/module-c/modules/module-e/ModuleE
import ModuleD from 'modules/module-b/modules/module-d'
```

### Examples of **correct** code for this rule:

_`module-b` can import `module-c` because it is his direct child_

```js
// src/modules/module-b/ModuleB.js
import ModuleC from './modules/module-c'
```

_`module-c` can import `module-a` because it is public_

```js
// src/modules/module-b/modules/module-c/ModuleC.js
import ModuleA from 'modules/module-a'
```

_`module-c` can import `module-d` because it is his brother_

```js
// modules/module-b/modules/module-c/ModuleC.js
import ModuleD from '../module-d'
```

_`module-e` can import `module-d` because it is his uncle_

```js
// modules/module-b/modules/module-c/modules/module-e/ModuleE
import ModuleD from 'modules/module-b/modules/module-d'
```

### Error messages

This rule provides information about the parent element of the imported one in case it is private, e.g. `Dependency is private of element of type 'modules' with elementName 'module-b'`

You can also configure a custom error message for changing this default behaviour, or even custom error messages only for a specific rule option. Read ["error messages"](../../README.md#error-messages) in the main docs for further info about how to configure messages.

## Further reading

Read [how to configure the `boundaries/elements` setting](../../README.md#global-settings) to assign an element type to each project's file.
