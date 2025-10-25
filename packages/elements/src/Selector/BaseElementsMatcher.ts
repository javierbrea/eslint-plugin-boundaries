import micromatch from "micromatch";

import type { MicromatchPattern } from "../Config";
import type {
  LocalElementKnown,
  CoreDependencyElement,
  LocalDependencyElementKnown,
  ExternalDependencyElement,
} from "../Descriptor";
import { isArray } from "../Support";

import type {
  BaseElementSelector,
  BaseElementSelectorData,
  DependencyElementSelectorData,
  DependencyElementSelector,
  BaseElementsSelector,
  ElementsSelector,
  ElementSelector,
  ElementSelectorData,
  DependencyElementsSelector,
} from "./ElementsSelector.types";
import {
  isSimpleElementSelectorByType,
  isElementSelectorWithLegacyOptions,
  isElementSelectorData,
} from "./ElementsSelectorHelpers";

/**
 * Base matcher class to determine if elements or dependencies match a given selector.
 */
export class BaseElementsMatcher {
  /**
   * Normalizes an ElementsSelector into an array of ElementSelectorData.
   * @param elementsSelector The elements selector, in any supported format.
   * @returns The normalized array of selector data.
   */
  protected normalizeElementsSelector(
    // eslint-disable-next-line no-unused-vars
    elementsSelector: BaseElementsSelector,
  ): BaseElementSelectorData[];
  protected normalizeElementsSelector(
    // eslint-disable-next-line no-unused-vars
    elementsSelector: DependencyElementsSelector,
  ): DependencyElementSelectorData[];

  protected normalizeElementsSelector(
    elementsSelector: ElementsSelector,
  ): ElementSelectorData[] {
    if (isArray(elementsSelector)) {
      if (isElementSelectorWithLegacyOptions(elementsSelector)) {
        return [this.normalizeSelector(elementsSelector)];
      }
      return elementsSelector.map((sel) => this.normalizeSelector(sel));
    }
    return [this.normalizeSelector(elementsSelector)];
  }

  /**
   * Normalizes a selector into ElementSelectorData format.
   * @param selector The selector to normalize.
   * @returns The normalized selector data.
   */
  protected normalizeSelector(
    // eslint-disable-next-line no-unused-vars
    selector: BaseElementSelector,
  ): BaseElementSelectorData;
  protected normalizeSelector(
    // eslint-disable-next-line no-unused-vars
    selector: DependencyElementSelector,
  ): DependencyElementSelectorData;

  protected normalizeSelector(selector: ElementSelector): ElementSelectorData {
    if (isSimpleElementSelectorByType(selector)) {
      return { type: selector };
    }

    if (isElementSelectorData(selector)) {
      return { ...selector };
    }

    if (isElementSelectorWithLegacyOptions(selector)) {
      if (isSimpleElementSelectorByType(selector[0])) {
        return {
          type: selector[0],
          captured: { ...selector[1] },
        };
      }
      return {
        ...selector[0],
        captured: { ...selector[1] },
      };
    }
    throw new Error("Invalid element selector");
  }

  /**
   * Whether the given element key matches the selector key using micromatch.
   * @param param0 The parameters object.
   * @returns Whether the element key matches the selector key.
   */
  protected isElementKeyMicromatchMatch<
    T extends
      | LocalElementKnown
      | CoreDependencyElement
      | ExternalDependencyElement
      | LocalDependencyElementKnown,
    S extends BaseElementSelectorData | DependencyElementSelectorData,
  >({
    element,
    selector,
    elementKey,
    selectorKey,
    selectorValue,
  }: {
    /** The element to check. */
    element: T;
    /** The selector to check against. */
    selector: S;
    /** The key of the element to check. */
    elementKey: T extends LocalElementKnown
      ? keyof LocalElementKnown
      : T extends CoreDependencyElement
        ? keyof CoreDependencyElement
        : T extends ExternalDependencyElement
          ? keyof ExternalDependencyElement
          : keyof LocalDependencyElementKnown;
    /** The key of the selector to check against. */
    selectorKey: S extends DependencyElementSelectorData
      ? keyof DependencyElementSelectorData
      : keyof BaseElementSelectorData;
    /** The value of the selector key to check against. */
    selectorValue?: MicromatchPattern;
  }): boolean {
    // The selector key does not exist in the selector, so it matches any value. We also check the value passed separately in order to improve typing inference.
    if (!(selectorKey in selector) || !selectorValue) {
      return true;
    }
    // The selector key exists in the selector, but it does not exist in the element. No match.
    if (!(elementKey in element)) {
      return false;
    }
    return micromatch.isMatch(elementKey, selectorValue);
  }
}
