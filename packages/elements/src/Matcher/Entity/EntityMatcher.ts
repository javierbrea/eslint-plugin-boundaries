import type { MatchersOptionsNormalized } from "../../Config";
import type { EntityDescription } from "../../Descriptor";
import type { ElementsMatcher } from "../Element";
import type { FilesMatcher } from "../File";
import type { OriginsMatcher } from "../Origin";
import { BaseElementsMatcher } from "../Shared";
import type { TemplateData, MatcherOptions, Micromatch } from "../Shared";

import type { EntityMatchResult } from "./EntityMatcher.types";
import type {
  EntitySelector,
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
    const elementSelectorMatching = selector.element
      ? this._elementsMatcher.getSelectorMatching(
          entity.element,
          selector.element,
          {
            extraTemplateData: templateData,
          }
        )
      : null;
    const fileSelectorMatching = selector.file
      ? this._filesMatcher.getSelectorMatching(entity.file, selector.file, {
          extraTemplateData: templateData,
        })
      : null;
    const originSelectorMatching = selector.origin
      ? this._originsMatcher.getSelectorMatching(
          entity.origin,
          selector.origin,
          {
            extraTemplateData: templateData,
          }
        )
      : null;

    return {
      element: elementSelectorMatching,
      file: fileSelectorMatching,
      origin: originSelectorMatching,
      isMatch: Boolean(
        (selector.element ? elementSelectorMatching : true) &&
          (selector.file ? fileSelectorMatching : true) &&
          (selector.origin ? originSelectorMatching : true)
      ),
    };
  }

  /**
   * Returns the first selector matching result for the given entity.
   * @param entity The entity description.
   * @param selector The entity selector normalized.
   * @param templateData The extra template data for selector values.
   * @returns The first selector matching result for the given entity.
   */
  private _getFirstSelectorMatching(
    entity: EntityDescription,
    selector: EntitySingleSelector[],
    templateData: TemplateData
  ): EntityMatchResult {
    for (const selectorData of selector) {
      const result = this._getSingleSelectorMatching(
        entity,
        selectorData,
        templateData
      );
      if (result.isMatch) {
        return result;
      }
    }

    return {
      element: null,
      file: null,
      origin: null,
      isMatch: false,
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
    selector: EntitySelector,
    { extraTemplateData = {} }: MatcherOptions = {}
  ): EntityMatchResult {
    const normalizedSelector = normalizeEntitySelector(selector);

    const elementExtraData = extraTemplateData.element || {};
    const fileExtraData = extraTemplateData.file || {};
    const originExtraData = extraTemplateData.origin || {};

    // Add extra template data for element, file and origin to be used in the matching of the selector properties.
    // TODO: Review, is this really needed?
    const templateData: TemplateData = {
      ...extraTemplateData,
      element: {
        ...entity.element,
        ...elementExtraData,
      },
      file: {
        ...entity.file,
        ...fileExtraData,
      },
      origin: {
        ...entity.origin,
        ...originExtraData,
      },
    };

    const result = this._getFirstSelectorMatching(
      entity,
      normalizedSelector,
      templateData
    );
    return result;
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
    selector: EntitySelector,
    options?: MatcherOptions
  ): boolean {
    const matchResult = this.getSelectorMatching(entity, selector, options);
    return matchResult.isMatch;
  }
}
