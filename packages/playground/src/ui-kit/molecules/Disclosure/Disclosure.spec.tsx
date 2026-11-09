import { render } from "@testing-library/react";
import type { ReactNode } from "react";

import { ICON_PATHS } from "@/ui-kit/atoms/Icon/Icon.constants";
import { FOCUS_RING, HOVER_BACKGROUND } from "@/ui-kit/helpers/theme";
import { ThemeRoot } from "@/ui-kit/providers/ThemeRoot";

import { Disclosure } from "./Disclosure";
import { DisclosurePom } from "./Disclosure.pom";
import type { DisclosureProps } from "./Disclosure.types";

const PROPS: DisclosureProps = {
  label: "from",
  summary: "src/modules/checkout/index.js",
  isOpen: true,
  onToggle: jest.fn(),
  children: <p>4 dependencies</p>,
};

/**
 * Wraps what a spec renders in the root of the playground, where its theme applies.
 * @param children What to render.
 * @returns The element.
 */
function inRoot(children: ReactNode): ReactNode {
  return <ThemeRoot>{children}</ThemeRoot>;
}

/**
 * Renders a disclosure, with the props that differ from {@link PROPS}, inside the root of the playground.
 * @param overrides The props that differ.
 * @returns The page object of the disclosure.
 */
function renderDisclosure(
  overrides: Partial<DisclosureProps> = {}
): DisclosurePom {
  render(inRoot(<Disclosure {...PROPS} {...overrides} />));
  return new DisclosurePom();
}

