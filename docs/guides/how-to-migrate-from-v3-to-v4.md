# How to migrate from v3.x to v4.x

## Breaking changes

There is only one breaking change in the v4.0.0 release. We've fixed the bug that caused ESLint to incorrectly mark the error position for multiline imports.

Previous behavior:

```js
import {
// ----^ (start of the error)
    ComponentA
} from './components/component-a';
// -----------------------------^ (end of the error)
```

Fixed behavior:

```js
import {
    ComponentA
} from './components/component-a';
// ----^ (start) ---------------^ (end)
```

## How to migrate

You need to adjust your `eslint-disable-next-line` directives to match the new position.

For example, this directive:

```js
// eslint-disable-next-line
import {
    ComponentA
} from './components/component-a';
```

Should be moved here:

```js
import {
    ComponentA
// eslint-disable-next-line
} from './components/component-a';
```