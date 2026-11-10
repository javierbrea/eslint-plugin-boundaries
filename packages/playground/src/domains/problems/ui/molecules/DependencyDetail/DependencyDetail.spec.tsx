import { tokenizeConfig } from "@/domains/evaluation/helpers/engine";
import type { DependencyDetailContent } from "@/domains/problems/ui/helpers/dependencyDetail";
import { renderInRoot } from "@/shared/testing/renderInRoot";
import { ICON_PATHS } from "@/ui-kit/atoms/Icon/Icon.constants";
import { FOCUS_RING } from "@/ui-kit/helpers/theme";

import { DependencyDetail } from "./DependencyDetail";
import { DependencyDetailPom } from "./DependencyDetail.pom";

const POLICY_TEXT = `{
  // No element may import a test file, whatever element it belongs to
  disallow: { to: { file: { categories: "test" } } },
}`;

const CHECKOUT = "src/modules/checkout/index.js";

const BUTTON_SPEC_SOURCE = "../../components/atoms/Button/Button.spec.js";

const DISALLOWED: DependencyDetailContent = {
  verdict: { icon: "cross", tone: "bad", text: "disallowed · policy 2" },
  location: { path: CHECKOUT, position: ":3", source: BUTTON_SPEC_SOURCE },
  message:
    'Dependencies to file of category "test" are not allowed. Denied by policy at index 2',
  policy: {
    ref: "policies[2]",
    tokens: tokenizeConfig(POLICY_TEXT),
    target: {
      kind: "config",
      range: { from: 40, to: 90, line: 3, column: 9 },
      policy: 2,
      dependency: { path: CHECKOUT, index: 2 },
    },
  },
};

const NOT_CHECKED: DependencyDetailContent = {
  verdict: { icon: "skip", tone: "faint", text: "not checked · external" },
  location: { path: CHECKOUT, position: ":4", source: "react" },
  message:
    "Not checked: the dependency is not local, and the rule checks external and core modules only with checkAllOrigins.",
  policy: undefined,
};

const ALLOWED: DependencyDetailContent = {
  ...DISALLOWED,
  verdict: { icon: "check", tone: "ok", text: "allowed · policy 1" },
  message: undefined,
};

