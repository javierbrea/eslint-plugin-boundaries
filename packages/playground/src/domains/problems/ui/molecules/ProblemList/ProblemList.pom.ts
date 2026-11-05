import { fireEvent } from "@testing-library/react";

import { OWN_CLASS, getStyle } from "@/shared/testing/emittedStyle";
import { Pom } from "@/shared/testing/pom";
import { IconPom } from "@/ui-kit/atoms/Icon/Icon.pom";

import { PROBLEM_LIST_TEST_ID } from "./ProblemList.constants";
import type {
  ProblemListEmptyStyle,
  ProblemRowLayout,
  ProblemRowTextStyle,
} from "./ProblemList.types";

/** Page object of a row of the problem list, a part of the list: the page object of the list builds it, so it is exported only as a type. It has no test id: it finds the list items within its parent, and the `index` and `containing` options pick among them. */
class ProblemRowPom extends Pom {
  protected readonly defaultTestId = "";

  /** @inheritdoc */
  protected findRoot(): HTMLElement {
    return this.pickMatch(
      this.searchBase.queryAllByRole("listitem"),
      'the role "listitem"'
    );
  }

  /**
   * How many rows its parent holds, whatever the `index` and `containing` options. A page object that lists them builds one `ProblemRowPom` per index below this number.
   * @returns The number of list items within the parent.
   */
  get count(): number {
    return this.searchBase.queryAllByRole("listitem").length;
  }

  /**
   * The content of the row, which is a button when the row opens something and plain content otherwise.
   * @returns The first element of the row.
   */
  private get content(): HTMLElement {
    return this.root.firstElementChild as HTMLElement;
  }

  /**
   * The parts of the content: the icon, where the problem is, the message and the meta line.
   * @returns The elements in order.
   */
  private get parts(): HTMLElement[] {
    return Array.from(this.content.children) as HTMLElement[];
  }

  /**
   * Where the problem is, with its position.
   * @returns The second part of the row.
   */
  private get where(): HTMLElement {
    return this.parts[1];
  }

  /**
   * The position, when the row has one.
   * @returns The element next to the location, or undefined.
   */
  private get positionElement(): HTMLElement | undefined {
    return this.where.children[0] as HTMLElement | undefined;
  }

  /**
   * Everything the row says.
   * @returns The text of the row: the location, the position, the message and the meta line.
   */
  get text(): string {
    return this.root.textContent;
  }

  /**
   * What the problem is about, without the position.
   * @returns The first text of the location.
   */
  get location(): string {
    return this.where.childNodes[0].textContent ?? "";
  }

  /**
   * Where the problem is, with the position next to it.
   * @returns The text of the location, such as `eslint.config.js:15:16`.
   */
  get locationWithPosition(): string {
    return this.where.textContent;
  }

  /**
   * Where in the location the problem is.
   * @returns The position, such as `:15:16`, or null when the row has none.
   */
  get position(): string | null {
    return this.positionElement?.textContent ?? null;
  }

  /**
   * The color of the position.
   * @returns The computed value.
   */
  get positionColor(): string {
    return getComputedStyle(this.positionElement as HTMLElement).color;
  }

  /**
   * What is wrong.
   * @returns The text of the message.
   */
  get message(): string {
    return this.parts[2].textContent;
  }

  /**
   * The color of the message.
   * @returns The computed value.
   */
  get messageColor(): string {
    return getComputedStyle(this.parts[2]).color;
  }

  /**
   * The line below the message.
   * @returns The text of the meta line, spaces included.
   */
  get meta(): string {
    return this.parts[3].textContent;
  }

  /**
   * The color of the meta line.
   * @returns The computed value.
   */
  get metaColor(): string {
    return getComputedStyle(this.parts[3]).color;
  }

  /**
   * How the meta line treats its spaces.
   * @returns The computed `white-space`.
   */
  get metaWhiteSpace(): string {
    return getComputedStyle(this.parts[3]).whiteSpace;
  }

