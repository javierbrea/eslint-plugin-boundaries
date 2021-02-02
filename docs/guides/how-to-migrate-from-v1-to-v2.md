# How to migrate from v1.x to v2.x

## Table of Contents

- [Breaking changes](#breaking-changes)
- [Step by step](#step-by-step)
  * [Settings](#settings)
    * [boundaries/types](#boundariestypes)
    * [boundaries/alias](#boundariesalias)
  * [Rules](#rules)
    * [boundaries/allowed-types](#boundariesprefer-recognized-types)
    * [boundaries/entry-point](#boundariesentry-point)
    * [boundaries/no-external](#boundariesno-external)
    * [boundaries/no-import-ignored](#boundariesno-import-ignored)
    * [boundaries/no-import-not-recognized-types](#boundariesno-import-not-recognized-types)
    * [boundaries/prefer-recognized-types](#boundariesprefer-recognized-types)

## Breaking changes

`eslint-plugin-boundaries` v1.x was working only in projects with a certain files and folders structure, and that was completely changed in v2.x, which can be configured to any type of project structure. This forced to modify the plugin configuration format and main rules options format.

Another important change introduced was the usage of `eslint-module-utils/resolve` module to resolve the paths of the `imports` in v2.x. This change made the plugin very much solid and customizable for any type of project, but it forced to remove the `boundaries/alias` setting that was present in v1.x.

Then, taking into account that v1.x configurations has to be modified before upgrading to v2.x anyway, the rules were also renamed to give them more understable names.

- Removed `boundaries/alias` setting. `import/resolver` has to be used instead
- Renamed `allowed-types` rule into `element-types` (now it can be used to allow/disallow). Changed the format of rule options
- Changed the format of `entry-point` rule options (now it support allow/disallow format)
- Renamed `no-external` rule into `external` (now it can be used to allow/disallow). Changed the format of rule options
- Renamed `no-import-ignored` rule into `no-ignored` (the majority of the plugin rules are referred to `import` statements, so it is not necessary to specify it in the rule name)
- Renamed `no-import-not-recognized-types` rule into `no-unknown`
- Renamed `prefer-recognized-types` rule into `no-unknown-files`

## Step by step

Here you have a reference of old v1.x settings and rules, and how to migrate them to v2.x formats.

### Settings

#### `boundaries/types`

The plugin is still compatible with this setting, and it transforms it automatically to a valid `boundaries/elements` setting, but you should migrate as soon as possible this configuration to the [new format](../../README.md#global-settings), as this support will be removed in next major versions.

Given a `boundaries/types` configuration like:

```jsonc
{
  "settings": {
    "boundaries/types": ["helpers", "components", "modules"]
  }
}
```

The v2.x plugin transforms it automatically to a `boundaries/elements` configuration like:

```jsonc
{
  "settings": {
    "boundaries/elements": [
      {
        "type": "helpers",
        "pattern": "helpers/*",
        "mode": "folder",
        "capture": ["elementName"]
      },
      {
        "type": "components",
        "pattern": "components/*",
        "mode": "folder",
        "capture": ["elementName"]
      },
      {
        "type": "modules",
        "pattern": "modules/*",
        "mode": "folder",
        "capture": ["elementName"]
      }
    ]
  }
}
```

Take into account that, if you don't migrate this setting by yourself you won't be able to configure elements of type "file", nor use custom `capture` patterns, etc.

#### `boundaries/alias`

This setting has been removed in v2.x, and you should use the correspondent [resolver](../../README.md#resolvers) being able to recognize you project aliases.

For example, if you are using `babel-plugin-module-resolver` in your project to provide aliases, you should install `eslint-import-resolver-babel-module` and configure it in the `import/resolver` setting. Then the plugin will resolve automatically the aliases you have defined for `babel`:

```jsonc
{
  "settings": {
    "import/resolver": {
      "babel-module": {}
    }
  }
}
```

Anyway, if you still need to define manually your aliases, you can use the `resolver-legacy-alias` distributed with the v2.x plugin for backward compatibility. So, and old `boundaries/alias` setting like:

```jsonc
{
  "settings": {
    "boundaries/alias": {
      "helpers": "src/helpers",
      "components": "src/components",
      "modules": "src/modules"
    }
  }
}
```

Can be migrated to an `import/resolver` setting like:

```jsonc
{
  "settings": {
    "import/resolver": {
      "eslint-import-resolver-node": {},
      "eslint-plugin-boundaries/resolver-legacy-alias": {
        "helpers": "./src/helpers",
        "components": "./src/components",
        "modules": "./src/modules"
      }
    }
  }
}
```

### Rules

#### `boundaries/allowed-types`

This rule has been renamed into `boundaries/element-types` because now it supports allowing/disallowing based on the rule options.

Rule options have to be migrated to a [valid v2.x format](../rules/element-types.md).

Given v1.x options like:

```jsonc
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

Should be migrated to:

```jsonc
{
  "rules": {
    // new rule name
    "boundaries/element-types": [2, {
        // disallow all, which was the default behavior in v1.x
        "default": "disallow",
        "rules": [
          // there is no need to migrate "allow.helpers", as they were not allowing anything
          // allow importing helpers and components from components
          {
            "from": ["components"],
            "allow": ["helpers", "components"]
          },
          // allow importing helpers, components and modules from modules
          {
            "from": ["modules"],
            "allow": ["helpers", "components", "modules"]
          }
        ]
      }
    ]
  }
}
```

#### `boundaries/entry-point`

Rule options have to be migrated to a [valid v2.x format](../rules/entry-point.md).

Now configuration presets don't assign a default value to the rule (it was `index.js` in v1.x)

Given v1.x options like:

```jsonc
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

Should be migrated to:

```jsonc
{
  "rules": {
    "boundaries/entry-point": [2, {
        // disallow all entry-points by default, which was the v1.x behavior
        "default": "disallow",
        "rules": [
          {
            // set default entry point for every elements
            "target": ["*"],
            "allow": "main.js"
          },
          {
            // disallow the default one in components and modules
            "target": ["components", "modules"],
            "disallow": "main.js"
          },
          {
            // set entry point for components
            "target": ["components"],
            // allow index.js
            "allow": "Component.js"
          },
          {
            // set entry point for modules
            "target": ["modules"],
            // only allow index.js
            "allow": "Module.js"
          }
        ]
      }
    ]
  }
}
```

> In v2.x format, you should better define a specific entry point for each element. The example shows a workaround that allows to define a default entry point for all elements, and then disallow it in specific elements, which is backward compatible with the v1.x configuration example. This is why the configuration looks more complicated than it should normally be.

#### `boundaries/no-external`

This rule has been renamed into `boundaries/external` because now it supports allowing/disallowing based on the rule options.

Rule options have to be migrated to a [valid v2.x format](../rules/external.md).

Given v1.x options like:

```jsonc
{
  "rules": {
    "boundaries/no-external": [2, {
        "forbid": {
          "helpers": ["react"],
          "components": ["react-router-dom"],
          "modules": [
            "material-ui",
            {
              "react-router-dom": ["Link"],
            }
          ]
        }
      }
    ]
  }
}
```

Should be migrated to:

```jsonc
{
  "rules": {
    "boundaries/entry-point": [2, {
        // allow all external imports by default, which was the v1.x behavior
        "default": "allow",
        "rules": [
          {
            // disallow importing `react` from helpers
            "from": ["helpers"],
            "disallow": ["react"]
          },
          {
            // disallow importing `react-router-dom` from components
            "from": ["components"],
            "disallow": ["react-router-dom"]
          },
          {
            // disallow importing `react-router-dom` `Link` specifier from modules
            "from": ["modules"],
            "disallow": [["react-router-dom", { "specifiers": ["Link"] }]]
          }
        ]
      }
    ]
  }
}
```

#### `boundaries/no-import-ignored`

This rule has been renamed into `boundaries/no-ignored`

#### `boundaries/no-import-not-recognized-types`

This rule has been renamed into `boundaries/no-unknown`

#### `boundaries/prefer-recognized-types`

This rule has been renamed into `boundaries/no-unknown-files`
