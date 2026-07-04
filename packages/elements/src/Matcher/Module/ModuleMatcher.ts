import type { MatchersOptionsNormalized } from "../../Config";
import type { ModuleDescription } from "../../Descriptor";
import { isNull } from "../../Shared";
import { BaseElementsMatcher } from "../Shared";
import type { TemplateData, MatcherOptions, Micromatch } from "../Shared";

import type {
  ModuleSingleSelector,
  ModuleSelector,
} from "./ModuleSelector.types";
import { normalizeModuleSelector } from "./ModuleSelectorHelpers";

/**
 * Matcher class to determine if modules match a given selector.
 */
export class ModulesMatcher extends BaseElementsMatcher {
  /**
   * Creates a new ModulesMatcher.
   * @param config Configuration options for the matcher.
   * @param micromatch Micromatch instance for matching.
   */
  constructor(config: MatchersOptionsNormalized, micromatch: Micromatch) {
    super(config, micromatch);
  }

  /**
   * Whether the given origin matches the selector.
   * @param origin The origin to check.
   * @param selector The selector to check against.
   * @param templateData The data to use for replace in selector value.
   * @returns Whether the origin matches the selector.
   */
  private _isOriginMatch(
    origin: ModuleDescription,
    selector: ModuleSingleSelector,
    templateData: TemplateData
  ): boolean {
    return this.isObjectKeyMicromatchMatch({
      object: origin,
      selector,
      objectKey: "origin",
      selectorKey: "origin",
      selectorValue: selector.origin,
      templateData,
    });
  }

  /**
   * Whether the given module source matches the selector module.
   * @param origin The origin to check.
   * @param selector The selector to check against.
   * @param templateData The data to use for replace in selector value.
   * @returns Whether the module source matches the selector module.
   */
  private _isSourceMatch(
    origin: ModuleDescription,
    selector: ModuleSingleSelector,
    templateData: TemplateData
  ): boolean {
    return this.isObjectKeyMicromatchMatch({
      object: origin,
      selector,
      objectKey: "source",
      selectorKey: "source",
      selectorValue: selector.source,
      templateData,
    });
  }

  /**
   * Whether the given module internal path matches the selector module.
   * @param origin The origin to check.
   * @param selector The selector to check against.
   * @param templateData The data to use for replace in selector value.
   * @returns Whether the module internal path matches the selector module.
   */
  private _isInternalPathMatch(
    origin: ModuleDescription,
    selector: ModuleSingleSelector,
    templateData: TemplateData
  ): boolean {
    return this.isObjectKeyMicromatchMatch({
      object: origin,
      selector,
      objectKey: "internalPath",
      selectorKey: "internalPath",
      selectorValue: selector.internalPath,
      templateData,
    });
  }

  /**
   * Returns the selector matching result for the given module description, or null if none matches.
   * @param moduleDescription The module description to check.
   * @param selectorsData The selectors to check against.
   * @param extraTemplateData Extra template data to use for matching.
   * @returns The selector matching result for the given module description, or null if none matches.
   */
  private _getSelectorMatching(
    moduleDescription: ModuleDescription,
    selectorsData: ModuleSingleSelector[],
    extraTemplateData: TemplateData
  ): ModuleSingleSelector | null {
    const templateData: TemplateData = {
      origin: moduleDescription,
      ...extraTemplateData,
    };

    for (const selectorData of selectorsData) {
      if (
        !this._isOriginMatch(moduleDescription, selectorData, templateData) ||
        !this._isSourceMatch(moduleDescription, selectorData, templateData) ||
        !this._isInternalPathMatch(
          moduleDescription,
          selectorData,
          templateData
        )
      ) {
        continue;
      }

      return selectorData;
    }

    return null;
  }

  /**
   * Returns the selector matching result for the given module, or null if none matches.
   * @param moduleDescription The module to check.
   * @param selector The selector to check against.
   * @param options Extra options for matching, such as templates data, etc.
   * @returns The selector matching result for the given module, or null if none matches.
   */
  public getSelectorMatching(
    moduleDescription: ModuleDescription,
    selector: ModuleSelector,
    { extraTemplateData = {} }: MatcherOptions = {}
  ): ModuleSingleSelector | null {
    const selectorsData = normalizeModuleSelector(selector);
    return this._getSelectorMatching(
      moduleDescription,
      selectorsData,
      extraTemplateData
    );
  }

  /**
   * Returns whether the given module matches the selector.
   * @param moduleDescription The module to check.
   * @param selector The selector to check against.
   * @param options Extra options for matching, such as templates data, etc.
   * @returns Whether the module matches the selector.
   */
  public isModuleMatch(
    moduleDescription: ModuleDescription,
    selector: ModuleSelector,
    options?: MatcherOptions
  ): boolean {
    const selectorMatching = this.getSelectorMatching(
      moduleDescription,
      selector,
      options
    );
    return !isNull(selectorMatching);
  }
}
