import { tokenizeConfig } from "@/domains/evaluation/helpers/engine";
import type { DependencyDetailContent } from "@/domains/problems/ui/helpers/dependencyDetail";
import { renderInRoot } from "@/shared/testing/renderInRoot";
import { ICON_PATHS } from "@/ui-kit/atoms/Icon/Icon.constants";

import { DependencyDetail } from "./DependencyDetail";
import { DependencyDetailPom } from "./DependencyDetail.pom";

const POLICY_TEXT = `{
  // No element may import a test file, whatever element it belongs to
  disallow: { to: { file: { categories: "test" } } },
}`;

const DISALLOWED: DependencyDetailContent = {
  verdict: { icon: "cross", tone: "bad", text: "disallowed · policy 2" },
  message:
    'Dependencies to file of category "test" are not allowed. Denied by policy at index 2',
  facts: [
    { label: "to", value: "src/components/atoms/Button/Button.spec.js" },
    { label: "element", value: "component" },
    { label: "file", value: "test" },
    { label: "kind", value: "value" },
    { label: "syntax", value: "import" },
  ],
  policy: {
    heading: "// policies[2]",
    tokens: tokenizeConfig(POLICY_TEXT),
    target: {
      kind: "config",
      range: { from: 40, to: 90, line: 3, column: 9 },
      policy: 2,
      dependency: { path: "src/modules/checkout/index.js", index: 2 },
    },
  },
};

const NOT_CHECKED: DependencyDetailContent = {
  verdict: { icon: "skip", tone: "faint", text: "not checked · external" },
  message:
    "Not checked: the dependency is not local, and the rule checks external and core modules only with checkAllOrigins.",
  facts: [
    { label: "to", value: "react" },
    { label: "element", value: null },
    { label: "file", value: null },
    { label: "kind", value: "value" },
    { label: "syntax", value: "import" },
  ],
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
      const { message, facts } = detail;

      // Assert
      expect(message).toBe(NOT_CHECKED.message);
      expect(facts[0]).toBe("to react");
    });

    it("should draw no message for a dependency that has none", () => {
      // Arrange
      renderInRoot(<DependencyDetail detail={ALLOWED} onOpen={jest.fn()} />);
      const detail = new DependencyDetailPom();

      // Act
      const { message, facts } = detail;

      // Assert
      expect(message).toBeNull();
      expect(facts).toHaveLength(5);
    });
  });

  describe("the facts", () => {
    it("should list each label followed by its value, in order", () => {
      // Arrange
      renderInRoot(<DependencyDetail detail={DISALLOWED} onOpen={jest.fn()} />);
      const detail = new DependencyDetailPom();

      // Act
      const { facts } = detail;

      // Assert
      expect(facts).toEqual([
        "to src/components/atoms/Button/Button.spec.js",
        "element component",
        "file test",
        "kind value",
        "syntax import",
      ]);
    });

    it("should draw a value that there is not as null", () => {
      // Arrange
      renderInRoot(
        <DependencyDetail detail={NOT_CHECKED} onOpen={jest.fn()} />
      );
      const detail = new DependencyDetailPom();

      // Act
      const { facts } = detail;

      // Assert
      expect(facts[1]).toBe("element null");
      expect(facts[2]).toBe("file null");
    });

    it("should draw the values in the ink color, and null in the faint one", () => {
      // Arrange
      renderInRoot(
        <DependencyDetail detail={NOT_CHECKED} onOpen={jest.fn()} />
      );
      const detail = new DependencyDetailPom();

      // Act
      const value = detail.factValueColor("to");
      const missing = detail.factValueColor("element");

      // Assert
      expect(value).toBe("var(--jsb-ink)");
      expect(missing).toBe("var(--jsb-faint)");
    });

    it("should draw them in the small mono text, in the muted color", () => {
      // Arrange
      renderInRoot(<DependencyDetail detail={DISALLOWED} onOpen={jest.fn()} />);
      const detail = new DependencyDetailPom();

      // Act
      const { fontFamily, fontSize, color } = detail.factsStyle;

      // Assert
      expect(fontFamily).toBe("var(--jsb-font-mono)");
      expect(fontSize).toBe("12px");
      expect(color).toBe("var(--jsb-muted)");
    });
  });

  describe("open policy in config", () => {
    it("should be a button that does not submit a form, with an arrow", () => {
      // Arrange
      renderInRoot(<DependencyDetail detail={DISALLOWED} onOpen={jest.fn()} />);
      const detail = new DependencyDetailPom();

      // Act
      const { canOpenPolicy, openPolicyText, openPolicyType } = detail;

      // Assert
      expect(canOpenPolicy).toBe(true);
      expect(openPolicyText).toBe("Open policy in config");
      expect(openPolicyType).toBe("button");
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
    it("should say its heading as a comment, and the policy under it", () => {
      // Arrange
      renderInRoot(<DependencyDetail detail={DISALLOWED} onOpen={jest.fn()} />);
      const detail = new DependencyDetailPom();

      // Act
      const { policyCardText } = detail;

      // Assert
      expect(policyCardText).toBe(`// policies[2]\n${POLICY_TEXT}`);
    });

    it("should draw the heading in the color of a comment of the code", () => {
      // Arrange
      renderInRoot(<DependencyDetail detail={DISALLOWED} onOpen={jest.fn()} />);
      const detail = new DependencyDetailPom();

      // Act
      const { policyHeadingColor } = detail;

      // Assert
      expect(policyHeadingColor).toBe("var(--jsb-code-comment)");
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

    it("should sit beside the text and be at most 420 px wide", () => {
      // Arrange
      renderInRoot(<DependencyDetail detail={DISALLOWED} onOpen={jest.fn()} />);
      const detail = new DependencyDetailPom();

      // Act
      const { columns } = detail;

      // Assert
      expect(columns).toBe("minmax(0, 1fr) minmax(0, 420px)");
    });

    it("should head the default as a comment too", () => {
      // Arrange
      const policy = {
        ...(DISALLOWED.policy as NonNullable<
          DependencyDetailContent["policy"]
        >),
        heading: "// default",
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
      const { policyCardText } = detail;

      // Assert
      expect(policyCardText).toBe('// default\n"disallow"');
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
