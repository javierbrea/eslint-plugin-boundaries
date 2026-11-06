import { render } from "@testing-library/react";

import type { TextRange } from "@/domains/evaluation/helpers/engine";
import type { ProblemItem } from "@/domains/problems/ui/helpers/problemItems";
import { renderInRoot } from "@/shared/testing/renderInRoot";
import { ICON_PATHS } from "@/ui-kit/atoms/Icon/Icon.constants";
import { FOCUS_RING } from "@/ui-kit/helpers/theme";

import { ProblemList } from "./ProblemList";
import { ProblemListPom } from "./ProblemList.pom";

const ERROR_RANGE: TextRange = { from: 410, to: 421, line: 15, column: 16 };

const WARNING_RANGE: TextRange = { from: 120, to: 150, line: 5, column: 7 };

const ERROR: ProblemItem = {
  key: "config:0",
  level: "error",
  location: "eslint.config.js",
  position: ":15:16",
  message:
    '[boundaries/dependencies] Invalid rule options. Value "dissallow" should be equal to one of the allowed values.',
  meta: "error · rules › boundaries/dependencies › 1 › default",
  target: { kind: "config", range: ERROR_RANGE },
};

const WARNING: ProblemItem = {
  key: "config:1",
  level: "warning",
  location: "eslint.config.js",
  position: ":5:7",
  message: "Some element descriptors are invalid and will be ignored.",
  meta: "warning · settings › boundaries/elements › 1",
  target: { kind: "config", range: WARNING_RANGE },
};

const DEPRECATION: ProblemItem = {
  key: "config:2",
  level: "deprecation",
  location: "eslint.config.js",
  position: ":9:3",
  message: "This option is deprecated.",
  meta: "deprecation · settings › boundaries/ignore",
  target: { kind: "config", range: { from: 60, to: 70, line: 9, column: 3 } },
};

const FILE_ITEM: ProblemItem = {
  key: "file:0",
  level: "error",
  location: "src/index.js",
  message: "A dependency is not allowed.",
  meta: "error · src/index.js",
  target: { kind: "file", path: "src/index.js" },
};

// A line of text mode is already in front of the user, so its row opens nothing
const TEXT_ITEM: ProblemItem = {
  key: "text:0",
  level: "error",
  location: "Project text",
  position: ":3",
  message: "Not a path.",
  meta: "  import { format } from './format'",
};

/** A failing dependency in the list of the sketch: the file, the line and an arrow to the source */
const DEPENDENCY_IN_SKETCH: ProblemItem = {
  key: "dependency:src/modules/checkout/index.js:2",
  level: "error",
  location: "src/modules/checkout/index.js",
  position: ":3",
  source: "../../components/atoms/Button/Button.spec",
  message:
    'Dependencies to file of category "test" are not allowed. Denied by policy at index 2',
  meta: "disallowed · policy 2",
  target: {
    kind: "dependency",
    path: "src/modules/checkout/index.js",
    index: 2,
  },
};

/** A failing dependency in the list of its file: the line and the source */
const DEPENDENCY_IN_FILE: ProblemItem = {
  ...DEPENDENCY_IN_SKETCH,
  location: undefined,
};

const EMPTY = "No problems.";

/** The text of a row, from the mono variant of the theme with the line height of the mockup's rows */
const ROW_TEXT = {
  fontFamily: "var(--jsb-font-mono)",
  fontSize: "12.5px",
  lineHeight: "1.5",
};

