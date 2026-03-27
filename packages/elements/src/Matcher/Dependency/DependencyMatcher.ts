import type { MatchersOptionsNormalized } from "../../Config";
import type {
  DependencyDescription,
  DependencyRelationshipType,
} from "../../Descriptor";
import type { EntitiesMatcher } from "../Entity";
import { BaseElementsMatcher } from "../Shared";
import type { TemplateData, MatcherOptions, Micromatch } from "../Shared";

import type { DependencyMatchResult } from "./DependencyMatcher.types";
import type {
  DependencySelectorNormalized,
  DependencySingleSelectorNormalized,
  DependencyInfoSingleSelector,
  DependencySelector,
} from "./DependencySelector.types";
import { normalizeDependencySelector } from "./DependencySelectorHelpers";

/**
 * Matcher class to determine if dependencies match a given dependencies selector.
 */
export class DependenciesMatcher extends BaseElementsMatcher {
  /**
   * Entities matcher to use for matching entities within dependencies.
   */
  private readonly _entitiesMatcher: EntitiesMatcher;

  /**
   * Creates a new DependenciesMatcher.
   * @param entitiesMatcher Entities matcher to use for matching entities within dependencies.
   * @param config Configuration options for the matcher.
   * @param micromatch Micromatch instance for matching.
   * @param globalCache Global cache instance.
   */
  constructor(
    entitiesMatcher: EntitiesMatcher,
    config: MatchersOptionsNormalized,
    micromatch: Micromatch
  ) {
    super(config, micromatch);
    this._entitiesMatcher = entitiesMatcher;
  }

  /**
   * Returns the selectors matching result for the given dependency.
   * @param dependency The dependency description.
   * @param selector The dependency selector normalized.
   * @param extraTemplateData The extra template data for selector values.
   * @returns The selectors matching result for the given dependency.
   */
  private _getSelectorsMatching(
    dependency: DependencyDescription,
    selector: DependencySingleSelectorNormalized,
    templateData: TemplateData
  ): DependencyMatchResult {
    const getDependencyMetadataSelectorMatching =
      (): DependencyInfoSingleSelector | null => {
        for (const dependencySelectorData of selector.dependency!) {
          const dependencyPropertiesMatch = this._dependencyPropertiesMatch(
            dependency,
            dependencySelectorData,
            templateData
          );
          if (dependencyPropertiesMatch) {
            return dependencySelectorData;
          }
        }
        return null;
      };

    const fromSelectorMatching = selector.from
      ? this._entitiesMatcher.getSelectorMatching(
          dependency.from,
          selector.from,
          {
            extraTemplateData: templateData,
          }
        )
      : null;
    const toSelectorMatching = selector.to
      ? this._entitiesMatcher.getSelectorMatching(dependency.to, selector.to, {
          extraTemplateData: templateData,
        })
      : null;
    const dependencyMetadataSelectorMatching = selector.dependency
      ? getDependencyMetadataSelectorMatching()
      : null;

    const fromMatch = Boolean(
      selector.from ? fromSelectorMatching?.isMatch : true
    );
    const toMatch = Boolean(selector.to ? toSelectorMatching?.isMatch : true);
    const dependencyMetadataMatch = Boolean(
      selector.dependency ? dependencyMetadataSelectorMatching : true
    );

    return {
      from: fromMatch
        ? {
            element: fromSelectorMatching!.element,
            file: fromSelectorMatching!.file,
            origin: fromSelectorMatching!.origin,
          }
        : null,
      to: toMatch
        ? {
            element: toSelectorMatching!.element,
            file: toSelectorMatching!.file,
            origin: toSelectorMatching!.origin,
          }
        : null,
      dependency: dependencyMetadataMatch
        ? dependencyMetadataSelectorMatching
        : null,
      isMatch: fromMatch && toMatch && dependencyMetadataMatch,
    };
  }

  /**
   * Determines if the dependency relationship matches the selector.
   * @param dependency The dependency description.
   * @param selector The data of an element selector.
   * @returns Whether the dependency relationship matches the selector.
   */
  private _relationshipFromMatches(
    selector: DependencyInfoSingleSelector,
    relationship: DependencyRelationshipType | null,
    templateData: TemplateData
  ): boolean {
    if (!selector.relationship?.from) {
      return true;
    }
    return this.isTemplateMicromatchMatch(
      selector.relationship.from,
      templateData,
      relationship
    );
  }

  /**
   * Determines if the dependency origin relationship matches the selector.
   * @param selector The dependency selector data.
   * @param relationship The relationship from origin element to target element.
   * @param templateData The template data for rendering selector values.
   * @returns Whether the dependency origin relationship matches.
   */
  private _relationshipToMatches(
    selector: DependencyInfoSingleSelector,
    relationship: DependencyRelationshipType | null,
    templateData: TemplateData
  ): boolean {
    if (!selector.relationship?.to) {
      return true;
    }
    return this.isTemplateMicromatchMatch(
      selector.relationship.to,
      templateData,
      relationship
    );
  }

  /**
   * Determines if the selector matches an specific kind
   * @param selector The dependency selector data
   * @param kind Kind to check
   * @param templateData The template data for rendering selector values
   * @returns Whether the selector matches the kind
   */
  private _kindMatches(
    selector: DependencyInfoSingleSelector,
    kind: string,
    templateData: TemplateData
  ): boolean {
    if (!selector.kind) {
      return true;
    }
    return this.isTemplateMicromatchMatch(selector.kind, templateData, kind);
  }

