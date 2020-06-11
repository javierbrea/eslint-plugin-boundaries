# boundaries/no-private

> Enforce elements to not use private elements of another element

## Rule details

This rule follow the next principles:

* An element becomes private when it is under another element.
* Private elements can't be used by anyone except its parent. _(and any other descendant of the parent when `allowUncles` option is enabled)_
* Private elements can use public elements.
* Private elements can use other private element when both have the same parent _("brother elements")_
* Private elements can use other private element if it is a direct child of a common ancestor, and the `allowUncles` option is enabled.

Project structure and settings in which next examples are based:

```txt
src/
├── components/
│   ├── component-a/
│   │   ├── index.js
│   │   ├── ComponentA.js
│   │   ├── helpers/
│   │   │   └── helper-a/
│   │   │       ├── index.js
│   │   │       ├── HelperA.js
│   │   │       └── helpers/
│   │   │           ├── helper-b/
│   │   │           ├── index.js
│   │   │           └── HelperB.js
│   │   └── components/
│   │       └── component-c/
│   │           ├── index.js
│   │           ├── ComponentC.js
│   │           └── components/
│   │               ├── component-d/
│   │               │   ├── index.js
│   │               │   └── ComponentD.js
│   │               └── component-e/
│   │                   ├── index.js
│   │                   └── ComponentE.js
│   └── component-b/
│       ├── index.js
│       └── ComponentB.js
└── modules/
    └── module-a/
        ├── index.js
        └── ModuleA.js
```

```json
{
  "settings": {
    "boundaries/types": ["components", "modules", "helpers"],
    "boundaries/alias": {
      "components": "src/components",
      "modules": "src/modules"
    }
  }
}
```


### Examples of **incorrect** code for this rule:

_Private elements can't be used by anyone except its parent (and other descendants of the parent when `allowUncles` option is enabled)_

```js
// src/components/component-a/ComponentA.js
import ComponentD from "./components/component-c/components/component-d"
```

_Component C is private of component A, so module A can't use it:_

```js
// src/modules/module-a/ModuleA.js
import ComponentC from "components/component-a/components/component-c"
```

_Helper B is private of helper A, so component C can't use it:_

```js
// src/components/component-a/components/component-c/ComponentC.js
import HelperB from "../../helpers/helper-a/helpers/helper-b"
```

_Helper B is private of helper A, so component A can't use it (even when it is its "grandchild"):_

```js
// src/components/component-a/ComponentA.js
import HelperB from "./helpers/helper-a/helpers/helper-b"
```

_Private elements can't use other private element if it is a direct child of a common ancestor, but the `allowUncles` option is disabled. Component D can't use helper A as it is a direct child of common ancestor component A, but `allowUncles` option is disabled._

```js
// .eslintrc.json
...
"boundaries/no-private": [2, {
  "allowUncles": false
}]
...
```

```js
// src/components/component-a/components/component-c/components/component-d/ComponentD.js
import HelperA from "components/component-a/helpers/helper-a"
```

### Examples of **correct** code for this rule:

_Component A is public, as it is not child of any other element, so anyone can use it:_

```js
// src/modules/module-a/ModuleA.js
import ComponentA from "components/component-a"
```

_Private elements can use public elements:_

```js
// src/components/component-a/components/component-c/ComponentC.js
import ModuleA from "modules/module-a"
```

_Elements can use their direct children elements:_

```js
// src/components/component-a/ComponentA.js
import ComponentC from "./components/component-c"
```

_Private elements can use other private element when both have the same parent. Component C can use helper A, as both are children of component A:_

```js
// src/components/component-a/components/component-c/ComponentC.js
import HelperA from "components/component-a/helpers/helper-a"
```

_Private elements can use other private element if it is a direct child of a common ancestor, and the `allowUncles` option is enabled_. Component D can use helper A as it is a direct child of common ancestor component A.

```js
// src/components/component-a/components/component-c/components/component-d/ComponentD.js
import HelperA from "components/component-a/helpers/helper-a"
```

## Rule options

```js
...
"boundaries/no-private": [<enabled>, { "allowUncles": <boolean> }]
...
```

* `enabled`: for enabling the rule. 0=off, 1=warn, 2=error.
* `allowUncles`: Optional boolean set to `false` to disallow importing "uncle elements". Default is `true`.

```json
{
  "rules": {
    "boundaries/no-private": [2, {
      "allowUncles": true
    }]
  }
}
```
