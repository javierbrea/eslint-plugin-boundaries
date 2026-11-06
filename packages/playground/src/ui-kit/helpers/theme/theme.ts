import { createTheme } from "@mui/material/styles";
import type { Components, PaletteOptions, Theme } from "@mui/material/styles";

import {
  FOCUS_RING,
  HOVER_BACKGROUND,
  ROOT_CLASS,
  STATE_TEXT,
} from "./theme.constants";
import { TYPOGRAPHY } from "./typography";

/** Prefix of the MUI variables of the playground, so that they never collide with those of a host that uses MUI */
const CSS_VAR_PREFIX = "jsb-play";

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

/** Backdrop of the dialogs in the dark scheme: 34% of `--jsb-ink`, which is light there, would brighten the page instead of dimming it */
const DARK_BACKDROP = "rgba(0, 0, 0, 0.55)";

/** Shadow of the dialogs, the only one that is not a token */
const DIALOG_SHADOW = "0 30px 80px -30px rgba(0, 0, 0, 0.5)";

/**
 * Look of the MUI widgets that the panes use, from the approved mockup: a pane that renders one of them needs no styles of its own. Values are `var(--jsb-*)` strings, so they follow the host's theme through CSS only, and nothing reads the palette at runtime.
 */
const WIDGETS: Components<Omit<Theme, "components">> = {
  // No ripple: the keyboard ring and the hover are the only feedback of a button
  MuiButtonBase: {
    defaultProps: { disableRipple: true },
    styleOverrides: {
      root: {
        "&:focus-visible": { outline: FOCUS_RING, outlineOffset: 2 },
      },
    },
  },
  MuiButton: {
    defaultProps: { disableElevation: true },
    styleOverrides: {
      root: {
        gap: 6,
        minWidth: 0,
        height: 30,
        padding: "0 12px",
        borderRadius: "var(--jsb-radius)",
        // The border is always there, so that the three variants are as tall and as wide
        border: "1px solid transparent",
        lineHeight: 1,
        whiteSpace: "nowrap",
        "&[aria-pressed='true']": {
          backgroundColor: "var(--jsb-accent-soft)",
          color: "var(--jsb-accent)",
        },
        "&.Mui-disabled": { opacity: 0.45 },
      },
      startIcon: { margin: 0 },
      endIcon: { margin: 0 },
      outlined: {
        color: "var(--jsb-ink)",
        borderColor: "var(--jsb-line-strong)",
        "&:hover": {
          backgroundColor: "var(--jsb-accent-soft)",
          borderColor: "var(--jsb-line-strong)",
        },
        // The disabled state of MUI greys the button out with its own colors
        "&.Mui-disabled": {
          color: "var(--jsb-ink)",
          borderColor: "var(--jsb-line-strong)",
        },
      },
      contained: {
        "&.Mui-disabled": {
          color: "var(--variant-containedColor)",
          backgroundColor: "var(--variant-containedBg)",
        },
      },
      text: {
        color: "var(--jsb-muted)",
        "&:hover": { backgroundColor: "var(--jsb-accent-soft)" },
        "&.Mui-disabled": { color: "var(--jsb-muted)" },
      },
      sizeSmall: ({ theme }) => ({
        height: 26,
        padding: "0 8px",
        fontSize: theme.typography.caption.fontSize,
      }),
    },
  },
  MuiIconButton: {
    styleOverrides: {
      root: {
        width: 30,
        height: 30,
        padding: 0,
        borderRadius: "var(--jsb-radius)",
        // MUI draws the hover only while the ripple is on
        "&:hover": { backgroundColor: "var(--jsb-accent-soft)" },
        "&[aria-pressed='true']": {
          backgroundColor: "var(--jsb-accent-soft)",
          color: "var(--jsb-accent)",
        },
        "&.Mui-disabled": { opacity: 0.45, color: "var(--jsb-muted)" },
      },
      sizeSmall: { width: 24, height: 24, borderRadius: 4 },
    },
    // Only the default color, so that `color="inherit"` keeps the color of a code area
    variants: [
      { props: { color: "default" }, style: { color: "var(--jsb-muted)" } },
    ],
  },
  // The tooltip has no arrow: MUI draws none unless `arrow` is set
  MuiTooltip: {
    styleOverrides: {
      tooltip: ({ theme }) => ({
        ...theme.typography.caption,
        backgroundColor: "var(--jsb-ink)",
        color: "var(--jsb-paper)",
        borderRadius: 4,
        padding: "4px 8px",
      }),
    },
  },
  MuiTabs: {
    styleOverrides: {
      root: { minHeight: 34 },
      indicator: { height: 2, backgroundColor: "var(--jsb-accent)" },
    },
  },
  MuiTab: {
    styleOverrides: {
      // The tab takes the size of the button from MUI, which spreads the `button` variant
      root: ({ theme }) => ({
        gap: 7,
        minWidth: 0,
        minHeight: 34,
        padding: "0 12px",
        fontWeight: theme.typography.fontWeightMedium,
        letterSpacing: 0,
        lineHeight: 1,
        // A label next to an icon would stack them, as MUI puts the icon above the label by default
        flexDirection: "row",
        color: "var(--jsb-muted)",
        "&.Mui-selected": { color: "var(--jsb-ink)" },
        // The scroller of the tabs clips a ring drawn outside the tab
        "&:focus-visible": { outlineOffset: -2 },
      }),
    },
  },
  // The segmented look: a bordered track with a flat button inside
  MuiToggleButtonGroup: {
    styleOverrides: {
      root: {
        padding: 2,
        border: "1px solid var(--jsb-line)",
        borderRadius: "var(--jsb-radius)",
      },
      // The group draws the edges between its buttons, which the track makes needless
      grouped: {
        margin: 0,
        border: 0,
        borderRadius: 4,
        "&.Mui-disabled": { border: 0 },
      },
    },
  },
  MuiToggleButton: {
    styleOverrides: {
      root: ({ theme }) => ({
        minWidth: 0,
        height: 22,
        padding: "0 9px",
        border: 0,
        borderRadius: 4,
        fontSize: theme.typography.caption.fontSize,
        fontWeight: theme.typography.fontWeightMedium,
        letterSpacing: 0,
        lineHeight: 1,
        textTransform: "none",
        color: "var(--jsb-muted)",
        "&:hover": { backgroundColor: HOVER_BACKGROUND },
        "&.Mui-selected": {
          color: "var(--jsb-accent)",
          backgroundColor: "var(--jsb-accent-soft)",
          "&:hover": { backgroundColor: "var(--jsb-accent-soft)" },
        },
        "&.Mui-disabled": {
          border: 0,
          opacity: 0.45,
          color: "var(--jsb-muted)",
        },
      }),
    },
  },
  MuiPaper: {
    styleOverrides: {
      root: {
        backgroundColor: "var(--jsb-card)",
        border: "1px solid var(--jsb-line)",
        // The dark scheme of MUI lightens a surface with its elevation
        backgroundImage: "none",
      },
    },
  },
  MuiDialog: {
    styleOverrides: {
      paper: {
        borderRadius: "var(--jsb-radius-xl)",
        boxShadow: DIALOG_SHADOW,
      },
      backdrop: ({ theme }) => [
        {
          backgroundColor:
            "color-mix(in srgb, var(--jsb-ink) 34%, transparent)",
        },
        theme.applyStyles("dark", { backgroundColor: DARK_BACKDROP }),
      ],
    },
  },
  MuiDialogTitle: {
    styleOverrides: {
      root: ({ theme }) => ({
        padding: "18px 22px 6px",
        ...theme.typography.dialogTitle,
      }),
    },
  },
  MuiDialogContent: {
    styleOverrides: {
      root: {
        padding: "6px 22px 4px",
        // MUI takes the top padding away from the content that follows a title
        ".MuiDialogTitle-root + &": { paddingTop: 6 },
      },
    },
  },
  MuiDialogActions: {
    styleOverrides: { root: { padding: "12px 22px 18px" } },
  },
  // Every input is mono; the dense size is the one of the rename field of the tree
  MuiInputBase: {
    styleOverrides: {
      root: ({ theme }) => ({
        ...theme.typography.mono,
        lineHeight: 1.4,
      }),
    },
  },
  MuiOutlinedInput: {
    styleOverrides: {
      root: {
        borderRadius: "var(--jsb-radius)",
        "& .MuiOutlinedInput-notchedOutline": {
          borderColor: "var(--jsb-line-strong)",
        },
        "&.Mui-focused": { boxShadow: "0 0 0 3px var(--jsb-accent-soft)" },
        "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
          borderColor: "var(--jsb-accent)",
          borderWidth: 1,
        },
        "&.Mui-error .MuiOutlinedInput-notchedOutline": {
          borderColor: "var(--jsb-bad)",
        },
      },
      // 38 px tall; a textarea keeps the padding of the root, which is the one of the input
      input: { "&:not(textarea)": { padding: 10 } },
      multiline: { padding: 10 },
      // 20 px tall: the input has no class of its own for the size
      sizeSmall: {
        "& .MuiOutlinedInput-input:not(textarea)": { padding: "1px 6px" },
      },
      // The border leaves a gap for the label as wide as a hidden copy of it, which MUI draws in the font of the input: the copy takes the font of the label, so that the gap fits it
      notchedOutline: ({ theme }) => ({
        "& legend": {
          fontFamily: theme.typography.fieldLabel.fontFamily,
          fontSize: theme.typography.fieldLabel.fontSize,
          fontWeight: theme.typography.fieldLabel.fontWeight,
        },
      }),
    },
  },
  // The label always floats over the border of the field, as the picker draws it, on the card that the dialog is
  MuiInputLabel: {
    defaultProps: { shrink: true },
    styleOverrides: {
      root: ({ theme }) => ({
        ...theme.typography.fieldLabel,
        color: "var(--jsb-muted)",
        "&.Mui-focused": { color: "var(--jsb-accent)" },
        "&.Mui-error": { color: STATE_TEXT.bad },
      }),
      // On the border, 8 px from the corner, with the card behind it: the border has no gap for it while the field is empty and has no focus
      outlined: {
        padding: "0 4px",
        backgroundColor: "var(--jsb-card)",
        transform: "translate(8px, -7px)",
        maxWidth: "calc(100% - 16px)",
      },
    },
  },
  // A field with a list of options: 38 px tall as the other fields, with the chevron at its end and no button to clear it, since a dependency always has a file. The popup is a card of its own, on the lighter surface of the listboxes
  MuiAutocomplete: {
    styleOverrides: {
      root: {
        "& .MuiOutlinedInput-root": {
          padding: 0,
          // The room that MUI keeps for the buttons at the end, which is one button, since the other is gone
          ".MuiAutocomplete-hasPopupIcon&": { paddingRight: 36 },
          ".MuiAutocomplete-hasPopupIcon.MuiAutocomplete-hasClearIcon&": {
            paddingRight: 36,
          },
          "& .MuiAutocomplete-input": { padding: 10 },
          "& .MuiAutocomplete-endAdornment": { right: 6 },
        },
      },
      clearIndicator: { display: "none" },
      popupIndicator: { color: "var(--jsb-muted)" },
      paper: {
        // Room between the field and its list, whichever side the list opens to
        margin: "4px 0",
        backgroundColor: "var(--jsb-paper-2)",
        border: "1px solid var(--jsb-line)",
        borderRadius: "var(--jsb-radius)",
        boxShadow: "var(--jsb-shadow)",
      },
      listbox: ({ theme }) => ({
        padding: 4,
        "& .MuiAutocomplete-option": {
          ...theme.typography.mono,
          minHeight: 28,
          padding: "0 8px",
          gap: 12,
          justifyContent: "space-between",
          borderRadius: 4,
          // The option that the pointer or the arrows are on
          "&.Mui-focused": { backgroundColor: HOVER_BACKGROUND },
          "&.Mui-focusVisible": { backgroundColor: HOVER_BACKGROUND },
          // The option that is picked, which stays the same under the pointer
          "&[aria-selected='true']": {
            backgroundColor: "var(--jsb-accent-soft)",
          },
          "&[aria-selected='true'].Mui-focused": {
            backgroundColor: "var(--jsb-accent-soft)",
          },
        },
      }),
      noOptions: ({ theme }) => ({
        ...theme.typography.mono,
        padding: "6px 8px",
        color: "var(--jsb-muted)",
      }),
    },
  },
  // 26 px pills for the names of a statement: the kind of the name and the name, and a button to remove it
  MuiChip: {
    styleOverrides: {
      root: ({ theme }) => ({
        ...theme.typography.monoSmall,
        height: 26,
        borderRadius: 13,
        lineHeight: 1,
      }),
      outlined: {
        color: "var(--jsb-ink)",
        backgroundColor: "transparent",
        borderColor: "var(--jsb-line-strong)",
        // The chip that can be pressed, such as the one that adds a name, answers as a button does
        "&.MuiChip-clickable:hover": { backgroundColor: HOVER_BACKGROUND },
        "&.Mui-focusVisible": { backgroundColor: HOVER_BACKGROUND },
      },
      label: {
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "0 10px",
      },
    },
  },
  // The small radio, whose ring is the 16 px of the picker inside its 20 px box, with no padding around it. The text of its label is 5 px from the box, which makes the 7 px of the mockup between the ring and the text
  MuiRadio: {
    defaultProps: { size: "small" },
    styleOverrides: {
      root: {
        padding: 0,
        color: "var(--jsb-faint)",
        "&.Mui-checked": { color: "var(--jsb-accent)" },
        // The focus is on the input inside the radio, so the ring cannot use :focus-visible
        "&.Mui-focusVisible": {
          outline: FOCUS_RING,
          outlineOffset: 0,
          borderRadius: "50%",
        },
      },
    },
  },
  MuiFormControlLabel: {
    styleOverrides: {
      root: { margin: 0, gap: 5 },
    },
  },
};

