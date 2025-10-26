import micromatch from "micromatch";

import { CacheManager } from "../Cache";
import type {
  DependencyDescription,
  DependencyRelationship,
} from "../Descriptor";
import { isArray } from "../Support";

import { BaseElementsMatcher } from "./BaseElementsMatcher";
import type { ElementsMatcher } from "./ElementsMatcher";
import type {
  BaseElementSelector,
  CapturedValuesTemplateData,
  DependenciesMatcherSerializedCache,
  DependencySelector,
  DependencyElementSelectorData,
  DependencySelectorNormalized,
  ElementSelectorData,
  BaseElementSelectorData,
  MatcherOptions,
} from "./ElementsSelector.types";

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
      capturedValuesTemplateData: CapturedValuesTemplateData;
    },
    boolean
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
    serializedCache: DependenciesMatcherSerializedCache,
  ): void {
    this._cache.setFromSerialized(serializedCache);
  }

  /**
   * Normalizes selector into DependencySelectorNormalized format, containing arrays of selectors data.
   * @param selector The dependency selector to normalize.
   * @returns The normalized dependency selector.
   */
  private _normalizeDependencySelector(
    selector: DependencySelector,
  ): DependencySelectorNormalized {
    return {
      from: selector.from
        ? this.normalizeElementsSelector(selector.from)
        : null,
      to: selector.to ? this.normalizeElementsSelector(selector.to) : null,
    };
  }

  /**
   * Converts a DependencyElementSelectorData to a BaseElementSelectorData, by removing dependency-specific properties.
   * @param selector The dependency element selector data.
   * @returns The base element selector data.
   */
  private _convertDependencyElementSelectorDataToBaseElementSelectorData(
    selector: DependencyElementSelectorData,
  ): BaseElementSelector {
    const baseSelector: Partial<BaseElementSelector> = {};

    if (selector.type) {
      baseSelector.type = selector.type;
    }

    if (selector.category) {
      baseSelector.category = selector.category;
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

    return baseSelector as BaseElementSelector;
  }

  /**
   * Converts an array of dependency element selector data to an array of base element selector data.
   * @param selector The dependency element selector data.
   * @returns The base element selector data.
   */
  private _convertDependencyElementsSelectorDataToBaseElementsSelectorData(
    selector: DependencyElementSelectorData[],
  ): BaseElementSelector[] {
    return selector.map((selectorData) =>
      this._convertDependencyElementSelectorDataToBaseElementSelectorData(
        selectorData,
      ),
    );
  }

  /**
   * Determines if the dependency base elements match the selectors.
   * @param dependency The dependency description.
   * @param selector The dependency selector normalized.
   * @param capturedValuesTemplateData The captured values template data.
   * @returns Whether the dependency base elements match the selectors.
   */
  private _elementsMatch(
    dependency: DependencyDescription,
    selector: DependencySelectorNormalized,
    capturedValuesTemplateData: CapturedValuesTemplateData,
  ): boolean {
    const fromMatches = selector.from
      ? this._elementsMatcher.isElementMatch(dependency.from, selector.from, {
          capturedValuesTemplateData,
        })
      : true;
    if (!fromMatches) {
      return false;
    }
    const toMatches = selector.to
      ? this._elementsMatcher.isElementMatch(
          dependency.to,
          this._convertDependencyElementsSelectorDataToBaseElementsSelectorData(
            selector.to,
          ),
          {
            capturedValuesTemplateData,
          },
        )
      : true;
    return toMatches;
  }

  /**
   * Determines if the dependency relationship matches the selector.
   * @param dependency The dependency description.
   * @param selector The data of an element selector.
   * @returns Whether the dependency relationship matches the selector.
   */
  private _relationshipMatches(
    selector: ElementSelectorData,
    relationship: DependencyRelationship | null,
  ): boolean {
    if (!selector.relationship) {
      return true;
    }
    if (!relationship) {
      return false;
    }
    const relationships = isArray(selector.relationship)
      ? selector.relationship
      : [selector.relationship];
    return relationships.includes(relationship);
  }

  /**
   * Determines if the selector matches an specific kind
   * @param selector The dependency selector data
   * @param kind Kind to check
   * @returns Whether the selector matches the kind
   */
  private _kindMatches(
    selector: DependencyElementSelectorData,
    kind: string,
  ): boolean {
    if (!selector.kind) {
      return true;
    }
    return selector.kind === kind;
  }

  /**
   * Determines if the selector matches some of the specifiers
   * @param selector The dependency selector data
   * @param specifiers Specifiers to check
   * @returns Whether the selector matches some of the specifiers
   */
  private _specifierMatches(
    selector: DependencyElementSelectorData,
    specifiers: string[] | null,
  ): boolean {
    const specifierPattern = selector.specifier;
    if (!specifierPattern) {
      return true;
    }
    if (!specifiers) {
      return false;
    }
    return specifiers.some((specifier) =>
      micromatch.isMatch(specifier, specifierPattern),
    );
  }

  /**
   * Determines if the selector matches the nodeKind
   * @param selector The dependency selector data
   * @param nodeKind The nodeKind to check
   * @returns Whether the selector matches the nodeKind
   */
  private _nodeKindMatches(
    selector: DependencyElementSelectorData,
    nodeKind: string | null,
  ): boolean {
    const nodeKindPattern = selector.nodeKind;
    if (!nodeKindPattern) {
      return true;
    }
    if (!nodeKind) {
      return false;
    }
    return micromatch.isMatch(nodeKind, nodeKindPattern);
  }

  /**
   * Determines if the dependency description matches the selector for 'from'.
   * @param dependency The dependency description.
   * @param fromSelector The selector for 'from' elements.
   * @returns Whether the dependency properties match the selector for 'from'.
   */
  private _dependencyFromPropertiesMatch(
    dependency: DependencyDescription,
    fromSelector: BaseElementSelectorData[] | null,
  ): boolean {
    if (!fromSelector) {
      return true;
    }
    return fromSelector.some((selectorData) =>
      this._relationshipMatches(
        selectorData,
        dependency.dependency.relationship.from,
      ),
    );
  }

  /**
   * Determines if the dependency description matches the selector for 'to'.
   * @param dependency The dependency description.
   * @param toSelector The selector for 'to' elements.
   * @returns Whether the dependency properties match the selector for 'to'.
   */
  private _dependencyToPropertiesMatch(
    dependency: DependencyDescription,
    toSelector: DependencyElementSelectorData[] | null,
  ): boolean {
    if (!toSelector) {
      return true;
    }
    return toSelector.some(
      (selectorData) =>
        this._relationshipMatches(
          selectorData,
          dependency.dependency.relationship.to,
        ) &&
        this._kindMatches(selectorData, dependency.dependency.kind) &&
        this._nodeKindMatches(selectorData, dependency.dependency.nodeKind) &&
        this._specifierMatches(selectorData, dependency.dependency.specifiers),
    );
  }

  /**
   * Check whether the dependency properties match the selector.
   * @param dependency The dependency description
   * @param selector The dependency selector normalized
   * @returns Whether the dependency properties match the selector
   */
  private _dependencyPropertiesMatch(
    dependency: DependencyDescription,
    selector: DependencySelectorNormalized,
  ): boolean {
    return (
      this._dependencyFromPropertiesMatch(dependency, selector.from) &&
      this._dependencyToPropertiesMatch(dependency, selector.to)
    );
  }

  /**
   * Returns whether the given dependency matches the selector.
   * @param dependency The dependency to check.
   * @returns Whether the dependency matches the selector properties.
   */
  public isDependencyMatch(
    dependency: DependencyDescription,
    selector: DependencySelector,
    { capturedValuesTemplateData = {} }: MatcherOptions = {},
  ): boolean {
    if (
      this._cache.has({
        dependency,
        selector,
        capturedValuesTemplateData,
      })
    ) {
      return this._cache.get({
        dependency,
        selector,
        capturedValuesTemplateData,
      })!;
    }

    const normalizedSelector = this._normalizeDependencySelector(selector);
    const result =
      this._elementsMatch(
        dependency,
        normalizedSelector,
        capturedValuesTemplateData,
      ) && this._dependencyPropertiesMatch(dependency, normalizedSelector);

    this._cache.set(
      {
        dependency,
        selector,
        capturedValuesTemplateData,
      },
      result,
    );
    return result;
  }
}
