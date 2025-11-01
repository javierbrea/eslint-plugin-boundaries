import { CacheManager } from "../Cache";
import type {
  DependencyDescription,
  DependencyRelationship,
} from "../Descriptor";
import { isNullish } from "../Support";

import {
  BaseElementsMatcher,
  normalizeElementsSelector,
} from "./BaseElementsMatcher";
import type { ElementsMatcher } from "./ElementsMatcher";
import type {
  BaseElementSelector,
  TemplateData,
  DependenciesMatcherSerializedCache,
  DependencySelector,
  DependencyElementSelectorData,
  DependencySelectorNormalized,
  BaseElementSelectorData,
  MatcherOptions,
  MatcherOptionsDependencySelectorsGlobals,
  DependencyMatchResult,
} from "./Matcher.types";
import {
  isBaseElementSelectorData,
  isDependencySelector,
} from "./MatcherHelpers";

/**
 * Matcher class to determine if dependencies match a given dependencies selector.
 */
export class DependenciesMatcher extends BaseElementsMatcher {
  /**
   * Cache to store previously described dependencies.
   */
  private _cache: CacheManager<
    {
      dependency: DependencyDescription;
      selector: DependencySelector;
      extraTemplateData: TemplateData;
      dependencySelectorsGlobals: MatcherOptionsDependencySelectorsGlobals;
    },
    DependencyMatchResult
  >;

  /**
   * Elements matcher to use for matching elements within dependencies.
   */
  private _elementsMatcher: ElementsMatcher;

  /**
   * Creates a new DependenciesMatcher.
   */
  constructor(elementsMatcher: ElementsMatcher) {
    super();
    this._cache = new CacheManager();
    this._elementsMatcher = elementsMatcher;
  }

  /**
   * Serializes the cache to a plain object.
   * @returns The serialized cache.
   */
  public serializeCache(): DependenciesMatcherSerializedCache {
    return this._cache.serialize();
  }

  /**
   * Sets the cache from a serialized object.
   * @param serializedCache The serialized cache.
   */
  public setCacheFromSerialized(
    serializedCache: DependenciesMatcherSerializedCache
  ): void {
    this._cache.setFromSerialized(serializedCache);
  }

  /**
   * Clears the cache.
   */
  public clearCache(): void {
    this._cache.clear();
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
    let normalizedDependencySelectors = selector.to
      ? normalizeElementsSelector(selector.to!)
      : null;

    if (normalizedDependencySelectors) {
      normalizedDependencySelectors = normalizedDependencySelectors.map(
        (depSelector) => {
          return {
            ...dependencySelectorsGlobals,
            ...depSelector,
          };
        }
      );
    }

    return {
      from: selector.from ? normalizeElementsSelector(selector.from) : null,
      to: normalizedDependencySelectors,
    };
  }

  /**
   * Converts a DependencyElementSelectorData to a BaseElementSelectorData, by removing dependency-specific properties.
   * @param selector The dependency element selector data.
   * @returns The base element selector data.
   */
  private _convertDependencyElementSelectorDataToBaseElementSelectorData(
    selector: DependencyElementSelectorData
  ): BaseElementSelector {
    const baseSelector: Partial<BaseElementSelector> = {};

    if (selector.type) {
      baseSelector.type = selector.type;
    }

    if (selector.category) {
      baseSelector.category = selector.category;
    }

    if (selector.path) {
      baseSelector.path = selector.path;
    }

    if (selector.elementPath) {
      baseSelector.elementPath = selector.elementPath;
    }

    if (selector.internalPath) {
      baseSelector.internalPath = selector.internalPath;
    }

    if (selector.captured) {
      baseSelector.captured = selector.captured;
    }

    if (selector.origin) {
      baseSelector.origin = selector.origin;
    }

    if (selector.baseSource) {
      baseSelector.baseSource = selector.baseSource;
    }

    if (selector.source) {
      baseSelector.source = selector.source;
    }

    if (!isNullish(selector.isIgnored)) {
      baseSelector.isIgnored = selector.isIgnored;
    }

    if (!isNullish(selector.isUnknown)) {
      baseSelector.isUnknown = selector.isUnknown;
    }

    return baseSelector as BaseElementSelector;
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
    const getFromSelectorMatching =
      (): DependencyElementSelectorData | null => {
        for (const fromSelectorData of selector.from!) {
          const fromMatch = this._elementsMatcher.isElementMatch(
            dependency.from,
            fromSelectorData,
            {
              extraTemplateData: templateData,
            }
          );
          const dependencyPropertiesMatch = this._dependencyFromPropertiesMatch(
            dependency,
            [fromSelectorData],
            templateData
          );
          if (fromMatch && dependencyPropertiesMatch) {
            return fromSelectorData;
          }
        }
        return null;
      };

    const getToSelectorMatching = (): DependencyElementSelectorData | null => {
      for (const toSelectorData of selector.to!) {
        const toMatch = isBaseElementSelectorData(toSelectorData)
          ? this._elementsMatcher.isElementMatch(
              dependency.to,
              this._convertDependencyElementSelectorDataToBaseElementSelectorData(
                toSelectorData
              ),
              {
                extraTemplateData: templateData,
              }
            )
          : true;
        const dependencyPropertiesMatch = this._dependencyToPropertiesMatch(
          dependency,
          [toSelectorData],
          templateData
        );
        if (toMatch && dependencyPropertiesMatch) {
          return toSelectorData;
        }
      }
      return null;
    };

    const fromSelectorMatching = selector.from
      ? getFromSelectorMatching()
      : null;
    const toSelectorMatching = selector.to ? getToSelectorMatching() : null;

    return {
      from: fromSelectorMatching,
      to: toSelectorMatching,
      isMatch: Boolean(
        (selector.from ? fromSelectorMatching : true) &&
          (selector.to ? toSelectorMatching : true)
      ),
    };
  }

