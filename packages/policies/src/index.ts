// Descriptions of files and dependencies
export { getMatcher, describeEntity, describeDependency } from "./Descriptions";

// Evaluation of the policies of the dependencies rule
export type {
  DependencyEvaluation,
  DependencySkipOptions,
  DependencySkipReason,
  PolicyEvaluation,
} from "./Evaluation";
export {
  DEPENDENCY_SKIP_REASONS_MAP,
  getDependencySkipReason,
  evaluatePolicies,
  evaluateDependency,
} from "./Evaluation";

// Descriptions and evaluation with matchers of an instance
export { Policies } from "./Policies";

// Messages
export type {
  CustomMessageTemplatePolicyEntitySelectorContext,
  CustomMessageTemplatePolicyContext,
  CustomMessageTemplatePolicySelectorContext,
  CustomMessageTemplateContext,
} from "./Messages";
export { customErrorMessage, elementDescriptionMessage } from "./Messages";
