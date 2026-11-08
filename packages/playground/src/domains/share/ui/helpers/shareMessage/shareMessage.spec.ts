import type { ShareOutcome } from "@/domains/share/helpers/shareOutcome";

import { getShareMessage } from "./shareMessage";

describe("ShareMessage", () => {
  describe("getShareMessage", () => {
    it.each<[ShareOutcome, string, string, boolean]>([
      ["copied", "Link copied", "var(--jsb-muted)", true],
      [
        "long",
        "Long link copied: some apps may cut it",
        "color-mix(in srgb, var(--jsb-warn) 85%, var(--jsb-ink))",
        false,
      ],
      [
        "failed",
        "The link could not be copied",
        "color-mix(in srgb, var(--jsb-bad) 85%, var(--jsb-ink))",
        false,
      ],
    ])(
      "should say %s in its words and its color, with a check only when it was copied",
      (outcome, text, color, hasCheck) => {
        // Act
        const message = getShareMessage(outcome);

        // Assert
        expect(message).toEqual({ text, color, hasCheck });
      }
    );
  });
});
