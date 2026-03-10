import type { MatchersOptionsNormalized } from "../Config";
import type {
  DependencyDescription,
  DependencyRelationship,
} from "../Descriptor";
import { isArray } from "../Support";

import { BaseElementsMatcher } from "./BaseElementsMatcher";
import type { ElementsMatcher } from "./ElementsMatcher";
import type {
  TemplateData,
  DependencySelector,
  DependencySelectorNormalized,
  BaseElementSelectorData,
  MatcherOptions,
  MatcherOptionsDependencySelectorsGlobals,
  DependencyMatchResult,
  DependencyDataSelectorData,
} from "./Matcher.types";
import {
  normalizeElementsSelector,
  isDependencyDataSelector,
  isDependencySelector,
} from "./MatcherHelpers";
import type { Micromatch } from "./Micromatch";

/**
 * Matcher class to determine if dependencies match a given dependencies selector.
 */
export class DependenciesMatcher extends BaseElementsMatcher {
  /**
   * Elements matcher to use for matching elements within dependencies.
   */
  private readonly _elementsMatcher: ElementsMatcher;

  /**
   * Creates a new DependenciesMatcher.
   * @param elementsMatcher Elements matcher to use for matching elements within dependencies.
   * @param config Configuration options for the matcher.
   * @param micromatch Micromatch instance for matching.
   * @param globalCache Global cache instance.
   */
  constructor(
    elementsMatcher: ElementsMatcher,
    config: MatchersOptionsNormalized,
    micromatch: Micromatch
  ) {
    super(config, micromatch);
    this._elementsMatcher = elementsMatcher;
  }

  /**
   * Normalizes selector into DependencySelectorNormalized format, containing arrays of selectors data.
   * @param selector The dependency selector to normalize.
   * @returns The normalized dependency selector.
   */
  private _normalizeDependencySelector(
    selector: DependencySelector,
    dependencySelectorsGlobals: MatcherOptionsDependencySelectorsGlobals
  ): DependencySelectorNormalized {
    if (!isDependencySelector(selector)) {
      throw new Error("Invalid dependency selector");
    }

    const explicitDependencySelectors =
      selector.dependency && isDependencyDataSelector(selector.dependency)
        ? isArray(selector.dependency)
          ? selector.dependency
          : [selector.dependency]
        : [];

    const normalizedDependencySelectors = explicitDependencySelectors.map(
      (dependencySelectorData) => ({
        ...dependencySelectorsGlobals,
        ...dependencySelectorData,
      })
    );

    const normalizedDependencyMetadataSelectors =
      normalizedDependencySelectors.length > 0
        ? normalizedDependencySelectors
        : Object.keys(dependencySelectorsGlobals).length > 0
          ? [{ ...dependencySelectorsGlobals }]
          : null;

    return {
      from: selector.from ? normalizeElementsSelector(selector.from) : null,
      to: selector.to ? normalizeElementsSelector(selector.to) : null,
      dependency: normalizedDependencyMetadataSelectors,
    };
  }

  /**
   * Returns the selectors matching result for the given dependency.
   * @param dependency The dependency description.
   * @param selector The dependency selector normalized.
   * @param extraTemplateData The extra template data for selector values.
   * @returns The selectors matching result for the given dependency.
   */
  private _getSelectorMatching(
    dependency: DependencyDescription,
    selector: DependencySelectorNormalized,
    templateData: TemplateData
  ): DependencyMatchResult {
    const getFromSelectorMatching = (): BaseElementSelectorData | null => {
      for (const fromSelectorData of selector.from!) {
        const fromMatch = this._elementsMatcher.isElementMatch(
          dependency.from,
          fromSelectorData,
          {
            extraTemplateData: templateData,
          }
        );
        if (fromMatch) {
          return fromSelectorData;
        }
      }
      return null;
    };

    const getToSelectorMatching = (): BaseElementSelectorData | null => {
      for (const toSelectorData of selector.to!) {
        const toMatch = this._elementsMatcher.isElementMatch(
          dependency.to,
          toSelectorData,
          {
            extraTemplateData: templateData,
          }
        );

        if (toMatch) {
          return toSelectorData;
        }
      }
      return null;
    };

    const getDependencySelectorMatching =
      (): DependencyDataSelectorData | null => {
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
      ? getFromSelectorMatching()
      : null;
    const toSelectorMatching = selector.to ? getToSelectorMatching() : null;
    const dependencySelectorMatching = selector.dependency
      ? getDependencySelectorMatching()
      : null;

    return {
      from: fromSelectorMatching,
      to: toSelectorMatching,
      dependency: dependencySelectorMatching,
      isMatch: Boolean(
        (selector.from ? fromSelectorMatching : true) &&
          (selector.to ? toSelectorMatching : true) &&
          (selector.dependency ? dependencySelectorMatching : true)
      ),
    };
  }

  /**
   * Determines if the dependency relationship matches the selector.
   * @param dependency The dependency description.
   * @param selector The data of an element selector.
   * @returns Whether the dependency relationship matches the selector.
   */
  private _relationshipFromMatches(
    selector: DependencyDataSelectorData,
    relationship: DependencyRelationship | null,
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
    selector: DependencyDataSelectorData,
    relationship: DependencyRelationship | null,
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
    selector: DependencyDataSelectorData,
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
    selector: DependencyDataSelectorData,
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
    selector: DependencyDataSelectorData,
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
    selector: DependencyDataSelectorData,
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
   * Determines if the selector matches the module
   * @param selector The dependency selector data
   * @param module The module to check
   * @param templateData The template data for rendering selector values
   * @returns Whether the selector matches the module
   */
  private _moduleMatches(
    selector: DependencyDataSelectorData,
    dependencyModule: string | null,
    templateData: TemplateData
  ): boolean {
    if (!selector.module) {
      return true;
    }
    return this.isTemplateMicromatchMatch(
      selector.module,
      templateData,
      dependencyModule
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
    selectorData: DependencyDataSelectorData,
    templateData: TemplateData
  ): boolean {
    const dependencyInfo = dependency.dependency;
    const relationshipFrom = dependencyInfo.relationship.from;
    const relationshipTo = dependencyInfo.relationship.to;
    const kind = dependencyInfo.kind;
    const nodeKind = dependencyInfo.nodeKind;
    const specifiers = dependencyInfo.specifiers;
    const source = dependencyInfo.source;
    const dependencyModule = dependencyInfo.module;

    return (
      this._kindMatches(selectorData, kind, templateData) &&
      this._nodeKindMatches(selectorData, nodeKind, templateData) &&
      this._sourceMatches(selectorData, source, templateData) &&
      this._moduleMatches(selectorData, dependencyModule, templateData) &&
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
   * Returns the selectors matching result for the given dependency.
   * @param dependency The dependency to check.
   * @param selector The selector to check against.
   * @param options Extra options for matching, such as templates data, globals for dependency selectors, etc.
   * @returns The matching result for the dependency against the selector.
   */
  public getSelectorsMatching(
    dependency: DependencyDescription,
    selector: DependencySelector,
    {
      extraTemplateData = {},
      dependencySelectorsGlobals = {},
    }: MatcherOptions = {}
  ): DependencyMatchResult {
    const normalizedSelector = this._normalizeDependencySelector(
      selector,
      dependencySelectorsGlobals
    );

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

    const result = this._getSelectorMatching(
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
   * @param options Extra options for matching, such as templates data, globals for dependency selectors, etc.
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
