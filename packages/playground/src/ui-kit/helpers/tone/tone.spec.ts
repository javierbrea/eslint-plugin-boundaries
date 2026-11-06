import { getCountTone } from "./tone";
import { STATE_TEXT, TONE_COLORS } from "./tone.constants";

describe("Tone", () => {
  describe("tONE_COLORS", () => {
    it("should take the color of each tone from the tokens of the host", () => {
      // Assert
      expect(TONE_COLORS).toEqual({
        ok: "var(--jsb-ok)",
        bad: "var(--jsb-bad)",
        warn: "var(--jsb-warn)",
        faint: "var(--jsb-faint)",
      });
    });
  });

  describe("sTATE_TEXT", () => {
    it.each<[keyof typeof STATE_TEXT, string]>([
      ["ok", "color-mix(in srgb, var(--jsb-ok) 85%, var(--jsb-ink))"],
      ["bad", "color-mix(in srgb, var(--jsb-bad) 85%, var(--jsb-ink))"],
      ["warn", "color-mix(in srgb, var(--jsb-warn) 85%, var(--jsb-ink))"],
    ])(
      "should mix 15%% of the ink into the token of the %s state, for contrast",
      (state, color) => {
        // Assert
        expect(STATE_TEXT[state]).toBe(color);
      }
    );

    it("should read not-checked text in the muted color, which already passes the contrast", () => {
      // Assert
      expect(STATE_TEXT.faint).toBe("var(--jsb-muted)");
    });
  });

  describe("getCountTone", () => {
    it("should be bad when any problem is an error", () => {
      // Act
      const tone = getCountTone(true);

      // Assert
      expect(tone).toBe("bad");
    });

    it("should be warn when there are only warnings and deprecations, or no problems", () => {
      // Act
      const tone = getCountTone(false);

      // Assert
      expect(tone).toBe("warn");
    });
  });
});
