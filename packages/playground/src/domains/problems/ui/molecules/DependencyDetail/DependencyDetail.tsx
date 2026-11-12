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

// The text and the policy side by side, the policy no wider than 460 px; with no policy there is only the text, which takes the width. The panel has 6 px of padding above, so this adds the rest of the 10 px
const Root = styled("div", {
  shouldForwardProp: (prop) => prop !== "hasPolicy",
})<{ hasPolicy: boolean }>(({ hasPolicy }) => ({
  display: "grid",
  gridTemplateColumns: hasPolicy
    ? "minmax(0, 1fr) minmax(0, 460px)"
    : "minmax(0, 1fr)",
  gap: 20,
  padding: "4px 16px 0",
}));

const VerdictLine = styled("div", {
  shouldForwardProp: (prop) => prop !== "tone",
})<{ tone: StateTone }>(({ theme, tone }) => ({
  display: "flex",
  alignItems: "center",
  gap: 8,
  ...theme.typography.monoLarge,
  fontWeight: theme.typography.fontWeightMedium,
  lineHeight: 1.4,
  // One line even while the verdict shows nothing yet, so that what comes under it does not move when the verdict arrives
  minHeight: "1.4em",
  // The icon is a shape and keeps the token
  color: TONE_COLORS[tone],
}));

// The text mixes the ink into the token, for contrast
const VerdictText = styled("span", {
  shouldForwardProp: (prop) => prop !== "tone",
})<{ tone: StateTone }>(({ tone }) => ({
  color: STATE_TEXT[tone],
}));

// The location of the dependency in the words and in the text of the rows of the problem list, with the line apart in the muted color
const Where = styled("div")(({ theme }) => ({
  marginTop: 6,
  color: "var(--jsb-ink)",
  ...theme.typography.mono,
  lineHeight: 1.5,
  // A path or a source without spaces would stretch the column instead of wrapping
  overflowWrap: "anywhere",
}));

const Position = styled("span")({ color: "var(--jsb-muted)" });

const Message = styled("p")(({ theme }) => ({
  margin: "4px 0 0",
  color: "var(--jsb-ink)",
  ...theme.typography.bodyLarge,
}));

// The divider is the border of the column, which the grid stretches to the height of the text
const PolicyColumn = styled("div")({
  display: "grid",
  alignContent: "start",
  gap: 8,
  minWidth: 0,
  paddingLeft: 20,
  borderLeftWidth: "1px",
  borderLeftStyle: "solid",
  borderLeftColor: "var(--jsb-line)",
});

const PolicyHead = styled("div")({
  display: "flex",
  alignItems: "center",
  gap: 10,
  minHeight: 20,
});

const PolicyLabel = styled("span")(({ theme }) => ({
  color: "var(--jsb-muted)",
  ...theme.typography.paneLabel,
}));

const PolicyRef = styled("span")(({ theme }) => ({
  color: "var(--jsb-ink)",
  ...theme.typography.monoSmall,
  fontWeight: theme.typography.fontWeightMedium,
  lineHeight: 1,
}));

// The head is a flex row, so the automatic margin takes the button to its end
const OpenPolicy = styled(ButtonBase)(({ theme }) => ({
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
  marginLeft: "auto",
  color: "var(--jsb-accent)",
  ...theme.typography.button,
  lineHeight: 1,
}));

const PolicyCard = styled("pre")(({ theme }) => ({
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
 * The body of the tab of a dependency, in two columns. The first says what the engine decided, where the dependency is, as the row of its problem says it, and the message of the plugin or why it is not checked. The second, which only a dependency that a policy decided has, names that policy, has the button that opens it in the config and shows it as it is written there, colored as the config editor colors it.
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
  const { verdict, message, policy } = detail;

  return (
    <Root data-testid={testId} hasPolicy={policy !== undefined}>
      <div>
        <VerdictLine tone={verdict.tone}>
          {verdict.icon === undefined ? null : <Icon name={verdict.icon} />}
          <VerdictText tone={verdict.tone}>{verdict.text}</VerdictText>
        </VerdictLine>
        <Where>
          {detail.location.path}
          <Position>{detail.location.position}</Position>
          {` → ${detail.location.source}`}
        </Where>
        {message === undefined ? null : <Message>{message}</Message>}
      </div>
      {policy === undefined ? null : (
        <PolicyColumn>
          <PolicyHead>
            <PolicyLabel>Policy</PolicyLabel>
            <PolicyRef>{policy.ref}</PolicyRef>
            <OpenPolicy type="button" onClick={() => onOpen(policy.target)}>
              Open in config
              <Icon name="arrow" />
            </OpenPolicy>
          </PolicyHead>
          <PolicyCard>{renderPolicy(policy.tokens)}</PolicyCard>
        </PolicyColumn>
      )}
    </Root>
  );
}
