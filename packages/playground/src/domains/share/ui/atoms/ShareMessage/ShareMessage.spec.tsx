import { render } from "@testing-library/react";

import type { ShareOutcome } from "@/domains/share/helpers/shareOutcome";
import { renderInRoot } from "@/shared/testing/renderInRoot";

import { ShareMessage } from "./ShareMessage";
import { ShareMessagePom } from "./ShareMessage.pom";

/**
 * Renders the message inside the root of the playground, where the type scale is.
 * @param outcome How the last share ended.
 * @returns The page object of the message.
 */
function renderMessage(outcome: ShareOutcome | undefined): ShareMessagePom {
  renderInRoot(<ShareMessage outcome={outcome} />);

  return new ShareMessagePom();
}

describe("ShareMessage", () => {
  beforeEach(() => {
    // React logs a prop that a styled part leaks to the DOM as an attribute it does not know, once for each name
    jest.spyOn(console, "error").mockReturnValue(undefined);
  });

  afterEach(() => {
    const logged = [...jest.mocked(console.error).mock.calls];

    jest.mocked(console.error).mockRestore();

    if (logged.length > 0) {
      throw new Error(`React logged to the console: ${JSON.stringify(logged)}`);
    }
  });

  describe("live region", () => {
    it("should be a polite live region that is there before it says anything", () => {
      // Arrange
      const message = renderMessage(undefined);

      // Act
      const { liveness, text, isRendered } = message;

      // Assert
      expect(isRendered).toBe(true);
      expect(liveness).toBe("polite");
      expect(text).toBe("");
    });

    it("should take no room in the flow of its container while it says nothing", () => {
      // Arrange
      const message = renderMessage(undefined);

      // Act
      const { position } = message;

      // Assert
      expect(position).toBe("absolute");
    });

    it("should take its place in the flow when it says something", () => {
      // Arrange
      const message = renderMessage("copied");

      // Act
      const { position } = message;

      // Assert
      expect(position).not.toBe("absolute");
    });

    it("should say the message in the same region it was empty in", () => {
      // Arrange
      const { rerender } = render(<ShareMessage outcome={undefined} />);
      const message = new ShareMessagePom();
      const region = message.text;

      // Act
      rerender(<ShareMessage outcome="copied" />);

      // Assert
      expect(region).toBe("");
      expect(message.text).toBe("Link copied");
      expect(message.liveness).toBe("polite");
    });
  });

  describe("copied", () => {
    it("should say that the link was copied, in the muted color, after a check in the color of what is allowed", () => {
      // Arrange
      const message = renderMessage("copied");

      // Act
      const { text, color, hasCheck, checkColor } = message;

      // Assert
      expect(text).toBe("Link copied");
      expect(color).toBe("var(--jsb-muted)");
      expect(hasCheck).toBe(true);
      expect(checkColor).toBe("var(--jsb-ok)");
    });
  });

  describe("long", () => {
    it("should warn that some apps may cut the link, in the color of warnings, with no check", () => {
      // Arrange
      const message = renderMessage("long");

      // Act
      const { text, color, hasCheck } = message;

      // Assert
      expect(text).toBe("Long link copied: some apps may cut it");
      expect(color).toBe(
        "color-mix(in srgb, var(--jsb-warn) 85%, var(--jsb-ink))"
      );
      expect(hasCheck).toBe(false);
    });
  });

  describe("failed", () => {
    it("should say that the link could not be copied, in the color of errors, with no check", () => {
      // Arrange
      const message = renderMessage("failed");

      // Act
      const { text, color, hasCheck } = message;

      // Assert
      expect(text).toBe("The link could not be copied");
      expect(color).toBe(
        "color-mix(in srgb, var(--jsb-bad) 85%, var(--jsb-ink))"
      );
      expect(hasCheck).toBe(false);
    });
  });

  describe("refused", () => {
    it("should say why the sketch is too large for a link, in the color of errors, with no check", () => {
      // Arrange
      const message = renderMessage({
        kind: "too-large",
        reason: "The sketch has more than 1000 files and folders.",
      });

      // Act
      const { text, color, hasCheck } = message;

      // Assert
      expect(text).toBe(
        "The sketch is too large for a link: The sketch has more than 1000 files and folders."
      );
      expect(color).toBe(
        "color-mix(in srgb, var(--jsb-bad) 85%, var(--jsb-ink))"
      );
      expect(hasCheck).toBe(false);
    });

    it("should say why the sketch cannot be shared when the cause is not its size", () => {
      // Arrange
      const message = renderMessage({
        kind: "invalid",
        reason: "Dependency 1 cannot be in the sketch.",
      });

      // Act
      const { text } = message;

      // Assert
      expect(text).toBe(
        "The sketch cannot be shared: Dependency 1 cannot be in the sketch."
      );
    });
  });

  describe("fit", () => {
    it("should be the first thing of its row to shrink, to nothing if it has to", () => {
      // Arrange
      const message = renderMessage("copied");

      // Act
      const { minWidth } = message;

      // Assert
      expect(minWidth).toBe("0");
    });

    it("should keep its words on one line and cut them with an ellipsis where there is no room for them", () => {
      // Arrange
      const message = renderMessage("copied");

      // Act
      const { textStyle } = message;

      // Assert
      expect(textStyle).toEqual({
        minWidth: "0",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      });
    });

    it("should show the whole message when the pointer is on its words", () => {
      // Arrange
      const message = renderMessage({
        kind: "too-large",
        reason: "The sketch has more than 1000 files and folders.",
      });

      // Act
      const { title, text } = message;

      // Assert
      expect(title).toBe(
        "The sketch is too large for a link: The sketch has more than 1000 files and folders."
      );
      expect(text).toBe(title);
    });

    it("should say the whole message in its live region, whatever is shown of it", () => {
      // Arrange
      const message = renderMessage("long");

      // Act
      const { text, title } = message;

      // Assert
      expect(text).toBe("Long link copied: some apps may cut it");
      expect(title).toBe(text);
    });

    it("should never shrink the check icon, so that the words give way to it", () => {
      // Arrange
      const message = renderMessage("copied");

      // Act
      const { checkFlexShrink } = message;

      // Assert
      expect(checkFlexShrink).toBe("0");
    });
  });

  describe("type", () => {
    it("should be 12 px in the body font", () => {
      // Arrange
      const message = renderMessage("copied");

      // Act
      const { fontSize, fontFamily } = message;

      // Assert
      expect(fontSize).toBe("12px");
      expect(fontFamily).toBe("var(--jsb-font-body)");
    });
  });

  describe("props", () => {
    it("should not pass the color to the DOM", () => {
      // Arrange
      const message = renderMessage("long");

      // Act
      const { isRendered } = message;
      const logged = jest.mocked(console.error).mock.calls;

      // Assert
      expect(isRendered).toBe(true);
      expect(logged).toEqual([]);
    });
  });
});
