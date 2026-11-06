import type { TreeItemProps } from "@mui/x-tree-view/TreeItem";
import type { Ref } from "react";

/** Props of {@link ProjectTreeItem}: the ones that the tree view gives each item, and the ref of its root element, which is a plain prop of a function component. */
export type ProjectTreeItemProps = TreeItemProps & {
  /** The ref of the root element of the item. */
  readonly ref?: Ref<HTMLLIElement>;
};

/** The text styles of the row of an item. */
export type ProjectRowTextStyle = Pick<
  CSSStyleDeclaration,
  "fontFamily" | "fontSize" | "lineHeight"
>;

/** The text styles of the glyph that marks the config. */
export type ProjectRowGlyphStyle = Pick<
  CSSStyleDeclaration,
  "fontSize" | "fontWeight" | "lineHeight"
>;
