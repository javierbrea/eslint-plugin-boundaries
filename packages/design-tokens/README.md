# @boundaries/design-tokens

The design tokens and the self-hosted fonts of JS Boundaries. It is private: the [website](../website) and the dev harness of the [playground](../playground) load it with `workspace:`, so that both render with the same colors, typefaces and radii, in both themes.

## Contents

- `tokens.css`: the `--jsb-*` custom properties. The light values are on `:root` and the dark values on `[data-theme="dark"]`, so a host switches the theme with the `data-theme` attribute of its `<html>` element.
- `fonts.css`: the `@font-face` rules of Sora, IBM Plex Sans and IBM Plex Mono (latin subsets), whose URLs are root-relative, under `/fonts/`.
- `static/fonts/`: the woff2 files that those rules point to, copied from the Fontsource packages, with the license of each family.
- The package entry, for the Node.js config of a host: `STATIC_DIR`, the absolute path of `static/`.

## Usage

A host imports both CSS files by their package path and serves `STATIC_DIR` at the root of its site, so that `/fonts/<file>.woff2` reaches the fonts.

With Docusaurus, as the website does in its `docusaurus.config.ts`:

```ts
import { STATIC_DIR } from "@boundaries/design-tokens";

export default {
  staticDirectories: ["static", STATIC_DIR],
  presets: [
    [
      "classic",
      {
        theme: {
          customCss: [
            require.resolve("@boundaries/design-tokens/tokens.css"),
            require.resolve("@boundaries/design-tokens/fonts.css"),
          ],
        },
      },
    ],
  ],
};
```

With Vite, as the harness of the playground does:

```js
// vite.config.js
import { STATIC_DIR } from "@boundaries/design-tokens";

export default { publicDir: STATIC_DIR };
```

```ts
// The entry of the app
import "@boundaries/design-tokens/tokens.css";
import "@boundaries/design-tokens/fonts.css";
```

## Development

```bash
pnpm nx check:all design-tokens                       # lint, types and spelling; lint also compares the fonts with the Fontsource packages
pnpm --filter @boundaries/design-tokens sync:fonts    # copy the fonts from the Fontsource packages into static/fonts, after upgrading them
```

The social card of the website renders these tokens and fonts, and its build does not regenerate it: after changing one of them, run `pnpm --filter website social-card` and commit the image (see the [website README](../website/README.md#social-card)).

## License

The CSS and the entry are licensed under the MIT license, like the rest of the repository. The fonts are licensed under the SIL Open Font License 1.1; see the `LICENSE-<family>.txt` files in `static/fonts/`.
