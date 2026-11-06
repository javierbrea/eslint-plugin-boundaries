# @boundaries/playground

A React component that classifies the files of a sketched project and evaluates its dependencies against a boundaries config, in the browser. It is private: the [website](../website) renders it at `/playground/`.

## Usage

A host renders the component with a source of the project and a store of the state:

```tsx
import {
  MemoryStore,
  Playground,
  QUICK_START_EXAMPLE,
  SketchSource,
} from "@boundaries/playground";

const source = new SketchSource(QUICK_START_EXAMPLE.sketch);
const store = new MemoryStore();

<Playground source={source} store={store} />;
```

The playground fills its container, so the host gives the container a height, such as the viewport below its navbar.

The host bundles the package and provides its peer dependencies (`react`, `react-dom`, `@mui/material`, `@emotion/react`, `@emotion/styled`) and the `--jsb-*` design tokens of the website (`packages/website/src/css/tokens.css`). The playground follows the `data-theme` attribute (`light` or `dark`) of the host's `<html>` element.

## Development

```bash
pnpm nx dev playground          # the dev harness, with the website's tokens, the Quick start example and a theme toggle
pnpm nx check:all playground    # lint, types, spelling, tests and build
```
