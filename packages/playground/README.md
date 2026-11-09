# @boundaries/playground

A React component that classifies the files of a sketched project and evaluates its dependencies against a boundaries config, in the browser. It is private: the [website](../website) renders it at `/playground/`.

## Usage

A host renders the component with a source of the project and a store of the state:

```tsx
import {
  HashStore,
  Playground,
  QUICK_START_EXAMPLE,
  SketchSource,
} from "@boundaries/playground";

const source = new SketchSource(QUICK_START_EXAMPLE.sketch);
const store = new HashStore();

<Playground
  source={source}
  store={store}
  quickStartUrl="/docs/quick-start/"
/>;
```

The source says where the project comes from and what the user can change in it. The store keeps the sketch: `HashStore` keeps it in the hash of the URL, so that a link opens it and Share copies that link, and `MemoryStore` keeps it in memory, with no Share. A store of a host implements `StateStore`: `load`, `save` and `clear`, and optionally `share`, which makes a link, and `subscribe`, which tells the playground that the sketch changed outside it. `quickStartUrl` is the guide that the help dialog links to; without it, the dialog has no link.

A page that only links to the playground, such as a page of the docs, imports `getPlaygroundHash` from `@boundaries/playground/share`. That entry loads no React and no component, and runs in Node.js too, so the link can be computed while the page renders on the server:

```ts
import { getPlaygroundHash } from "@boundaries/playground/share";

const href = `/playground/#${getPlaygroundHash({ config, project })}`;
```

`config` is the JSON5 text of `{ settings, rules }`, and `project` is the text of the text mode of the playground. A project that text mode cannot read throws an error that lists its problems.

The playground fills its container, so the host gives the container a height, such as the viewport below its navbar.

The host bundles the package and provides its peer dependencies (`react`, `react-dom`, `@mui/material`, `@emotion/react`, `@emotion/styled`) and the `--jsb-*` design tokens of the website (`packages/website/src/css/tokens.css`). The playground follows the `data-theme` attribute (`light` or `dark`) of the host's `<html>` element.

## Development

```bash
pnpm nx dev playground          # the dev harness, with the website's tokens, the Quick start example and a theme toggle
pnpm nx check:all playground    # lint, types, spelling, tests and build
```
