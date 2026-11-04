import { render, screen as view } from "@testing-library/react";

import { LoadState } from "./LoadState";

describe("LoadState", () => {
  describe("loading", () => {
    it("should say that the sketch is loading", () => {
      // Arrange
      render(<LoadState load={{ status: "loading" }} />);

      // Act
      const message = view.getByRole("status");

      // Assert
      expect(message.textContent).toBe("Loading the sketch…");
    });

    it("should draw the message in the muted color", () => {
      // Arrange
      render(<LoadState load={{ status: "loading" }} />);

      // Act
      const style = getComputedStyle(view.getByRole("status"));

      // Assert
      expect(style.color).toBe("var(--jsb-muted)");
    });
  });

  describe("failed", () => {
    it("should say why the sketch could not be loaded when the reason is an error", () => {
      // Arrange
      render(
        <LoadState load={{ status: "failed", error: new Error("offline") }} />
      );

      // Act
      const message = view.getByRole("alert");

      // Assert
      expect(message.textContent).toBe(
        "The sketch could not be loaded: offline"
      );
    });

    it("should say why the sketch could not be loaded when the reason is not an error", () => {
      // Arrange
      render(<LoadState load={{ status: "failed", error: "offline" }} />);

      // Act
      const message = view.getByRole("alert");

      // Assert
      expect(message.textContent).toBe(
        "The sketch could not be loaded: offline"
      );
    });

    it("should draw the message in the color of errors", () => {
      // Arrange
      render(<LoadState load={{ status: "failed", error: "offline" }} />);

      // Act
      const style = getComputedStyle(view.getByRole("alert"));

      // Assert
      expect(style.color).toBe("var(--jsb-bad)");
    });

    it("should not pass the failed state to the DOM", () => {
      // Arrange
      render(<LoadState load={{ status: "failed", error: "offline" }} />);

      // Act
      const message = view.getByRole("alert");

      // Assert
      expect(message.hasAttribute("failed")).toBe(false);
    });
  });
});
