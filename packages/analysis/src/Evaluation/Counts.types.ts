import type { PolicySummary } from "../Config";

/** What a policy has counted of the dependencies of a project */
export type PolicyCount = Pick<
  PolicySummary,
  "decided" | "disallowed" | "errors"
>;
