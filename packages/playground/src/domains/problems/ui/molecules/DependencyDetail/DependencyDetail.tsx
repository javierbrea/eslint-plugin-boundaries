import ButtonBase from "@mui/material/ButtonBase";
import { styled } from "@mui/material/styles";
import { Fragment } from "react";
import type { ReactNode } from "react";

import type { ConfigTokenKind } from "@/domains/evaluation/helpers/engine";
import type { PolicyCardContent } from "@/domains/problems/ui/helpers/dependencyDetail";
import { Icon } from "@/ui-kit/atoms/Icon";
import { STATE_TEXT, TONE_COLORS } from "@/ui-kit/helpers/tone";
import type { StateTone } from "@/ui-kit/helpers/tone";

import { DEPENDENCY_DETAIL_TEST_ID } from "./DependencyDetail.constants";
import type { DependencyDetailProps } from "./DependencyDetail.types";

// The text and the card side by side, the card no wider than 420 px, as the mockup lays them out; the panel has 6 px of padding above, so this adds the rest of the 10 px
const Root = styled("div")({
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) minmax(0, 420px)",
  gap: 20,
  padding: "4px 16px 0",
});

const VerdictLine = styled("div", {
  shouldForwardProp: (prop) => prop !== "tone",
})<{ tone: StateTone }>(({ theme, tone }) => ({
  display: "flex",
  alignItems: "center",
  gap: 8,
  ...theme.typography.monoLarge,
  fontWeight: theme.typography.fontWeightMedium,
  lineHeight: 1.4,
  // The icon is a shape and keeps the token
  color: TONE_COLORS[tone],
}));

// The text mixes the ink into the token, for contrast
const VerdictText = styled("span", {
  shouldForwardProp: (prop) => prop !== "tone",
})<{ tone: StateTone }>(({ tone }) => ({
  color: STATE_TEXT[tone],
}));

const Message = styled("p")(({ theme }) => ({
  margin: "6px 0 8px",
  color: "var(--jsb-ink)",
  ...theme.typography.bodyLarge,
}));

const Facts = styled("div")(({ theme }) => ({
  display: "flex",
  flexWrap: "wrap",
  gap: "2px 14px",
  color: "var(--jsb-muted)",
  ...theme.typography.monoSmall,
  lineHeight: 1.6,
  // A path or a module name without spaces would stretch the row instead of wrapping
  overflowWrap: "anywhere",
}));

const FactValue = styled("b", {
  shouldForwardProp: (prop) => prop !== "isNull",
})<{ isNull: boolean }>(({ theme, isNull }) => ({
  fontWeight: theme.typography.fontWeightMedium,
  color: isNull ? "var(--jsb-faint)" : "var(--jsb-ink)",
}));

const OpenPolicy = styled(ButtonBase)(({ theme }) => ({
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
  marginTop: 10,
  color: "var(--jsb-accent)",
  ...theme.typography.button,
  lineHeight: 1,
}));

const PolicyCard = styled("pre")(({ theme }) => ({
  alignSelf: "start",
  margin: 0,
  padding: "10px 12px",
  borderRadius: "var(--jsb-radius)",
  backgroundColor: "var(--jsb-code)",
  color: "var(--jsb-code-fg)",
  ...theme.typography.monoSmall,
  lineHeight: 1.6,
  whiteSpace: "pre-wrap",
  overflow: "auto",
}));

const Heading = styled("span")({ color: "var(--jsb-code-comment)" });

const Piece = styled("span", {
  shouldForwardProp: (prop) => prop !== "color",
})<{ color: string }>(({ color }) => ({ color }));

/** The color of each kind of piece of the policy that has one of its own in a code area, as the config editor gives it: a literal is colored as a number. Keys, punctuation and plain text keep the color of the card, `--jsb-code-fg`, which is the editor's too. */
const PIECE_COLORS: Readonly<Partial<Record<ConfigTokenKind, string>>> = {
  string: "var(--jsb-code-string)",
  number: "var(--jsb-code-number)",
  literal: "var(--jsb-code-number)",
  comment: "var(--jsb-code-comment)",
};

/**
 * Draws the policy as written in the config, with its pieces colored as the editor colors them.
 * @param tokens The pieces of the text of the policy.
 * @returns A colored element for each piece that has a color of its own, and the bare text for the others, which inherits the color of the card.
 */
function renderPolicy(tokens: PolicyCardContent["tokens"]): ReactNode {
  return tokens.map(({ kind, text }, index) => {
    const color = PIECE_COLORS[kind];

    return (
      // The pieces never reorder: they are made again from the text of the policy
      <Fragment key={index}>
        {color === undefined ? text : <Piece color={color}>{text}</Piece>}
      </Fragment>
    );
  });
}

/**
 * The body of the tab of a dependency: what the engine says about it, with the message of the plugin or why it is not checked, the facts that decide it, the button that opens the policy that decided it in the config, and a card with that policy as it is written there, colored as the config editor colors it.
 * @param props DependencyDetail props.
 * @param props.detail What the body draws.
 * @param props.onOpen Called with the target of the button, which opens the policy in the config.
 * @param props.testId The test id of the root element, in place of the default one.
 * @returns The body of the tab.
 */
export function DependencyDetail({
  detail,
  onOpen,
  testId = DEPENDENCY_DETAIL_TEST_ID,
}: Readonly<DependencyDetailProps>): ReactNode {
  const { verdict, message, facts, policy } = detail;

  return (
    <Root data-testid={testId}>
      <div>
        <VerdictLine tone={verdict.tone}>
          <Icon name={verdict.icon} />
          <VerdictText tone={verdict.tone}>{verdict.text}</VerdictText>
        </VerdictLine>
        {message === undefined ? null : <Message>{message}</Message>}
        <Facts>
          {facts.map(({ label, value }) => (
            <span key={label}>
              {label}{" "}
              <FactValue isNull={value === null}>{value ?? "null"}</FactValue>
            </span>
          ))}
        </Facts>
        {policy === undefined ? null : (
          <OpenPolicy type="button" onClick={() => onOpen(policy.target)}>
            Open policy in config
            <Icon name="arrow" />
          </OpenPolicy>
        )}
      </div>
      {policy === undefined ? null : (
        <PolicyCard>
          <Heading>{policy.heading}</Heading>
          {"\n"}
          {renderPolicy(policy.tokens)}
        </PolicyCard>
      )}
    </Root>
  );
}
