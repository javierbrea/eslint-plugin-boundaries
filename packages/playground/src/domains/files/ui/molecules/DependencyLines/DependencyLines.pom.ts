import { act, fireEvent, waitFor } from "@testing-library/react";

import { StatementPom } from "@/domains/files/ui/atoms/Statement/Statement.pom";
import { OWN_CLASS, getStyle } from "@/shared/testing/emittedStyle";
import { Pom } from "@/shared/testing/pom";
import { IconPom } from "@/ui-kit/atoms/Icon/Icon.pom";

import {
  DELETE_ACTION_LABEL,
  DEPENDENCY_LINES_TEST_ID,
  EDIT_ACTION_LABEL,
} from "./DependencyLines.constants";

/** Page object of a tooltip. MUI renders it in a portal, outside the list, so it finds the tooltip within the whole document: build it with the `portal` option. */
class TooltipPom extends Pom {
  protected readonly defaultTestId = "";

  /** @inheritdoc */
  protected findRoot(): HTMLElement {
    return this.pickMatch(
      this.searchBase.queryAllByRole("tooltip"),
      'the role "tooltip"'
    );
  }

  /**
   * What the tooltip says.
   * @returns The text of the tooltip.
   */
  get text(): string {
    return this.root.textContent;
  }

  /**
   * Waits for the tooltip to be in the document, which MUI does after a delay.
   * @returns A promise that settles when the tooltip is there.
   */
  async waitUntilShown(): Promise<void> {
    await waitFor(() => this.root);
  }
}

/** Page object of the verdict of a line, a part of the line: the page object of the line builds it, so it is exported only as a type. It has no test id: its root is the last element of its parent, which is where the line puts it. */
class VerdictPom extends Pom {
  protected readonly defaultTestId = "";

  /** @inheritdoc */
  protected findRoot(): HTMLElement {
    const { lastElementChild: last } = this.searchBaseElement;

    return this.pickMatch(
      last === null ? [] : [last as HTMLElement],
      "the last element of its parent"
    );
  }

  /**
   * What the verdict reads, without the icon.
   * @returns The text of the verdict, such as `policy 2`.
   */
  get text(): string {
    return this.root.textContent;
  }

  /**
   * The color of the verdict and of its icon.
   * @returns The computed color.
   */
  get color(): string {
    return getComputedStyle(this.root).color;
  }

  /**
   * How visible the verdict is, which fades while it is of an evaluation that is out of date.
   * @returns The computed `opacity`: `1`, or `0.5` while it is faded.
   */
  get opacity(): string {
    return getComputedStyle(this.root).opacity;
  }

  /**
   * The icon of the verdict.
   * @returns The page object of the icon, which is not rendered when the verdict has none.
   */
  get icon(): IconPom {
    return this.childPom(IconPom);
  }

  /**
   * Where the verdict sits in its column.
   * @returns The computed `justify-content`, which is `flex-end` when the verdict is right-aligned.
   */
  get alignment(): string {
    return getComputedStyle(this.root).justifyContent;
  }

  /**
   * The font size of the verdict.
   * @returns The computed value.
   */
  get fontSize(): string {
    return getComputedStyle(this.root).fontSize;
  }

  /** Puts the pointer over the verdict, which shows its tooltip when it has one. */
  hover(): void {
    fireEvent.mouseOver(this.root);
  }

  /** Gives the keyboard focus to the verdict, as Tab does, which shows its tooltip when it has one. */
  focus(): void {
    act(() => this.root.focus());
  }

  /**
   * Whether the keyboard reaches the verdict with Tab.
   * @returns True when the verdict is in the tab order.
   */
  get isTabStop(): boolean {
    return this.root.tabIndex === 0;
  }

  /**
   * Whether the verdict has the keyboard focus.
   * @returns True when the verdict is the active element of the page.
   */
  get isFocused(): boolean {
    return document.activeElement === this.root;
  }

  /**
   * Whether the sentence of the tooltip replaces the text of the verdict as its name, which assistive technology would then read instead of what is drawn.
   * @returns True when the verdict has an `aria-label`.
   */
  get hasLabel(): boolean {
    return this.root.hasAttribute("aria-label");
  }

  /**
   * What assistive technology reads as the description of the verdict: the element that `aria-describedby` points to while the tooltip is open, and the `title` that MUI leaves while it is closed.
   * @returns The text of the description, or null when the verdict has none.
   */
  get description(): string | null {
    const id = this.root.getAttribute("aria-describedby");
    const described = id === null ? null : document.getElementById(id);

    return described?.textContent ?? this.root.getAttribute("title");
  }
}

/** Page object of a button of the actions of a line, a part of the line: the page object of the line builds it, so it is exported only as a type. It has no test id: it finds the button by its accessible name, the `name` option, within its parent. */
class LineActionPom extends Pom {
  protected readonly defaultTestId = "";

