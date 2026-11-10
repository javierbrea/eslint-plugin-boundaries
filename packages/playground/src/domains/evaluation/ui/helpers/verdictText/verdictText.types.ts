import type { DependencyVerdict } from "@/domains/evaluation/helpers/engine";

/** A verdict that an evaluation decided: any but the `pending` one of a dependency that is newer than the evaluation on screen, which `getPendingVerdict` writes */
export type DecidedVerdict = Exclude<DependencyVerdict, { status: "pending" }>;

/** The icon of a verdict, by the name of an icon of `src/ui-kit/atoms/Icon`. The names are written here because an `ui-helper` does not import `ui-kit` atoms, and the `IconName` of the icon atom accepts them */
export type VerdictIcon = "check" | "cross" | "warn" | "skip";
