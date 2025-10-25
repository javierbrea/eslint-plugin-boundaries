import type { ElementDescription } from "../Descriptor";
import { isArray } from "../Support";

import type {
  ElementSelectorData,
  ElementsSelector,
  ElementSelector,
  FileElementSelector,
  FileElementSelectorData,
  DependencyElementSelector,
  DependencyElementSelectorData,
  FileElementsSelector,
  DependencyElementsSelector,
} from "./ElementsSelector.types";
import {
  isSimpleElementSelectorByType,
  isElementSelectorWithLegacyOptions,
  isElementSelectorData,
} from "./ElementsSelectorHelpers";

/**
 * Matcher class to determine if elements match a given selector.
 */
export class ElementsMatcher {
  /**
   * The underlying selector used to match elements.
   */
  private _selectorData: ElementSelectorData[];

  /**
   * Creates a new ElementsSelectorMatcher.
   * @param selector The underlying selector used to match elements.
   */
  constructor(selector: ElementsSelector) {
    this._selectorData = this._normalizeElementsSelector(selector);
  }

  /**
   * Normalizes an ElementsSelector into an array of ElementSelectorData.
   * @param elementsSelector The elements selector, in any supported format.
   * @returns The normalized array of selector data.
   */
  private _normalizeElementsSelector(
    // eslint-disable-next-line no-unused-vars
    elementsSelector: FileElementsSelector,
  ): FileElementSelectorData[];
  private _normalizeElementsSelector(
    // eslint-disable-next-line no-unused-vars
    elementsSelector: DependencyElementsSelector,
  ): DependencyElementSelectorData[];

  private _normalizeElementsSelector(
    elementsSelector: ElementsSelector,
  ): ElementSelectorData[] {
    if (isArray(elementsSelector)) {
      if (isElementSelectorWithLegacyOptions(elementsSelector)) {
        return [this._normalizeSelector(elementsSelector)];
      }
      return elementsSelector.map((sel) => this._normalizeSelector(sel));
    }
    return [this._normalizeSelector(elementsSelector)];
  }

  /**
   * Normalizes a selector into ElementSelectorData format.
   * @param selector The selector to normalize.
   * @returns The normalized selector data.
   */
  private _normalizeSelector(
    // eslint-disable-next-line no-unused-vars
    selector: FileElementSelector,
  ): FileElementSelectorData;
  private _normalizeSelector(
    // eslint-disable-next-line no-unused-vars
    selector: DependencyElementSelector,
  ): DependencyElementSelectorData;

  private _normalizeSelector(selector: ElementSelector): ElementSelectorData {
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
   * Returns the normalized selector data.
   * @returns The normalized selector data.
   */
  public get selector(): ElementSelectorData[] {
    return this._selectorData;
  }

  /**
   * Returns whether the given element matches the selector.
   * @param element The element to check.
   * @returns Whether the element matches the selector.
   */
  // @ts-expect-error Matching logic not implemented yet
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-unused-vars
  public isMatch(element: ElementDescription): boolean {
    // TODO: Implement the matching logic
    return true;
  }
}
