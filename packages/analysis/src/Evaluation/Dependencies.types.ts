import type { SettingsNormalized } from "@boundaries/config";

import type { EvaluatedRule } from "../Config";

import type { ProjectDependency } from "./Evaluation.types";

/** What the dependencies of a project are decided with */
export type DependenciesInput = {
  /** The dependencies of the project, each with the source its statement writes */
  readonly dependencies: readonly ProjectDependency[];
  /** The normalized settings */
  readonly settings: SettingsNormalized;
  /** The rule that decides, or `undefined` when no dependency is evaluated */
  readonly rule: EvaluatedRule | undefined;
};

/** What the rule describes and decides a dependency with */
export type DependencyJudgment = {
  /** The normalized settings */
  readonly settings: SettingsNormalized;
  /** The node kinds whose syntaxes the analysis reads, from the built-in selectors of the settings */
  readonly readNodeKinds: ReadonlySet<string>;
  /** The rule that decides, or `undefined` when no dependency is evaluated */
  readonly rule: EvaluatedRule | undefined;
};
