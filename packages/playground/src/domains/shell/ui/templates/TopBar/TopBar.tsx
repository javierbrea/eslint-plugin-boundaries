import { styled } from "@mui/material/styles";
import type { ReactNode } from "react";

import { formatCount } from "@/shared/helpers/formatCount";
import { STATE_TEXT, TONE_COLORS } from "@/ui-kit/helpers/tone";
import type { StateTone } from "@/ui-kit/helpers/tone";

import { TOP_BAR_TEST_ID } from "./TopBar.constants";
import type { TopBarProps } from "./TopBar.types";

/** Height of the bar in pixels, border included. */
const BAR_HEIGHT = 44;

const Bar = styled("div")({
  display: "flex",
  alignItems: "center",
  gap: 10,
  boxSizing: "border-box",
  height: BAR_HEIGHT,
  padding: "0 10px 0 12px",
  borderBottom: "1px solid var(--jsb-line)",
  // What the bar holds keeps its size, so that a message that does not fit is the only item that gives way (see the message of the share)
  "& > *": { flexShrink: 0 },
});

const Spacer = styled("span")({ flex: 1 });

const Status = styled("div")(({ theme }) => ({
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  marginLeft: 6,
  color: "var(--jsb-muted)",
  ...theme.typography.monoSmall,
  lineHeight: "normal",
}));

const Dot = styled("span", {
  shouldForwardProp: (prop) => prop !== "tone",
})<{ tone: StateTone }>(({ tone }) => ({
  flex: "none",
  width: 6,
  height: 6,
  borderRadius: "50%",
  backgroundColor: TONE_COLORS[tone],
}));

const Count = styled("span", {
  shouldForwardProp: (prop) => prop !== "color",
})<{ color?: string }>(({ color }) => ({ color }));

// Read by screen readers and never drawn: the text on screen is the one beside it
const Announcement = styled("span")({
  position: "absolute",
  width: 1,
  height: 1,
  margin: -1,
  padding: 0,
  border: 0,
  overflow: "hidden",
  clipPath: "inset(50%)",
  whiteSpace: "nowrap",
});

/** What the status says after the numbers of the sketch, with the tone of its text and of the dot. */
type StatusEnd = {
  readonly text: string | undefined;
  /** The color of the text, or `undefined` for the muted color of the status. */
  readonly textTone: StateTone | undefined;
  readonly dotTone: StateTone;
  /** Whether a screen reader is told the text when the status starts saying it. */
  readonly announce: boolean;
};

/**
 * Picks what the status says after the numbers of the sketch.
 * @param props TopBar props.
 * @param props.problems How many problems the sketch has, or `undefined` before they are known.
 * @param props.tone The color of the number of problems.
 * @param props.configHasErrors Whether the config has errors.
 * @param props.evaluation What the status says about the evaluation, in place of the problems.
 * @returns What the caller says about the evaluation, that the config has errors, the number of problems, or nothing before the problems are known, with the tones of the text and of the dot.
 */
function getStatusEnd({
  problems,
  tone,
  configHasErrors,
  evaluation,
}: Readonly<TopBarProps>): StatusEnd {
  if (evaluation !== undefined) {
    return {
      text: evaluation.text,
      textTone: evaluation.tone,
      dotTone: evaluation.tone,
      announce: evaluation.announce,
    };
  }
  if (configHasErrors) {
    return {
      text: "config has errors",
      textTone: "bad",
      dotTone: "bad",
      announce: false,
    };
  }
  if (problems === undefined) {
    return {
      text: undefined,
      textTone: undefined,
      dotTone: "faint",
      announce: false,
    };
  }
  return {
    text: formatCount(problems, "problem", "problems"),
    textTone: problems > 0 ? tone : undefined,
    dotTone: "ok",
    announce: false,
  };
}

/**
 * The top bar: the status of the sketch, with how many files and dependencies it has and how many problems, that the config has errors, or what the caller says about the evaluation, which a polite live region announces when the caller asks. It places what the caller gives it around the status: something before it, such as the picker of examples, and something at the other end, such as the actions, after a spacer that pushes them to the end.
 * @param props TopBar props.
 * @param props.files How many files the sketch has.
 * @param props.dependencies How many dependencies the sketch has.
 * @param props.problems How many problems it has, or `undefined` before they are known.
 * @param props.tone The color of the number of problems.
 * @param props.configHasErrors Whether the config has errors.
 * @param props.evaluation What the status says about the evaluation, in place of the problems.
 * @param props.start What goes before the status.
 * @param props.end What goes at the end of the bar.
 * @param props.testId The test id of the root element, in place of the default one.
 * @returns The bar.
 */
export function TopBar(props: Readonly<TopBarProps>): ReactNode {
  const { files, dependencies, start, end, testId = TOP_BAR_TEST_ID } = props;
  const { text, textTone, dotTone, announce } = getStatusEnd(props);

  return (
    <Bar data-testid={testId}>
      {start}
      <Status>
        <Dot tone={dotTone} aria-hidden="true" />
        <span>
          {formatCount(files, "file", "files")} ·{" "}
          {formatCount(dependencies, "dependency", "dependencies")}
          {text !== undefined && (
            <>
              {" · "}
              <Count
                color={
                  textTone === undefined ? undefined : STATE_TEXT[textTone]
                }
                // The announcement says it right after, so a screen reader reads it once
                aria-hidden={announce ? "true" : undefined}
              >
                {text}
              </Count>
            </>
          )}
        </span>
        {/* A polite live region that is always there, so that screen readers pick up the text that comes into it */}
        <Announcement role="status">{announce ? text : null}</Announcement>
      </Status>
      <Spacer />
      {end}
    </Bar>
  );
}
