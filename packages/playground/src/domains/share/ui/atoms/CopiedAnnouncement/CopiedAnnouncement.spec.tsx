import { render } from "@testing-library/react";

import { CopiedAnnouncement } from "./CopiedAnnouncement";
import { CopiedAnnouncementPom } from "./CopiedAnnouncement.pom";

describe("CopiedAnnouncement", () => {
  describe("region", () => {
    it("should be there before it says anything, so that screen readers pick up what comes into it", () => {
      // Arrange
      render(<CopiedAnnouncement isCopied={false} />);
      const announcement = new CopiedAnnouncementPom();

      // Act
      const { isRendered, text } = announcement;

      // Assert
      expect(isRendered).toBe(true);
      expect(text).toBe("");
    });

    it("should be a polite live region, so that it never interrupts what a screen reader is reading", () => {
      // Arrange
      render(<CopiedAnnouncement isCopied />);
      const announcement = new CopiedAnnouncementPom();

      // Act
      const { politeness, isReadAsStatus } = announcement;

      // Assert
      expect(politeness).toBe("polite");
      expect(isReadAsStatus).toBe(true);
    });
  });

  describe("isCopied", () => {
    it("should say that the link was copied while it is true", () => {
      // Arrange
      render(<CopiedAnnouncement isCopied />);
      const announcement = new CopiedAnnouncementPom();

      // Act
      const { text } = announcement;

      // Assert
      expect(text).toBe("Link copied");
    });

    it("should say the text in the same region it was empty in when it turns true, and empty it when it turns false", () => {
      // Arrange
      const { rerender } = render(<CopiedAnnouncement isCopied={false} />);
      const announcement = new CopiedAnnouncementPom();
      const before = announcement.text;

      // Act
      rerender(<CopiedAnnouncement isCopied />);
      const whileCopied = announcement.text;
      rerender(<CopiedAnnouncement isCopied={false} />);
      const after = announcement.text;

      // Assert
      expect(before).toBe("");
      expect(whileCopied).toBe("Link copied");
      expect(after).toBe("");
    });
  });

  describe("look", () => {
    it.each([false, true])(
      "should never be drawn, whether isCopied is %s",
      (isCopied) => {
        // Arrange
        render(<CopiedAnnouncement isCopied={isCopied} />);
        const announcement = new CopiedAnnouncementPom();

        // Act
        const { isVisuallyHidden, isRemoved } = announcement;

        // Assert
        expect(isVisuallyHidden).toBe(true);
        expect(isRemoved).toBe(false);
      }
    );
  });
});
