# boundaries/allowed-types

> Prevent elements of one type to import any other element types not specified in the configuration of this rule

## Rule details

Project structure and settings in which next examples are based:

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

```json
{
  "settings": {
    "boundaries/types": ["helpers", "components", "modules"],
    "boundaries/alias": {
      "helpers": "src/helpers",
      "components": "src/components",
      "modules": "src/modules"
    }
  },
  "rules": {
    "boundaries/allowed-types": [2, {
        "allow": {
          "helpers": [],
          "components": ["helpers", "components"],
          "modules": ["helpers", "components", "modules"]
        }
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

## Rule options

```js
...
"boundaries/allowed-types": [<enabled>, { "allow": <object> }]
...
```

* `enabled`: for enabling the rule. 0=off, 1=warn, 2=error.
* `allow`: Define allowed types for each element type. (Use element type as a key in the object to define its allowed dependencies)

```json
{
  "rules": {
    "boundaries/allowed-types": [2, {
        "allow": {
          "helpers": [],
          "components": ["helpers", "components"],
          "modules": ["helpers", "components", "modules"]
        }
      }
    ]
  }
}
```