  /**
   * Determines if the selector matches some of the specifiers
   * @param selector The dependency selector data
   * @param specifiers Specifiers to check
   * @param templateData The template data for rendering selector values
   * @returns Whether the selector matches some of the specifiers
   */
  private _specifierMatches(
    selector: DependencyInfoSingleSelector,
    specifiers: string[] | null,
    templateData: TemplateData
  ): boolean {
    if (!selector.specifiers) {
      return true;
    }
    return this.isTemplateMicromatchMatch(
      selector.specifiers,
      templateData,
      specifiers
    );
  }

  /**
   * Determines if the selector matches the nodeKind
   * @param selector The dependency selector data
   * @param nodeKind The nodeKind to check
   * @param templateData The template data for rendering selector values
   * @returns Whether the selector matches the nodeKind
   */
  private _nodeKindMatches(
    selector: DependencyInfoSingleSelector,
    nodeKind: string | null,
    templateData: TemplateData
  ): boolean {
    if (!selector.nodeKind) {
      return true;
    }
    return this.isTemplateMicromatchMatch(
      selector.nodeKind,
      templateData,
      nodeKind
    );
  }

  /**
   * Determines if the dependency description matches the selector for 'to'.
   * @param dependency The dependency description.
   * @param toSelector The selector for 'to' elements.
   * @param templateData The template data for rendering selector values
   * @returns Whether the dependency properties match the selector for 'to'.
   */
  private _sourceMatches(
    selector: DependencyInfoSingleSelector,
    source: string,
    templateData: TemplateData
  ): boolean {
    if (!selector.source) {
      return true;
    }
    return this.isTemplateMicromatchMatch(
      selector.source,
      templateData,
      source
    );
  }

  /**
   * Determines if the dependency description matches the selector for dependency metadata.
   * @param dependency The dependency description.
   * @param selectorData The selector for dependency metadata.
   * @param templateData The template data for rendering selector values
   * @returns Whether the dependency properties match the selector.
   */
  private _dependencyPropertiesMatch(
    dependency: DependencyDescription,
    selectorData: DependencyInfoSingleSelector,
    templateData: TemplateData
  ): boolean {
    const dependencyInfo = dependency.dependency;
    const relationshipFrom = dependencyInfo.relationship.from;
    const relationshipTo = dependencyInfo.relationship.to;
    const kind = dependencyInfo.kind;
    const nodeKind = dependencyInfo.nodeKind;
    const specifiers = dependencyInfo.specifiers;
    const source = dependencyInfo.source;

    return (
      this._kindMatches(selectorData, kind, templateData) &&
      this._nodeKindMatches(selectorData, nodeKind, templateData) &&
      this._sourceMatches(selectorData, source, templateData) &&
      this._relationshipFromMatches(
        selectorData,
        relationshipFrom,
        templateData
      ) &&
      this._relationshipToMatches(selectorData, relationshipTo, templateData) &&
      this._specifierMatches(selectorData, specifiers, templateData)
    );
  }

  /**
   * Returns the first selector matching result for the given dependency.
   * @param dependency The dependency to check.
   * @param selector The selector to check against.
   * @param templateData The template data for rendering selector values.
   * @returns The first selector matching result for the given dependency.
   */
  private _getFirstSelectorMatching(
    dependency: DependencyDescription,
    selector: DependencySelectorNormalized,
    templateData: TemplateData
  ): DependencyMatchResult {
    for (const singleSelector of selector) {
      const matchResult = this._getSelectorsMatching(
        dependency,
        singleSelector,
        templateData
      );
      if (matchResult.isMatch) {
        return matchResult;
      }
    }
    return {
      from: null,
      to: null,
      dependency: null,
      isMatch: false,
    };
  }

  /**
   * Returns the selectors matching result for the given dependency.
   * @param dependency The dependency to check.
   * @param selector The selector to check against.
   * @param options Extra options for matching, such as templates data, etc.
   * @returns The matching result for the dependency against the selector.
   */
  public getSelectorsMatching(
    dependency: DependencyDescription,
    selector: DependencySelector,
    { extraTemplateData = {} }: MatcherOptions = {}
  ): DependencyMatchResult {
    const normalizedSelector = normalizeDependencySelector(selector);

    const fromExtraData = extraTemplateData.from || {};
    const toExtraData = extraTemplateData.to || {};

    // Add `to` and `from` data to the template when checking elements in dependencies
    const templateData: TemplateData = {
      ...extraTemplateData,
      from: {
        ...dependency.from,
        ...fromExtraData,
      },
      to: {
        ...dependency.to,
        ...toExtraData,
      },
      dependency: dependency.dependency,
    };

    const result = this._getFirstSelectorMatching(
      dependency,
      normalizedSelector,
      templateData
    );
    return result;
  }

  /**
   * Returns whether the given dependency matches the selector.
   * @param dependency The dependency to check.
   * @param selector The selector to check against.
   * @param options Extra options for matching, such as templates data, etc.
   * @returns Whether the dependency matches the selector properties.
   */
  public isDependencyMatch(
    dependency: DependencyDescription,
    selector: DependencySelector,
    options?: MatcherOptions
  ): boolean {
    const matchResult = this.getSelectorsMatching(
      dependency,
      selector,
      options
    );
    return matchResult.isMatch;
  }
}
