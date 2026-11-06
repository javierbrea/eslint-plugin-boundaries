import type { VerdictTone } from "@/domains/evaluation/ui/helpers/verdictText";

/** The color of each tone of a verdict outside a code area, from the tokens of the host. */
export const VERDICT_COLORS: Readonly<Record<VerdictTone, string>> = {
  ok: "var(--jsb-ok)",
  bad: "var(--jsb-bad)",
  warn: "var(--jsb-warn)",
  faint: "var(--jsb-faint)",
};
