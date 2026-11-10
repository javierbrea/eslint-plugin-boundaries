import { act, render, waitFor } from "@testing-library/react";

import type { ShareNotice } from "@/domains/share/helpers/shareOutcome";
import { ICON_PATHS } from "@/ui-kit/atoms/Icon/Icon.constants";
import { ThemeRoot } from "@/ui-kit/providers/ThemeRoot";

import { ShareDialog } from "./ShareDialog";
import { ShareDialogPom } from "./ShareDialog.pom";
import type { ShareDialogProps } from "./ShareDialog.types";

/** The link of the project that could not be copied. */
const LINK = "https://boundaries.test/playground/#v=1&d=eJxLTEoFAAH";

const LONG: ShareNotice = { kind: "long", length: 9412, maxLength: 8192 };
const NOT_COPIED: ShareNotice = { kind: "not-copied", link: LINK };
const NOT_MADE: ShareNotice = { kind: "not-made" };
const TOO_LARGE: ShareNotice = { kind: "too-large", limit: "nodes", max: 1000 };
const INVALID: ShareNotice = {
  kind: "invalid",
  reason: "Dependency 1 cannot be in the project.",
};

/** What a spec gets from the dialog it renders. */
type Page = {
  /** The page object of the dialog. */
  dialog: ShareDialogPom;
  /** The props of the dialog, with the spies of its handlers. */
  props: ShareDialogProps;
  /** Renders the dialog again with other props. */
  update: (changes: Partial<ShareDialogProps>) => void;
};

/**
 * Renders an open dialog inside the root of the playground, where its theme is.
 * @param notice What the dialog tells.
 * @param changes What differs from a dialog that is open, whose copy again works and whose button has not copied yet.
 * @returns The page object of the dialog, its props and the function that updates it.
 */
function renderDialog(
  notice: ShareNotice,
  changes: Partial<ShareDialogProps> = {}
): Page {
  const props: ShareDialogProps = {
    notice,
    isOpen: true,
    isCopiedAgain: false,
    onCopyAgain: jest.fn(() => Promise.resolve(true)),
    onClose: jest.fn(),
    onExited: jest.fn(),
    ...changes,
  };
  const { rerender } = render(
    <ThemeRoot>
      <ShareDialog {...props} />
    </ThemeRoot>
  );

  return {
    dialog: new ShareDialogPom(),
    props,
    update: (next) =>
      rerender(
        <ThemeRoot>
          <ShareDialog {...props} {...next} />
        </ThemeRoot>
      ),
  };
}

/** The notices that have no link, so that the dialog has a single button. */
const NOTICES_WITHOUT_LINK: [string, ShareNotice][] = [
  ["long", LONG],
  ["not-made", NOT_MADE],
  ["too-large", TOO_LARGE],
  ["invalid", INVALID],
];

