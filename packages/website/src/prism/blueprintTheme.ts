import type { PrismTheme } from "prism-react-renderer";

/**
 * Always-dark code palette of the site, identical in both color modes. Literal colors mirror the `--jsb-code*` tokens in `src/css/tokens.css`, because Prism themes are JS objects.
 */
export const blueprintTheme: PrismTheme = {
  plain: {
    color: "#e7e9f8",
    backgroundColor: "#1b1f3b",
  },
  styles: [
    {
      types: ["keyword", "property", "attr-name", "tag"],
      style: { color: "#b3b8ff" },
    },
    {
      types: ["string", "attr-value", "inserted"],
      style: { color: "#8fe3cf" },
    },
    {
      types: ["comment", "prolog", "doctype", "cdata"],
      style: { color: "#9499bb", fontStyle: "italic" },
    },
    {
      types: ["number", "boolean", "constant"],
      style: { color: "#ffd479" },
    },
    {
      types: ["deleted", "important"],
      style: { color: "#ff8f7c" },
    },
    {
      types: ["function", "class-name"],
      style: { color: "#e7e9f8" },
    },
    {
      types: ["punctuation", "operator"],
      style: { color: "#aeb3d6" },
    },
  ],
};