describe("Disclosure", () => {
  describe("the header", () => {
    it("should be a button that starts with the label", () => {
      // Arrange
      const disclosure = renderDisclosure();

      // Act
      const { isButton, label } = disclosure;

      // Assert
      expect(isButton).toBe(true);
      expect(label).toBe("from");
    });

    it("should draw the chevron to the right at 12 px, in the faint color", () => {
      // Arrange
      const { chevron } = renderDisclosure({ isOpen: false });

      // Act
      const { pathData, width, height, isHidden } = chevron;

      // Assert
      expect(pathData).toBe(ICON_PATHS["chevron-right"]);
      expect([width, height]).toEqual(["12", "12"]);
      expect(isHidden).toBe(true);
      expect(chevron.wrapperStyle.color).toBe("var(--jsb-faint)");
    });

    it("should turn the chevron a quarter while the body is shown, and not while it is folded", () => {
      // Arrange
      const { rerender } = render(inRoot(<Disclosure {...PROPS} isOpen />));
      const { chevron } = new DisclosurePom();
      const whileOpen = chevron.wrapperStyle.transform;

      // Act
      rerender(inRoot(<Disclosure {...PROPS} isOpen={false} />));

      // Assert
      expect(whileOpen).toBe("rotate(90deg)");
      expect(chevron.wrapperStyle.transform).toBe("none");
    });

    it("should call onToggle when it is pressed, and leave the state to its owner", () => {
      // Arrange
      const onToggle = jest.fn();
      const disclosure = renderDisclosure({ isOpen: false, onToggle });

      // Act
      disclosure.toggle();

      // Assert
      expect(onToggle).toHaveBeenCalledTimes(1);
      expect(disclosure.isOpen).toBe(false);
    });

    it("should be hovered with the soft accent and take the keyboard ring, as the other rows do", () => {
      // Arrange
      const disclosure = renderDisclosure();

      // Act
      const { hoverStyle, focusStyle } = disclosure;

      // Assert
      expect(hoverStyle.background).toBe(HOVER_BACKGROUND);
      expect(focusStyle.outline).toBe(FOCUS_RING);
      expect(focusStyle["outline-offset"]).toBe("-2px");
    });
  });

  describe("the body", () => {
    it("should say that it is expanded, and control the body that holds what it folds, while it is open", () => {
      // Arrange
      const disclosure = renderDisclosure({ isOpen: true });

      // Act
      const { isOpen, bodyId, bodyText } = disclosure;

      // Assert
      expect(isOpen).toBe(true);
      expect(bodyId).not.toBeNull();
      expect(bodyText).toBe("4 dependencies");
    });

    it("should say that it is folded, and not render what it folds, while it is not open", () => {
      // Arrange
      const disclosure = renderDisclosure({ isOpen: false });

      // Act
      const { isOpen, hasBody, bodyText } = disclosure;

      // Assert
      expect(isOpen).toBe(false);
      expect(hasBody).toBe(false);
      expect(bodyText).toBe("");
    });

    it("should name no body while it is folded, which is not rendered then, and the same body again when it opens", () => {
      // Arrange
      const { rerender } = render(inRoot(<Disclosure {...PROPS} isOpen />));
      const disclosure = new DisclosurePom();
      const whileOpen = disclosure.controlledId;

      // Act
      rerender(inRoot(<Disclosure {...PROPS} isOpen={false} />));
      const whileFolded = disclosure.controlledId;
      rerender(inRoot(<Disclosure {...PROPS} isOpen />));
      const whenOpenAgain = disclosure.controlledId;

      // Assert
      expect(whileOpen).not.toBeNull();
      expect(whileFolded).toBeNull();
      expect(whenOpenAgain).toBe(whileOpen);
    });

    it("should give each disclosure a body of its own", () => {
      // Arrange
      render(
        inRoot(
          <>
            <Disclosure {...PROPS} label="first" testId="first">
              one
            </Disclosure>
            <Disclosure {...PROPS} label="second" testId="second">
              two
            </Disclosure>
          </>
        )
      );
      const first = new DisclosurePom({ testId: "first" });
      const second = new DisclosurePom({ testId: "second" });

      // Act
      const { controlledId: firstId, bodyText: firstText } = first;
      const { controlledId: secondId, bodyText: secondText } = second;

      // Assert
      expect(firstId).not.toBe(secondId);
      expect([firstText, secondText]).toEqual(["one", "two"]);
    });

    it("should take the test id it is given in place of its own", () => {
      // Arrange
      render(inRoot(<Disclosure {...PROPS} testId="custom" />));

      // Act
      const custom = new DisclosurePom({ testId: "custom" });

      // Assert
      expect(custom.isRendered).toBe(true);
      expect(new DisclosurePom().isRendered).toBe(false);
    });

    it("should lay out what a section folds in a column of 8 px", () => {
      // Arrange
      const disclosure = renderDisclosure({ variant: "section" });

      // Act
      const { display, gridTemplateColumns, rowGap, padding } =
        disclosure.bodyLayout;

      // Assert
      expect({ display, gridTemplateColumns, rowGap, padding }).toEqual({
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr)",
        rowGap: "8px",
        padding: "4px 0px",
      });
    });

    it("should line up what a box folds under its label, after the chevron", () => {
      // Arrange
      const disclosure = renderDisclosure({ variant: "box" });

      // Act
      const { padding } = disclosure.bodyLayout;

      // Assert
      expect(padding).toBe("0px 10px 8px 28px");
    });
  });

  describe("the section", () => {
    it("should be the default look, which is bare", () => {
      // Arrange
      const disclosure = renderDisclosure();

      // Act
      const { frame, headerPadding } = disclosure;

      // Assert
      expect(frame.borderStyle).not.toBe("solid");
      expect(headerPadding).toBe("4px 0px");
    });

    it("should write the label in the pane label style, muted", () => {
      // Arrange
      const disclosure = renderDisclosure({ variant: "section" });

      // Act
      const { labelStyle, labelColor } = disclosure;

      // Assert
      expect(labelColor).toBe("var(--jsb-muted)");
      expect(labelStyle).toEqual({
        fontFamily: "var(--jsb-font-mono)",
        fontSize: "10.5px",
        fontWeight: "500",
        letterSpacing: "0.14em",
        textTransform: "uppercase",
      });
    });

    it("should write the summary in mono 12 px in the ink color, cut with an ellipsis, and give its full text as the title", () => {
      // Arrange
      const disclosure = renderDisclosure({ variant: "section" });

      // Act
      const { summary, summaryTitle, summaryColor, summaryStyle } = disclosure;

      // Assert
      expect(summary).toBe("src/modules/checkout/index.js");
      expect(summaryTitle).toBe("src/modules/checkout/index.js");
      expect(summaryColor).toBe("var(--jsb-ink)");
      expect(summaryStyle).toEqual({
        fontFamily: "var(--jsb-font-mono)",
        fontSize: "12px",
        fontWeight: "500",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      });
    });

    it("should write the summary in the muted color when it is not a path", () => {
      // Arrange
      const disclosure = renderDisclosure({
        summary: "line 3",
        isSummaryMuted: true,
      });

      // Act
      const { summaryColor } = disclosure;

      // Assert
      expect(summaryColor).toBe("var(--jsb-muted)");
    });

    it("should follow the label with the summary instead of pushing it to the end", () => {
      // Arrange
      const disclosure = renderDisclosure({ variant: "section" });

      // Act
      const { isSummaryAtEnd } = disclosure;

      // Assert
      expect(isSummaryAtEnd).toBe(false);
    });

    it("should draw only the label when it has no summary", () => {
      // Arrange
      const disclosure = renderDisclosure({ summary: undefined });

      // Act
      const { summary, summaryTitle } = disclosure;

      // Assert
      expect(summary).toBeNull();
      expect(summaryTitle).toBeNull();
    });
  });

  describe("the box", () => {
    it("should be framed with a 1 px line and the radius of the playground", () => {
      // Arrange
      const disclosure = renderDisclosure({ variant: "box" });

      // Act
      const { frame, headerPadding } = disclosure;

      // Assert
      expect(frame).toEqual({
        borderStyle: "solid",
        borderRadius: "var(--jsb-radius)",
      });
      expect(headerPadding).toBe("6px 10px");
    });

    it("should write the label in the accent color, in the medium weight of mono 12 px", () => {
      // Arrange
      const disclosure = renderDisclosure({ variant: "box", label: "element" });

      // Act
      const { labelColor, labelStyle } = disclosure;

      // Assert
      expect(labelColor).toBe("var(--jsb-accent)");
      expect(labelStyle.fontWeight).toBe("500");
      expect(labelStyle.textTransform).not.toBe("uppercase");
    });

    it("should put the summary at the end of the header, in regular weight", () => {
      // Arrange
      const disclosure = renderDisclosure({
        variant: "box",
        summary: '[ "module" ]',
        isSummaryMuted: true,
      });

      // Act
      const { isSummaryAtEnd, summaryStyle, summaryColor } = disclosure;

      // Assert
      expect(isSummaryAtEnd).toBe(true);
      expect(summaryColor).toBe("var(--jsb-muted)");
      expect(summaryStyle.textOverflow).toBe("ellipsis");
      expect(summaryStyle.fontWeight).not.toBe("500");
    });
  });
});