  /** @inheritdoc */
  protected findRoot(): HTMLElement {
    const buttonName = this.requireName();

    return this.pickMatch(
      this.searchBase.queryAllByRole("button", { name: buttonName }),
      `the role "button" named ${buttonName}`
    );
  }

  /**
   * The icon of the button.
   * @returns The page object of the icon.
   */
  get icon(): IconPom {
    return this.childPom(IconPom);
  }

  /**
   * How visible the actions of the line are, which the element that holds the button decides.
   * @returns The computed opacity of the holder: `0` while the line is not selected, under the pointer or with the focus inside, and `1` while it is the selected one.
   */
  get holderOpacity(): string {
    return getComputedStyle(this.root.parentElement as HTMLElement).opacity;
  }

  /**
   * Whether the button has the keyboard focus.
   * @returns True when the button is the active element of the page.
   */
  get isFocused(): boolean {
    return document.activeElement === this.root;
  }

  /** Presses the button. */
  press(): void {
    fireEvent.click(this.root);
  }

  /** Puts the pointer over the button, which shows its tooltip. */
  hover(): void {
    fireEvent.mouseOver(this.root);
  }

  /** Gives the keyboard focus to the button, as Tab does. */
  focus(): void {
    act(() => this.root.focus());
  }
}

/** Page object of a line of the dependency list, a part of the list: the page object of the list builds it, so it is exported only as a type. It has no test id: it finds the list items within its parent, and the `index` option picks one. */
class DependencyLinePom extends Pom {
  protected readonly defaultTestId = "";

  /** @inheritdoc */
  protected findRoot(): HTMLElement {
    return this.pickMatch(
      this.searchBase.queryAllByRole("listitem"),
      'the role "listitem"'
    );
  }

  /**
   * The button that selects the line, which holds its statement and has the line as its target.
   * @returns The element, which is the first button of the line.
   */
  private get selectButton(): HTMLElement {
    return this.scope.getAllByRole("button")[0];
  }

  /**
   * How many lines its parent holds, whatever the `index` option. A page object that lists them builds one `DependencyLinePom` per index below this number.
   * @returns The number of list items within the parent.
   */
  get count(): number {
    return this.searchBase.queryAllByRole("listitem").length;
  }

  /**
   * Everything the line says, which is its number, its statement and its verdict.
   * @returns The text of the line.
   */
  get text(): string {
    return this.root.textContent;
  }

  /**
   * The number of the line.
   * @returns The text of the first element of the line.
   */
  get number(): string | null {
    return this.root.firstElementChild?.textContent ?? null;
  }

  /**
   * The statement of the line.
   * @returns The page object of the statement.
   */
  get statement(): StatementPom {
    return this.childPom(StatementPom);
  }

  /**
   * The statement as it reads.
   * @returns The text of the statement.
   */
  get statementText(): string {
    return this.statement.text;
  }

  /**
   * The pieces of the statement with the color each one is drawn in.
   * @returns For each piece, in order, its text and its color.
   */
  get statementParts(): StatementPom["parts"] {
    return this.statement.parts;
  }

  /**
   * The verdict of the line.
   * @returns The page object of the verdict.
   */
  get verdict(): VerdictPom {
    return this.childPom(VerdictPom);
  }

  /**
   * The accessible name of each action of the line, in order. The first button of the line selects it and is named by its statement, so it is not an action.
   * @returns The name of each action; empty while the dependencies cannot be edited.
   */
  get actionNames(): string[] {
    return this.accessibleNames("button").slice(1);
  }

  /**
   * How many buttons of the line are inside another button, which assistive technology cannot reach.
   * @returns The number of buttons that have a button among their ancestors within the line.
   */
  get nestedButtonCount(): number {
    return Array.from(
      this.root.querySelectorAll("button, [role='button']")
    ).filter(
      (button) =>
        button.parentElement?.closest("button, [role='button']") !== null
    ).length;
  }

  /**
   * Whether the line is the one in focus, as assistive technology reads it: the button that selects it is the current item.
   * @returns True when the button of the line is marked as the current item.
   */
  get isSelected(): boolean {
    return this.scope.queryByRole("button", { current: true }) !== null;
  }

  /**
   * The background of the line, which is what marks it as selected or under the pointer.
   * @returns The computed background color of the line when it is selected, which jsdom cannot tell under the pointer.
   */
  get backgroundColor(): string {
    return getComputedStyle(this.root).backgroundColor;
  }

  /**
   * The columns of the line: its number, its statement, its actions and its verdict.
   * @returns The computed `grid-template-columns`.
   */
  get columns(): string {
    return getComputedStyle(this.root).gridTemplateColumns;
  }

