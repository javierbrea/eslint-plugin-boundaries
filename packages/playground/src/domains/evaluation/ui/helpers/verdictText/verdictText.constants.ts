import type { VerdictIcon } from "./verdictText.types";

/** What the icon of a verdict says to assistive technology, wherever the icon is drawn: in the line of a dependency, which says the rest in its text, and in the count of the dependencies of a file, which is a bare number. A skip icon says nothing: the text of the verdict is `not checked · <reason>` or `not evaluated`. */
export const VERDICT_ICON_LABELS: Readonly<
  Record<VerdictIcon, string | undefined>
> = {
  check: "allowed",
  cross: "disallowed",
  warn: "disallowed, as a warning",
  skip: undefined,
};
