import { styled } from "@mui/material/styles";
import type { ReactNode } from "react";

import { Icon } from "@/ui-kit/atoms/Icon";
import { STATE_TEXT, TONE_COLORS } from "@/ui-kit/helpers/tone";
import type { StateTone } from "@/ui-kit/helpers/tone";

import type { VerdictCountProps } from "./VerdictCount.types";

const Root = styled("span")<{ tone: StateTone }>(({ tone }) => ({
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
  // The icon is a shape and keeps the token
  color: TONE_COLORS[tone],
}));

const Label = styled("span")<{ tone: StateTone }>(({ tone }) => ({
  color: STATE_TEXT[tone],
}));

/**
 * How many dependencies have a verdict, with its icon, in the color of the verdict: `✓ 2`, `✕ 1` or `– 4 not checked`. The text says what is counted when it can, as `4 not checked` does, and then the icon is decoration. A count that is a bare number, such as `2`, names its verdict through the label of the icon, so that assistive technology reads `allowed 2` and not just `2`.
 * @param props VerdictCount props.
 * @param props.tone How the count is colored.
 * @param props.icon The icon of the verdict.
 * @param props.iconLabel What the icon says to assistive technology. Without it, the icon is hidden.
 * @param props.children What the count says.
 * @returns The count.
 */
export function VerdictCount({
  tone,
  icon,
  iconLabel,
  children,
}: Readonly<VerdictCountProps>): ReactNode {
  return (
    <Root tone={tone}>
      <Icon name={icon} label={iconLabel} />
      <Label tone={tone}>{children}</Label>
    </Root>
  );
}
