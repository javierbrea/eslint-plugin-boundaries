import { styled } from "@mui/material/styles";
import type { ReactNode } from "react";

import { formatCount } from "@/shared/helpers/formatCount";
import { STATE_TEXT } from "@/ui-kit/helpers/tone";

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
  shouldForwardProp: (prop) => prop !== "failing",
})<{ failing: boolean }>(({ failing }) => ({
  flex: "none",
  width: 6,
  height: 6,
  borderRadius: "50%",
  backgroundColor: failing ? "var(--jsb-bad)" : "var(--jsb-ok)",
}));

const Count = styled("span", {
  shouldForwardProp: (prop) => prop !== "color",
})<{ color?: string }>(({ color }) => ({ color }));

/**
 * The top bar: the status of the sketch, with how many files and dependencies it has and how many problems, or that the config has errors. It places what the caller gives it around the status: something before it, such as the picker of examples, and something at the other end, such as the actions, after a spacer that pushes them to the end.
 * @param props TopBar props.
 * @param props.files How many files the sketch has.
 * @param props.dependencies How many dependencies the sketch has.
 * @param props.problems How many problems it has.
 * @param props.tone The color of the number of problems.
 * @param props.configHasErrors Whether the config has errors.
 * @param props.start What goes before the status.
 * @param props.end What goes at the end of the bar.
 * @param props.testId The test id of the root element, in place of the default one.
 * @returns The bar.
 */
export function TopBar({
  files,
  dependencies,
  problems,
  tone,
  configHasErrors,
  start,
  end,
  testId = TOP_BAR_TEST_ID,
}: Readonly<TopBarProps>): ReactNode {
  return (
    <Bar data-testid={testId}>
      {start}
      <Status>
        <Dot failing={configHasErrors} aria-hidden="true" />
        <span>
          {formatCount(files, "file", "files")} ·{" "}
          {formatCount(dependencies, "dependency", "dependencies")} ·{" "}
          {configHasErrors ? (
            <Count color={STATE_TEXT.bad}>config has errors</Count>
          ) : (
            <Count color={problems > 0 ? STATE_TEXT[tone] : undefined}>
              {formatCount(problems, "problem", "problems")}
            </Count>
          )}
        </span>
      </Status>
      <Spacer />
      {end}
    </Bar>
  );
}
