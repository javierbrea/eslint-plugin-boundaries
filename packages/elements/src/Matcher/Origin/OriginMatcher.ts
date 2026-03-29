import type { MatchersOptionsNormalized } from "../../Config";
import type { OriginDescription } from "../../Descriptor";
import { isNull } from "../../Shared";
import { BaseElementsMatcher } from "../Shared";
import type { TemplateData, MatcherOptions, Micromatch } from "../Shared";

import type {
  OriginSingleSelector,
  OriginSelector,
} from "./OriginSelector.types";
import { normalizeOriginSelector } from "./OriginSelectorHelpers";

/**
 * Matcher class to determine if origins match a given selector.
 */
export class OriginsMatcher extends BaseElementsMatcher {
  /**
   * Creates a new OriginsMatcher.
   * @param config Configuration options for the matcher.
   * @param micromatch Micromatch instance for matching.
   */
  constructor(config: MatchersOptionsNormalized, micromatch: Micromatch) {
    super(config, micromatch);
  }

  /**
   * Whether the given origin kind matches the selector kind.
   * @param origin The origin to check.
   * @param selector The selector to check against.
   * @param templateData The data to use for replace in selector value.
   * @returns Whether the origin kind matches the selector kind.
   */
  private _isKindMatch(
    origin: OriginDescription,
    selector: OriginSingleSelector,
    templateData: TemplateData
  ): boolean {
    return this.isElementKeyMicromatchMatch({
      element: origin,
      selector,
      elementKey: "kind",
      selectorKey: "kind",
      selectorValue: selector.kind,
      templateData,
    });
  }

  /**
   * Whether the given origin module matches the selector module.
   * @param origin The origin to check.
   * @param selector The selector to check against.
   * @param templateData The data to use for replace in selector value.
   * @returns Whether the origin module matches the selector module.
   */
  private _isModuleMatch(
    origin: OriginDescription,
    selector: OriginSingleSelector,
    templateData: TemplateData
  ): boolean {
    return this.isElementKeyMicromatchMatch({
      element: origin,
      selector,
      elementKey: "module",
      selectorKey: "module",
      selectorValue: selector.module,
      templateData,
    });
  }

  /**
   * Returns the selector matching result for the given origin.
   * @param origin The origin to check.
   * @param selectorsData The selectors to check against.
   * @param extraTemplateData Extra template data to use for matching.
   * @returns The selector matching result for the given origin, or null if none matches.
   */
  private _getSelectorMatching(
    origin: OriginDescription,
    selectorsData: OriginSingleSelector[],
    extraTemplateData: TemplateData
  ): OriginSingleSelector | null {
    const templateData: TemplateData = {
      origin,
      ...extraTemplateData,
    };

    for (const selectorData of selectorsData) {
      if (
        !this._isKindMatch(origin, selectorData, templateData) ||
        !this._isModuleMatch(origin, selectorData, templateData)
      ) {
        continue;
      }

      return selectorData;
    }

    return null;
  }

  /**
   * Returns the selector matching result for the given origin, or null if none matches.
   * @param origin The origin to check.
   * @param selector The selector to check against.
   * @param options Extra options for matching, such as templates data, etc.
   * @returns The selector matching result for the given origin, or null if none matches.
   */
  public getSelectorMatching(
    origin: OriginDescription,
    selector: OriginSelector,
    { extraTemplateData = {} }: MatcherOptions = {}
  ): OriginSingleSelector | null {
    const selectorsData = normalizeOriginSelector(selector);
    return this._getSelectorMatching(origin, selectorsData, extraTemplateData);
  }

  /**
   * Returns whether the given origin matches the selector.
   * @param origin The origin to check.
   * @param selector The selector to check against.
   * @param options Extra options for matching, such as templates data, etc.
   * @returns Whether the origin matches the selector.
   */
  public isOriginMatch(
    origin: OriginDescription,
    selector: OriginSelector,
    options?: MatcherOptions
  ): boolean {
    const selectorMatching = this.getSelectorMatching(
      origin,
      selector,
      options
    );
    return !isNull(selectorMatching);
  }
}
