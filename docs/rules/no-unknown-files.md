# boundaries/prefer-recognized-types

> Prevent creating files not recognized as any of the element types

## Rule details

Project structure and settings in which next examples are based:

```txt
src/
├── index.js
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
    "boundaries/types": ["helpers", "components" ],
    "boundaries/ignore": ["src/index.js"]
  }
}
```


### Examples of **incorrect** files for this rule:

_Foo A element is not recognized as a "component" nor a "helper", because it is not under any of these folders_

```js
// src/foo/foo-a/index.js
```

### Examples of **correct** files for this rule:

_index.js file is not allowed as it is not recognized as "component" or "helper", because it is not under any of these folders, and it has not its own element folder, but it is ignored in settings:_

```js
// src/index.js
```

_HelperA.js file is recognized as a "helper", because it is under "helpers" folder, and it has its own element folder_

```js
// src/helpers/helper-a/HelperA.js
```

_ComponentA.js file is recognized as a "component", because it is under "components" folder, and it has its own element folder_

```js
// src/components/component-a/ComponentA.js
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