  /**
   * Where the statement may break a word to fit its column, so that a long path wraps and is never cut.
   * @returns The computed `overflow-wrap` of the button that holds the statement.
   */
  get statementWrap(): string {
    return getComputedStyle(this.selectButton).overflowWrap;
  }

  /**
   * The bar on the left of the line while it is selected.
   * @returns The computed box shadow of the line.
   */
  get boxShadow(): string {
    return getComputedStyle(this.root).boxShadow;
  }

  /**
   * What the line looks like under the pointer, which jsdom cannot compute: it is read from the rule that applies on hover.
   * @returns The declarations of that rule.
   */
  get hoverStyle(): Record<string, string> {
    return getStyle(this.root, `${OWN_CLASS}:hover`);
  }

  /**
   * What the actions of the line look like under the pointer, which jsdom cannot compute: it is read from the rule that applies on hover.
   * @returns The declarations of that rule.
   */
  get actionsHoverStyle(): Record<string, string> {
    return getStyle(this.root, `${OWN_CLASS}:hover [data-actions]`);
  }

  /**
   * What the actions of the line look like while the line is the selected one: jsdom does not weigh the specificity of the rules, so it is read from the rule that applies then.
   * @returns The declarations of that rule.
   */
  get actionsSelectedStyle(): Record<string, string> {
    return getStyle(this.root, `${OWN_CLASS}[data-selected] [data-actions]`);
  }

  /**
   * What the actions of the line look like while the keyboard focus is inside the line, which jsdom cannot compute: it is read from the rule that applies then.
   * @returns The declarations of that rule.
   */
  get actionsFocusStyle(): Record<string, string> {
    return getStyle(this.root, `${OWN_CLASS}:focus-within [data-actions]`);
  }

  /**
   * The accessible name of the edit action of the line.
   * @returns The name, which ends with the number of the line.
   */
  private get editName(): string {
    return `${EDIT_ACTION_LABEL} ${this.number}`;
  }

  /**
   * The button that edits the line.
   * @returns The page object of the button, which is not rendered while the dependencies cannot be edited.
   */
  get editAction(): LineActionPom {
    return this.childPom(LineActionPom, { name: this.editName });
  }

  /**
   * The button that removes the line.
   * @returns The page object of the button, which is not rendered while the dependencies cannot be edited.
   */
  get deleteAction(): LineActionPom {
    return this.childPom(LineActionPom, {
      name: `${DELETE_ACTION_LABEL} ${this.number}`,
    });
  }

  /** Clicks the line, as the user does to put it in focus. */
  click(): void {
    fireEvent.click(this.selectButton);
  }

  /** Gives the keyboard focus to the button that selects the line. */
  focus(): void {
    act(() => this.selectButton.focus());
  }

  /**
   * Whether the button that selects the line has the keyboard focus.
   * @returns True when that button is the active element of the page.
   */
  get isFocused(): boolean {
    return document.activeElement === this.selectButton;
  }

  /**
   * Presses a key while the line has the keyboard focus.
   * @param key The `key` of the event, such as `Enter`.
   */
  pressKey(key: string): void {
    fireEvent.keyDown(this.selectButton, { key });
  }

  /**
   * Releases a key while the line has the keyboard focus, which is when the space activates it.
   * @param key The `key` of the event, such as ` `.
   */
  releaseKey(key: string): void {
    fireEvent.keyUp(this.selectButton, { key });
  }
}

/** Page object of the dependency list of a file. It is not rendered for an empty list. */
export class DependencyLinesPom extends Pom {
  protected readonly defaultTestId = DEPENDENCY_LINES_TEST_ID;

  /**
   * The lines of the list, in order.
   * @returns One page object for each line.
   */
  get lines(): DependencyLinePom[] {
    const { count } = this.childPom(DependencyLinePom);

    return Array.from({ length: count }, (_, index) => this.line(index));
  }

  /**
   * One line of the list.
   * @param index The position of the line, from 0.
   * @returns The page object of the line.
   */
  line(index: number): DependencyLinePom {
    return this.childPom(DependencyLinePom, { index });
  }

  /**
   * What each line says, in order.
   * @returns The number of the line, its statement and its verdict.
   */
  get lineTexts(): string[] {
    return this.lines.map(({ text }) => text);
  }

  /**
   * The number of each line, in order.
   * @returns The text of each line number.
   */
  get lineNumbers(): (string | null)[] {
    return this.lines.map(({ number }) => number);
  }

  /**
   * The tooltip that a verdict or an action shows.
   * @returns The page object of the tooltip, which is not rendered until the pointer reaches something that has one.
   */
  get tooltip(): TooltipPom {
    return this.childPom(TooltipPom, { portal: true });
  }
}

export type { DependencyLinePom, LineActionPom, TooltipPom, VerdictPom };
