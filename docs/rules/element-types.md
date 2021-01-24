# boundaries/element-types

> Check allowed dependencies between element types

## Rule details

It checks `import` statements between the element types of the project based on the provided options rules.

### Options

```
"boundaries/element-types": [<enabled>, { "default": <string>, "rules": <object> }]
```

* `enabled`: for enabling the rule. 0=off, 1=warn, 2=error.
* `default`: `allow` or `disallow`. If no one `rule` matches, the dependency will allowed or disallowed based on this value.
* `rules`: Rules to be processed in order to decide if the `import` statement has to be allowed or not.
  * `from`: `<element matchers>` If the file being analyzed matches with this, then the rule will be executed to know if it allows/disallows the `import`. If not, the rule is skipped.
  * `disallow`: `<element matchers>` If the element being imported matches with this, then the result of the rule will be "disallow", and the import will be notified as an `eslint` error (this value can be overwritten by a next rule returning "allow")
  * `allow`: `<element matchers>` If the element being imported matches with this, then the result of the rule will be "allow", and the import will not be notified as an `eslint` error (this value can be overwritten by a next rule returning "disallow")

##### Further reading:
* [Main format of rules options](../../README.md#main-format-of-rules-options)
* [Element matchers](../../README.md#element-matchers)

##### Comparing captures of the file element with captures of the imported element

As a bonus of this rule, the `<capturedValuesObject>` option of the "element matchers" in the `allow`/`disallow` properties supports replacements with the captured values of the `from` element. It sounds complicated, but it can be easy to understand with an example:

Suposse you want that helpers of one category can only import helpers of the same category. Then, you need to compare the value of the `category` captured in `from` with the value of the `category` captured in `allow`. You can use the special pattern `${capturedKey}` in the `allow` options, and it will be replaced by the correspondant captured key in `from` before using `micromatch` to check if the value matches.

So, if the `from` element has captured values `{ family: "atom", elementName: "component-a" }`, then the next element matcher in the `allow` property: `["helpers", { "category": "!${family}-${elementName}" }]` will only match if the helper captured category has a value matching `"!atom-component-a"` _(which may has not sense at all, but is useful to illustrate how the replacement works. An example with a more useful usage of this feature can be seen in the next options example)_


##### Example

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
            // from components with captured family "molecule"
            "from": [["components", { "family": "molecule" }]],
            "allow": [
              // allow importing components with captured family "atom"
              ["components", { "family": "atom" }]
            ]
          },
        ]
      }
    ]
  }
}
```

### Settings

Project structure and settings and in which next examples are based:

```txt
src/
├── components/
│   ├── component-a/
│   │   ├── index.js
│   │   └── ComponentA.js
│   └── component-b/
│       ├── index.js
│       └── ComponentB.js
├── helpers/
│   ├── helper-a/
│   │   ├── index.js
│   │   └── HelperA.js
│   └── helper-b/
│       ├── index.js
│       └── HelperB.js
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
        "pattern": "module/*",
        "mode": "folder",
        "capture": ["elementName"]
      }
    ]
  }
}
```

### Examples of **incorrect** code for this rule:

_Helpers can't import another helper:_

```js
// src/helpers/helper-a/HelperA.js
import HelperB from "helpers/helper-b"
```

_Helpers can't import a component:_

```js
// src/helpers/helper-a/HelperA.js
import ComponentA from "components/component-a"
```

_Helpers can't import a module:_

```js
// src/helpers/helper-a/HelperA.js
import ModuleA from "modules/module-a"
```

_Components can't import a module:_

```js
// src/components/component-a/ComponentA
import ModuleA from "modules/module-a"
```

### Examples of **correct** code for this rule:

_Components can import helpers:_

```js
// src/components/component-a/ComponentA.js
import HelperA from "helpers/helper-a"
```

_Components can import another components:_

```js
// src/components/component-a/ComponentA.js
import ComponentB from "components/component-b"
```

_Modules can import helpers:_

```js
// src/modules/module-a/ModuleA.js
import HelperA from "helpers/helper-a"
```

_Modules can import components:_

```js
// src/modules/module-a/ModuleA.js
import ComponentA from "components/component-a"
```

_Modules can import other modules:_

```js
// src/modules/module-a/ModuleA.js
import  ModuleB from "modules/module-b"
```

## Further reading

Read [how to configure the `boundaries/elements` setting](../../README.md#global-settings) to assign an element type to each project's file.
