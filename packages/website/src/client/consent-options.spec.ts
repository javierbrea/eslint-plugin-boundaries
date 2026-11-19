import { getConsentModeOptions } from "./consent-options";

describe("consent-options", () => {
  describe("getConsentModeOptions", () => {
    it("should ask for consent with the banner and respect Global Privacy Control in opt-in", () => {
      // Arrange
      const googleAnalyticsMode = "opt-in";

      // Act
      const options = getConsentModeOptions(googleAnalyticsMode);

      // Assert
      expect(options).toEqual({
        mode: "opt-in",
        autoShow: true,
        respectGpc: true,
        analyticsEnabled: false,
      });
    });

    it("should enable analytics with no banner and ignore Global Privacy Control in opt-out", () => {
      // Arrange
      const googleAnalyticsMode = "opt-out";

      // Act
      const options = getConsentModeOptions(googleAnalyticsMode);

      // Assert
      expect(options).toEqual({
        mode: "opt-out",
        autoShow: false,
        respectGpc: false,
        analyticsEnabled: true,
      });
    });

    it("should return the options of opt-in when Google Analytics is disabled", () => {
      // Arrange
      const googleAnalyticsMode = "disabled";

      // Act
      const options = getConsentModeOptions(googleAnalyticsMode);

      // Assert
      expect(options).toEqual({
        mode: "opt-in",
        autoShow: true,
        respectGpc: true,
        analyticsEnabled: false,
      });
    });
  });
});
