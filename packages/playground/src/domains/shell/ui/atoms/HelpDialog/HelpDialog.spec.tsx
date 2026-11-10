import { render, waitFor } from "@testing-library/react";

import { ICON_PATHS } from "@/ui-kit/atoms/Icon/Icon.constants";
import { ThemeRoot } from "@/ui-kit/providers/ThemeRoot";

import { HelpDialog } from "./HelpDialog";
import { HelpDialogPom } from "./HelpDialog.pom";
import type { HelpDialogProps } from "./HelpDialog.types";

/** What a spec gets from the dialog it renders. */
type Page = {
  /** The page object of the dialog. */
  dialog: HelpDialogPom;
  /** The props of the dialog, with the spies of its handlers. */
  props: HelpDialogProps;
  /** Renders the dialog again with other props. */
  update: (changes: Partial<HelpDialogProps>) => void;
};

/**
 * Renders the dialog inside the root of the playground, where its theme is.
 * @param changes What differs from an open dialog that links to the playground guide and to the Quick start.
 * @returns The page object of the dialog, its props and the function that updates it.
 */
function renderDialog(changes: Partial<HelpDialogProps> = {}): Page {
  const props: HelpDialogProps = {
    isOpen: true,
    guideUrl: "/docs/guides/playground",
    quickStartUrl: "/docs/quick-start",
    onClose: jest.fn(),
    onExited: jest.fn(),
    ...changes,
  };
  const { rerender } = render(
    <ThemeRoot>
      <HelpDialog {...props} />
    </ThemeRoot>
  );

  return {
    dialog: new HelpDialogPom(),
    props,
    update: (next) =>
      rerender(
        <ThemeRoot>
          <HelpDialog {...props} {...next} />
        </ThemeRoot>
      ),
  };
}