  /**
   * The icon of the level.
   * @returns The page object of the icon.
   */
  get icon(): IconPom {
    return this.childPom(IconPom);
  }

  /**
   * Whether the row is a button that opens something.
   * @returns True when the row holds a button.
   */
  get opens(): boolean {
    return this.scope.queryAllByRole("button").length > 0;
  }

  /**
   * The type of the button of the row.
   * @returns The `type` attribute, or null when the row has no button or the button has none.
   */
  get buttonType(): string | null {
    return this.scope.queryByRole("button")?.getAttribute("type") ?? null;
  }

  /**
   * The text styles of the content of the row, whether it opens something or not.
   * @returns The computed font family, size and line height.
   */
  get textStyle(): ProblemRowTextStyle {
    const { fontFamily, fontSize, lineHeight } = getComputedStyle(this.content);

    return { fontFamily, fontSize, lineHeight };
  }

  /**
   * How the content of the row is laid out.
   * @returns The computed display, and the alignment of the button of MUI, which would center its content.
   */
  get layout(): ProblemRowLayout {
    const { display, alignItems, justifyContent } = getComputedStyle(
      this.content
    );

    return { display, alignItems, justifyContent };
  }

  /**
   * The ring that shows the keyboard focus, which jsdom cannot compute: it is read from the rule that applies on keyboard focus.
   * @returns The declarations of that rule.
   */
  get focusStyle(): Record<string, string> {
    return getStyle(this.content, `${OWN_CLASS}:focus-visible`);
  }

  /**
   * What the row looks like under the pointer, which jsdom cannot compute: it is read from the rule that applies on hover.
   * @returns The declarations of that rule.
   */
  get hoverStyle(): Record<string, string> {
    return getStyle(this.content, `${OWN_CLASS}:hover`);
  }

  /** Presses the content of the row. */
  press(): void {
    fireEvent.click(this.content);
  }
}

/** Page object of the problem list. It finds its root by the test id, whether the list holds rows or says there are none. */
export class ProblemListPom extends Pom {
  protected readonly defaultTestId = PROBLEM_LIST_TEST_ID;

  /**
   * How many rows the list has.
   * @returns The number of list items.
   */
  get rowCount(): number {
    return this.childPom(ProblemRowPom).count;
  }

  /**
   * The rows, in order.
   * @returns One page object for each row.
   */
  get rows(): ProblemRowPom[] {
    return Array.from({ length: this.rowCount }, (_, index) =>
      this.childPom(ProblemRowPom, { index })
    );
  }

  /**
   * Gets the row that says a text.
   * @param containing Part of what the row says, such as its location with its position.
   * @returns The page object of the row.
   */
  row(containing: string): ProblemRowPom {
    return this.childPom(ProblemRowPom, { containing });
  }

  /**
   * How many rows are buttons that open something.
   * @returns The number of buttons.
   */
  get openableRowCount(): number {
    return this.scope.queryAllByRole("button").length;
  }

  /**
   * What the list says when it has no rows.
   * @returns The sentence, or null when the list has rows.
   */
  get emptyText(): string | null {
    return this.rowCount === 0 ? this.root.textContent : null;
  }

  /**
   * Whether a text is among the content of the list, which is how a spec checks that the sentence for no rows is not drawn next to the rows.
   * @param text The text of an element.
   * @returns True when an element of the list, or the list itself, has that text.
   */
  holds(text: string): boolean {
    return this.scope.queryByText(text) !== null;
  }

  /**
   * The text styles of the sentence that says there are no rows.
   * @returns The computed color, font family and font size.
   */
  get emptyStyle(): ProblemListEmptyStyle {
    const { color, fontFamily, fontSize } = getComputedStyle(this.root);

    return { color, fontFamily, fontSize };
  }
}

export type { ProblemRowPom };
