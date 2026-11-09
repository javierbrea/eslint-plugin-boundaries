import type {
  ShareOutcome,
  ShareRefusal,
} from "@/domains/share/helpers/shareOutcome";

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

    it.each<[ShareRefusal, string]>([
      [
        {
          kind: "too-large",
          reason: "The sketch has more than 1000 files and folders.",
        },
        "The sketch is too large for a link: The sketch has more than 1000 files and folders.",
      ],
      [
        {
          kind: "invalid",
          reason:
            '"src/a.js " cannot be in the tree. A path cannot end with a space.',
        },
        'The sketch cannot be shared: "src/a.js " cannot be in the tree. A path cannot end with a space.',
      ],
    ])(
      "should say why a sketch that is not shared is refused, after what its kind says, in the color of errors and with no check",
      (refusal, text) => {
        // Act
        const message = getShareMessage(refusal);

        // Assert
        expect(message).toEqual({
          text,
          color: "color-mix(in srgb, var(--jsb-bad) 85%, var(--jsb-ink))",
          hasCheck: false,
        });
      }
    );
  });
});
