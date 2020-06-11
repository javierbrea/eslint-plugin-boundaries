# boundaries/no-import-ignored

> Prevent importing files marked as ignored from the recognized elements

## Rule details

Project structure and settings in which next examples are based:

```txt
src/
├── index.js
└─ components/
   └── component-a/
        ├── index.js
        └── ComponentA.js
```

```json
{
  "settings": {
    "boundaries/types": ["components"],
    "boundaries/ignore": ["src/index.js"]
  }
}
```


### Examples of **incorrect** files for this rule:

_index.js file element is ignored, so it can't be used by components_

```js
// src/components/component-a/ComponentA.js
import index from "../../index"
```

## Rule options

```js
...
"boundaries/prefer-recognized-types": <enabled>
...
```

* `enabled`: for enabling the rule. 0=off, 1=warn, 2=error.

```json
{
  "rules": {
    "boundaries/prefer-recognized-types": 2
  }
}
```
