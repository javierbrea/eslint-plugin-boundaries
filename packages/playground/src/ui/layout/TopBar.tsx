import { styled } from "@mui/material/styles";
import type { ReactNode } from "react";

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

const Status = styled("div")({
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  marginLeft: 6,
  color: "var(--jsb-muted)",
  font: "12px var(--jsb-font-mono)",
});

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
 * Pluralizes a noun for a count.
 * @param count The count.
 * @param noun The noun in the singular.
 * @returns The count and the noun, such as `1 file` or `6 files`.
 */
function countOf(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? "" : "s"}`;
}

/**
 * The top bar: the status of the sketch, with how many files it has and how many problems, or that the config has errors. The dependencies count is for the next milestone, and the example picker, help, reset and share for the one after.
 * @param props TopBar props.
 * @param props.files How many files the sketch has.
 * @param props.problems How many problems it has.
 * @param props.tone The color of the number of problems.
 * @param props.configHasErrors Whether the config has errors.
 * @returns The bar.
 */
export function TopBar({
  files,
  problems,
  tone,
  configHasErrors,
}: Readonly<TopBarProps>): ReactNode {
  return (
    <Bar>
      <Status>
        <Dot failing={configHasErrors} aria-hidden="true" />
        <span>
          {countOf(files, "file")} ·{" "}
          {configHasErrors ? (
            <Count color="var(--jsb-bad)">config has errors</Count>
          ) : (
            <Count color={problems > 0 ? `var(--jsb-${tone})` : undefined}>
              {countOf(problems, "problem")}
            </Count>
          )}
        </span>
      </Status>
    </Bar>
  );
}
