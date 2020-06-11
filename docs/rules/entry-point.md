# boundaries/entry-point

> Prevent other elements importing a file different from the allowed entry point

## Rule details

Project structure and settings in which next examples are based:

```txt
src/
└── components/
    ├── component-a/
    │   ├── index.js
    │   └── ComponentA.js
    └── component-b/
        ├── index.js
        └── ComponentB.js
```

```json
{
  "settings": {
    "boundaries/types": ["components"],
    "boundaries/alias": {
      "components": "src/components"
    }
  }
}
```


### Examples of **incorrect** code for this rule:

```js
// src/components/component-a/ComponentA.js
import ComponentB from "../components/component-b/ComponentB.js"

```

### Examples of **correct** code for this rule:

```js
// src/components/component-a/ComponentA.js
import ComponentB from "../component-b"

```

```js
// src/components/component-a/ComponentA.js
import ComponentB from "../component-b/index"

```

```js
// src/components/component-a/ComponentA.js
import ComponentB from "components/component-b"

```

## Rule options

```js
...
"boundaries/entry-point": [<enabled>, { "default": <string>, "byType": <object> }]
...
```

* `enabled`: for enabling the rule. 0=off, 1=warn, 2=error.
* `default`: Default file name to be used as entry point for all element types.
* `byType`: Define specific entry point file names for specific element types. (Use element type as a key in the object to define its file name)

```json
{
  "rules": {
    "boundaries/entry-point": [2, {
      "default": "main.js",
      "byType": {
        "components": "Component.js",
        "modules": "Module.js"
      }
    }]
  }
}
```
