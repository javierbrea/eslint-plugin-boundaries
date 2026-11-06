import { VERDICT_COLORS } from "./verdictColors.constants";

describe("verdictColors", () => {
  describe("vERDICT_COLORS", () => {
    it("should take the color of each tone of a verdict from the tokens of the host", () => {
      // Assert
      expect(VERDICT_COLORS).toEqual({
        ok: "var(--jsb-ok)",
        bad: "var(--jsb-bad)",
        warn: "var(--jsb-warn)",
        faint: "var(--jsb-faint)",
      });
    });
  });
});
