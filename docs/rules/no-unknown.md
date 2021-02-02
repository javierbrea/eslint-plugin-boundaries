# boundaries/no-unknown

> Prevent importing unknown elements from the known ones

## Rule details

It checks `import` statements to local files. If the imported file is not recognized as any of the element types from settings, the `import` will be notified as an error.

### Options

```
"boundaries/no-unknown": [<enabled>]
```

* `enabled`: for enabling the rule. 0=off, 1=warn, 2=error.

##### Options example

```jsonc
{
  "rules": {
    "boundaries/no-unknown": [2]
  }
}
```
### Settings

Examples in the next sections are based on the previous options example and these files and settings.

```txt
src/
├── components/
│   └─ atoms/
│       ├── atom-a/
│       │   ├── index.js
│       │   └── AtomA.js
│       └── atom-b/
│           ├── index.js
│           └── AtomB.js
├── helpers/
│   ├── data/
│   │   ├── sort.js
│   │   └── parse.js
│   └── permissions/
│       └── roles.js
│
├── foo.js
└── index.js
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
      }
    ]
  }
}
```

### Examples of **incorrect** files for this rule:

_Helpers can't import `foo.js` file because it is unknown_

```js
// src/helpers/data/parse.js
import foo from '../../foo'
```

_Components can't import `index.js` file because it is unknown_

```js
// src/components/atoms/atom-a/AtomA.js
import index from '../../../index'
```

### Examples of **correct** files for this rule:

_Components can import helpers_

```js
// src/components/atoms/atom-a/AtomA.js
import index from '../../../helpers/data/parse'
```

_`index.js` file can import `foo.js` file because both are unknown_

```js
// src/index.js
import foo from './foo'
```

## Further reading

* Read [how to configure the `boundaries/elements` setting](../../README.md#global-settings) to assign an element type to each project's file.

