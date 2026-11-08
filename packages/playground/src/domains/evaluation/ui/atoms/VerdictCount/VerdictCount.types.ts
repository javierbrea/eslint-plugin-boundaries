import type { ReactNode } from "react";

import type { VerdictIcon } from "@/domains/evaluation/ui/helpers/verdictText";
import type { StateTone } from "@/ui-kit/helpers/tone";

/** Props of {@link VerdictCount}. */
export type VerdictCountProps = {
  /** How the count is colored: the verdict it counts. */
  readonly tone: StateTone;
  /** The icon of that verdict, drawn before the count. */
  readonly icon: VerdictIcon;
  /** What the icon says to assistive technology, such as `allowed`, for a count that is a bare number. A count whose text says what it counts, such as `3 allowed`, leaves it out, and then the icon is decoration. */
  readonly iconLabel?: string;
  /** What the count says, such as `2` or `3 allowed`. */
  readonly children: ReactNode;
};
