import { render } from "@testing-library/react";

import { LoadState } from "./LoadState";
import { LoadStatePom } from "./LoadState.pom";
import type { LoadStateProps } from "./LoadState.types";

/**
 * Renders the message of a load.
 * @param load The state of the load of the sketch.
 * @returns The page object of the message.
 */
function renderLoadState(load: LoadStateProps["load"]): LoadStatePom {
  render(<LoadState load={load} />);

  return new LoadStatePom();
}

describe("LoadState", () => {
  describe("loading", () => {
    it("should say that the sketch is loading", () => {
      // Arrange
      const message = renderLoadState({ status: "loading" });

      // Act
      const { role, text } = message;

      // Assert
      expect(role).toBe("status");
      expect(text).toBe("Loading the sketch…");
    });

    it("should draw the message in the muted color", () => {
      // Arrange
      const message = renderLoadState({ status: "loading" });

      // Act
      const { color } = message;

      // Assert
      expect(color).toBe("var(--jsb-muted)");
    });
  });

  describe("failed", () => {
    it("should say why the sketch could not be loaded when the reason is an error", () => {
      // Arrange
      const message = renderLoadState({
        status: "failed",
        error: new Error("offline"),
      });

      // Act
      const { role, text } = message;

      // Assert
      expect(role).toBe("alert");
      expect(text).toBe("The sketch could not be loaded: offline");
    });

    it("should say why the sketch could not be loaded when the reason is not an error", () => {
      // Arrange
      const message = renderLoadState({ status: "failed", error: "offline" });

      // Act
      const { role, text } = message;

      // Assert
      expect(role).toBe("alert");
      expect(text).toBe("The sketch could not be loaded: offline");
    });

    it("should draw the message in the color of errors", () => {
      // Arrange
      const message = renderLoadState({ status: "failed", error: "offline" });

      // Act
      const { color } = message;

      // Assert
      expect(color).toBe("var(--jsb-bad)");
    });

    it("should not pass the failed state to the DOM", () => {
      // Arrange
      const message = renderLoadState({ status: "failed", error: "offline" });

      // Act
      const { hasFailedAttribute } = message;

      // Assert
      expect(hasFailedAttribute).toBe(false);
    });
  });
});
