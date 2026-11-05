import { fireEvent, render, screen as view } from "@testing-library/react";

import type { TextRange } from "@/engine";
import { FOCUS_RING } from "@/theme";
import { OWN_CLASS, getStyle } from "@/theme/__fixtures__/GetStyle";
import { renderInRoot } from "@/theme/__fixtures__/RenderInRoot";
import type { ProblemItem } from "@/ui/state";

import { ProblemList } from "./ProblemList";

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

const EMPTY = "No problems.";

/** The text of a row, from the mono variant of the theme with the line height of the mockup's rows */
const ROW_TEXT = {
  fontFamily: "var(--jsb-font-mono)",
  fontSize: "12.5px",
  lineHeight: "1.5",
};

/**
 * Gets the icon of a row.
 * @param row The row.
 * @returns The element that draws the icon.
 */
function getIcon(row: HTMLElement): SVGElement {
  const icon = row.querySelector("svg");
  if (icon === null) {
    throw new Error("The row has no icon");
  }
  return icon;
}

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

      // Act
      const rows = view.getAllByRole("button");

      // Assert
      expect(rows.map((row) => row.textContent)).toEqual([
        `eslint.config.js:15:16${ERROR.message}${ERROR.meta}`,
        `eslint.config.js:5:7${WARNING.message}${WARNING.meta}`,
      ]);
    });

    it("should draw the location, the message and the meta of a row", () => {
      // Arrange
      render(<ProblemList items={[ERROR]} onOpen={jest.fn()} empty={EMPTY} />);

      // Act
      const where = view.getByText("eslint.config.js", { exact: false });
      const message = view.getByText(ERROR.message);
      const meta = view.getByText(ERROR.meta);

      // Assert
      expect(where.textContent).toBe("eslint.config.js:15:16");
      expect(getComputedStyle(message).color).toBe("var(--jsb-ink)");
      expect(getComputedStyle(meta).color).toBe("var(--jsb-muted)");
    });

    it("should draw the position in the muted color, next to the location", () => {
      // Arrange
      render(<ProblemList items={[ERROR]} onOpen={jest.fn()} empty={EMPTY} />);

      // Act
      const position = view.getByText(":15:16");

      // Assert
      expect(getComputedStyle(position).color).toBe("var(--jsb-muted)");
      expect(position.parentElement?.textContent).toBe(
        "eslint.config.js:15:16"
      );
    });

    it("should draw a row without a position", () => {
      // Arrange
      const item: ProblemItem = { ...ERROR, position: undefined };
      render(<ProblemList items={[item]} onOpen={jest.fn()} empty={EMPTY} />);

      // Act
      const where = view.getByText("eslint.config.js");

      // Assert
      expect(where.textContent).toBe("eslint.config.js");
      expect(where.children).toHaveLength(0);
    });

    it("should keep the spaces of the meta, as the line of text mode was written", () => {
      // Arrange
      const item: ProblemItem = {
        ...ERROR,
        meta: "  import { format } from './format'",
      };
      render(<ProblemList items={[item]} onOpen={jest.fn()} empty={EMPTY} />);

      // Act
      const meta = view.getByText("import { format } from './format'");

      // Assert
      expect(getComputedStyle(meta).whiteSpace).toBe("pre-wrap");
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

      // Act
      const [opens, plain] = view.getAllByRole("listitem").map((item) => {
        const { fontFamily, fontSize, lineHeight } = getComputedStyle(
          item.firstElementChild as HTMLElement
        );

        return { fontFamily, fontSize, lineHeight };
      });

      // Assert
      expect(opens).toEqual(ROW_TEXT);
      expect(plain).toEqual(ROW_TEXT);
    });

    it("should say that there are no rows in the small body text", () => {
      // Arrange
      renderInRoot(<ProblemList items={[]} onOpen={jest.fn()} empty={EMPTY} />);

      // Act
      const style = getComputedStyle(view.getByText(EMPTY));

      // Assert
      expect(style.fontFamily).toBe("var(--jsb-font-body)");
      expect(style.fontSize).toBe("12.5px");
    });
  });

  describe("a row that opens something", () => {
    it("should draw the focus ring of the theme inside the row, where the scroll of the panel cannot clip it", () => {
      // Arrange
      renderInRoot(
        <ProblemList items={[ERROR]} onOpen={jest.fn()} empty={EMPTY} />
      );

      // Act
      const style = getStyle(
        view.getByRole("button"),
        `${OWN_CLASS}:focus-visible`
      );

      // Assert
      expect(style).toEqual({ outline: FOCUS_RING, "outline-offset": "-2px" });
    });

    it("should highlight on hover", () => {
      // Arrange
      renderInRoot(
        <ProblemList items={[ERROR]} onOpen={jest.fn()} empty={EMPTY} />
      );

      // Act
      const style = getStyle(view.getByRole("button"), `${OWN_CLASS}:hover`);

      // Assert
      expect(style["background-color"]).toBe("var(--jsb-accent-soft)");
    });

    it("should lay out its content in the grid of a row, which the button of MUI would center", () => {
      // Arrange
      renderInRoot(
        <ProblemList items={[ERROR]} onOpen={jest.fn()} empty={EMPTY} />
      );

      // Act
      const style = getComputedStyle(view.getByRole("button"));

      // Assert
      expect(style.display).toBe("grid");
      expect(style.alignItems).toBe("normal");
      expect(style.justifyContent).toBe("normal");
    });
  });

  describe("level", () => {
    it("should draw a cross in the bad color for an error", () => {
      // Arrange
      render(<ProblemList items={[ERROR]} onOpen={jest.fn()} empty={EMPTY} />);

      // Act
      const icon = getIcon(view.getByRole("button"));

      // Assert
      expect(icon.querySelector("path")?.getAttribute("d")).toBe(
        "M4 4l8 8M12 4l-8 8"
      );
      expect(icon.parentElement).not.toBeNull();
      expect(getComputedStyle(icon.parentElement as HTMLElement).color).toBe(
        "var(--jsb-bad)"
      );
    });

    it.each([
      ["warning", WARNING],
      ["deprecation", DEPRECATION],
    ])(
      "should draw a triangle in the warning color for a %s",
      (_level, item) => {
        // Arrange
        render(<ProblemList items={[item]} onOpen={jest.fn()} empty={EMPTY} />);

        // Act
        const icon = getIcon(view.getByRole("button"));

        // Assert
        expect(icon.querySelector("path")?.getAttribute("d")).toBe(
          "M8 2.5l6 11H2z M8 7v3 M8 12v.01"
        );
        expect(icon.parentElement).not.toBeNull();
        expect(getComputedStyle(icon.parentElement as HTMLElement).color).toBe(
          "var(--jsb-warn)"
        );
      }
    );

    it("should hide the icon from assistive technology, as the meta says the level", () => {
      // Arrange
      render(<ProblemList items={[ERROR]} onOpen={jest.fn()} empty={EMPTY} />);

      // Act
      const icon = getIcon(view.getByRole("button"));

      // Assert
      expect(icon.getAttribute("aria-hidden")).toBe("true");
    });
  });

  describe("onOpen", () => {
    it("should be called with the target of the row that is pressed", () => {
      // Arrange
      const onOpen = jest.fn();
      render(
        <ProblemList items={[ERROR, WARNING]} onOpen={onOpen} empty={EMPTY} />
      );

      // Act
      fireEvent.click(view.getAllByRole("button")[1] as HTMLElement);

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

      // Act
      fireEvent.click(view.getByRole("button"));

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

      // Act
      const row = view.getByRole("button");

      // Assert
      expect(row.getAttribute("type")).toBe("button");
    });
  });

  describe("a row without a target", () => {
    it("should be plain content and not a button", () => {
      // Arrange
      render(
        <ProblemList items={[TEXT_ITEM]} onOpen={jest.fn()} empty={EMPTY} />
      );

      // Act
      const buttons = view.queryAllByRole("button");

      // Assert
      expect(buttons).toHaveLength(0);
      expect(view.getByText(TEXT_ITEM.message)).toBeTruthy();
    });

    it("should draw the same content as a row that opens something", () => {
      // Arrange
      render(
        <ProblemList items={[TEXT_ITEM]} onOpen={jest.fn()} empty={EMPTY} />
      );

      // Act
      const where = view.getByText("Project text", { exact: false });
      const meta = view.getByText("import { format } from './format'");

      // Assert
      expect(where.textContent).toBe("Project text:3");
      expect(getComputedStyle(meta).whiteSpace).toBe("pre-wrap");
      expect(
        getIcon(meta.parentElement as HTMLElement).getAttribute("aria-hidden")
      ).toBe("true");
    });

    it("should do nothing when it is pressed", () => {
      // Arrange
      const onOpen = jest.fn();
      render(<ProblemList items={[TEXT_ITEM]} onOpen={onOpen} empty={EMPTY} />);

      // Act
      fireEvent.click(view.getByText(TEXT_ITEM.message));

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

      // Act
      const buttons = view.getAllByRole("button");

      // Assert
      expect(view.getAllByRole("listitem")).toHaveLength(3);
      expect(buttons).toHaveLength(2);
    });
  });

  describe("empty", () => {
    it("should say it in the muted color when there are no items", () => {
      // Arrange
      render(<ProblemList items={[]} onOpen={jest.fn()} empty={EMPTY} />);

      // Act
      const text = view.getByText(EMPTY);

      // Assert
      expect(getComputedStyle(text).color).toBe("var(--jsb-muted)");
    });

    it("should draw no row when there are no items", () => {
      // Arrange
      render(<ProblemList items={[]} onOpen={jest.fn()} empty={EMPTY} />);

      // Act
      const rows = view.queryAllByRole("button");

      // Assert
      expect(rows).toHaveLength(0);
    });

    it("should not say it when there are items", () => {
      // Arrange
      render(<ProblemList items={[ERROR]} onOpen={jest.fn()} empty={EMPTY} />);

      // Act
      const text = view.queryByText(EMPTY);

      // Assert
      expect(text).toBeNull();
    });
  });
});
