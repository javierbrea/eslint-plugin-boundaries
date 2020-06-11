# boundaries/no-import-not-recognized-types

> Prevent importing not recognized elements from the recognized ones

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
└── foo/
    └── foo-a/
        └── index.js
```

```json
{
  "settings": {
    "boundaries/types": ["helpers", "components" ]
  }
}
```


### Examples of **incorrect** files for this rule:

_Foo A element is not recognized as a "component" nor "helper", because it is not under any of these folders. So it can't be used by components_

```js
// src/helpers/helper-a/HelperA.js
import fooA from "../../foo/foo-a"
```

_Foo A element is not recognized as a "component" nor "helper", because it is not under any of these folders. So it can't be used by components_

```js
// src/components/component-a/ComponentA.js
import fooA from "../../foo/foo-a"
```

### Examples of **correct** files for this rule:

_A recognized element can import another one:_

```js
// src/components/component-a/ComponentA.js
import HelperA from "../../helpers/helper-a"
```

## Rule options

```js
...
"boundaries/no-import-not-recognized-types": <enabled>
...
```

* `enabled`: for enabling the rule. 0=off, 1=warn, 2=error.

```json
{
  "rules": {
    "boundaries/no-import-not-recognized-types": 2
  }
}
```
