import type { DependencyResult } from "@/domains/evaluation/helpers/engine";

/** Props of {@link DependencySummary}. */
export type DependencySummaryProps = {
  /** The dependencies of the file, with their verdicts. */
  readonly results: readonly DependencyResult[];
  /** Whether the engine evaluated them. It does not while the config cannot be read, the rule options are invalid or the rule is off. */
  readonly isEvaluated: boolean;
  /** A class for the root element, which is how `styled(DependencySummary)` places the summary. */
  readonly className?: string;
  /** The test id of the root element. It is the one of the summary when it is unset. */
  readonly testId?: string;
};
