import type { SettingsNormalized } from "@boundaries/config";
import { Policies } from "@boundaries/policies";

/**
 * The `Policies` instance of each normalized settings object, kept as long as the object is. An analysis keeps its settings object for its whole life, so its evaluations share the matchers of the instance and the descriptions that they cache unless `boundaries/cache` is `false`, and a host frees them by dropping the analysis. The module functions of `@boundaries/policies` would keep them for the life of the module instead.
 */
const policiesBySettings = new WeakMap<SettingsNormalized, Policies>();

/**
 * Returns the `Policies` instance that describes and evaluates with some normalized settings, created on the first call with the settings object.
 * @param settings The normalized settings of an analysis.
 * @returns The instance of the settings object, the same one on every call with that object, and another one for any other object, even of equal content.
 */
export function getPolicies(settings: SettingsNormalized): Policies {
  const cachedPolicies = policiesBySettings.get(settings);
  if (cachedPolicies) {
    return cachedPolicies;
  }
  const policies = new Policies();
  policiesBySettings.set(settings, policies);
  return policies;
}
