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
  getDependencySkipReason,
  evaluatePolicies,
  evaluateDependency,
} from "./Evaluation";

// Messages
export type {
  CustomMessageTemplatePolicyEntitySelectorContext,
  CustomMessageTemplatePolicyContext,
  CustomMessageTemplatePolicySelectorContext,
  CustomMessageTemplateContext,
} from "./Messages";
export { customErrorMessage, elementDescriptionMessage } from "./Messages";
