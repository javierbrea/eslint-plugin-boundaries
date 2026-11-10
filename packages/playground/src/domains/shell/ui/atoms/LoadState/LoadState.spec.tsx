import { render } from "@testing-library/react";

import { ICON_PATHS } from "@/ui-kit/atoms/Icon/Icon.constants";

import { LoadState } from "./LoadState";
import { LoadStatePom } from "./LoadState.pom";
import type { LoadStateProps } from "./LoadState.types";

/**
 * Renders the message of a load.
 * @param load The state of the load of the sketch.
 * @param onReset Called when the user asks to reset the sketch, if the message has a button for it.
 * @returns The page object of the message.
 */
function renderLoadState(
  load: LoadStateProps["load"],
  onReset?: () => void
): LoadStatePom {
  render(<LoadState load={load} onReset={onReset} />);

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
      expect(text).toBe("Loading the project…");
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
      expect(text).toBe("The project could not be loaded: offline");
    });

    it("should say why the sketch could not be loaded when the reason is not an error", () => {
      // Arrange
      const message = renderLoadState({ status: "failed", error: "offline" });

      // Act
      const { role, text } = message;

      // Assert
      expect(role).toBe("alert");
      expect(text).toBe("The project could not be loaded: offline");
    });

    it("should draw the message in the color of errors", () => {
      // Arrange
      const message = renderLoadState({ status: "failed", error: "offline" });

      // Act
      const { color } = message;

      // Assert
      expect(color).toBe(
        "color-mix(in srgb, var(--jsb-bad) 85%, var(--jsb-ink))"
      );
    });

    it("should break a reason that is one long word, so that it never widens the page", () => {
      // Arrange
      const message = renderLoadState({
        status: "failed",
        error: new Error(`"src/${"x".repeat(3000)}.js" cannot be found`),
      });

      // Act
      const { overflowWrap } = message;

      // Assert
      expect(overflowWrap).toBe("anywhere");
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

  describe("reset", () => {
    it("should offer to reset the sketch when it could not be loaded and the host has a way to do it", () => {
      // Arrange
      const message = renderLoadState(
        { status: "failed", error: new Error("unreadable link") },
        jest.fn()
      );

      // Act
      const { hasResetButton, text } = message;

      // Assert
      expect(hasResetButton).toBe(true);
      expect(text).toBe("The project could not be loaded: unreadable link");
    });

    it("should call the host when the button is pressed", () => {
      // Arrange
      const onReset = jest.fn();
      const message = renderLoadState(
        { status: "failed", error: "offline" },
        onReset
      );

      // Act
      message.pressReset();

      // Assert
      expect(onReset).toHaveBeenCalledTimes(1);
    });

    it("should draw the reset icon in the button", () => {
      // Arrange
      const message = renderLoadState(
        { status: "failed", error: "offline" },
        jest.fn()
      );

      // Act
      const { resetIcon } = message;

      // Assert
      expect(resetIcon.pathData).toBe(ICON_PATHS.reset);
    });

    it("should offer nothing when the host has no way to reset the sketch", () => {
      // Arrange
      const message = renderLoadState({ status: "failed", error: "offline" });

      // Act
      const { hasResetButton } = message;

      // Assert
      expect(hasResetButton).toBe(false);
    });

    it("should offer nothing while the sketch is loading, whatever the host can do", () => {
      // Arrange
      const message = renderLoadState({ status: "loading" }, jest.fn());

      // Act
      const { hasResetButton } = message;

      // Assert
      expect(hasResetButton).toBe(false);
    });
  });
});
