// The analysis of a config
export type {
  ConfigAnalysis,
  ConfigPath,
  ElementTypeSummary,
  EvaluatedRule,
  FileCategorySummary,
  NotEvaluatedReason,
  PolicyRef,
  PolicySummary,
  ProjectConfig,
  RuleSummary,
} from "./Config";
export { analyzeConfig } from "./Config";

// The evaluation of a project
export type {
  DependencyDescription,
  DependencyRef,
  DependencyRelationship,
  DependencyRelationshipKind,
  DependencyResult,
  DependencyVerdict,
  EntityDescription,
  ParentDescription,
  Project,
  ProjectAnalysis,
  ProjectDependency,
  ProjectDependencySyntax,
  ProjectDependencyTarget,
  ProjectSpecifier,
  SkipReason,
} from "./Evaluation";
export { evaluateProject } from "./Evaluation";
