import type { MatchersOptionsNormalized } from "../../Config";
import type { EntityDescription } from "../../Descriptor";
import { isNull, isUndefined } from "../../Shared";
import type { ElementsMatcher } from "../Element";
import type { FilesMatcher } from "../File";
import type { OriginsMatcher } from "../Origin";
import { BaseElementsMatcher } from "../Shared";
import type { TemplateData, MatcherOptions, Micromatch } from "../Shared";

import type {
  EntityMatchResult,
  EntitySingleSelectorMatchResult,
} from "./EntityMatcher.types";
import type {
  BackwardCompatibleEntitySelector,
  EntitySingleSelector,
} from "./EntitySelector.types";
import { normalizeEntitySelector } from "./EntitySelectorHelpers";

/**
 * Matcher class to determine if entities match a given entity selector.
 */
export class EntitiesMatcher extends BaseElementsMatcher {
  /**
   * Elements matcher to use for matching elements within entities.
   */
  private readonly _elementsMatcher: ElementsMatcher;
  private readonly _filesMatcher: FilesMatcher;
  private readonly _originsMatcher: OriginsMatcher;

  /**
   * Creates a new EntitiesMatcher.
   * @param elementsMatcher Elements matcher to use for matching elements within entities.
   * @param config Configuration options for the matcher.
   * @param micromatch Micromatch instance for matching.
   * @param globalCache Global cache instance.
   */
  constructor(
    elementsMatcher: ElementsMatcher,
    filesMatcher: FilesMatcher,
    originsMatcher: OriginsMatcher,
    config: MatchersOptionsNormalized,
    micromatch: Micromatch
  ) {
    super(config, micromatch);
    this._elementsMatcher = elementsMatcher;
    this._filesMatcher = filesMatcher;
    this._originsMatcher = originsMatcher;
  }

  /**
   * Returns the selectors matching result for the given entity.
   * @param entity The entity description.
   * @param selector The entity selector normalized.
   * @param extraTemplateData The extra template data for selector values.
   * @returns The selectors matching result for the given entity.
   */
  private _getSingleSelectorMatching(
    entity: EntityDescription,
    selector: EntitySingleSelector,
    templateData: TemplateData
  ): EntityMatchResult {
    const elementSelectorMatching = isUndefined(selector.element)
      ? undefined
      : this._elementsMatcher.getSelectorMatching(
          entity.element,
          selector.element,
          {
            extraTemplateData: templateData,
          }
        );
    const fileSelectorMatching = isUndefined(selector.file)
      ? undefined
      : this._filesMatcher.getSelectorMatching(entity.file, selector.file, {
          extraTemplateData: templateData,
        });
    const originSelectorMatching = isUndefined(selector.origin)
      ? undefined
      : this._originsMatcher.getSelectorMatching(
          entity.origin,
          selector.origin,
          {
            extraTemplateData: templateData,
          }
        );

    const selectorResult: EntitySingleSelectorMatchResult = {};
    if (elementSelectorMatching) {
      selectorResult.element = elementSelectorMatching;
    }
    if (fileSelectorMatching) {
      selectorResult.file = fileSelectorMatching;
    }
    if (originSelectorMatching) {
      selectorResult.origin = originSelectorMatching;
    }

    const isMatch = Boolean(
      (selector.element ? elementSelectorMatching : true) &&
        (selector.file ? fileSelectorMatching : true) &&
        (selector.origin ? originSelectorMatching : true)
    );

    return {
      selector: isMatch ? selectorResult : null,
      isMatch,
    };
  }

  /**
   * Returns the selectors matching result for the given entity.
   * @param entity The entity to check.
   * @param selector The selector to check against.
   * @param options Extra options for matching, such as templates data, etc.
   * @returns The matching result for the entity against the selector.
   */
  public getSelectorMatching(
    entity: EntityDescription,
    selector: BackwardCompatibleEntitySelector,
    { extraTemplateData = {} }: MatcherOptions = {}
  ): EntitySingleSelectorMatchResult | null {
    const normalizedSelector = normalizeEntitySelector(selector);

    const elementExtraData = extraTemplateData.element || {};
    const fileExtraData = extraTemplateData.file || {};
    const originExtraData = extraTemplateData.origin || {};

    const templateData: TemplateData = {
      ...extraTemplateData,
      element: { ...entity.element, ...elementExtraData },
      file: { ...entity.file, ...fileExtraData },
      origin: { ...entity.origin, ...originExtraData },
    };

    for (const selectorData of normalizedSelector) {
      const result = this._getSingleSelectorMatching(
        entity,
        selectorData,
        templateData
      );
      if (result.isMatch) {
        return result.selector;
      }
    }

    return null;
  }

  /**
   * Returns whether the given entity matches the selector.
   * @param entity The entity to check.
   * @param selector The selector to check against.
   * @param options Extra options for matching, such as templates data, etc.
   * @returns Whether the entity matches the selector properties.
   */
  public isEntityMatch(
    entity: EntityDescription,
    selector: BackwardCompatibleEntitySelector,
    options?: MatcherOptions
  ): boolean {
    const matchResult = this.getSelectorMatching(entity, selector, options);
    return !isNull(matchResult);
  }
}
