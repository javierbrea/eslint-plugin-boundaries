import { renderInRoot } from "@/shared/testing/renderInRoot";

import { InspectorRows } from "./InspectorRows";
import { InspectorRowsPom } from "./InspectorRows.pom";
import type { InspectorRowsProps } from "./InspectorRows.types";

const ROWS: InspectorRowsProps["rows"] = [
  { label: "to", text: "—", tone: "muted" },
  { label: "dependency", text: "line 3", tone: "muted" },
  { label: "from", text: "src/modules/checkout/index.js", tone: "ink" },
];

/**
 * Renders the rows inside the root of the playground, where their text styles apply.
 * @param rows The rows.
 * @returns The page object of the rows.
 */
function renderRows(rows: InspectorRowsProps["rows"] = ROWS): InspectorRowsPom {
  renderInRoot(<InspectorRows rows={rows} />);
  return new InspectorRowsPom();
}

describe("InspectorRows", () => {
  it("should draw a row for each section, with its label and its text, in order", () => {
    // Arrange
    const list = renderRows();

    // Act
    const { rows } = list;

    // Assert
    expect(rows).toEqual([
      { label: "to", text: "—" },
      { label: "dependency", text: "line 3" },
      { label: "from", text: "src/modules/checkout/index.js" },
    ]);
  });

  it("should draw nothing for no rows", () => {
    // Arrange
    const list = renderRows([]);

    // Act
    const { rows } = list;

    // Assert
    expect(rows).toEqual([]);
  });

  it("should write the text of each row in the color of its tone", () => {
    // Arrange
    const list = renderRows();

    // Act
    const colors = ["to", "dependency", "from"].map((label) =>
      list.textColor(label)
    );

    // Assert
    expect(colors).toEqual([
      "var(--jsb-muted)",
      "var(--jsb-muted)",
      "var(--jsb-ink)",
    ]);
  });

  it("should write each label in the pane label style, muted", () => {
    // Arrange
    const list = renderRows();

    // Act
    const style = list.labelStyle("to");

    // Assert
    expect(style).toEqual({
      fontFamily: "var(--jsb-font-mono)",
      fontSize: "10.5px",
      fontWeight: "500",
      letterSpacing: "0.14em",
      textTransform: "uppercase",
      color: "var(--jsb-muted)",
    });
  });

  it("should write the text in mono 12 px, cut with an ellipsis, and give its full text as the title", () => {
    // Arrange
    const list = renderRows();

    // Act
    const style = list.textStyle("from");
    const title = list.textTitle("from");

    // Assert
    expect(style).toEqual({
      fontFamily: "var(--jsb-font-mono)",
      fontSize: "12px",
      fontWeight: "500",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    });
    expect(title).toBe("src/modules/checkout/index.js");
  });

  it("should start each row where the label of a header that folds starts, after the chevron and its gap", () => {
    // Arrange
    const list = renderRows();

    // Act
    const indent = list.indent("to");

    // Assert
    expect(indent).toBe("20px");
  });
});