  /**
   * Determines if the dependency relationship matches the selector.
   * @param dependency The dependency description.
   * @param selector The data of an element selector.
   * @returns Whether the dependency relationship matches the selector.
   */
  private _relationshipMatches(
    selector: DependencyElementSelectorData,
    relationship: DependencyRelationship | null,
    templateData: TemplateData
  ): boolean {
    if (!selector.relationship) {
      return true;
    }
    if (!relationship) {
      return false;
    }
    return this.isMicromatchMatch(
      relationship,
      this.getRenderedTemplates(selector.relationship, templateData)
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
    selector: DependencyElementSelectorData,
    kind: string,
    templateData: TemplateData
  ): boolean {
    if (!selector.kind) {
      return true;
    }
    if (!kind) {
      return false;
    }
    return this.isMicromatchMatch(
      kind,
      this.getRenderedTemplates(selector.kind, templateData)
    );
  }

  /**
   * Determines if the selector matches some of the specifiers
   * @param selector The dependency selector data
   * @param specifiers Specifiers to check
   * @param templateData The template data for rendering selector values
   * @returns Whether the selector matches some of the specifiers
   */
  private _specifierMatches(
    selector: DependencyElementSelectorData,
    specifiers: string[] | null,
    templateData: TemplateData
  ): boolean {
    const specifierPattern = selector.specifiers;
    if (!specifierPattern) {
      return true;
    }
    if (!specifiers) {
      return false;
    }
    return specifiers.some((specifier) =>
      this.isMicromatchMatch(
        specifier,
        this.getRenderedTemplates(specifierPattern, templateData)
      )
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
    selector: DependencyElementSelectorData,
    nodeKind: string | null,
    templateData: TemplateData
  ): boolean {
    const nodeKindPattern = selector.nodeKind;
    if (!nodeKindPattern) {
      return true;
    }
    if (!nodeKind) {
      return false;
    }
    return this.isMicromatchMatch(
      nodeKind,
      this.getRenderedTemplates(nodeKindPattern, templateData)
    );
  }

  /**
   * Determines if the dependency description matches the selector for 'from'.
   * @param dependency The dependency description.
   * @param fromSelector The selector for 'from' elements.
   * @param templateData The template data for rendering selector values
   * @returns Whether the dependency properties match the selector for 'from'.
   */
  private _dependencyFromPropertiesMatch(
    dependency: DependencyDescription,
    fromSelector: BaseElementSelectorData[],
    templateData: TemplateData
  ): boolean {
    return fromSelector.some((selectorData) =>
      this._relationshipMatches(
        selectorData,
        dependency.dependency.relationship.from,
        templateData
      )
    );
  }

  /**
   * Determines if the dependency description matches the selector for 'to'.
   * @param dependency The dependency description.
   * @param toSelector The selector for 'to' elements.
   * @param templateData The template data for rendering selector values
   * @returns Whether the dependency properties match the selector for 'to'.
   */
  private _dependencyToPropertiesMatch(
    dependency: DependencyDescription,
    toSelector: DependencyElementSelectorData[],
    templateData: TemplateData
  ): boolean {
    return toSelector.some((selectorData) => {
      return (
        this._relationshipMatches(
          selectorData,
          dependency.dependency.relationship.to,
          templateData
        ) &&
        this._kindMatches(
          selectorData,
          dependency.dependency.kind,
          templateData
        ) &&
        this._nodeKindMatches(
          selectorData,
          dependency.dependency.nodeKind,
          templateData
        ) &&
        this._specifierMatches(
          selectorData,
          dependency.dependency.specifiers,
          templateData
        )
      );
    });
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
    if (
      this._cache.has({
        dependency,
        selector,
        extraTemplateData,
        dependencySelectorsGlobals,
      })
    ) {
      return this._cache.get({
        dependency,
        selector,
        extraTemplateData,
        dependencySelectorsGlobals,
      })!;
    }

    const normalizedSelector = this._normalizeDependencySelector(
      selector,
      dependencySelectorsGlobals
    );
    // Add `to` and `from` data to the template when checking elements in dependencies
    const templateData: TemplateData = {
      from: dependency.from,
      to: dependency.to,
      ...extraTemplateData,
    };

    const result = this._getSelectorMatching(
      dependency,
      normalizedSelector,
      templateData
    );

    this._cache.set(
      {
        dependency,
        selector,
        extraTemplateData,
        dependencySelectorsGlobals,
      },
      result
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
