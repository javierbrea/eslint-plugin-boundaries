import { Pom } from "@/shared/testing/pom";

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
   * @returns True when the head has an element with a title.
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
   * @returns The text of each `code` element of the hint.
   */
  get hintCodeTexts(): string[] {
    return Array.from(this.hintElement?.querySelectorAll("code") ?? []).map(
      (code) => code.textContent
    );
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
   * The element of the path, which is the one with a title.
   * @returns The element, or null when the head has none.
   */
  private get pathElement(): HTMLElement | null {
    return this.root.querySelector<HTMLElement>("[title]");
  }

  /**
   * The element of the hint, which is the last one of the head when it has one. A head holds the label, the path (if any), the end slot or the spacer, and the hint (if any).
   * @returns The element, or null when the head has none.
   */
  private get hintElement(): HTMLElement | null {
    const { items } = this;
    const itemsWithoutHint = this.pathElement === null ? 2 : 3;

    return items.length > itemsWithoutHint ? items[items.length - 1] : null;
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
