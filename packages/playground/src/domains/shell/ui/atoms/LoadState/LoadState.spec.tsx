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
      renderLoadState({ status: "failed", error: "offline" });

      // Act
      const logged = jest.mocked(console.error).mock.calls;

      // Assert
      expect(logged).toEqual([]);
    });
  });
});
