import { act, render } from "@testing-library/react";
import { createRef } from "react";

import { ICON_PATHS } from "@/ui-kit/atoms/Icon/Icon.constants";
import { ThemeRoot } from "@/ui-kit/providers/ThemeRoot";

import { CopyButton } from "./CopyButton";
import { CopyButtonPom } from "./CopyButton.pom";
import type { CopyButtonProps } from "./CopyButton.types";

/** What a spec gets from the button it renders. */
type Page = {
  /** The page object of the button. */
  button: CopyButtonPom;
  /** The props of the button, with the spy of its handler. */
  props: CopyButtonProps;
  /** Renders the button again with other props. */
  update: (changes: Partial<CopyButtonProps>) => void;
};

/**
 * Renders the button inside the root of the playground, where its theme and its CSS rules are.
 * @param changes What differs from a button that shares, with an icon, that has not copied yet.
 * @returns The page object of the button, its props and the function that updates it.
 */
function renderButton(changes: Partial<CopyButtonProps> = {}): Page {
  const props: CopyButtonProps = {
    label: "Share",
    icon: "share",
    isCopied: false,
    onClick: jest.fn(),
    ...changes,
  };
  const { rerender } = render(
    <ThemeRoot>
      <CopyButton {...props} />
    </ThemeRoot>
  );

  return {
    button: new CopyButtonPom(),
    props,
    update: (next) =>
      rerender(
        <ThemeRoot>
          <CopyButton {...props} {...next} />
        </ThemeRoot>
      ),
  };
}

