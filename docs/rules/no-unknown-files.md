# boundaries/no-unknown-files

> Prevent creating files not recognized as any of the element types

## Rule details

It checks local files paths. If the file is not recognized as part of any element defined in settings, it will be notified as an error.

### Options

```
"boundaries/no-unknown-files": [<enabled>]
```

* `enabled`: for enabling the rule. 0=off, 1=warn, 2=error.

##### Options example

```jsonc
{
  "rules": {
    "boundaries/no-unknown-files": [2]
  }
}
```

### Settings

Examples in the next sections are based on the previous options example and these files and settings.

```txt
src/
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
    "boundaries/ignore": ["src/index.js"],
    "boundaries/elements": [
      {
        "type": "helpers",
        "pattern": "helpers/*/*.js",
        "mode": "file"
      }
    ]
  }
}
```

### Examples of **incorrect** files for this rule:

_`foo.js` file is not recognized, so it is not allowed_

```js
// src/foo.js
```

### Examples of **correct** files for this rule:

_Helper files are allowed_

```js
// src/helpers/data/sort.js
```

_`index.js` file is not recognized, but it is ignored in settings_

```js
// src/index.js
```

## Further reading

* Read [how to configure the `boundaries/elements` setting](../../README.md#global-settings) to assign an element type to each project's file.
