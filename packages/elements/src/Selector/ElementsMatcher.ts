import type { ElementDescription } from "../Descriptor";

import type { ElementsSelector } from "./ElementsSelector.types";

/**
 * Matcher class to determine if elements match a given selector. TODO: Design its API and implement it.
 */
export class ElementsMatcher {
  /**
   * The underlying selector used to match elements.
   */
  private _selector: ElementsSelector;

  /**
   * Creates a new ElementsSelectorMatcher.
   * @param selector The underlying selector used to match elements.
   */
  constructor(selector: ElementsSelector) {
    this._selector = selector;
  }

  /**
   * Returns whether the given element matches the selector.
   * @param element The element to check.
   * @returns Whether the element matches the selector.
   */

  // @ts-expect-error TODO: Implement the matching logic
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-unused-vars
  public isMatch(element: ElementDescription): boolean {
    // TODO: Implement the matching logic
    return true;
  }
}
