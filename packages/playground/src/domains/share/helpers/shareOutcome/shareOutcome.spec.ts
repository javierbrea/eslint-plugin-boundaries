import { LONG_LINK_LENGTH } from "@/domains/share/helpers/sketchHash";

import { getCopiedOutcome } from "./shareOutcome";

describe("ShareOutcome", () => {
  describe("getCopiedOutcome", () => {
    it("should say that the link was copied when it is short", () => {
      // Arrange
      const link = `https://example.com/playground/#v=1&s=${"a".repeat(40)}`;

      // Act
      const outcome = getCopiedOutcome(link);

      // Assert
      expect(outcome).toBe("copied");
    });

    it("should say that the link was copied when it has the longest length that is not long", () => {
      // Arrange
      const link = "a".repeat(LONG_LINK_LENGTH);

      // Act
      const outcome = getCopiedOutcome(link);

      // Assert
      expect(outcome).toBe("copied");
    });

    it("should say that the link is long when it has one character more", () => {
      // Arrange
      const link = "a".repeat(LONG_LINK_LENGTH + 1);

      // Act
      const outcome = getCopiedOutcome(link);

      // Assert
      expect(outcome).toBe("long");
    });
  });
});
