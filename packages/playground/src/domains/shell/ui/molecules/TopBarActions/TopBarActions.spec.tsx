import { render } from "@testing-library/react";
import { createRef } from "react";

import { ICON_PATHS } from "@/ui-kit/atoms/Icon/Icon.constants";
import { ThemeRoot } from "@/ui-kit/providers/ThemeRoot";

import { TopBarActions } from "./TopBarActions";
import { TopBarActionsPom } from "./TopBarActions.pom";
import type { TopBarActionsProps } from "./TopBarActions.types";

/** What a spec gets from the actions it renders. */
type Page = {
  /** The page object of the actions. */
  actions: TopBarActionsPom;
  /** The props of the actions, with the spies of its handlers. */
  props: TopBarActionsProps;
  /** Renders the actions again with other props. */
  update: (changes: Partial<TopBarActionsProps>) => void;
};

/**
 * Renders the actions inside the root of the playground, where its theme is.
 * @param changes What differs from the actions of a bar that can share, with the help closed.
 * @returns The page object of the actions, their props and the function that updates them.
 */
function renderActions(changes: Partial<TopBarActionsProps> = {}): Page {
  const props: TopBarActionsProps = {
    isHelpOpen: false,
    onHelp: jest.fn(),
    onReset: jest.fn(),
    onShare: jest.fn(),
    ...changes,
  };
  const { rerender } = render(
    <ThemeRoot>
      <TopBarActions {...props} />
    </ThemeRoot>
  );

  return {
    actions: new TopBarActionsPom(),
    props,
    update: (next) =>
      rerender(
        <ThemeRoot>
          <TopBarActions {...props} {...next} />
        </ThemeRoot>
      ),
  };
}

describe("TopBarActions", () => {
  describe("order", () => {
    it("should draw the message, then Help, Reset and Share", () => {
      // Arrange
      const { actions } = renderActions();

      // Act
      const { parts } = actions;

      // Assert
      expect(parts).toEqual(["message", "Help", "Reset", "Share"]);
    });

    it("should draw neither the message nor Share when the bar cannot share", () => {
      // Arrange
      const { actions } = renderActions({ onShare: undefined });

      // Act
      const { parts, hasShare } = actions;

      // Assert
      expect(parts).toEqual(["Help", "Reset"]);
      expect(hasShare).toBe(false);
      expect(actions.message.isRendered).toBe(false);
    });
  });

  describe("help", () => {
    it("should be an icon-only button named Help, 30 px square, in the muted color", () => {
      // Arrange
      const { actions } = renderActions();

      // Act
      const { helpLook, helpIcon } = actions;

      // Assert
      expect(helpLook).toMatchObject({
        width: "30px",
        height: "30px",
        color: "var(--jsb-muted)",
      });
      expect(helpIcon.pathData).toBe(ICON_PATHS.help);
      expect(helpIcon.width).toBe("16");
    });

    it("should say Help in a tooltip when the pointer is on it", async () => {
      // Arrange
      const { actions } = renderActions();

      // Act
      await actions.hoverHelp();
      const tooltip = await actions.waitForHelpTooltip();

      // Assert
      expect(tooltip).toBe("Help");
    });

    it("should announce a dialog and be pressed, in the soft accent, only while the help is open", () => {
      // Arrange
      const { actions, update } = renderActions({ isHelpOpen: false });

      // Act
      const pressedBefore = actions.isHelpPressed;
      const closedLook = actions.helpLook;

      update({ isHelpOpen: true });

      // Assert
      expect(actions.helpPopup).toBe("dialog");
      expect(pressedBefore).toBe(false);
      expect(closedLook.background).not.toBe("var(--jsb-accent-soft)");
      expect(actions.isHelpPressed).toBe(true);
      expect(actions.helpLook).toMatchObject({
        background: "var(--jsb-accent-soft)",
        color: "var(--jsb-accent)",
      });
    });

    it("should ask for the help when it is pressed", () => {
      // Arrange
      const { actions, props } = renderActions();

      // Act
      actions.pressHelp();

      // Assert
      expect(props.onHelp).toHaveBeenCalledTimes(1);
    });

    it("should give its element to the caller, who can take the keyboard focus back to it", () => {
      // Arrange
      const helpButtonRef = createRef<HTMLButtonElement>();
      const { actions } = renderActions({ helpButtonRef });

      // Act
      helpButtonRef.current?.focus();

      // Assert
      expect(helpButtonRef.current?.tagName).toBe("BUTTON");
      expect(actions.isHelpFocused).toBe(true);
    });
  });

  describe("reset", () => {
    it("should be a text button with the reset icon", () => {
      // Arrange
      const { actions } = renderActions();

      // Act
      const variant = actions.variantOf("Reset");
      const { pathData } = actions.iconOf("Reset");

      // Assert
      expect(variant).toBe("text");
      expect(pathData).toBe(ICON_PATHS.reset);
    });

    it("should ask to reset the sketch when it is pressed", () => {
      // Arrange
      const { actions, props } = renderActions();

      // Act
      actions.pressReset();

      // Assert
      expect(props.onReset).toHaveBeenCalledTimes(1);
      expect(props.onShare).not.toHaveBeenCalled();
    });

    it("should take the keyboard focus when it is first rendered, if the caller asks for it", () => {
      // Arrange
      const { actions } = renderActions({ autoFocusReset: true });

      // Act
      const { isResetFocused } = actions;

      // Assert
      expect(isResetFocused).toBe(true);
    });

    it("should not take the keyboard focus by itself", () => {
      // Arrange
      const { actions } = renderActions();

      // Act
      const { isResetFocused } = actions;

      // Assert
      expect(isResetFocused).toBe(false);
      expect(document.activeElement).toBe(document.body);
    });
  });

  describe("share", () => {
    it("should be a contained button with the share icon", () => {
      // Arrange
      const { actions } = renderActions();

      // Act
      const variant = actions.variantOf("Share");
      const { pathData } = actions.iconOf("Share");

      // Assert
      expect(variant).toBe("contained");
      expect(pathData).toBe(ICON_PATHS.share);
    });

    it("should ask to share the sketch when it is pressed", () => {
      // Arrange
      const { actions, props } = renderActions();

      // Act
      actions.pressShare();

      // Assert
      expect(props.onShare).toHaveBeenCalledTimes(1);
      expect(props.onReset).not.toHaveBeenCalled();
    });

    it("should say in the message how the last share ended", () => {
      // Arrange
      const { actions, update } = renderActions();

      // Act
      update({ shareOutcome: "copied" });

      // Assert
      expect(actions.message.text).toBe("Link copied");
    });
  });
});
