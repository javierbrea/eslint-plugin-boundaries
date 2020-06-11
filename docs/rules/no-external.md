# boundaries/no-external

> Enforce elements of one type to not use some external dependencies

## Rule details

Project structure and settings in which next examples are based:

```txt
src/
├── components/
│   └── component-a/
│       ├── index.js
│       └── ComponentA.js
├── helpers/
│   └── helper-a/
│       ├── index.js
│       └── HelperA.js
└── modules/
    └── module-a/
        ├── index.js
        └── ModuleA.js
```

```json
{
  "settings": {
    "boundaries/types": ["helpers", "components", "modules"],
  },
  "rules": {
    "boundaries/no-external": [2, {
        "forbid": {
          "helpers": ["react"],
          "components": ["react-router-dom"],
          "modules": []
        }
      }
    ]
  }
}
```


### Examples of **incorrect** code for this rule:

_Helpers can't import `react`:_

```js
// src/helpers/helper-a/HelperA.js
import React from "react"
```

_Components can't import `react-router-dom`:_

```js
// src/components/component-a/ComponentA.js
import { withRouter } from "react-router-dom"
```

### Examples of **correct** code for this rule:

_Modules can import `react-router-dom`:_

```js
// src/modules/module-a/ModuleA.js
import { withRouter } from "react-router-dom"
```

## Rule options

```js
...
"boundaries/no-external": [<enabled>, { "forbid": <object> }]
...
```

* `enabled`: for enabling the rule. 0=off, 1=warn, 2=error.
* `forbid`: Define forbidden external dependencies for each element type. (Use element type as a key in the object to define its forbidden dependencies)

```json
{
  "rules": {
    "boundaries/no-external": [2, {
        "forbid": {
          "helpers": ["react"],
          "components": ["react-router-dom"],
          "modules": []
        }
      }
    ]
  }
}
```
