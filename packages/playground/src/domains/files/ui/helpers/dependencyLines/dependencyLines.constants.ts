import type { VerdictIcon } from "@/domains/evaluation/ui/helpers/verdictText";

/** What the icon of a verdict says to assistive technology. A skip icon says nothing: the text of the verdict is `not checked · <reason>` or `not evaluated`. */
export const VERDICT_ICON_LABELS: Readonly<
  Record<VerdictIcon, string | undefined>
> = {
  check: "allowed",
  cross: "disallowed",
  warn: "disallowed, as a warning",
  skip: undefined,
};
