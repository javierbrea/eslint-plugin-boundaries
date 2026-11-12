import type {
  ConfigProblem,
  DependencyResult,
  EntityDescription,
} from "@/domains/evaluation/helpers/engine";

/** Milliseconds after the last edit of the config before the sketch is evaluated again, so that typing does not evaluate each keystroke. */
export const EVALUATION_DELAY = 150;

/** The problems of the config before the first evaluation arrives: one array, so that the panes that read it do not render again for each change of the store. */
export const NO_PROBLEMS: readonly ConfigProblem[] = [];

/** The verdicts before the first evaluation arrives: one array, for the same reason as {@link NO_PROBLEMS}. */
export const NO_RESULTS: readonly DependencyResult[] = [];

/** The descriptions of the files before the first evaluation arrives: one map, for the same reason as {@link NO_PROBLEMS}. */
export const NO_DESCRIPTIONS: ReadonlyMap<string, EntityDescription> =
  new Map();
