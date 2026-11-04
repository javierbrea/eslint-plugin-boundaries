import { styled } from "@mui/material/styles";
import type { ReactNode } from "react";

/** What a count is about: something that fails, or something to look at. */
type CountTone = "bad" | "warn";

/** Text color and background of each tone. */
const TONES: Readonly<
  Record<CountTone, { color: string; backgroundColor: string }>
> = {
  bad: {
    color: "var(--jsb-bad)",
    backgroundColor: "color-mix(in srgb, var(--jsb-bad) 14%, transparent)",
  },
  warn: {
    color: "var(--jsb-warn)",
    backgroundColor: "color-mix(in srgb, var(--jsb-warn) 16%, transparent)",
  },
};

const Badge = styled("span", {
  shouldForwardProp: (prop) => prop !== "tone",
})<{ tone: CountTone }>(({ tone }) => ({
  ...TONES[tone],
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
  tone: CountTone;
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
