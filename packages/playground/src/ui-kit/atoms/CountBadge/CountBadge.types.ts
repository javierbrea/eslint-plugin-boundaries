import type { Tone } from "@/ui-kit/helpers/tone";

/** Props of {@link CountBadge}. */
export type CountBadgeProps = {
  /** The number to show. */
  count: number;
  /** The color of the badge. */
  tone: Tone;
  /** What the number counts, such as `2 problems`: assistive technology reads it instead of the bare number. */
  label: string;
};
