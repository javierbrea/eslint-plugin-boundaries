import { styled } from "@mui/material/styles";
import type { ReactNode } from "react";

import { TONE_COLORS } from "./Tone";
import type { Tone } from "./Tone.types";

/** How much of the color of each tone the background of the badge takes. */
const BACKGROUND_SHARES: Readonly<Record<Tone, string>> = {
  bad: "14%",
  warn: "16%",
};

const Badge = styled("span", {
  shouldForwardProp: (prop) => prop !== "tone",
})<{ tone: Tone }>(({ tone }) => ({
  color: TONE_COLORS[tone],
  backgroundColor: `color-mix(in srgb, ${TONE_COLORS[tone]} ${BACKGROUND_SHARES[tone]}, transparent)`,
  display: "inline-grid",
  placeItems: "center",
  boxSizing: "border-box",
  minWidth: 18,
  height: 18,
  padding: "0 5px",
  borderRadius: 9,
  fontFamily: "var(--jsb-font-mono)",
  fontSize: 11,
  fontWeight: 500,
  lineHeight: 1,
}));

/** Props of {@link CountBadge}. */
type CountBadgeProps = {
  /** The number to show. */
  count: number;
  /** The color of the badge. */
  tone: Tone;
  /** What the number counts, such as `2 problems`: assistive technology reads it instead of the bare number. */
  label: string;
};

/**
 * A count in an 18 px pill, next to a tab or a node of the tree.
 * @param props CountBadge props.
 * @param props.count The number to show.
 * @param props.tone The color of the badge: `bad` for problems, `warn` for warnings.
 * @param props.label What the number counts, such as `2 problems`.
 * @returns The badge.
 */
export function CountBadge({
  count,
  tone,
  label,
}: Readonly<CountBadgeProps>): ReactNode {
  return (
    <Badge tone={tone} role="img" aria-label={label}>
      {count}
    </Badge>
  );
}
