import { styled } from "@mui/material/styles";
import type { ReactNode } from "react";

import { TONE_COLORS } from "@/ui-kit/helpers/tone";
import type { Tone } from "@/ui-kit/helpers/tone";

import { COUNT_BADGE_TEXT_COLORS } from "./CountBadge.constants";
import type { CountBadgeProps } from "./CountBadge.types";

/** How much of the color of each tone the background of the badge takes. */
const BACKGROUND_SHARES: Readonly<Record<Tone, string>> = {
  bad: "14%",
  warn: "16%",
};

const Badge = styled("span", {
  shouldForwardProp: (prop) => prop !== "tone",
})<{ tone: Tone }>(({ theme, tone }) => ({
  color: COUNT_BADGE_TEXT_COLORS[tone],
  backgroundColor: `color-mix(in srgb, ${TONE_COLORS[tone]} ${BACKGROUND_SHARES[tone]}, transparent)`,
  display: "inline-grid",
  placeItems: "center",
  boxSizing: "border-box",
  minWidth: 18,
  height: 18,
  padding: "0 5px",
  borderRadius: 9,
  ...theme.typography.monoTiny,
}));

/**
 * A count in an 18 px pill, next to a tab or a label.
 * @param props CountBadge props.
 * @param props.count The number to show.
 * @param props.tone The color of the badge: `bad` for what fails, `warn` for what is worth a look.
 * @param props.label What the number counts, such as `3 unread messages`.
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
