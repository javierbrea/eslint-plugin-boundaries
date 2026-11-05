import type { ReactNode } from "react";

/** Props of {@link PaneHead}. */
export type PaneHeadProps = {
  /** Name of the pane, drawn as a small uppercase label. */
  label: string;
  /** Path of what the pane shows, in mono and cut with an ellipsis when it does not fit. */
  path?: string;
  /** Short help for the pane, at the end of the head. */
  hint?: ReactNode;
  /** Buttons or tabs. The slot takes the free width of the head, so give the last item `marginLeft: "auto"` to push it to the end. */
  end?: ReactNode;
};

/** The text styles of an item of a pane head, as its page object reads them. */
export type PaneHeadTextStyle = Pick<
  CSSStyleDeclaration,
  "fontFamily" | "fontSize" | "fontWeight" | "letterSpacing" | "textTransform"
>;
