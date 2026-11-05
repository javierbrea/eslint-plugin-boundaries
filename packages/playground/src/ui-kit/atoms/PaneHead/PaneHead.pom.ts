import { Pom } from "@/shared/testing/pom";
import { MonoPom } from "@/ui-kit/atoms/Mono/Mono.pom";

import type { PaneHeadTextStyle } from "./PaneHead.types";

/**
 * Reads the text styles of an element.
 * @param element The element.
 * @returns Its computed text styles.
 */
function readTextStyle(element: Element): PaneHeadTextStyle {
  const { fontFamily, fontSize, fontWeight, letterSpacing, textTransform } =
    getComputedStyle(element);

  return { fontFamily, fontSize, fontWeight, letterSpacing, textTransform };
}

/** Page object of the hint of a head, so that the page objects of what the hint holds search within it. The page object of the head builds it with the hint as its `root`. */
class HintPom extends Pom {
  protected readonly defaultTestId = "";

  /**
   * The code the hint holds.
   * @returns The text of each name or path in mono of the hint, in order.
   */
  get codeTexts(): string[] {
    const { count } = this.childPom(MonoPom);

    return Array.from(
      { length: count },
      (_, index) => this.childPom(MonoPom, { index }).text
    );
  }
}

/** Page object of the head of a pane. It has no role or test id: it finds the label of the head by the `name` option, which is required, and takes the parent of the label as its root. */
export class PaneHeadPom extends Pom {
  protected readonly defaultTestId = "";

  /** @inheritdoc */
  protected findRoot(): HTMLElement {
    const labelName = this.requireName();

    return this.pickMatch(
      this.searchBase
        .queryAllByText(labelName)
        .map((label) => label.parentElement as HTMLElement),
      `the label ${labelName}`
    );
  }

  /**
   * The elements of the head, which are the label, the path (when there is one), the end slot or the spacer, and the hint (when there is one).
   * @returns The elements in order.
   */
  private get items(): HTMLElement[] {
    return Array.from(this.root.children) as HTMLElement[];
  }

  /**
   * The name of the pane.
   * @returns The text of the label.
   */
  get label(): string {
    return this.items[0].textContent;
  }

  /**
   * The element the label is drawn in.
   * @returns The tag name of the label, in upper case.
   */
  get labelTag(): string {
    return this.items[0].tagName;
  }

  /**
   * The path of what the pane shows.
   * @returns The text of the path, or null when the head has none.
   */
  get path(): string | null {
    return this.pathElement?.textContent ?? null;
  }

  /**
   * The full path, which is also what the tooltip of the path says.
   * @returns The `title` of the path, or null when the head has none.
   */
  get pathTitle(): string | null {
    return this.pathElement?.getAttribute("title") ?? null;
  }

  /**
   * Whether the head shows a path.
   * @returns True when the head has a path.
   */
  get hasPath(): boolean {
    return this.pathElement !== null;
  }

  /**
   * The short help for the pane.
   * @returns The text of the hint, or null when the head has none.
   */
  get hint(): string | null {
    return this.hintElement?.textContent ?? null;
  }

  /**
   * The code the hint holds, when it accepts elements.
   * @returns The text of each name or path in mono of the hint, in order; empty when the head has no hint.
   */
  get hintCodeTexts(): string[] {
    const { hintElement } = this;

    return hintElement === null
      ? []
      : this.childPom(HintPom, { root: hintElement }).codeTexts;
  }

  /**
   * The labels of the buttons of the end slot.
   * @returns The text of each button of the head, in order.
   */
  get buttonLabels(): string[] {
    return this.scope
      .queryAllByRole("button")
      .map((button) => button.textContent);
  }

  /**
   * The text of each element of the head, in order.
   * @returns The text of the label, the path, the end slot (empty for the spacer) and the hint.
   */
  get itemTexts(): string[] {
    return this.items.map((item) => item.textContent);
  }

  /**
   * The text styles of the label.
   * @returns The computed styles of the head, which the label takes.
   */
  get labelStyle(): PaneHeadTextStyle {
    return readTextStyle(this.root);
  }

  /**
   * The text styles of the path.
   * @returns The computed styles of the path.
   */
  get pathStyle(): PaneHeadTextStyle {
    return readTextStyle(this.requireElement(this.pathElement, "path"));
  }

  /**
   * The text styles of the hint.
   * @returns The computed styles of the hint.
   */
  get hintStyle(): PaneHeadTextStyle {
    return readTextStyle(this.requireElement(this.hintElement, "hint"));
  }

  /**
   * The element of the path, which is the one of the items of the head that has a title. What the end slot or the hint holds is not an item, so a title inside them is not the path.
   * @returns The element, or null when the head has none.
   */
  private get pathElement(): HTMLElement | null {
    return this.items.find((item) => item.hasAttribute("title")) ?? null;
  }

  /**
   * The element of the hint, which comes right after the end slot (or the spacer), which comes after the label and the path when there is one.
   * @returns The element, or null when the head has none.
   */
  private get hintElement(): HTMLElement | null {
    const itemsBeforeEndSlot = this.pathElement === null ? 1 : 2;

    return this.items.at(itemsBeforeEndSlot + 1) ?? null;
  }

  /**
   * Narrows an element of the head that the caller needs.
   * @param element The element, or null when the head has none.
   * @param description What the element is, for the error.
   * @returns The element.
   * @throws When the head has none.
   */
  private requireElement(
    element: HTMLElement | null,
    description: string
  ): HTMLElement {
    if (element === null) {
      throw new Error(`${this.constructor.name} found no ${description}`);
    }

    return element;
  }
}
