import type { SettingsNormalized } from "@boundaries/config";

import type { Sketch } from "@/contract";

import type { EvaluatedRule } from "./evaluatedRule.types";

/** What the dependencies of a sketch are decided with */
export type DependenciesInput = {
  readonly sketch: Sketch;
  /** The paths of the files of the sketch, as `getFiles` gives them, to write the sources of the statements */
  readonly paths: readonly string[];
  /** The normalized settings */
  readonly settings: SettingsNormalized;
  /** The rule that decides, or `undefined` when no dependency is evaluated */
  readonly rule: EvaluatedRule | undefined;
};

/** What the rule decides a dependency with */
export type DependencyJudgment = {
  readonly settings: SettingsNormalized;
  readonly rule: EvaluatedRule;
};