describe("ProblemList", () => {
  describe("rows", () => {
    it("should draw one row for each item, in order", () => {
      // Arrange
      render(
        <ProblemList
          items={[ERROR, WARNING]}
          onOpen={jest.fn()}
          empty={EMPTY}
        />
      );
      const list = new ProblemListPom();

      // Act
      const texts = list.rows.map((row) => row.text);

      // Assert
      expect(texts).toEqual([
        `eslint.config.js:15:16${ERROR.message}${ERROR.meta}`,
        `eslint.config.js:5:7${WARNING.message}${WARNING.meta}`,
      ]);
    });

    it("should draw the location, the message and the meta of a row", () => {
      // Arrange
      render(<ProblemList items={[ERROR]} onOpen={jest.fn()} empty={EMPTY} />);
      const [row] = new ProblemListPom().rows;

      // Act
      const { locationWithPosition, message, meta, messageColor, metaColor } =
        row;

      // Assert
      expect(locationWithPosition).toBe("eslint.config.js:15:16");
      expect(message).toBe(ERROR.message);
      expect(meta).toBe(ERROR.meta);
      expect(messageColor).toBe("var(--jsb-ink)");
      expect(metaColor).toBe("var(--jsb-muted)");
    });

    it("should draw the position in the muted color, next to the location", () => {
      // Arrange
      render(<ProblemList items={[ERROR]} onOpen={jest.fn()} empty={EMPTY} />);
      const [row] = new ProblemListPom().rows;

      // Act
      const { position, positionColor, locationWithPosition } = row;

      // Assert
      expect(position).toBe(":15:16");
      expect(positionColor).toBe("var(--jsb-muted)");
      expect(row.location).toBe("eslint.config.js");
      expect(locationWithPosition).toBe("eslint.config.js:15:16");
    });

    it("should draw a row without a position", () => {
      // Arrange
      const item: ProblemItem = { ...ERROR, position: undefined };
      render(<ProblemList items={[item]} onOpen={jest.fn()} empty={EMPTY} />);
      const [row] = new ProblemListPom().rows;

      // Act
      const { position, locationWithPosition } = row;

      // Assert
      expect(row.location).toBe("eslint.config.js");
      expect(locationWithPosition).toBe("eslint.config.js");
      expect(position).toBeNull();
    });

    it("should keep the spaces of the meta, as the line of text mode was written", () => {
      // Arrange
      const item: ProblemItem = {
        ...ERROR,
        meta: "  import { format } from './format'",
      };
      render(<ProblemList items={[item]} onOpen={jest.fn()} empty={EMPTY} />);
      const [row] = new ProblemListPom().rows;

      // Act
      const { meta, metaWhiteSpace } = row;

      // Assert
      expect(meta).toBe("  import { format } from './format'");
      expect(metaWhiteSpace).toBe("pre-wrap");
    });
  });

  describe("a failing dependency", () => {
    it("should draw the file, the line and the source after an arrow in the list of the sketch", () => {
      // Arrange
      render(
        <ProblemList
          items={[DEPENDENCY_IN_SKETCH]}
          onOpen={jest.fn()}
          empty={EMPTY}
        />
      );
      const [row] = new ProblemListPom().rows;

      // Act
      const { position, source, locationWithPosition } = row;

      // Assert
      expect(row.location).toBe("src/modules/checkout/index.js");
      expect(position).toBe(":3");
      expect(source).toBe("→ ../../components/atoms/Button/Button.spec");
      expect(locationWithPosition).toBe(
        "src/modules/checkout/index.js:3 → ../../components/atoms/Button/Button.spec"
      );
    });

    it("should draw the line and the source, without the file or an arrow, in the list of a file", () => {
      // Arrange
      render(
        <ProblemList
          items={[DEPENDENCY_IN_FILE]}
          onOpen={jest.fn()}
          empty={EMPTY}
        />
      );
      const [row] = new ProblemListPom().rows;

      // Act
      const { position, source, locationWithPosition } = row;

      // Assert
      expect(row.location).toBe("");
      expect(position).toBe(":3");
      expect(source).toBe("../../components/atoms/Button/Button.spec");
      expect(locationWithPosition).toBe(
        ":3 ../../components/atoms/Button/Button.spec"
      );
    });

    it("should draw the message and the meta of the verdict, and the position in the muted color", () => {
      // Arrange
      render(
        <ProblemList
          items={[DEPENDENCY_IN_SKETCH]}
          onOpen={jest.fn()}
          empty={EMPTY}
        />
      );
      const [row] = new ProblemListPom().rows;

      // Act
      const { message, meta, positionColor } = row;

      // Assert
      expect(message).toBe(DEPENDENCY_IN_SKETCH.message);
      expect(meta).toBe("disallowed · policy 2");
      expect(positionColor).toBe("var(--jsb-muted)");
    });

    it("should draw a warning for a dependency that the rule disallows as a warning", () => {
      // Arrange
      render(
        <ProblemList
          items={[{ ...DEPENDENCY_IN_SKETCH, level: "warning" }]}
          onOpen={jest.fn()}
          empty={EMPTY}
        />
      );
      const [row] = new ProblemListPom().rows;

      // Act
      const { icon } = row;

      // Assert
      expect(icon.pathData).toBe(ICON_PATHS.warn);
      expect(icon.wrapperStyle.color).toBe("var(--jsb-warn)");
    });

    it("should be called with the dependency as the target when the row is pressed", () => {
      // Arrange
      const onOpen = jest.fn();
      render(
        <ProblemList
          items={[DEPENDENCY_IN_SKETCH]}
          onOpen={onOpen}
          empty={EMPTY}
        />
      );
      const [row] = new ProblemListPom().rows;

      // Act
      row.press();

      // Assert
      expect(onOpen).toHaveBeenCalledWith({
        kind: "dependency",
        path: "src/modules/checkout/index.js",
        index: 2,
      });
    });

    it("should leave the source out of a row that has none", () => {
      // Arrange
      render(<ProblemList items={[ERROR]} onOpen={jest.fn()} empty={EMPTY} />);
      const [row] = new ProblemListPom().rows;

      // Act
      const { source } = row;

      // Assert
      expect(source).toBeNull();
    });
  });

  describe("text", () => {
    it("should set the text of a row in the mono font, whether the row opens something or not", () => {
      // Arrange
      renderInRoot(
        <ProblemList
          items={[ERROR, TEXT_ITEM]}
          onOpen={jest.fn()}
          empty={EMPTY}
        />
      );
      const list = new ProblemListPom();

      // Act
      const [opens, plain] = list.rows.map((row) => row.textStyle);

      // Assert
      expect(opens).toEqual(ROW_TEXT);
      expect(plain).toEqual(ROW_TEXT);
    });

    it("should say that there are no rows in the small body text", () => {
      // Arrange
      renderInRoot(<ProblemList items={[]} onOpen={jest.fn()} empty={EMPTY} />);
      const list = new ProblemListPom();

      // Act
      const { fontFamily, fontSize } = list.emptyStyle;

      // Assert
      expect(fontFamily).toBe("var(--jsb-font-body)");
      expect(fontSize).toBe("12.5px");
    });
  });

  describe("a row that opens something", () => {
    it("should draw the focus ring of the theme inside the row, where the scroll of the panel cannot clip it", () => {
      // Arrange
      renderInRoot(
        <ProblemList items={[ERROR]} onOpen={jest.fn()} empty={EMPTY} />
      );
      const [row] = new ProblemListPom().rows;

      // Act
      const { focusStyle } = row;

      // Assert
      expect(focusStyle).toEqual({
        outline: FOCUS_RING,
        "outline-offset": "-2px",
      });
    });

    it("should highlight on hover", () => {
      // Arrange
      renderInRoot(
        <ProblemList items={[ERROR]} onOpen={jest.fn()} empty={EMPTY} />
      );
      const [row] = new ProblemListPom().rows;

      // Act
      const { hoverStyle } = row;

      // Assert
      expect(hoverStyle["background-color"]).toBe("var(--jsb-accent-soft)");
    });

    it("should lay out its content in the grid of a row, which the button of MUI would center", () => {
      // Arrange
      renderInRoot(
        <ProblemList items={[ERROR]} onOpen={jest.fn()} empty={EMPTY} />
      );
      const [row] = new ProblemListPom().rows;

      // Act
      const { layout } = row;

      // Assert
      expect(layout).toEqual({
        display: "grid",
        alignItems: "normal",
        justifyContent: "normal",
      });
    });
  });

  describe("level", () => {
    it("should draw a cross in the bad color for an error", () => {
      // Arrange
      render(<ProblemList items={[ERROR]} onOpen={jest.fn()} empty={EMPTY} />);
      const [row] = new ProblemListPom().rows;

      // Act
      const { icon } = row;

      // Assert
      expect(icon.pathData).toBe(ICON_PATHS.cross);
      expect(icon.wrapperStyle.color).toBe("var(--jsb-bad)");
    });

    it.each([
      ["warning", WARNING],
      ["deprecation", DEPRECATION],
    ])(
      "should draw a triangle in the warning color for a %s",
      (_level, item) => {
        // Arrange
        render(<ProblemList items={[item]} onOpen={jest.fn()} empty={EMPTY} />);
        const [row] = new ProblemListPom().rows;

        // Act
        const { icon } = row;

        // Assert
        expect(icon.pathData).toBe(ICON_PATHS.warn);
        expect(icon.wrapperStyle.color).toBe("var(--jsb-warn)");
      }
    );

    it("should hide the icon from assistive technology, as the meta says the level", () => {
      // Arrange
      render(<ProblemList items={[ERROR]} onOpen={jest.fn()} empty={EMPTY} />);
      const [row] = new ProblemListPom().rows;

      // Act
      const { isHidden } = row.icon;

      // Assert
      expect(isHidden).toBe(true);
    });
  });

  describe("onOpen", () => {
    it("should be called with the target of the row that is pressed", () => {
      // Arrange
      const onOpen = jest.fn();
      render(
        <ProblemList items={[ERROR, WARNING]} onOpen={onOpen} empty={EMPTY} />
      );
      const list = new ProblemListPom();

      // Act
      list.rows[1].press();

      // Assert
      expect(onOpen).toHaveBeenCalledTimes(1);
      expect(onOpen).toHaveBeenCalledWith({
        kind: "config",
        range: WARNING_RANGE,
      });
    });

    it("should be called with the target of a row that opens a file", () => {
      // Arrange
      const onOpen = jest.fn();
      render(<ProblemList items={[FILE_ITEM]} onOpen={onOpen} empty={EMPTY} />);
      const [row] = new ProblemListPom().rows;

      // Act
      row.press();

      // Assert
      expect(onOpen).toHaveBeenCalledWith({
        kind: "file",
        path: "src/index.js",
      });
    });

    it("should not be called before a row is pressed", () => {
      // Arrange
      const onOpen = jest.fn();

      // Act
      render(<ProblemList items={[ERROR]} onOpen={onOpen} empty={EMPTY} />);

      // Assert
      expect(onOpen).not.toHaveBeenCalled();
    });

    it("should draw each row with a target as a button that does not submit a form", () => {
      // Arrange
      render(<ProblemList items={[ERROR]} onOpen={jest.fn()} empty={EMPTY} />);
      const [row] = new ProblemListPom().rows;

      // Act
      const { buttonType } = row;

      // Assert
      expect(buttonType).toBe("button");
    });
  });

  describe("a row without a target", () => {
    it("should be plain content and not a button", () => {
      // Arrange
      render(
        <ProblemList items={[TEXT_ITEM]} onOpen={jest.fn()} empty={EMPTY} />
      );
      const list = new ProblemListPom();

      // Act
      const { openableRowCount } = list;

      // Assert
      expect(openableRowCount).toBe(0);
      expect(list.rows[0].message).toBe(TEXT_ITEM.message);
    });

    it("should draw the same content as a row that opens something", () => {
      // Arrange
      render(
        <ProblemList items={[TEXT_ITEM]} onOpen={jest.fn()} empty={EMPTY} />
      );
      const [row] = new ProblemListPom().rows;

      // Act
      const { locationWithPosition, metaWhiteSpace, icon } = row;

      // Assert
      expect(locationWithPosition).toBe("Project text:3");
      expect(metaWhiteSpace).toBe("pre-wrap");
      expect(icon.isHidden).toBe(true);
    });

    it("should do nothing when it is pressed", () => {
      // Arrange
      const onOpen = jest.fn();
      render(<ProblemList items={[TEXT_ITEM]} onOpen={onOpen} empty={EMPTY} />);
      const [row] = new ProblemListPom().rows;

      // Act
      row.press();

      // Assert
      expect(onOpen).not.toHaveBeenCalled();
    });

    it("should sit among rows that open something, which are the only buttons", () => {
      // Arrange
      render(
        <ProblemList
          items={[ERROR, TEXT_ITEM, WARNING]}
          onOpen={jest.fn()}
          empty={EMPTY}
        />
      );
      const list = new ProblemListPom();

      // Act
      const { rowCount, openableRowCount } = list;

      // Assert
      expect(rowCount).toBe(3);
      expect(openableRowCount).toBe(2);
    });
  });

  describe("empty", () => {
    it("should draw nothing when there are no items and nothing to say, because a note says it", () => {
      // Arrange
      render(<ProblemList items={[]} onOpen={jest.fn()} />);
      const list = new ProblemListPom();

      // Act
      const { isRendered } = list;

      // Assert
      expect(isRendered).toBe(false);
    });

    it("should say it in the muted color when there are no items", () => {
      // Arrange
      render(<ProblemList items={[]} onOpen={jest.fn()} empty={EMPTY} />);
      const list = new ProblemListPom();

      // Act
      const { emptyText, emptyStyle } = list;

      // Assert
      expect(emptyText).toBe(EMPTY);
      expect(list.holds(EMPTY)).toBe(true);
      expect(emptyStyle.color).toBe("var(--jsb-muted)");
    });

    it("should draw no row when there are no items", () => {
      // Arrange
      render(<ProblemList items={[]} onOpen={jest.fn()} empty={EMPTY} />);
      const list = new ProblemListPom();

      // Act
      const { openableRowCount } = list;

      // Assert
      expect(openableRowCount).toBe(0);
      expect(list.rows).toHaveLength(0);
    });

    it("should not say it when there are items", () => {
      // Arrange
      render(<ProblemList items={[ERROR]} onOpen={jest.fn()} empty={EMPTY} />);
      const list = new ProblemListPom();

      // Act
      const holdsEmpty = list.holds(EMPTY);

      // Assert
      expect(holdsEmpty).toBe(false);
    });
  });
});
