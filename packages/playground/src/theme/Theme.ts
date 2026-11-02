import { createTheme } from "@mui/material/styles";
import type { PaletteOptions, Theme } from "@mui/material/styles";

/** Class of the root element of the playground, the scope of every MUI variable and style */
export const ROOT_CLASS = "jsb-play-root";

/** Key of the Emotion cache of the playground, the prefix of its class names */
export const CACHE_KEY = "jsb-play";

/**
 * Colors from the `--jsb-*` tokens of the host. The tokens already change with the host's theme, so both color schemes share them; MUI's own defaults of each scheme fill the rest.
 */
const PALETTE: PaletteOptions = {
  primary: { main: "var(--jsb-accent)", contrastText: "var(--jsb-accent-ink)" },
  success: { main: "var(--jsb-ok)" },
  error: { main: "var(--jsb-bad)" },
  warning: { main: "var(--jsb-warn)" },
  info: { main: "var(--jsb-accent)" },
  text: {
    primary: "var(--jsb-ink)",
    secondary: "var(--jsb-muted)",
    disabled: "var(--jsb-faint)",
  },
  divider: "var(--jsb-line)",
  background: { default: "var(--jsb-paper)", paper: "var(--jsb-card)" },
};

/**
 * Creates the MUI theme of the playground: colors and fonts from the host's tokens, variables scoped to the root element, light and dark schemes following the host's `data-theme` attribute, and overlays rendered inside the root element.
 * @param getContainer Returns the root element, where dialogs, menus and popovers render so that they see its variables.
 * @returns The theme.
 */
export function createPlaygroundTheme(
  getContainer: () => HTMLElement | null
): Theme {
  return createTheme({
    cssVariables: {
      // Derives shades with color-mix() and contrast text with relative colors, because the palette is made of var() values
      nativeColor: true,
      rootSelector: `.${ROOT_CLASS}`,
      colorSchemeSelector: `[data-theme="%s"] .${ROOT_CLASS}`,
    },
    colorSchemes: {
      light: { palette: PALETTE },
      dark: { palette: PALETTE },
    },
    typography: {
      fontFamily: "var(--jsb-font-body)",
      h1: { fontFamily: "var(--jsb-font-display)" },
      h2: { fontFamily: "var(--jsb-font-display)" },
      h3: { fontFamily: "var(--jsb-font-display)" },
      h4: { fontFamily: "var(--jsb-font-display)" },
      h5: { fontFamily: "var(--jsb-font-display)" },
      h6: { fontFamily: "var(--jsb-font-display)" },
    },
    shape: {
      // --jsb-radius
      borderRadius: 6,
    },
    components: {
      MuiModal: { defaultProps: { container: getContainer } },
      MuiPopover: { defaultProps: { container: getContainer } },
      MuiPopper: { defaultProps: { container: getContainer } },
    },
  });
}
