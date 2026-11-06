import { TONE_COLORS } from "./tone.constants";

describe("Tone", () => {
  describe("tONE_COLORS", () => {
    it("should take the color of each tone from the tokens of the host", () => {
      // Assert
      expect(TONE_COLORS).toEqual({
        bad: "var(--jsb-bad)",
        warn: "var(--jsb-warn)",
      });
    });
  });
});
