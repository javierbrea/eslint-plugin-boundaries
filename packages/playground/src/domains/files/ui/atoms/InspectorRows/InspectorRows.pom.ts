import { Pom } from "@/shared/testing/pom";

import type {
  InspectorRowLabelStyle,
  InspectorRowTextStyle,
} from "./InspectorRows.types";

/** The selector of the element a list of rows is drawn in. */
const LIST_SELECTOR = "ul";

/** Page object of the rows of the inspector that have nothing to fold. It has no test id: it finds the first `ul` within its parent. */
export class InspectorRowsPom extends Pom {
  protected readonly defaultTestId = "";

  /** @inheritdoc */
  protected findRoot(): HTMLElement {
    return this.findRootBySelector(LIST_SELECTOR);
  }

  /**
   * The rows, which are the `li` elements.
   * @returns The elements in order.
   */
  private get rowElements(): HTMLElement[] {
    return Array.from(this.root.querySelectorAll("li"));
  }

  /**
   * The row that has a label.
   * @param label The label, such as `to`.
   * @returns The `li` element.
   * @throws When the list has no such row.
   */
  private rowElement(label: string): HTMLElement {
    const row = this.rowElements.find(
      (item) => item.firstElementChild?.textContent === label
    );

    if (row === undefined) {
      throw new Error(`${this.constructor.name} found no row "${label}"`);
    }

    return row;
  }

  /**
   * The text element of a row, which follows its label.
   * @param label The label of the row.
   * @returns The element.
   */
  private textElement(label: string): HTMLElement {
    return this.rowElement(label).lastElementChild as HTMLElement;
  }

  /**
   * The rows of the list.
   * @returns The label and the text of each row, in order.
   */
  get rows(): { label: string; text: string }[] {
    return this.rowElements.map((row) => ({
      label: row.firstElementChild?.textContent ?? "",
      text: row.lastElementChild?.textContent ?? "",
    }));
  }

  /**
   * The color of the text of a row.
   * @param label The label of the row.
   * @returns The computed color.
   */
  textColor(label: string): string {
    return getComputedStyle(this.textElement(label)).color;
  }

  /**
   * The full text of a row, which is what its tooltip says when the text is cut.
   * @param label The label of the row.
   * @returns The `title` of the text, or null when it has none.
   */
  textTitle(label: string): string | null {
    return this.textElement(label).getAttribute("title");
  }

  /**
   * The text styles of the text of a row.
   * @param label The label of the row.
   * @returns The computed font family, size and weight, and how it is cut when it does not fit.
   */
  textStyle(label: string): InspectorRowTextStyle {
    const { fontFamily, fontSize, fontWeight, textOverflow, whiteSpace } =
      getComputedStyle(this.textElement(label));

    return { fontFamily, fontSize, fontWeight, textOverflow, whiteSpace };
  }

  /**
   * The text styles of the label of a row.
   * @param label The label of the row.
   * @returns The computed font family, size, weight, letter spacing, text transform and color.
   */
  labelStyle(label: string): InspectorRowLabelStyle {
    const {
      fontFamily,
      fontSize,
      fontWeight,
      letterSpacing,
      textTransform,
      color,
    } = getComputedStyle(this.rowElement(label).firstElementChild as Element);

    return {
      fontFamily,
      fontSize,
      fontWeight,
      letterSpacing,
      textTransform,
      color,
    };
  }

  /**
   * How far the label of a row is from the left, which is where the label of a header that folds starts.
   * @param label The label of the row.
   * @returns The computed padding on the left of the row.
   */
  indent(label: string): string {
    return getComputedStyle(this.rowElement(label)).paddingLeft;
  }
}
