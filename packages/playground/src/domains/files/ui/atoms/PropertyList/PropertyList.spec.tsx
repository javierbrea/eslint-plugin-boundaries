import { renderInRoot } from "@/shared/testing/renderInRoot";

import { PropertyList } from "./PropertyList";
import { PropertyListPom } from "./PropertyList.pom";
import type { PropertyListProps } from "./PropertyList.types";

const ENTRIES: PropertyListProps["entries"] = [
  { key: "types", value: ["component"] },
  { key: "path", value: "src/components/atoms/Button" },
  { key: "captured", value: { family: "atoms", name: "Button" } },
  { key: "fileInternalPath", value: null },
  { key: "isIgnored", value: false },
];

/**
 * Renders a list inside the root of the playground, where its text styles apply.
 * @param props The props of the list.
 * @returns The page object of the list.
 */
function renderList(props: PropertyListProps): PropertyListPom {
  renderInRoot(<PropertyList {...props} />);
  return new PropertyListPom();
}

describe("PropertyList", () => {
  it("should list each key with its value, formatted as the plugin writes it, in order", () => {
    // Arrange
    const list = renderList({ entries: ENTRIES });

    // Act
    const { entries } = list;

    // Assert
    expect(entries).toEqual({
      types: '[ "component" ]',
      path: '"src/components/atoms/Button"',
      captured: '{ family: "atoms", name: "Button" }',
      fileInternalPath: "null",
      isIgnored: "false",
    });
    expect(Object.keys(entries)).toEqual([
      "types",
      "path",
      "captured",
      "fileInternalPath",
      "isIgnored",
    ]);
  });

  it("should draw a null value in the muted color, apart from the other values", () => {
    // Arrange
    const list = renderList({ entries: ENTRIES });

    // Act
    const nullColor = list.valueColor("fileInternalPath");
    const others = [
      list.valueColor("types"),
      list.valueColor("path"),
      list.valueColor("isIgnored"),
    ];

    // Assert
    expect(nullColor).toBe("var(--jsb-muted)");
    expect(others).not.toContain(nullColor);
  });

  it("should draw the keys in the muted color", () => {
    // Arrange
    const list = renderList({ entries: ENTRIES });

    // Act
    const colors = ["types", "path", "isIgnored"].map((key) =>
      list.keyColor(key)
    );

    // Assert
    expect(colors).toEqual([
      "var(--jsb-muted)",
      "var(--jsb-muted)",
      "var(--jsb-muted)",
    ]);
  });

  it("should leave the value of an entry that has none empty, so that the next entry stays in its row", () => {
    // Arrange
    const list = renderList({
      entries: [
        { key: "specifiers", value: ["renderButton"] },
        { key: "relationship" },
        { key: "from", value: null, isNested: true },
      ],
    });

    // Act
    const { entries } = list;

    // Assert
    expect(entries).toEqual({
      specifiers: '[ "renderButton" ]',
      relationship: "",
      from: "null",
    });
  });

  it("should indent a nested entry under the entry above it, and no other", () => {
    // Arrange
    const list = renderList({
      entries: [
        { key: "relationship" },
        { key: "from", value: "uncle", isNested: true },
        { key: "to", value: "nephew", isNested: true },
        { key: "kind", value: "value" },
      ],
    });

    // Act
    const indents = ["relationship", "from", "to", "kind"].map((key) =>
      list.keyIndent(key)
    );

    // Assert
    expect(indents).toEqual(["0px", "14px", "14px", "0px"]);
  });

  it("should size the key column to the longest key, so that the values line up", () => {
    // Arrange
    const list = renderList({ entries: ENTRIES });

    // Act
    const { layout } = list;

    // Assert
    expect(layout).toEqual({
      display: "grid",
      gridTemplateColumns: "max-content minmax(0, 1fr)",
      columnGap: "10px",
      rowGap: "1px",
    });
  });

  it("should break a long value anywhere, instead of widening the pane", () => {
    // Arrange
    const list = renderList({
      entries: [
        {
          key: "source",
          value: "../../components/atoms/Button/Button.spec.js",
        },
      ],
    });

    // Act
    const overflowWrap = list.valueOverflowWrap("source");

    // Assert
    expect(overflowWrap).toBe("anywhere");
  });

  it("should write in mono 12 px with a line of 1.5", () => {
    // Arrange
    const list = renderList({ entries: ENTRIES });

    // Act
    const { textStyle } = list;

    // Assert
    expect(textStyle).toEqual({
      fontFamily: "var(--jsb-font-mono)",
      fontSize: "12px",
      lineHeight: "1.5",
    });
  });

  it("should draw no frame unless it is asked to", () => {
    // Arrange
    const list = renderList({ entries: ENTRIES });

    // Act
    const { frame } = list;

    // Assert
    expect(frame.borderStyle).not.toBe("solid");
    expect(frame.padding).not.toBe("8px 10px");
  });

  it("should draw a frame of 1 px with the radius of the playground and the padding of a box when it is framed", () => {
    // Arrange
    const list = renderList({ entries: ENTRIES, isFramed: true });

    // Act
    const { frame } = list;

    // Assert
    expect(frame).toEqual({
      borderStyle: "solid",
      borderRadius: "var(--jsb-radius)",
      padding: "8px 10px",
    });
  });

  it("should list nothing for no entries", () => {
    // Arrange
    const list = renderList({ entries: [] });

    // Act
    const { entries } = list;

    // Assert
    expect(entries).toEqual({});
  });
});