describe("CopyButton", () => {
  describe("label face", () => {
    it("should say its label with its icon while it has not copied", () => {
      // Arrange
      const { button } = renderButton();

      // Act
      const { isShowingLabel, isShowingCopied, visibleText, labelIcon } =
        button;

      // Assert
      expect(isShowingLabel).toBe(true);
      expect(isShowingCopied).toBe(false);
      expect(visibleText).toBe("Share");
      expect(labelIcon.pathData).toBe(ICON_PATHS.share);
    });

    it("should say only its label when it has no icon", () => {
      // Arrange
      const { button } = renderButton({ icon: undefined });

      // Act
      const { visibleText, labelIcon } = button;

      // Assert
      expect(visibleText).toBe("Share");
      expect(labelIcon.isRendered).toBe(false);
    });
  });

  describe("isCopied", () => {
    it("should draw a check and Copied in place of the icon and the label while it is true", () => {
      // Arrange
      const { button } = renderButton({ isCopied: true });

      // Act
      const { isShowingCopied, isShowingLabel, visibleText, checkIcon } =
        button;

      // Assert
      expect(isShowingCopied).toBe(true);
      expect(isShowingLabel).toBe(false);
      expect(visibleText).toBe("Copied");
      expect(checkIcon.pathData).toBe(ICON_PATHS.check);
    });

    it("should draw the label again when it goes back to false", () => {
      // Arrange
      const { button, update } = renderButton({ isCopied: true });

      // Act
      update({ isCopied: false });

      // Assert
      expect(button.isShowingLabel).toBe(true);
      expect(button.isShowingCopied).toBe(false);
      expect(button.visibleText).toBe("Share");
    });

    it("should keep the label above the button and the confirmation below it while each is not shown", () => {
      // Arrange
      const { button, update } = renderButton();

      // Act
      const whileLabel = {
        label: button.labelFace.transform,
        copied: button.copiedFace.transform,
      };
      update({ isCopied: true });
      const whileCopied = {
        label: button.labelFace.transform,
        copied: button.copiedFace.transform,
      };

      // Assert
      expect(whileLabel).toEqual({ label: "none", copied: "translateY(45%)" });
      expect(whileCopied).toEqual({
        label: "translateY(-45%)",
        copied: "none",
      });
    });

    it("should grow the check into place when the confirmation comes in", () => {
      // Arrange
      const { button, update } = renderButton();

      // Act
      const whileLabel = button.checkIcon.wrapperStyle.transform;
      update({ isCopied: true });
      const whileCopied = button.checkIcon.wrapperStyle.transform;

      // Assert
      expect(whileLabel).toBe("scale(0.5)");
      expect(whileCopied).toBe("none");
    });
  });

  describe("accessible name", () => {
    it("should be the label while it has not copied, without the confirmation", () => {
      // Arrange
      const { button } = renderButton();

      // Act
      const isNamedByLabel = button.isButtonNamed("Share");

      // Assert
      expect(isNamedByLabel).toBe(true);
    });

    it("should still be the label while it confirms, since the caller tells the copy another way", () => {
      // Arrange
      const { button } = renderButton({ isCopied: true });

      // Act
      const isNamedByLabel = button.isButtonNamed("Share");
      const isNamedByConfirmation = button.isButtonNamed("Copied");

      // Assert
      expect(isNamedByLabel).toBe(true);
      expect(isNamedByConfirmation).toBe(false);
    });

    it("should hide the confirmation from assistive technology and leave the label to it", () => {
      // Arrange
      const { button } = renderButton();

      // Act
      const { labelFace, copiedFace } = button;

      // Assert
      expect(copiedFace.isHiddenFromAssistiveTechnology).toBe(true);
      expect(labelFace.isHiddenFromAssistiveTechnology).toBe(false);
    });
  });

  describe("width", () => {
    it("should lay both faces in the same cell, so that the button is as wide as the wider one whichever it draws", () => {
      // Arrange
      const { button } = renderButton();

      // Act
      const { layout } = button;

      // Assert
      expect(layout).toEqual({
        facesDisplay: "grid",
        labelFaceArea: "1/1",
        copiedFaceArea: "1/1",
      });
    });

    it("should cut the face that waits outside the button", () => {
      // Arrange
      const { button } = renderButton();

      // Act
      const { overflow } = button;

      // Assert
      expect(overflow).toBe("hidden");
    });
  });

  describe("motion", () => {
    it("should animate each face as it comes in and goes out, and not for a user who asks for less motion", () => {
      // Arrange
      const { button } = renderButton();

      // Act
      const label = button.labelFace.transitions;
      const copied = button.copiedFace.transitions;

      // Assert
      expect(label.always).toContain("opacity 180ms");
      expect(copied.always).toContain("opacity 180ms");
      expect(label.reducedMotion).toBe("none");
      expect(copied.reducedMotion).toBe("none");
    });

    it("should animate the check, and not for a user who asks for less motion", () => {
      // Arrange
      const { button } = renderButton();

      // Act
      const check = button.copiedFace.iconWrapperTransitions;

      // Assert
      expect(check.always).toContain("transform 240ms");
      expect(check.reducedMotion).toBe("none");
    });
  });

  describe("variant", () => {
    it("should be contained", () => {
      // Arrange
      const { button } = renderButton();

      // Act
      const { variant } = button;

      // Assert
      expect(variant).toBe("contained");
    });
  });

  describe("onClick", () => {
    it("should be called once each time the button is pressed", () => {
      // Arrange
      const { button, props } = renderButton();

      // Act
      button.press();
      button.press();

      // Assert
      expect(props.onClick).toHaveBeenCalledTimes(2);
    });

    it("should not be called until the button is pressed", () => {
      // Arrange
      const { props } = renderButton();

      // Act
      const { onClick } = props;

      // Assert
      expect(onClick).not.toHaveBeenCalled();
    });
  });

  describe("buttonRef", () => {
    it("should give the caller the element of the button, which takes the focus when the caller asks it to", () => {
      // Arrange
      const buttonRef = createRef<HTMLButtonElement>();
      const { button } = renderButton({ buttonRef });

      // Act
      act(() => {
        buttonRef.current?.focus();
      });

      // Assert
      expect(button.isFocused).toBe(true);
    });
  });

  describe("focus", () => {
    it("should have the focus after the keyboard moves it there", () => {
      // Arrange
      const { button } = renderButton();

      // Act
      button.focus();

      // Assert
      expect(button.isFocused).toBe(true);
    });
  });

  describe("testId", () => {
    it("should render the default test id of the component on its root", () => {
      // Arrange
      renderButton();

      // Act
      const { isRendered } = new CopyButtonPom();

      // Assert
      expect(isRendered).toBe(true);
    });

    it("should render the test id of the caller in place of the default one", () => {
      // Arrange
      renderButton({ testId: "share-button" });

      // Act
      const withCallerId = new CopyButtonPom({ testId: "share-button" });
      const withDefaultId = new CopyButtonPom();

      // Assert
      expect(withCallerId.isRendered).toBe(true);
      expect(withDefaultId.isRendered).toBe(false);
    });
  });

  describe("props", () => {
    it("should not pass its styling props to the DOM", () => {
      // Arrange
      const { button } = renderButton({ isCopied: true });

      // Act
      const { leakedPropAttributes } = button;

      // Assert
      expect(leakedPropAttributes).toEqual([]);
    });
  });
});
