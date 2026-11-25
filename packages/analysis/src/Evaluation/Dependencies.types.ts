import type { SettingsNormalized } from "@boundaries/config";
import type { Policies } from "@boundaries/policies";

import type { EvaluatedRule, ReadNodes } from "../Config";

import type { ProjectDependency } from "./Evaluation.types";

/** What the dependencies of a project are decided with */
export type DependenciesInput = {
  /** The dependencies of the project, each with the source its statement writes */
  readonly dependencies: readonly ProjectDependency[];
  /** The `Policies` instance that describes and decides the dependencies */
  readonly policies: Policies;
  /** The normalized settings */
  readonly settings: SettingsNormalized;
  /** The rule that decides, or `undefined` when no dependency is evaluated */
  readonly rule: EvaluatedRule | undefined;
};

/** What the rule describes and decides a dependency with */
export type DependencyJudgment = {
  /** The `Policies` instance that describes and decides the dependency */
  readonly policies: Policies;
  /** The normalized settings */
  readonly settings: SettingsNormalized;
  /** For each syntax and each import kind, the node that reads its statements, from the built-in selectors that the nodes of the settings repeat */
  readonly readNodes: ReadNodes;
  /** The rule that decides, or `undefined` when no dependency is evaluated */
  readonly rule: EvaluatedRule | undefined;
};
