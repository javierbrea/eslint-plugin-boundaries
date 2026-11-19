import type { GoogleAnalyticsMode } from "./googleAnalyticsMode";
import {
  isShownInGoogleAnalyticsMode,
  readGoogleAnalyticsMode,
  resolveGoogleAnalyticsMode,
} from "./googleAnalyticsMode";

const BANNER_VARIABLE = "DISABLE_CONSENT_BANNER";
const ANALYTICS_VARIABLE = "DISABLE_GOOGLE_ANALYTICS";

describe("googleAnalyticsMode", () => {
  describe("resolveGoogleAnalyticsMode", () => {
    it("should resolve opt-in when no variable is set", () => {
      // Arrange
      const env = {};

      // Act
      const mode = resolveGoogleAnalyticsMode(env);

      // Assert
      expect(mode).toBe("opt-in");
    });

    it("should resolve opt-out when the banner is disabled", () => {
      // Arrange
      // Typed as process.env, so the type check proves that the build can pass it
      const env: typeof process.env = { [BANNER_VARIABLE]: "true" };

      // Act
      const mode = resolveGoogleAnalyticsMode(env);

      // Assert
      expect(mode).toBe("opt-out");
    });

    it("should resolve disabled when Google Analytics is disabled", () => {
      // Arrange
      const env = { [ANALYTICS_VARIABLE]: "true" };

      // Act
      const mode = resolveGoogleAnalyticsMode(env);

      // Assert
      expect(mode).toBe("disabled");
    });

    it("should resolve disabled when both the banner and Google Analytics are disabled", () => {
      // Arrange
      const env = { [BANNER_VARIABLE]: "true", [ANALYTICS_VARIABLE]: "true" };

      // Act
      const mode = resolveGoogleAnalyticsMode(env);

      // Assert
      expect(mode).toBe("disabled");
    });

    it("should resolve opt-out when Google Analytics is not disabled and the banner is", () => {
      // Arrange
      const env = { [BANNER_VARIABLE]: "true", [ANALYTICS_VARIABLE]: "false" };

      // Act
      const mode = resolveGoogleAnalyticsMode(env);

      // Assert
      expect(mode).toBe("opt-out");
    });

    it.each([
      [BANNER_VARIABLE, "TRUE"],
      [BANNER_VARIABLE, "1"],
      [BANNER_VARIABLE, "false"],
      [BANNER_VARIABLE, ""],
      [ANALYTICS_VARIABLE, "TRUE"],
      [ANALYTICS_VARIABLE, "1"],
      [ANALYTICS_VARIABLE, "false"],
      [ANALYTICS_VARIABLE, ""],
    ])(
      "should resolve opt-in when %s is %p, since only the exact string true counts",
      (variable, value) => {
        // Arrange
        const env = { [variable]: value };

        // Act
        const mode = resolveGoogleAnalyticsMode(env);

        // Assert
        expect(mode).toBe("opt-in");
      }
    );
  });

  describe("readGoogleAnalyticsMode", () => {
    it("should read opt-in when there are no custom fields", () => {
      // Arrange
      const customFields = undefined;

      // Act
      const mode = readGoogleAnalyticsMode(customFields);

      // Assert
      expect(mode).toBe("opt-in");
    });

    it("should read opt-in when the custom fields have no mode", () => {
      // Arrange
      const customFields = {};

      // Act
      const mode = readGoogleAnalyticsMode(customFields);

      // Assert
      expect(mode).toBe("opt-in");
    });

    it.each(["opt-in", "opt-out", "disabled"] as const)(
      "should read the mode %p back from the googleAnalyticsMode custom field",
      (storedMode) => {
        // Arrange
        const customFields = { googleAnalyticsMode: storedMode };

        // Act
        const mode = readGoogleAnalyticsMode(customFields);

        // Assert
        expect(mode).toBe(storedMode);
      }
    );

    it.each(["opt-on", 1, true])(
      "should read opt-in when the field holds %p, which is not a mode",
      (value) => {
        // Arrange
        const customFields = { googleAnalyticsMode: value };

        // Act
        const mode = readGoogleAnalyticsMode(customFields);

        // Assert
        expect(mode).toBe("opt-in");
      }
    );
  });

  describe("isShownInGoogleAnalyticsMode", () => {
    it("should show a block meant for the mode of the build", () => {
      // Arrange
      const modes = ["opt-out", "disabled"] as const;

      // Act
      const isShown = isShownInGoogleAnalyticsMode("disabled", modes);

      // Assert
      expect(isShown).toBe(true);
    });

    it("should hide a block that is not meant for the mode of the build", () => {
      // Arrange
      const modes = ["opt-out", "disabled"] as const;

      // Act
      const isShown = isShownInGoogleAnalyticsMode("opt-in", modes);

      // Assert
      expect(isShown).toBe(false);
    });

    it("should throw an error that names the entry that is not a mode, even when the mode of the build is in the list", () => {
      // Arrange
      const modes: readonly GoogleAnalyticsMode[] = [
        "opt-in",
        // @ts-expect-error MDX props are not type-checked, so a typo reaches the guard
        "opt-on",
      ];

      // Act
      const showBlock = () => isShownInGoogleAnalyticsMode("opt-in", modes);

      // Assert
      expect(showBlock).toThrow(
        'Not a Google Analytics mode: "opt-on". The modes are "opt-in", "opt-out", "disabled".'
      );
    });

    it("should throw an error that names every entry that is not a mode", () => {
      // Arrange
      const modes: readonly GoogleAnalyticsMode[] = [
        // @ts-expect-error MDX props are not type-checked, so a typo reaches the guard
        "opt-on",
        "opt-out",
        // @ts-expect-error MDX props are not type-checked, so a typo reaches the guard
        "disable",
      ];

      // Act
      const showBlock = () => isShownInGoogleAnalyticsMode("opt-in", modes);

      // Assert
      expect(showBlock).toThrow(
        'Not a Google Analytics mode: "opt-on", "disable". The modes are "opt-in", "opt-out", "disabled".'
      );
    });
  });
});
