import { styled } from "@mui/material/styles";
import type { ReactNode } from "react";

import type { VerdictTone } from "@/domains/evaluation/ui/helpers/verdictText";
import { Icon } from "@/ui-kit/atoms/Icon";
import { STATE_TEXT } from "@/ui-kit/helpers/theme";

import type { VerdictCountProps } from "./VerdictCount.types";

/** The color of the icon of each verdict outside a code area, from the tokens of the host. The text has its own, which mixes in the ink for contrast. */
const ICON_COLORS: Readonly<Record<VerdictTone, string>> = {
  ok: "var(--jsb-ok)",
  bad: "var(--jsb-bad)",
  warn: "var(--jsb-warn)",
  faint: "var(--jsb-faint)",
};

const Root = styled("span")<{ tone: VerdictTone }>(({ tone }) => ({
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
  // The icon is a shape and keeps the token
  color: ICON_COLORS[tone],
}));

const Label = styled("span")<{ tone: VerdictTone }>(({ tone }) => ({
  color: STATE_TEXT[tone],
}));

/**
 * How many dependencies have a verdict, with its icon, in the color of the verdict: `✓ 2`, `✕ 1` or `– 4 not checked`. The icon is decoration, and the text says what is counted.
 * @param props VerdictCount props.
 * @param props.tone How the count is colored.
 * @param props.icon The icon of the verdict.
 * @param props.children What the count says.
 * @returns The count.
 */
export function VerdictCount({
  tone,
  icon,
  children,
}: Readonly<VerdictCountProps>): ReactNode {
  return (
    <Root tone={tone}>
      <Icon name={icon} />
      <Label tone={tone}>{children}</Label>
    </Root>
  );
}
