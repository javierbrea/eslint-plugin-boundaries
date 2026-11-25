import type {
  DependenciesRuleOptionsNormalized,
  SettingsNormalized,
} from "@boundaries/config";
import { Elements } from "@boundaries/elements";
import type {
  DependencyDescription,
  DependencyDescriptorOptions,
  EntityDescription,
  Matcher,
} from "@boundaries/elements";

import { createMatcherGetter } from "../Descriptions";
import type { MatcherGetter } from "../Descriptions";
import { evaluateDependencyWith, evaluatePoliciesWith } from "../Evaluation";
import type { DependencyEvaluation, PolicyEvaluation } from "../Evaluation";

/**
 * Describes files and dependencies and evaluates the policies of the `dependencies` rule as the functions of the same name do, with matchers of its own.
 *
 * The functions of the package keep every matcher they build, with the descriptions that the matcher caches unless `boundaries/cache` is `false`, for the life of the module. An instance keeps its own matchers instead, which are freed with it, so a host that evaluates many configs or projects in one process can free them by dropping the instance. Two instances never share a matcher, and an instance never shares one with the functions.
 */
export class Policies {
  /** The `Elements` instance that builds and keeps the matchers of this instance */
  private readonly _elements = new Elements();

  /** Returns the matcher of some settings, memoized by settings identity for this instance */
  private readonly _getMatcher: MatcherGetter = createMatcherGetter(
    this._elements
  );

  /**
   * Returns the `@boundaries/elements` matcher of some normalized settings, memoized by settings identity. Settings of equal content get the same matcher of this instance.
   * @param settings The settings, normalized by `@boundaries/config`.
   * @returns The matcher of the settings.
   */
  public getMatcher(settings: SettingsNormalized): Matcher {
    return this._getMatcher(settings);
  }

  /**
   * Describes a file: the element it belongs to, its file categories and its module origin.
   * @param settings The settings, normalized by `@boundaries/config`.
   * @param filePath The path of the file.
   * @returns The description of the file.
   */
  public describeEntity(
    settings: SettingsNormalized,
    filePath: string
  ): EntityDescription {
    return this._getMatcher(settings).describeEntity(filePath);
  }

  /**
   * Describes a dependency: the files it connects and the dependency itself.
   * @param settings The settings, normalized by `@boundaries/config`.
   * @param dependency The dependency: the paths of the importing file and of the resolved target, the source as written, its kind, the name of its dependency node and its specifiers.
   * @returns The description of the dependency.
   */
  public describeDependency(
    settings: SettingsNormalized,
    dependency: DependencyDescriptorOptions
  ): DependencyDescription {
    return this._getMatcher(settings).describeDependency(dependency);
  }

  /**
   * Evaluates the policies of the `dependencies` rule against a dependency, as the rule does: the last policy that matches decides, `disallow` takes precedence over `allow` within a policy, and `options.default` decides when no policy matches.
   * @param settings The settings, normalized by `@boundaries/config`.
   * @param options The options of the rule, normalized by `@boundaries/config`.
   * @param dependency The description of the dependency.
   * @returns The verdict, the deciding policy and match, the message of a violation, and the problems found while matching.
   * @throws An error naming the custom `message` and where it is set, with the Handlebars error as its `cause`, when the dependency is not allowed and its custom `message` fails to render, such as one with invalid syntax or an unknown helper.
   */
  public evaluatePolicies(
    settings: SettingsNormalized,
    options: DependenciesRuleOptionsNormalized,
    dependency: DependencyDescription
  ): PolicyEvaluation {
    return evaluatePoliciesWith(
      this._getMatcher,
      settings,
      options,
      dependency
    );
  }

  /**
   * Evaluates a dependency as the `dependencies` rule does: it checks first whether the rule evaluates it, and then evaluates the policies. A dependency that the rule does not evaluate builds no matcher.
   * @param settings The settings, normalized by `@boundaries/config`.
   * @param options The options of the rule, normalized by `@boundaries/config`.
   * @param dependency The description of the dependency.
   * @returns The reason why the dependency is not evaluated, or the evaluation of the policies.
   * @throws An error naming the custom `message` and where it is set, with the Handlebars error as its `cause`, when the dependency is not allowed and its custom `message` fails to render, such as one with invalid syntax or an unknown helper.
   */
  public evaluateDependency(
    settings: SettingsNormalized,
    options: DependenciesRuleOptionsNormalized,
    dependency: DependencyDescription
  ): DependencyEvaluation {
    return evaluateDependencyWith(
      this._getMatcher,
      settings,
      options,
      dependency
    );
  }
}
