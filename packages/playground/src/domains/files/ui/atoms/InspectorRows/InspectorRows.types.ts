/** The color of the text of a row: the ink of a path, the muted of what is not one, and the faint of a placeholder. */
export type InspectorRowTone = "ink" | "muted" | "faint";

/** A row of the inspector that has nothing to fold. */
export type InspectorRow = {
  /** The name of the section the row stands for, in the pane label style. */
  readonly label: string;
  /** What the row says, in mono and cut with an ellipsis when it does not fit. */
  readonly text: string;
  /** The color of the text. */
  readonly tone: InspectorRowTone;
};

/** Props of {@link InspectorRows}. */
export type InspectorRowsProps = {
  /** The rows, in order. */
  readonly rows: readonly InspectorRow[];
};

/** The text styles of a row, as its page object reads them. */
export type InspectorRowTextStyle = Pick<
  CSSStyleDeclaration,
  "fontFamily" | "fontSize" | "fontWeight" | "textOverflow" | "whiteSpace"
>;

/** The text styles of the label of a row, as its page object reads them. */
export type InspectorRowLabelStyle = Pick<
  CSSStyleDeclaration,
  | "fontFamily"
  | "fontSize"
  | "fontWeight"
  | "letterSpacing"
  | "textTransform"
  | "color"
>;
