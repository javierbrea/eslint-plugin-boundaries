import { HighlightStyle } from "@codemirror/language";
import { EditorView } from "@codemirror/view";
import { tags } from "@lezer/highlight";

import { HIGHLIGHT_CLASS } from "@/domains/config/ui/helpers/editorHighlight";
import { TYPOGRAPHY } from "@/ui-kit/helpers/theme";

const { body2, mono, monoCaption, fontWeightBold } = TYPOGRAPHY;

/** The paths of the `i-cross` and `i-warn` icons of the mockup, which are 16 px wide and drawn with a 2 px stroke */
const ICON_PATHS = {
  cross: "M4 4l8 8M12 4l-8 8",
  warning: "M8 2.5l6 11H2z M8 7v3 M8 12v.01",
} as const;

/**
 * Builds the `mask-image` that draws an icon in the color of the element. The icon components of the package are not used here: CodeMirror creates the markers of the gutter itself, as empty elements.
 * @param path The path of the icon, in a 16 px view box.
 * @returns The CSS value of the mask.
 */
function createIconMask(path: string): string {
  const icon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${path}"/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(icon)}")`;
}

/** The look of the markers of the lint gutter: the default ones are images set with `content`, so they are replaced by a masked background */
const MARKER = {
  width: "12px",
  height: "12px",
  content: "normal",
  maskSize: "contain",
  maskRepeat: "no-repeat",
  maskPosition: "center",
  WebkitMaskSize: "contain",
  WebkitMaskRepeat: "no-repeat",
  WebkitMaskPosition: "center",
};

/** The look of the problems on the text: a wavy underline, as the mockup draws it. The default one is a background image */
const UNDERLINE = {
  backgroundImage: "none",
  paddingBottom: "0",
  textDecorationLine: "underline",
  textDecorationStyle: "wavy",
  textDecorationSkipInk: "none",
  textUnderlineOffset: "4px",
};

/** The overlay of the line of the cursor and of the lines of the highlight */
const ACTIVE_LINE = "color-mix(in srgb, var(--jsb-code-fg) 5%, transparent)";
const SELECTION =
  "color-mix(in srgb, var(--jsb-code-keyword) 32%, transparent)";
const HIGHLIGHT =
  "color-mix(in srgb, var(--jsb-code-keyword) 13%, transparent)";

/**
 * The theme of the editor: a code area on `--jsb-code` with the lint gutter, the problems and their tooltip. Every color is a token of the host. It is dark in both color schemes, as the file pane is. CodeMirror builds the theme when this module loads, before any MUI theme exists, so the text reads the type scale as constants and not through `theme.typography`.
 */
export const editorTheme = EditorView.theme(
  {
    "&": {
      height: "100%",
      backgroundColor: "var(--jsb-code)",
      color: "var(--jsb-code-fg)",
      fontSize: mono.fontSize,
    },
    // No ring around the editor, as the mockup draws it (maintainer, 2026-11-04): the cursor and the active line show the focus. "none" overrides the dotted outline of the base theme of CodeMirror
    "&.cm-focused": { outline: "none" },
    ".cm-scroller": {
      fontFamily: mono.fontFamily,
      // The pitch of a line of the code
      lineHeight: "22px",
      overflow: "auto",
    },
    ".cm-content": {
      padding: "8px 0 40px",
      caretColor: "var(--jsb-code-fg)",
    },
    ".cm-line": { padding: "0 14px 0 0" },
    ".cm-cursor, .cm-dropCursor": {
      borderLeftColor: "var(--jsb-code-fg)",
    },
    ".cm-selectionBackground": { backgroundColor: SELECTION },
    "&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground":
      { backgroundColor: SELECTION },
    ".cm-activeLine, .cm-activeLineGutter": { backgroundColor: ACTIVE_LINE },
    "&.cm-focused .cm-matchingBracket": {
      backgroundColor: SELECTION,
      outline: "none",
    },
    "&.cm-focused .cm-nonmatchingBracket": {
      backgroundColor: "transparent",
      color: "var(--jsb-code-error)",
    },
    // The mark of a policy that "Open policy in config" points at, with the bar on the leftmost gutter
    [`.cm-line.${HIGHLIGHT_CLASS}, .cm-gutterElement.${HIGHLIGHT_CLASS}`]: {
      backgroundColor: HIGHLIGHT,
    },
    [`.cm-gutter-lint .cm-gutterElement.${HIGHLIGHT_CLASS}`]: {
      boxShadow: "inset 3px 0 0 var(--jsb-code-keyword)",
    },
    ".cm-gutters": {
      backgroundColor: "var(--jsb-code)",
      color: "var(--jsb-code-comment)",
      border: "none",
    },
    ".cm-lineNumbers .cm-gutterElement": {
      boxSizing: "border-box",
      minWidth: "36px",
      padding: "0 12px 0 0",
      fontSize: monoCaption.fontSize,
    },
    ".cm-gutter-lint": { width: "18px" },
    ".cm-gutter-lint .cm-gutterElement": {
      display: "grid",
      placeItems: "center",
      padding: "0",
    },
    ".cm-lint-marker-error, .cm-lint-marker-warning": MARKER,
    ".cm-lint-marker-error": {
      backgroundColor: "var(--jsb-code-error)",
      maskImage: createIconMask(ICON_PATHS.cross),
      WebkitMaskImage: createIconMask(ICON_PATHS.cross),
    },
    ".cm-lint-marker-warning": {
      backgroundColor: "var(--jsb-code-number)",
      maskImage: createIconMask(ICON_PATHS.warning),
      WebkitMaskImage: createIconMask(ICON_PATHS.warning),
    },
    ".cm-lintRange-error": {
      ...UNDERLINE,
      textDecorationColor: "var(--jsb-code-error)",
    },
    ".cm-lintRange-warning": {
      ...UNDERLINE,
      textDecorationColor: "var(--jsb-code-number)",
    },
    // The small triangle under the position of a problem without width, such as a parse error
    ".cm-lintPoint-error:after": {
      borderBottomColor: "var(--jsb-code-error)",
    },
    ".cm-lintPoint-warning:after": {
      borderBottomColor: "var(--jsb-code-number)",
    },
    // The tooltip of a problem is a card, as the mockup draws it: the 3 px bar on its left is the border of the diagnostic
    ".cm-tooltip": {
      overflow: "hidden",
      border: "1px solid var(--jsb-line-strong)",
      borderRadius: "var(--jsb-radius)",
      backgroundColor: "var(--jsb-card)",
      boxShadow: "var(--jsb-shadow)",
      color: "var(--jsb-ink)",
      fontFamily: body2.fontFamily,
      fontSize: body2.fontSize,
      fontWeight: body2.fontWeight,
      lineHeight: body2.lineHeight,
    },
    ".cm-tooltip-lint": { maxWidth: "430px" },
    ".cm-diagnostic": {
      padding: "10px 12px",
      marginLeft: "-1px",
    },
    ".cm-diagnostic-error": { borderLeft: "3px solid var(--jsb-bad)" },
    ".cm-diagnostic-warning": { borderLeft: "3px solid var(--jsb-warn)" },
    ".cm-diagnosticText strong": {
      display: "block",
      marginBottom: "2px",
      fontWeight: fontWeightBold,
    },
    ".cm-diagnosticText a": {
      whiteSpace: "nowrap",
      color: "var(--jsb-accent)",
      textDecoration: "none",
    },
    ".cm-diagnosticText a:hover": { textDecoration: "underline" },
  },
  { dark: true }
);

/** The colors of the JSON5 tokens in a code area: keys and punctuation in the text color, strings, numbers and comments each in their own */
export const highlightStyle = HighlightStyle.define([
  { tag: tags.propertyName, color: "var(--jsb-code-fg)" },
  { tag: tags.string, color: "var(--jsb-code-string)" },
  { tag: [tags.number, tags.bool, tags.null], color: "var(--jsb-code-number)" },
  {
    tag: [tags.lineComment, tags.blockComment],
    color: "var(--jsb-code-comment)",
  },
  {
    tag: [tags.separator, tags.squareBracket, tags.brace],
    color: "var(--jsb-code-fg)",
  },
]);
