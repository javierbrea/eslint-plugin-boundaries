import ButtonBase from "@mui/material/ButtonBase";
import { styled } from "@mui/material/styles";
import type { ReactNode } from "react";

import type { VerdictTone } from "@/domains/evaluation/ui/helpers/verdictText";
import { VERDICT_COLORS } from "@/domains/problems/ui/helpers/verdictColors";
import { Icon } from "@/ui-kit/atoms/Icon";

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
})<{ tone: VerdictTone }>(({ theme, tone }) => ({
  display: "flex",
  alignItems: "center",
  gap: 8,
  ...theme.typography.mono,
  fontWeight: theme.typography.fontWeightMedium,
  lineHeight: 1.4,
  color: VERDICT_COLORS[tone],
}));

const Message = styled("p")(({ theme }) => ({
  margin: "6px 0 8px",
  color: "var(--jsb-ink)",
  ...theme.typography.body1,
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

/**
 * The body of the tab of a dependency: what the engine says about it, with the message of the plugin or why it is not checked, the facts that decide it, the button that opens the policy that decided it in the config, and a card with that policy as it is written there.
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
          {verdict.text}
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
          {`\n${policy.text}`}
        </PolicyCard>
      )}
    </Root>
  );
}