describe("DependencyDetail", () => {
  describe("the verdict line", () => {
    it("should say what the engine decided, with the icon of the verdict", () => {
      // Arrange
      renderInRoot(<DependencyDetail detail={DISALLOWED} onOpen={jest.fn()} />);
      const detail = new DependencyDetailPom();

      // Act
      const { verdictText, verdictIcon } = detail;

      // Assert
      expect(verdictText).toBe("disallowed · policy 2");
      expect(verdictIcon.pathData).toBe(ICON_PATHS.cross);
      expect(verdictIcon.isHidden).toBe(true);
    });

    it("should draw no icon and no words while the dependency shows no verdict yet, and still say where it is", () => {
      // Arrange
      renderInRoot(
        <DependencyDetail
          detail={{
            ...NOT_CHECKED,
            verdict: { icon: undefined, tone: "faint", text: "" },
            message: undefined,
          }}
          onOpen={jest.fn()}
        />
      );
      const detail = new DependencyDetailPom();

      // Act
      const { verdictText, verdictIcon, locationText } = detail;

      // Assert
      expect(verdictText).toBe("");
      expect(verdictIcon.isRendered).toBe(false);
      expect(locationText).toBe(`${CHECKOUT}:4 → react`);
    });

    it("should keep the height of one line of its text, so that the body does not move when a verdict comes into an empty line", () => {
      // Arrange
      renderInRoot(
        <DependencyDetail
          detail={{
            ...NOT_CHECKED,
            verdict: { icon: undefined, tone: "faint", text: "" },
            message: undefined,
          }}
          onOpen={jest.fn()}
        />
      );
      const detail = new DependencyDetailPom();

      // Act
      const { verdictMinHeight } = detail;

      // Assert
      expect(verdictMinHeight).toBe("1.4em");
    });

    it.each<[DependencyDetailContent["verdict"], string, string, string]>([
      [
        DISALLOWED.verdict,
        "var(--jsb-bad)",
        "color-mix(in srgb, var(--jsb-bad) 85%, var(--jsb-ink))",
        ICON_PATHS.cross,
      ],
      [
        ALLOWED.verdict,
        "var(--jsb-ok)",
        "color-mix(in srgb, var(--jsb-ok) 85%, var(--jsb-ink))",
        ICON_PATHS.check,
      ],
      [
        { icon: "warn", tone: "warn", text: "disallowed · default" },
        "var(--jsb-warn)",
        "color-mix(in srgb, var(--jsb-warn) 85%, var(--jsb-ink))",
        ICON_PATHS.warn,
      ],
      [
        NOT_CHECKED.verdict,
        "var(--jsb-faint)",
        "var(--jsb-muted)",
        ICON_PATHS.skip,
      ],
    ])(
      "should draw %j with its icon in %s and its words in %s",
      (verdict, iconColor, textColor, path) => {
        // Arrange
        renderInRoot(
          <DependencyDetail
            detail={{ ...DISALLOWED, verdict }}
            onOpen={jest.fn()}
          />
        );
        const detail = new DependencyDetailPom();

        // Act
        const { verdictColor, verdictTextColor, verdictText, verdictIcon } =
          detail;

        // Assert
        expect(verdictColor).toBe(iconColor);
        expect(verdictTextColor).toBe(textColor);
        expect(verdictText).toBe(verdict.text);
        expect(verdictIcon.pathData).toBe(path);
      }
    );

    it("should write it in the medium mono text of 13 px", () => {
      // Arrange
      renderInRoot(<DependencyDetail detail={DISALLOWED} onOpen={jest.fn()} />);
      const detail = new DependencyDetailPom();

      // Act
      const { fontFamily, fontSize, fontWeight } = detail.verdictStyle;

      // Assert
      expect(fontFamily).toBe("var(--jsb-font-mono)");
      expect(fontSize).toBe("13px");
      expect(fontWeight).toBe("500");
    });
  });

  describe("the message", () => {
    it("should be written in the body font of 13.5 px, in the ink color", () => {
      // Arrange
      renderInRoot(<DependencyDetail detail={DISALLOWED} onOpen={jest.fn()} />);
      const detail = new DependencyDetailPom();

      // Act
      const { fontFamily, fontSize, color } = detail.messageStyle;

      // Assert
      expect(fontFamily).toBe("var(--jsb-font-body)");
      expect(fontSize).toBe("13.5px");
      expect(color).toBe("var(--jsb-ink)");
    });

    it("should say the message that it is given under the verdict line", () => {
      // Arrange
      renderInRoot(<DependencyDetail detail={DISALLOWED} onOpen={jest.fn()} />);
      const detail = new DependencyDetailPom();

      // Act
      const { message } = detail;

      // Assert
      expect(message).toBe(DISALLOWED.message);
    });

    it("should say why a dependency is not checked in the same place", () => {
      // Arrange
      renderInRoot(
        <DependencyDetail detail={NOT_CHECKED} onOpen={jest.fn()} />
      );
      const detail = new DependencyDetailPom();

      // Act
      const { message } = detail;

      // Assert
      expect(message).toBe(NOT_CHECKED.message);
    });

    it("should draw no message for a dependency that has none", () => {
      // Arrange
      renderInRoot(<DependencyDetail detail={ALLOWED} onOpen={jest.fn()} />);
      const detail = new DependencyDetailPom();

      // Act
      const { message, textParts } = detail;

      // Assert
      expect(message).toBeNull();
      expect(textParts).toEqual([
        "allowed · policy 1",
        `${CHECKOUT}:3 → ${BUTTON_SPEC_SOURCE}`,
      ]);
    });
  });

  describe("the location", () => {
    it("should say the file, the line and the source of the statement, in the words of the rows of the problem list", () => {
      // Arrange
      renderInRoot(<DependencyDetail detail={DISALLOWED} onOpen={jest.fn()} />);
      const detail = new DependencyDetailPom();

      // Act
      const { locationText } = detail;

      // Assert
      expect(locationText).toBe(`${CHECKOUT}:3 → ${BUTTON_SPEC_SOURCE}`);
    });

    it("should come under the verdict line and before the message", () => {
      // Arrange
      renderInRoot(<DependencyDetail detail={DISALLOWED} onOpen={jest.fn()} />);
      const detail = new DependencyDetailPom();

      // Act
      const { textParts } = detail;

      // Assert
      expect(textParts).toEqual([
        "disallowed · policy 2",
        `${CHECKOUT}:3 → ${BUTTON_SPEC_SOURCE}`,
        DISALLOWED.message,
      ]);
    });

    it("should say where a dependency that no policy decided is, too", () => {
      // Arrange
      renderInRoot(
        <DependencyDetail detail={NOT_CHECKED} onOpen={jest.fn()} />
      );
      const detail = new DependencyDetailPom();

      // Act
      const { locationText } = detail;

      // Assert
      expect(locationText).toBe(`${CHECKOUT}:4 → react`);
    });

    it("should draw the line apart from the file, in the muted color", () => {
      // Arrange
      renderInRoot(<DependencyDetail detail={DISALLOWED} onOpen={jest.fn()} />);
      const detail = new DependencyDetailPom();

      // Act
      const { locationPosition, locationPositionColor } = detail;

      // Assert
      expect(locationPosition).toBe(":3");
      expect(locationPositionColor).toBe("var(--jsb-muted)");
    });

    it("should write it in the mono text of 12.5 px, in the ink color, as a row of the problem list does", () => {
      // Arrange
      renderInRoot(<DependencyDetail detail={DISALLOWED} onOpen={jest.fn()} />);
      const detail = new DependencyDetailPom();

      // Act
      const { fontFamily, fontSize, fontWeight, color } = detail.locationStyle;

      // Assert
      expect(fontFamily).toBe("var(--jsb-font-mono)");
      expect(fontSize).toBe("12.5px");
      expect(fontWeight).toBe("400");
      expect(color).toBe("var(--jsb-ink)");
    });
  });

  describe("the column of the policy", () => {
    it("should say Policy, then the policy that decided the dependency, then the button, in its head", () => {
      // Arrange
      renderInRoot(<DependencyDetail detail={DISALLOWED} onOpen={jest.fn()} />);
      const detail = new DependencyDetailPom();

      // Act
      const { hasPolicyColumn, policyHeadTexts } = detail;

      // Assert
      expect(hasPolicyColumn).toBe(true);
      expect(policyHeadTexts).toEqual([
        "Policy",
        "policies[2]",
        "Open in config",
      ]);
    });

    it("should name the default when the default decided", () => {
      // Arrange
      const policy = {
        ...(DISALLOWED.policy as NonNullable<
          DependencyDetailContent["policy"]
        >),
        ref: "default",
        tokens: [{ kind: "string" as const, text: '"disallow"' }],
      };
      renderInRoot(
        <DependencyDetail
          detail={{ ...DISALLOWED, policy }}
          onOpen={jest.fn()}
        />
      );
      const detail = new DependencyDetailPom();

      // Act
      const { policyHeadTexts, policyCardText } = detail;

      // Assert
      expect(policyHeadTexts).toEqual(["Policy", "default", "Open in config"]);
      expect(policyCardText).toBe('"disallow"');
    });

    it("should write the label in the style of the label of a pane, in the muted color", () => {
      // Arrange
      renderInRoot(<DependencyDetail detail={DISALLOWED} onOpen={jest.fn()} />);
      const detail = new DependencyDetailPom();

      // Act
      const style = detail.policyLabelStyle;

      // Assert
      expect(style).toEqual({
        color: "var(--jsb-muted)",
        fontFamily: "var(--jsb-font-mono)",
        fontSize: "10.5px",
        fontWeight: "500",
        letterSpacing: "0.14em",
        textTransform: "uppercase",
      });
    });

    it("should write the policy in the medium mono text of 12 px, in the ink color", () => {
      // Arrange
      renderInRoot(<DependencyDetail detail={DISALLOWED} onOpen={jest.fn()} />);
      const detail = new DependencyDetailPom();

      // Act
      const style = detail.policyRefStyle;

      // Assert
      expect(style).toEqual({
        color: "var(--jsb-ink)",
        fontFamily: "var(--jsb-font-mono)",
        fontSize: "12px",
        fontWeight: "500",
      });
    });

    it("should be set apart from the text by a divider of 1 px, with 20 px of padding after it", () => {
      // Arrange
      renderInRoot(<DependencyDetail detail={DISALLOWED} onOpen={jest.fn()} />);
      const detail = new DependencyDetailPom();

      // Act
      const style = detail.policyColumnStyle;

      // Assert
      expect(style).toEqual({
        paddingLeft: "20px",
        borderLeftWidth: "1px",
        borderLeftStyle: "solid",
        borderLeftColor: "var(--jsb-line)",
      });
    });

    it("should sit beside the text, 20 px from it and at most 460 px wide", () => {
      // Arrange
      renderInRoot(<DependencyDetail detail={DISALLOWED} onOpen={jest.fn()} />);
      const detail = new DependencyDetailPom();

      // Act
      const { columns, gap } = detail;

      // Assert
      expect(columns).toBe("minmax(0, 1fr) minmax(0, 460px)");
      expect(gap).toBe("20px");
    });

    it("should not be drawn for a dependency that no policy decided, and then the text has the width", () => {
      // Arrange
      renderInRoot(
        <DependencyDetail detail={NOT_CHECKED} onOpen={jest.fn()} />
      );
      const detail = new DependencyDetailPom();

      // Act
      const { hasPolicyColumn, policyHeadTexts, columns } = detail;

      // Assert
      expect(hasPolicyColumn).toBe(false);
      expect(policyHeadTexts).toEqual([]);
      expect(columns).toBe("minmax(0, 1fr)");
    });
  });

  describe("open in config", () => {
    it("should be a button that does not submit a form, with an arrow", () => {
      // Arrange
      renderInRoot(<DependencyDetail detail={DISALLOWED} onOpen={jest.fn()} />);
      const detail = new DependencyDetailPom();

      // Act
      const { canOpenPolicy, openPolicyText, openPolicyType, openPolicyIcon } =
        detail;

      // Assert
      expect(canOpenPolicy).toBe(true);
      expect(openPolicyText).toBe("Open in config");
      expect(openPolicyType).toBe("button");
      expect(openPolicyIcon.pathData).toBe(ICON_PATHS.arrow);
      expect(openPolicyIcon.isHidden).toBe(true);
    });

    it("should be at the end of the head of the policy", () => {
      // Arrange
      renderInRoot(<DependencyDetail detail={DISALLOWED} onOpen={jest.fn()} />);
      const detail = new DependencyDetailPom();

      // Act
      const { policyHeadTexts, openPolicyMarginLeft } = detail;

      // Assert
      expect(policyHeadTexts.at(-1)).toBe("Open in config");
      expect(openPolicyMarginLeft).toBe("auto");
    });

    it("should draw the focus ring of the theme when the keyboard reaches it", () => {
      // Arrange
      renderInRoot(<DependencyDetail detail={DISALLOWED} onOpen={jest.fn()} />);
      const detail = new DependencyDetailPom();

      // Act
      const { openPolicyFocusStyle } = detail;

      // Assert
      expect(openPolicyFocusStyle.outline).toBe(FOCUS_RING);
    });

    it("should call onOpen with the target of the policy when it is pressed", () => {
      // Arrange
      const onOpen = jest.fn();
      renderInRoot(<DependencyDetail detail={DISALLOWED} onOpen={onOpen} />);
      const detail = new DependencyDetailPom();

      // Act
      detail.openPolicy();

      // Assert
      expect(onOpen).toHaveBeenCalledTimes(1);
      expect(onOpen).toHaveBeenCalledWith({
        kind: "config",
        range: { from: 40, to: 90, line: 3, column: 9 },
        policy: 2,
        dependency: { path: "src/modules/checkout/index.js", index: 2 },
      });
    });

    it("should not call onOpen before it is pressed", () => {
      // Arrange
      const onOpen = jest.fn();

      // Act
      renderInRoot(<DependencyDetail detail={DISALLOWED} onOpen={onOpen} />);

      // Assert
      expect(onOpen).not.toHaveBeenCalled();
    });

    it("should not be drawn for a dependency that no policy decided", () => {
      // Arrange
      renderInRoot(
        <DependencyDetail detail={NOT_CHECKED} onOpen={jest.fn()} />
      );
      const detail = new DependencyDetailPom();

      // Act
      const { canOpenPolicy, policyCardText } = detail;

      // Assert
      expect(canOpenPolicy).toBe(false);
      expect(policyCardText).toBeNull();
    });
  });

  describe("the card of the policy", () => {
    it("should hold the policy as it is written in the config, with no comment above it", () => {
      // Arrange
      renderInRoot(<DependencyDetail detail={DISALLOWED} onOpen={jest.fn()} />);
      const detail = new DependencyDetailPom();

      // Act
      const { policyCardText } = detail;

      // Assert
      expect(policyCardText).toBe(POLICY_TEXT);
    });

    it("should color the comment and the string of policy 2 as the editor does, and the rest as the code text", () => {
      // Arrange
      renderInRoot(<DependencyDetail detail={DISALLOWED} onOpen={jest.fn()} />);
      const detail = new DependencyDetailPom();

      // Act
      const colored = detail.policyPieces.filter(
        ({ color }) => color !== "var(--jsb-code-fg)"
      );

      // Assert
      expect(colored).toEqual([
        {
          text: "// No element may import a test file, whatever element it belongs to",
          color: "var(--jsb-code-comment)",
        },
        { text: '"test"', color: "var(--jsb-code-string)" },
      ]);
      expect(detail.policyPieces.map(({ text }) => text).join("")).toBe(
        POLICY_TEXT
      );
    });

    it("should give each kind of piece the color that the editor gives it", () => {
      // Arrange
      const policy = {
        ...(DISALLOWED.policy as NonNullable<
          DependencyDetailContent["policy"]
        >),
        tokens: [
          { kind: "punctuation" as const, text: "{" },
          { kind: "plain" as const, text: " " },
          { kind: "comment" as const, text: "/* why */" },
          { kind: "plain" as const, text: " " },
          { kind: "key" as const, text: "max" },
          { kind: "punctuation" as const, text: ":" },
          { kind: "plain" as const, text: " " },
          { kind: "number" as const, text: "2" },
          { kind: "punctuation" as const, text: "," },
          { kind: "plain" as const, text: " " },
          { kind: "key" as const, text: "on" },
          { kind: "punctuation" as const, text: ":" },
          { kind: "plain" as const, text: " " },
          { kind: "literal" as const, text: "true" },
          { kind: "plain" as const, text: " " },
          { kind: "punctuation" as const, text: "}" },
        ],
      };
      renderInRoot(
        <DependencyDetail
          detail={{ ...DISALLOWED, policy }}
          onOpen={jest.fn()}
        />
      );
      const detail = new DependencyDetailPom();

      // Act
      const { policyPieces } = detail;

      // Assert
      expect(policyPieces).toEqual([
        { text: "{", color: "var(--jsb-code-fg)" },
        { text: " ", color: "var(--jsb-code-fg)" },
        { text: "/* why */", color: "var(--jsb-code-comment)" },
        { text: " ", color: "var(--jsb-code-fg)" },
        { text: "max", color: "var(--jsb-code-fg)" },
        { text: ":", color: "var(--jsb-code-fg)" },
        { text: " ", color: "var(--jsb-code-fg)" },
        { text: "2", color: "var(--jsb-code-number)" },
        { text: ",", color: "var(--jsb-code-fg)" },
        { text: " ", color: "var(--jsb-code-fg)" },
        { text: "on", color: "var(--jsb-code-fg)" },
        { text: ":", color: "var(--jsb-code-fg)" },
        { text: " ", color: "var(--jsb-code-fg)" },
        { text: "true", color: "var(--jsb-code-number)" },
        { text: " ", color: "var(--jsb-code-fg)" },
        { text: "}", color: "var(--jsb-code-fg)" },
      ]);
    });

    it("should be a code area in the mono font that keeps the lines of the policy", () => {
      // Arrange
      renderInRoot(<DependencyDetail detail={DISALLOWED} onOpen={jest.fn()} />);
      const detail = new DependencyDetailPom();

      // Act
      const { backgroundColor, color, fontFamily, whiteSpace } =
        detail.policyCardStyle;

      // Assert
      expect(backgroundColor).toBe("var(--jsb-code)");
      expect(color).toBe("var(--jsb-code-fg)");
      expect(fontFamily).toBe("var(--jsb-font-mono)");
      expect(whiteSpace).toBe("pre-wrap");
    });
  });

  describe("testId", () => {
    it("should let the test id of the root be replaced, so that two bodies can be told apart", () => {
      // Arrange
      renderInRoot(
        <>
          <DependencyDetail detail={DISALLOWED} onOpen={jest.fn()} />
          <DependencyDetail
            detail={NOT_CHECKED}
            onOpen={jest.fn()}
            testId="other-detail"
          />
        </>
      );

      // Act
      const other = new DependencyDetailPom({ testId: "other-detail" });

      // Assert
      expect(other.verdictText).toBe("not checked · external");
    });
  });
});