/**
 * Creates the MUI theme of the playground: colors and fonts from the host's tokens, variables scoped to the root element, light and dark schemes following the host's `data-theme` attribute, and overlays rendered inside the root element.
 * @param getContainer Returns the root element, where dialogs, menus and popovers render so that they see its variables.
 * @returns The theme.
 */
export function createPlaygroundTheme(
  getContainer: () => HTMLElement | null
): Theme {
  const theme = createTheme({
    cssVariables: {
      // Derives shades with color-mix() and contrast text with relative colors, because the palette is made of var() values
      nativeColor: true,
      rootSelector: `.${ROOT_CLASS}`,
      colorSchemeSelector: `[data-theme="%s"] .${ROOT_CLASS}`,
      // MUI skips the variables of a theme whose prefix is the one of an outer MUI provider of the host, so the playground has its own
      cssVarPrefix: CSS_VAR_PREFIX,
    },
    colorSchemes: {
      light: { palette: PALETTE },
      dark: { palette: PALETTE },
    },
    typography: TYPOGRAPHY,
    shape: {
      // --jsb-radius
      borderRadius: 6,
    },
    components: {
      ...WIDGETS,
      MuiModal: { defaultProps: { container: getContainer } },
      MuiPopover: { defaultProps: { container: getContainer } },
      MuiPopper: { defaultProps: { container: getContainer } },
    },
  });

  // nativeColor declares its helper variables on :root; they go on the root element, with the rest of the variables
  const generateStyleSheets = theme.generateStyleSheets;
  theme.generateStyleSheets = () =>
    generateStyleSheets().map((sheet) =>
      ":root" in sheet ? { [`.${ROOT_CLASS}`]: sheet[":root"] } : sheet
    );

  return theme;
}
