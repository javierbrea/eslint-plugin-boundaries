import micromatch from "micromatch";

import { CacheManager } from "../Cache";
import type {
  DependencyDescription,
  DependencyRelationship,
} from "../Descriptor";

import { BaseElementsMatcher } from "./BaseElementsMatcher";
import type { ElementsMatcher } from "./ElementsMatcher";
import type {
  BaseElementSelector,
  TemplateData,
  DependenciesMatcherSerializedCache,
  DependencySelector,
  DependencyElementSelectorData,
  DependencySelectorNormalized,
  ElementSelectorData,
  BaseElementSelectorData,
  MatcherOptions,
  MatcherOptionsDependencySelectorsGlobals,
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
      extraTemplateData: TemplateData;
      dependencySelectorsGlobals: MatcherOptionsDependencySelectorsGlobals;
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
    dependencySelectorsGlobals: MatcherOptionsDependencySelectorsGlobals,
  ): DependencySelectorNormalized {
    let normalizedDependencySelectors = selector.to
      ? this.normalizeElementsSelector(selector.to!)
      : null;

    if (normalizedDependencySelectors) {
      normalizedDependencySelectors = normalizedDependencySelectors.map(
        (depSelector) => {
          return {
            ...dependencySelectorsGlobals,
            ...depSelector,
          };
        },
      );
    }

    return {
      from: selector.from
        ? this.normalizeElementsSelector(selector.from)
        : null,
      to: normalizedDependencySelectors,
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
   * @param extraTemplateData The extra template data for selector values.
   * @returns Whether the dependency base elements match the selectors.
   */
  private _elementsMatch(
    dependency: DependencyDescription,
    selector: DependencySelectorNormalized,
    templateData: TemplateData,
  ): boolean {
    const fromMatches = selector.from
      ? this._elementsMatcher.isElementMatch(dependency.from, selector.from, {
          extraTemplateData: templateData,
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
            extraTemplateData: templateData,
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
    templateData: TemplateData,
  ): boolean {
    if (!selector.relationship) {
      return true;
    }
    if (!relationship) {
      return false;
    }
    return micromatch.isMatch(
      relationship,
      this.getRenderedTemplates(selector.relationship, templateData),
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
    templateData: TemplateData,
  ): boolean {
    if (!selector.kind) {
      return true;
    }
    return micromatch.isMatch(
      kind,
      this.getRenderedTemplates(selector.kind, templateData),
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
    templateData: TemplateData,
  ): boolean {
    const specifierPattern = selector.specifier;
    if (!specifierPattern) {
      return true;
    }
    if (!specifiers) {
      return false;
    }
    return specifiers.some((specifier) =>
      micromatch.isMatch(
        specifier,
        this.getRenderedTemplates(specifierPattern, templateData),
      ),
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
    templateData: TemplateData,
  ): boolean {
    const nodeKindPattern = selector.nodeKind;
    if (!nodeKindPattern) {
      return true;
    }
    if (!nodeKind) {
      return false;
    }
    return micromatch.isMatch(
      nodeKind,
      this.getRenderedTemplates(nodeKindPattern, templateData),
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
    fromSelector: BaseElementSelectorData[] | null,
    templateData: TemplateData,
  ): boolean {
    if (!fromSelector) {
      return true;
    }
    return fromSelector.some((selectorData) =>
      this._relationshipMatches(
        selectorData,
        dependency.dependency.relationship.from,
        templateData,
      ),
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
    toSelector: DependencyElementSelectorData[] | null,
    templateData: TemplateData,
  ): boolean {
    if (!toSelector) {
      return true;
    }
    return toSelector.some((selectorData) => {
      return (
        this._relationshipMatches(
          selectorData,
          dependency.dependency.relationship.to,
          templateData,
        ) &&
        this._kindMatches(
          selectorData,
          dependency.dependency.kind,
          templateData,
        ) &&
        this._nodeKindMatches(
          selectorData,
          dependency.dependency.nodeKind,
          templateData,
        ) &&
        this._specifierMatches(
          selectorData,
          dependency.dependency.specifiers,
          templateData,
        )
      );
    });
  }

  /**
   * Check whether the dependency properties match the selector.
   * @param dependency The dependency description
   * @param selector The dependency selector normalized
   * @param templateData The template data for rendering selector values
   * @returns Whether the dependency properties match the selector
   */
  private _dependencyPropertiesMatch(
    dependency: DependencyDescription,
    selector: DependencySelectorNormalized,
    templateData: TemplateData,
  ): boolean {
    return (
      this._dependencyFromPropertiesMatch(
        dependency,
        selector.from,
        templateData,
      ) &&
      this._dependencyToPropertiesMatch(dependency, selector.to, templateData)
    );
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
    {
      extraTemplateData = {},
      dependencySelectorsGlobals = {},
    }: MatcherOptions = {},
  ): boolean {
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
      dependencySelectorsGlobals,
    );
    // Add `to` and `from` data to the template when checking elements in dependencies
    const templateData: TemplateData = {
      from: dependency.from,
      to: dependency.to,
      ...extraTemplateData,
    };
    const result =
      this._elementsMatch(dependency, normalizedSelector, templateData) &&
      this._dependencyPropertiesMatch(
        dependency,
        normalizedSelector,
        templateData,
      );

    this._cache.set(
      {
        dependency,
        selector,
        extraTemplateData,
        dependencySelectorsGlobals,
      },
      result,
    );
    return result;
  }
}
