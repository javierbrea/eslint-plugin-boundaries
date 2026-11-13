import type { Tone } from "@/ui-kit/helpers/tone";

/** Props of {@link CountBadge}. */
export type CountBadgeProps = {
  /** The number to show. */
  count: number;
  /** The color of the badge. */
  tone: Tone;
  /** What the number counts, such as `3 unread messages`: assistive technology reads it instead of the bare number. */
  label: string;
  /** The id of the badge, for an element that adds what the number counts to its own name with `aria-labelledby`. */
  id?: string;
};
