import type { CSSProperties } from "react";

// The text styles of the panes, by role. MUI only knows its own variants, so the theme declares these to read `theme.typography.mono` with its type
declare module "@mui/material/styles" {
  interface TypographyVariants {
    /** The label that floats over the border of a field */
    fieldLabel: CSSProperties;
    /** The small uppercase label of a pane head or of a group in the inspector */
    paneLabel: CSSProperties;
    /** Body text a notch larger than the body, such as the message of a verdict */
    bodyLarge: CSSProperties;
    /** Mono text a notch larger than that of rows, such as the verdict of a dependency */
    monoLarge: CSSProperties;
    /** Mono text of rows, names, paths and inputs */
    mono: CSSProperties;
    /** Mono text a notch smaller, such as the facets of the inspector and the text mode */
    monoSmall: CSSProperties;
    /** Mono text for the detail under a name */
    monoCaption: CSSProperties;
    /** Small mono text: the count of a badge */
    monoTiny: CSSProperties;
    /** The smallest mono text: the tag that marks a node */
    monoMicro: CSSProperties;
    /** Mono text of a code area that has its own line pitch, such as the dependencies of a file */
    code: CSSProperties;
    /** The title of a dialog */
    dialogTitle: CSSProperties;
    /** The title of a pane that has nothing to show */
    title: CSSProperties;
    /** A large number, such as the count of a tile of the inspector */
    figure: CSSProperties;
  }

  interface TypographyVariantsOptions {
    fieldLabel?: CSSProperties;
    paneLabel?: CSSProperties;
    bodyLarge?: CSSProperties;
    monoLarge?: CSSProperties;
    mono?: CSSProperties;
    monoSmall?: CSSProperties;
    monoCaption?: CSSProperties;
    monoTiny?: CSSProperties;
    monoMicro?: CSSProperties;
    code?: CSSProperties;
    dialogTitle?: CSSProperties;
    title?: CSSProperties;
    figure?: CSSProperties;
  }
}