describe("HelpDialog", () => {
  describe("open", () => {
    it("should draw nothing while it is closed, which is how it starts", () => {
      // Arrange
      const { dialog } = renderDialog({ isOpen: false });

      // Act
      const { isRendered } = dialog;

      // Assert
      expect(isRendered).toBe(false);
    });
  });

  describe("title", () => {
    it("should say how the playground works, and name the dialog by it", () => {
      // Arrange
      const { dialog } = renderDialog();

      // Act
      const { title } = dialog;
      const isNamedDialog = dialog.isDialogNamed("How the playground works");

      // Assert
      expect(title).toBe("How the playground works");
      expect(isNamedDialog).toBe(true);
    });

    it("should be 540 px wide, border included", () => {
      // Arrange
      const { dialog } = renderDialog();

      // Act
      const { size } = dialog;

      // Assert
      expect(size).toEqual({ width: "540px", boxSizing: "border-box" });
    });
  });

  describe("lead", () => {
    it("should say in one sentence what the playground does", () => {
      // Arrange
      const { dialog } = renderDialog();

      // Act
      const { lead } = dialog;

      // Assert
      expect(lead).toBe(
        "Sketch a project, write its boundaries config, and see how the plugin classifies each file and which imports it allows. In the browser, nothing to install."
      );
    });
  });

  describe("steps", () => {
    it("should explain the three steps, in order", () => {
      // Arrange
      const { dialog } = renderDialog();

      // Act
      const { steps } = dialog;

      // Assert
      expect(steps).toEqual([
        {
          title: "Sketch the files",
          text: "Add, rename and delete files in Project, or switch it to text and write one path per line.",
        },
        {
          title: "Write the config",
          text: "Open eslint.config.js and edit its settings and rules, the same ones the plugin takes. Problems are underlined as you type.",
        },
        {
          title: "Add dependencies",
          text: "Select a file to see its element, then add its imports to see which ones the rules allow, and which policy decides.",
        },
      ]);
    });

    it("should draw the names of the config, its keys and its policies in mono", () => {
      // Arrange
      const { dialog } = renderDialog();

      // Act
      const { stepCodes } = dialog;

      // Assert
      expect(stepCodes).toEqual([
        [],
        ["eslint.config.js", "settings", "rules"],
        [],
      ]);
    });

    it("should number the steps with a circle of 24 px in the accent", () => {
      // Arrange
      const { dialog } = renderDialog();

      // Act
      const marker = dialog.stepMarker(0);

      // Assert
      expect(marker).toMatchObject({
        content: "counter(step)",
        width: "24px",
        height: "24px",
        border: "1px solid var(--jsb-accent)",
        "border-radius": "50%",
        color: "var(--jsb-accent)",
        "box-sizing": "border-box",
      });
    });

    it("should count the steps with one counter that the list resets and every item increments", () => {
      // Arrange
      const { dialog } = renderDialog();

      // Act
      const { counters } = dialog;

      // Assert
      expect(counters).toEqual({ reset: "step", increment: "step" });
    });

    it("should draw each number in mono and each step in the size of its text", () => {
      // Arrange
      const { dialog } = renderDialog();

      // Act
      const marker = dialog.stepMarker(1);

      // Assert
      expect(marker).toMatchObject({
        "font-family": "var(--jsb-font-mono)",
        "font-size": "12px",
        "font-weight": "500",
        "line-height": "1",
      });
    });
  });

  describe("tips", () => {
    it("should put the note on import paths first and the one on the Quick start, Reset and Share second", () => {
      // Arrange
      const { dialog } = renderDialog();

      // Act
      const { tips } = dialog;

      // Assert
      expect(tips).toEqual([
        "Imports are written with the full relative path of their file, such as ../helpers/format/index.js, and that is the path dependency.source, customSourcePatterns and {{dependency.source}} see. Text mode also reads shorter paths, by a rule of its own and not by the resolvers of your config: with eslint-import-resolver-typescript, ESLint takes ./b.js to a b.ts beside it.",
        "The project starts with the example of the Quick start. Reset brings it back, and Share copies a link with the whole project.",
      ]);
    });

    it("should draw the names and the paths of the first tip in mono", () => {
      // Arrange
      const { dialog } = renderDialog();

      // Act
      const { tipCodes } = dialog;

      // Assert
      expect(tipCodes).toEqual([
        [
          "../helpers/format/index.js",
          "dependency.source",
          "customSourcePatterns",
          "{{dependency.source}}",
          "eslint-import-resolver-typescript",
          "./b.js",
          "b.ts",
        ],
        [],
      ]);
    });

    it("should start each tip with the info icon", () => {
      // Arrange
      const { dialog } = renderDialog();

      // Act
      const icons = [dialog.tipIcon(0), dialog.tipIcon(1)];

      // Assert
      expect(icons.map((icon) => icon.pathData)).toEqual([
        ICON_PATHS.info,
        ICON_PATHS.info,
      ]);
      expect(icons.map((icon) => icon.isHidden)).toEqual([true, true]);
    });
  });

  describe("footer", () => {
    it("should link to the playground guide and to the Quick start, each with an arrow", () => {
      // Arrange
      const { dialog } = renderDialog({
        guideUrl: "/docs/guides/playground",
        quickStartUrl: "/docs/quick-start",
      });

      // Act
      const { playgroundGuideLink, quickStartLink } = dialog;

      // Assert
      expect(playgroundGuideLink.href).toBe("/docs/guides/playground");
      expect(playgroundGuideLink.icon.pathData).toBe(ICON_PATHS.arrow);
      expect(quickStartLink.href).toBe("/docs/quick-start");
      expect(quickStartLink.icon.pathData).toBe(ICON_PATHS.arrow);
    });

    it("should draw the playground guide first, then the Quick start, and then the button that closes it", () => {
      // Arrange
      const { dialog } = renderDialog();

      // Act
      const { footerTexts } = dialog;

      // Assert
      expect(footerTexts).toEqual([
        "Read the playground guide",
        "Read the Quick start",
        "Got it",
      ]);
    });

    it("should link only to the Quick start, with an arrow, before the button that closes it, without the URL of the guide", () => {
      // Arrange
      const { dialog } = renderDialog({
        guideUrl: undefined,
        quickStartUrl: "/docs/quick-start",
      });

      // Act
      const { playgroundGuideLink, quickStartLink, footerTexts } = dialog;

      // Assert
      expect(quickStartLink.isRendered).toBe(true);
      expect(quickStartLink.href).toBe("/docs/quick-start");
      expect(quickStartLink.icon.pathData).toBe(ICON_PATHS.arrow);
      expect(playgroundGuideLink.isRendered).toBe(false);
      expect(footerTexts).toEqual(["Read the Quick start", "Got it"]);
    });

    it("should link only to the playground guide, with an arrow, before the button that closes it, without the URL of the Quick start", () => {
      // Arrange
      const { dialog } = renderDialog({
        guideUrl: "/docs/guides/playground",
        quickStartUrl: undefined,
      });

      // Act
      const { playgroundGuideLink, quickStartLink, footerTexts } = dialog;

      // Assert
      expect(playgroundGuideLink.isRendered).toBe(true);
      expect(playgroundGuideLink.href).toBe("/docs/guides/playground");
      expect(playgroundGuideLink.icon.pathData).toBe(ICON_PATHS.arrow);
      expect(quickStartLink.isRendered).toBe(false);
      expect(footerTexts).toEqual(["Read the playground guide", "Got it"]);
    });

    it("should draw each link in the accent, also under the pointer where a host would underline it", () => {
      // Arrange
      const { dialog } = renderDialog();

      // Act
      const links = [dialog.playgroundGuideLink, dialog.quickStartLink];

      // Assert
      expect(links.map((link) => link.color)).toEqual([
        "var(--jsb-accent)",
        "var(--jsb-accent)",
      ]);
      expect(links.map((link) => link.hover)).toEqual([
        { color: "var(--jsb-accent)", textDecoration: "none" },
        { color: "var(--jsb-accent)", textDecoration: "none" },
      ]);
    });

    it("should draw no link without the URL of the guide and the one of the Quick start", () => {
      // Arrange
      const { dialog } = renderDialog({
        guideUrl: undefined,
        quickStartUrl: undefined,
      });

      // Act
      const { playgroundGuideLink, quickStartLink, footerTexts } = dialog;

      // Assert
      expect(playgroundGuideLink.isRendered).toBe(false);
      expect(quickStartLink.isRendered).toBe(false);
      expect(footerTexts).toEqual(["Got it"]);
    });

    it("should leave the button at the right edge when there are two links: only the last one takes the free space", () => {
      // Arrange
      const { dialog } = renderDialog();

      // Act
      const { playgroundGuideLink, quickStartLink } = dialog;

      // Assert
      expect(playgroundGuideLink.takesFreeSpace).toBe(false);
      expect(quickStartLink.takesFreeSpace).toBe(true);
    });

    it("should leave the button at the right edge when the playground guide is the only link", () => {
      // Arrange
      const { dialog } = renderDialog({ quickStartUrl: undefined });

      // Act
      const { takesFreeSpace } = dialog.playgroundGuideLink;

      // Assert
      expect(takesFreeSpace).toBe(true);
    });

    it("should leave the button at the right edge when the Quick start is the only link", () => {
      // Arrange
      const { dialog } = renderDialog({ guideUrl: undefined });

      // Act
      const { takesFreeSpace } = dialog.quickStartLink;

      // Assert
      expect(takesFreeSpace).toBe(true);
    });

    it("should put 20 px between its elements and no other room before them", () => {
      // Arrange
      const { dialog } = renderDialog();

      // Act
      const { footerSpacing } = dialog;

      // Assert
      expect(footerSpacing).toEqual({ gap: "20px", siblingMargin: undefined });
    });

    it("should close with a contained button", () => {
      // Arrange
      const { dialog, props } = renderDialog();

      // Act
      const { closeButtonVariant } = dialog;

      dialog.close();

      // Assert
      expect(closeButtonVariant).toBe("contained");
      expect(props.onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe("closing", () => {
    it("should ask to close with the Escape key", () => {
      // Arrange
      const { dialog, props } = renderDialog();

      // Act
      dialog.pressEscape();

      // Assert
      expect(props.onClose).toHaveBeenCalledTimes(1);
    });

    it("should ask to close with a click outside it", () => {
      // Arrange
      const { dialog, props } = renderDialog();

      // Act
      dialog.clickBackdrop();

      // Assert
      expect(props.onClose).toHaveBeenCalledTimes(1);
    });

    it("should say when it is gone from the page after it closed, and not before", async () => {
      // Arrange
      const { dialog, props, update } = renderDialog();

      // Act
      update({ isOpen: false });

      const exitedAtOnce = jest.mocked(props.onExited).mock.calls.length;

      await dialog.waitUntilGone();
      await waitFor(() => expect(props.onExited).toHaveBeenCalledTimes(1));

      // Assert
      expect(exitedAtOnce).toBe(0);
      expect(dialog.isRendered).toBe(false);
    });

    it("should take the keyboard focus while it is open", () => {
      // Arrange
      const { dialog } = renderDialog();

      // Act
      const { focusedText } = dialog;

      // Assert
      expect(focusedText).not.toBeNull();
    });
  });
});