describe("ShareDialog", () => {
  describe("open", () => {
    it("should be in the page while it is open", () => {
      // Arrange
      const { dialog } = renderDialog(NOT_MADE);

      // Act
      const { isRendered } = dialog;

      // Assert
      expect(isRendered).toBe(true);
    });

    it("should draw nothing while it is closed", () => {
      // Arrange
      const { dialog } = renderDialog(NOT_MADE, { isOpen: false });

      // Act
      const { isRendered } = dialog;

      // Assert
      expect(isRendered).toBe(false);
    });
  });

  describe("notice", () => {
    it.each<[string, ShareNotice, string, string]>([
      ["long", LONG, "Long link copied", "The link has 9,412 characters"],
      [
        "not-copied",
        NOT_COPIED,
        "The link could not be copied",
        "The browser did not let the playground use the clipboard.",
      ],
      [
        "not-made",
        NOT_MADE,
        "The link could not be made",
        "The page could not make the link of the project.",
      ],
      [
        "too-large",
        TOO_LARGE,
        "The project is too large for a link",
        "It has more than 1,000 files and folders",
      ],
      [
        "invalid",
        INVALID,
        "The project cannot be shared",
        "A link would not open it",
      ],
    ])(
      "should tell the %s notice with its title, and name the dialog by it",
      (_kind, notice, title, text) => {
        // Arrange
        const { dialog } = renderDialog(notice);

        // Act
        const isNamedDialog = dialog.isDialogNamed(title);

        // Assert
        expect(dialog.title).toBe(title);
        expect(isNamedDialog).toBe(true);
        expect(dialog.text).toContain(text);
      }
    );
  });

  describe("title icon", () => {
    it("should be a warning in the color of warnings for a link that was copied but is long", () => {
      // Arrange
      const { dialog } = renderDialog(LONG);

      // Act
      const { titleIcon, titleIconColor } = dialog;

      // Assert
      expect(titleIcon.pathData).toBe(ICON_PATHS.warn);
      expect(titleIconColor).toBe("var(--jsb-warn)");
    });

    it.each<[string, ShareNotice]>([
      ["not-copied", NOT_COPIED],
      ["not-made", NOT_MADE],
      ["too-large", TOO_LARGE],
      ["invalid", INVALID],
    ])(
      "should be a cross in the color of errors for the %s notice",
      (_kind, notice) => {
        // Arrange
        const { dialog } = renderDialog(notice);

        // Act
        const { titleIcon, titleIconColor } = dialog;

        // Assert
        expect(titleIcon.pathData).toBe(ICON_PATHS.cross);
        expect(titleIconColor).toBe("var(--jsb-bad)");
      }
    );
  });

  describe("description", () => {
    it.each<[string, ShareNotice]>([
      ["long", LONG],
      ["not-copied", NOT_COPIED],
      ["not-made", NOT_MADE],
      ["too-large", TOO_LARGE],
    ])(
      "should be the text of the message alone for the %s notice, which has no reason",
      (_kind, notice) => {
        // Arrange
        const { dialog } = renderDialog(notice);

        // Act
        const { description } = dialog;

        // Assert
        expect(description).not.toBe("");
        expect(description).toBe(dialog.text);
      }
    );

    it("should be exactly the text of the message for a notice with no reason", () => {
      // Arrange
      const { dialog } = renderDialog(NOT_MADE);

      // Act
      const { description } = dialog;

      // Assert
      expect(description).toBe(
        "The page could not make the link of the project. Your project is still here: try again in a moment."
      );
    });

    it("should be the text of the message followed by the reason when the notice has one", () => {
      // Arrange
      const { dialog } = renderDialog(INVALID);

      // Act
      const { description } = dialog;

      // Assert
      expect(description).toBe(
        "A link would not open it, because the playground refuses it when it reads a link: Dependency 1 cannot be in the project."
      );
    });
  });

  describe("reason", () => {
    it("should be drawn apart from the text, with a cross in the color of errors, when the notice has one", () => {
      // Arrange
      const { dialog } = renderDialog(INVALID);

      // Act
      const { reason } = dialog;

      // Assert
      expect(reason.isRendered).toBe(true);
      expect(reason.text).toBe("Dependency 1 cannot be in the project.");
      expect(reason.icon.pathData).toBe(ICON_PATHS.cross);
      expect(reason.icon.wrapperStyle.color).toBe("var(--jsb-bad)");
    });

    it.each<[string, ShareNotice]>([
      ["long", LONG],
      ["not-copied", NOT_COPIED],
      ["not-made", NOT_MADE],
      ["too-large", TOO_LARGE],
    ])(
      "should not be drawn for the %s notice, which has none",
      (_kind, notice) => {
        // Arrange
        const { dialog } = renderDialog(notice);

        // Act
        const { isRendered } = dialog.reason;

        // Assert
        expect(isRendered).toBe(false);
      }
    );
  });

  describe("layout", () => {
    it("should start its content where the words of its title start, past the icon", () => {
      // Arrange
      const { dialog } = renderDialog(NOT_MADE);

      // Act
      const { contentIndent, titleTextStart } = dialog;

      // Assert
      expect(contentIndent).toBe(48);
      expect(titleTextStart).toBe(48);
    });

    it("should be 440 px wide, border included", () => {
      // Arrange
      const { dialog } = renderDialog(NOT_MADE);

      // Act
      const { size } = dialog;

      // Assert
      expect(size).toEqual({ width: "440px", boxSizing: "border-box" });
    });
  });

  describe("notice with no link", () => {
    it.each(NOTICES_WITHOUT_LINK)(
      "should have one button, Got it, for the %s notice",
      (_kind, notice) => {
        // Arrange
        const { dialog } = renderDialog(notice);

        // Act
        const { buttonNames } = dialog;

        // Assert
        expect(buttonNames).toEqual(["Got it"]);
      }
    );

    it.each(NOTICES_WITHOUT_LINK)(
      "should fill Got it and give it the keyboard focus for the %s notice",
      (_kind, notice) => {
        // Arrange
        const { dialog } = renderDialog(notice);

        // Act
        const gotIt = dialog.button("Got it");

        // Assert
        expect(gotIt.variant).toBe("contained");
        expect(gotIt.isFocused).toBe(true);
      }
    );

    it.each(NOTICES_WITHOUT_LINK)(
      "should draw no field, copy button or announcement for the %s notice",
      (_kind, notice) => {
        // Arrange
        const { dialog } = renderDialog(notice);

        // Act
        const { link, copyButton, announcement } = dialog;

        // Assert
        expect(link.isRendered).toBe(false);
        expect(copyButton.isRendered).toBe(false);
        expect(announcement.isRendered).toBe(false);
      }
    );

    it("should call onClose when Got it is pressed", () => {
      // Arrange
      const { dialog, props } = renderDialog(NOT_MADE);

      // Act
      dialog.button("Got it").press();

      // Assert
      expect(props.onClose).toHaveBeenCalledTimes(1);
      expect(props.onCopyAgain).not.toHaveBeenCalled();
    });
  });

  describe("notice with a link", () => {
    it("should offer to close it, as text, beside the button that copies the link, filled", () => {
      // Arrange
      const { dialog } = renderDialog(NOT_COPIED);

      // Act
      const { buttonNames, copyButton } = dialog;
      const closeButton = dialog.button("Close");

      // Assert
      expect(buttonNames).toEqual(["Close", "Copy link"]);
      expect(closeButton.variant).toBe("text");
      expect(copyButton.variant).toBe("contained");
      expect(dialog.button("Got it").isRendered).toBe(false);
    });

    it("should hold the link in a read-only field that is named after the project", () => {
      // Arrange
      const { dialog } = renderDialog(NOT_COPIED);

      // Act
      const { link } = dialog;

      // Assert
      expect(link.value).toBe(LINK);
      expect(link.isReadOnly).toBe(true);
      expect(link.isTextBoxNamed("Link to the project")).toBe(true);
    });

    it("should give the keyboard focus to the field, with the whole link selected, when it opens", () => {
      // Arrange
      const { dialog } = renderDialog(NOT_COPIED);

      // Act
      const { link } = dialog;

      // Assert
      expect(link.isFocused).toBe(true);
      expect(link.selection).toEqual({ start: 0, end: LINK.length });
      expect(dialog.button("Close").isFocused).toBe(false);
      expect(dialog.copyButton.isFocused).toBe(false);
    });

    it("should select the whole link again whenever the field takes the focus", () => {
      // Arrange
      const { dialog } = renderDialog(NOT_COPIED);
      const { link } = dialog;
      link.collapseSelection();
      link.blur();

      // Act
      const selectionWhileAway = link.selection;
      link.focus();

      // Assert
      expect(selectionWhileAway).toEqual({ start: 0, end: 0 });
      expect(link.isFocused).toBe(true);
      expect(link.selection).toEqual({ start: 0, end: LINK.length });
    });

    it("should call onClose, and not copy, when Close is pressed", () => {
      // Arrange
      const { dialog, props } = renderDialog(NOT_COPIED);

      // Act
      dialog.button("Close").press();

      // Assert
      expect(props.onClose).toHaveBeenCalledTimes(1);
      expect(props.onCopyAgain).not.toHaveBeenCalled();
    });
  });

  describe("focus once the dialog has come in", () => {
    it("should give the field the focus again, with the whole link selected, when the dialog had it when it came in", async () => {
      // Arrange
      const { dialog } = renderDialog(NOT_COPIED);
      const { link } = dialog;
      dialog.focusDialog();
      const isFocusedBefore = link.isFocused;

      // Act
      await waitFor(() => expect(link.isFocused).toBe(true));

      // Assert
      expect(isFocusedBefore).toBe(false);
      expect(link.selection).toEqual({ start: 0, end: LINK.length });
    });

    it("should select the whole link again when the field has the focus and the link was deselected while the dialog came in", async () => {
      // Arrange
      const { dialog } = renderDialog(NOT_COPIED);
      const { link } = dialog;
      link.collapseSelection();
      const stateBefore = { isFocused: link.isFocused, ...link.selection };

      // Act
      await waitFor(() =>
        expect(link.selection).toEqual({ start: 0, end: LINK.length })
      );

      // Assert
      expect(stateBefore).toEqual({ isFocused: true, start: 0, end: 0 });
      expect(link.isFocused).toBe(true);
    });

    it.each(NOTICES_WITHOUT_LINK)(
      "should give Got it the focus again when the dialog had it for the %s notice",
      async (_kind, notice) => {
        // Arrange
        const { dialog } = renderDialog(notice);
        const gotIt = dialog.button("Got it");
        dialog.focusDialog();
        const isFocusedBefore = gotIt.isFocused;

        // Act
        await waitFor(() => expect(gotIt.isFocused).toBe(true));

        // Assert
        expect(isFocusedBefore).toBe(false);
      }
    );
  });

  describe("onCopyAgain", () => {
    it("should be called once with the link when Copy link is pressed", async () => {
      // Arrange
      const { dialog, props } = renderDialog(NOT_COPIED);

      // Act
      await act(async () => {
        dialog.copyButton.press();
      });

      // Assert
      expect(props.onCopyAgain).toHaveBeenCalledTimes(1);
      expect(props.onCopyAgain).toHaveBeenCalledWith(LINK);
      expect(props.onClose).not.toHaveBeenCalled();
    });

    it("should leave the focus on the button when the link was copied", async () => {
      // Arrange
      const { dialog } = renderDialog(NOT_COPIED);
      dialog.link.collapseSelection();
      dialog.copyButton.focus();

      // Act
      await act(async () => {
        dialog.copyButton.press();
      });

      // Assert
      expect(dialog.copyButton.isFocused).toBe(true);
      expect(dialog.link.isFocused).toBe(false);
      expect(dialog.link.selection).toEqual({ start: 0, end: 0 });
    });

    it("should focus the field and select the whole link again when the link was not copied", async () => {
      // Arrange
      const { dialog } = renderDialog(NOT_COPIED, {
        onCopyAgain: jest.fn(() => Promise.resolve(false)),
      });
      dialog.link.collapseSelection();
      dialog.copyButton.focus();

      // Act
      await act(async () => {
        dialog.copyButton.press();
      });

      // Assert
      expect(dialog.link.isFocused).toBe(true);
      expect(dialog.link.selection).toEqual({ start: 0, end: LINK.length });
      expect(dialog.copyButton.isFocused).toBe(false);
    });

    it("should do nothing when the link was not copied and the dialog is gone by then", async () => {
      // Arrange
      let finishCopy: (isCopied: boolean) => void = () => undefined;
      const { dialog, update } = renderDialog(NOT_COPIED, {
        onCopyAgain: jest.fn(
          () =>
            new Promise<boolean>((resolve) => {
              finishCopy = resolve;
            })
        ),
      });
      dialog.copyButton.press();
      update({ isOpen: false });
      await dialog.waitUntilGone();

      // Act
      // A copy that fails after the field is gone would reject, which fails the test that is running
      await act(async () => {
        finishCopy(false);
        await new Promise((resolve) => {
          setTimeout(resolve, 0);
        });
      });

      // Assert
      expect(dialog.isRendered).toBe(false);
    });
  });

  describe("isCopiedAgain", () => {
    it("should make Copy link say Copied, and announce the copy, while it is true", () => {
      // Arrange
      const { dialog } = renderDialog(NOT_COPIED, { isCopiedAgain: true });

      // Act
      const { copyButton, announcement } = dialog;

      // Assert
      expect(copyButton.isShowingCopied).toBe(true);
      expect(copyButton.visibleText).toBe("Copied");
      expect(copyButton.isButtonNamed("Copy link")).toBe(true);
      expect(announcement.text).toBe("Link copied");
    });

    it("should make Copy link say its label, and announce nothing, while it is false", () => {
      // Arrange
      const { dialog } = renderDialog(NOT_COPIED, { isCopiedAgain: false });

      // Act
      const { copyButton, announcement } = dialog;

      // Assert
      expect(copyButton.isShowingLabel).toBe(true);
      expect(copyButton.visibleText).toBe("Copy link");
      expect(announcement.text).toBe("");
      expect(announcement.politeness).toBe("polite");
    });

    it("should change what the button says when it changes while the dialog is open", () => {
      // Arrange
      const { dialog, update } = renderDialog(NOT_COPIED);

      // Act
      update({ isCopiedAgain: true });

      // Assert
      expect(dialog.copyButton.isShowingCopied).toBe(true);
      expect(dialog.announcement.text).toBe("Link copied");
    });
  });

  describe("onClose", () => {
    it.each<[string, ShareNotice]>([
      ["a notice with no link", NOT_MADE],
      ["a notice with a link", NOT_COPIED],
    ])("should be called when Escape is pressed in %s", (_case, notice) => {
      // Arrange
      const { dialog, props } = renderDialog(notice);

      // Act
      dialog.pressEscape();

      // Assert
      expect(props.onClose).toHaveBeenCalledTimes(1);
    });

    it.each<[string, ShareNotice]>([
      ["a notice with no link", NOT_MADE],
      ["a notice with a link", NOT_COPIED],
    ])(
      "should be called when the backdrop is clicked in %s",
      (_case, notice) => {
        // Arrange
        const { dialog, props } = renderDialog(notice);

        // Act
        dialog.clickBackdrop();

        // Assert
        expect(props.onClose).toHaveBeenCalledTimes(1);
      }
    );

    it("should not be called while the user does nothing", () => {
      // Arrange
      const { props } = renderDialog(NOT_MADE);

      // Act
      const { onClose } = props;

      // Assert
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe("onExited", () => {
    it("should not be called while the dialog is open", () => {
      // Arrange
      const { props } = renderDialog(NOT_COPIED);

      // Act
      const { onExited } = props;

      // Assert
      expect(onExited).not.toHaveBeenCalled();
    });

    it("should be called once the dialog is gone after it closed", async () => {
      // Arrange
      const { dialog, props, update } = renderDialog(NOT_COPIED);

      // Act
      update({ isOpen: false });
      const exitedAtOnce = jest.mocked(props.onExited).mock.calls.length;
      await dialog.waitUntilGone();
      await waitFor(() => expect(props.onExited).toHaveBeenCalledTimes(1));

      // Assert
      expect(exitedAtOnce).toBe(0);
      expect(dialog.isRendered).toBe(false);
    });
  });

  describe("props", () => {
    it("should not pass the tone to the DOM", () => {
      // Arrange
      const { dialog } = renderDialog(LONG);

      // Act
      const { leakedPropAttributes } = dialog;

      // Assert
      expect(leakedPropAttributes).toEqual([]);
    });
  });
});
