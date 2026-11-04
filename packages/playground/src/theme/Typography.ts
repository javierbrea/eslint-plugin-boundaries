import type { TypographyVariantsOptions } from "@mui/material/styles";

/** Font families, which are tokens of the host */
const BODY_FONT = "var(--jsb-font-body)";
const MONO_FONT = "var(--jsb-font-mono)";
const DISPLAY_FONT = "var(--jsb-font-display)";

/** Font weights of the design: its bold is 600, so a heading, a button and the emphasis of a tooltip share it */
const REGULAR = 400;
const MEDIUM = 500;
const BOLD = 600;

/**
 * The type scale of the playground, from the approved mockup. It is the `typography` of the MUI theme, which the panes read with `theme.typography.<variant>`, so that a size changes in one place. Sizes are in pixels, as the mockup draws them.
 *
 * It is a constant, besides being in the theme, for what is built before any theme exists, such as the theme of the code editor.
 */
export const TYPOGRAPHY = {
  fontFamily: BODY_FONT,
  fontWeightRegular: REGULAR,
  fontWeightMedium: MEDIUM,
  fontWeightBold: BOLD,
  h1: { fontFamily: DISPLAY_FONT },
  h2: { fontFamily: DISPLAY_FONT },
  h3: { fontFamily: DISPLAY_FONT },
  h4: { fontFamily: DISPLAY_FONT },
  h5: { fontFamily: DISPLAY_FONT },
  h6: { fontFamily: DISPLAY_FONT },
  // The body is 13 px; the buttons and the tabs are a notch smaller
  body1: {
    fontFamily: BODY_FONT,
    fontSize: "13px",
    fontWeight: REGULAR,
    lineHeight: 1.45,
  },
  body2: {
    fontFamily: BODY_FONT,
    fontSize: "12.5px",
    fontWeight: REGULAR,
    lineHeight: 1.45,
  },
  button: {
    fontSize: "12.5px",
    fontWeight: BOLD,
    letterSpacing: 0,
    textTransform: "none",
  },
  // Small text in the body font: a hint, a tooltip, a label
  caption: {
    fontFamily: BODY_FONT,
    fontSize: "12px",
    fontWeight: REGULAR,
    lineHeight: 1.45,
  },
  paneLabel: {
    fontFamily: MONO_FONT,
    fontSize: "10.5px",
    fontWeight: MEDIUM,
    letterSpacing: "0.14em",
    lineHeight: 1,
    textTransform: "uppercase",
  },
  mono: {
    fontFamily: MONO_FONT,
    fontSize: "12.5px",
    fontWeight: REGULAR,
    lineHeight: 1.45,
  },
  monoSmall: {
    fontFamily: MONO_FONT,
    fontSize: "12px",
    fontWeight: REGULAR,
    lineHeight: 1.45,
  },
  monoCaption: {
    fontFamily: MONO_FONT,
    fontSize: "11.5px",
    fontWeight: REGULAR,
    lineHeight: 1.45,
  },
  monoTiny: {
    fontFamily: MONO_FONT,
    fontSize: "11px",
    fontWeight: MEDIUM,
    lineHeight: 1,
  },
  // The 28 px of a line is the pitch of the dependencies of a file
  code: {
    fontFamily: MONO_FONT,
    fontSize: "13px",
    fontWeight: REGULAR,
    lineHeight: "28px",
  },
  // A host styles its headings, such as the website's tightened letter spacing, and the titles of the mockup have none
  dialogTitle: {
    fontFamily: DISPLAY_FONT,
    fontSize: "18px",
    fontWeight: BOLD,
    letterSpacing: "normal",
    lineHeight: 1.3,
  },
  title: {
    fontFamily: DISPLAY_FONT,
    fontSize: "16px",
    fontWeight: BOLD,
    letterSpacing: "normal",
    lineHeight: 1.3,
  },
  figure: {
    fontFamily: DISPLAY_FONT,
    fontSize: "20px",
    fontWeight: BOLD,
    lineHeight: 1.1,
  },
} satisfies TypographyVariantsOptions;
