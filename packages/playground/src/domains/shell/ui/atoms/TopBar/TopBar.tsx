import { styled } from "@mui/material/styles";
import type { ReactNode } from "react";

import { formatCount } from "@/shared/helpers/formatCount";
import { TONE_COLORS } from "@/ui-kit/helpers/tone";

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
});

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
 * The top bar: the status of the sketch, with how many files it has and how many problems, or that the config has errors. The dependencies count is for the next milestone, and the example picker, help, reset and share for the one after.
 * @param props TopBar props.
 * @param props.files How many files the sketch has.
 * @param props.problems How many problems it has.
 * @param props.tone The color of the number of problems.
 * @param props.configHasErrors Whether the config has errors.
 * @param props.testId The test id of the root element, when the component that is the bar has one.
 * @returns The bar.
 */
export function TopBar({
  files,
  problems,
  tone,
  configHasErrors,
  testId,
}: Readonly<TopBarProps>): ReactNode {
  return (
    <Bar data-testid={testId}>
      <Status>
        <Dot failing={configHasErrors} aria-hidden="true" />
        <span>
          {formatCount(files, "file", "files")} ·{" "}
          {configHasErrors ? (
            <Count color={TONE_COLORS.bad}>config has errors</Count>
          ) : (
            <Count color={problems > 0 ? TONE_COLORS[tone] : undefined}>
              {formatCount(problems, "problem", "problems")}
            </Count>
          )}
        </span>
      </Status>
    </Bar>
  );
}
