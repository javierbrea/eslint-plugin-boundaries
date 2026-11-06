import type { ReactNode } from "react";

import type {
  VerdictIcon,
  VerdictTone,
} from "@/domains/evaluation/ui/helpers/verdictText";

/** Props of {@link VerdictCount}. */
export type VerdictCountProps = {
  /** How the count is colored: the verdict it counts. */
  readonly tone: VerdictTone;
  /** The icon of that verdict, drawn before the count. */
  readonly icon: VerdictIcon;
  /** What the count says, such as `2` or `3 allowed`. */
  readonly children: ReactNode;
};
