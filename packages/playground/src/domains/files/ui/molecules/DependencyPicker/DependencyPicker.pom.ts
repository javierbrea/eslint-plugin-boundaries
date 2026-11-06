import { act, fireEvent, within } from "@testing-library/react";

import { NamesEditorPom } from "@/domains/files/ui/atoms/NamesEditor/NamesEditor.pom";
import { StatementPom } from "@/domains/files/ui/atoms/Statement/Statement.pom";
import { Pom } from "@/shared/testing/pom";

import {
  DEPENDENCY_PICKER_TEST_ID,
  FILE_FIELD_LABEL,
  IMPORTED_ROW_LABEL,
  KIND_ROW_LABEL,
  MODULE_FIELD_LABEL,
  PREVIEW_ROW_LABEL,
  SYNTAX_ROW_LABEL,
  TARGET_ROW_LABEL,
} from "./DependencyPicker.constants";
import type { FileOption } from "./DependencyPicker.types";

/** The labels of the rows of the form, in the order the picker draws them. */
const ROW_LABELS = [
  TARGET_ROW_LABEL,
  SYNTAX_ROW_LABEL,
  KIND_ROW_LABEL,
  IMPORTED_ROW_LABEL,
  PREVIEW_ROW_LABEL,
];

/** Page object of a group of radios of the picker, a part of the picker: the page object of the picker builds it, so it is exported only as a type. It has no test id: it finds the radio group named after its row, which is the `name` option. */
class RadioChoicePom extends Pom {
  protected readonly defaultTestId = "";

  /** @inheritdoc */
  protected findRoot(): HTMLElement {
    const groupName = this.requireName();

    return this.pickMatch(
      this.searchBase.queryAllByRole("radiogroup", { name: groupName }),
      `the role "radiogroup" named ${groupName}`
    );
  }

  /**
   * The radios of the group.
   * @returns The elements, in order.
   */
  private get radios(): HTMLInputElement[] {
    return this.scope.getAllByRole<HTMLInputElement>("radio");
  }

  /**
   * What the radios say.
   * @returns The accessible name of each radio, in order.
   */
  get labels(): string[] {
    return this.accessibleNames("radio");
  }

  /**
   * The radio that is checked.
   * @returns The accessible name of the radio. A group always has one checked.
   */
  get checked(): string {
    return this.labels[this.radios.findIndex((radio) => radio.checked)];
  }

  /**
   * Whether the first radio of the group has the keyboard focus.
   * @returns True when it is the active element of the page.
   */
  get isFirstFocused(): boolean {
    return document.activeElement === this.radios[0];
  }

  /**
   * Checks a radio.
   * @param label The accessible name of the radio, such as `import`.
   */
  select(label: string): void {
    fireEvent.click(this.scope.getByRole("radio", { name: label }));
  }
}

/** Page object of the field that picks a file, a part of the picker: the page object of the picker builds it, so it is exported only as a type. It finds the combobox named after its label. Its list renders in a popup outside the dialog's content, so it is built with the `portal` option. */
class FileFieldPom extends Pom {
  protected readonly defaultTestId = "";

  /** @inheritdoc */
  protected findRoot(): HTMLElement {
    return this.pickMatch(
      this.searchBase.queryAllByRole("combobox", { name: FILE_FIELD_LABEL }),
      `the role "combobox" named ${FILE_FIELD_LABEL}`
    );
  }

  /**
   * What the field holds.
   * @returns The value of the input.
   */
  get value(): string {
    return (this.root as HTMLInputElement).value;
  }

  /**
   * Whether the list of files is open.
   * @returns The `aria-expanded` attribute of the field is `true`.
   */
  get isOpen(): boolean {
    return this.root.getAttribute("aria-expanded") === "true";
  }

  /**
   * The files that the list shows.
   * @returns The path and the element of each option, in order. Empty while the list is closed.
   */
  get listedFiles(): FileOption[] {
    return this.searchBase.queryAllByRole("option").map((option) => ({
      path: (option.firstElementChild as HTMLElement).textContent,
      element: (option.lastElementChild as HTMLElement).textContent,
    }));
  }

  /**
   * What the list says when no file matches.
   * @returns The text, or null when the list is not showing it.
   */
  get noOptionsText(): string | null {
    return (
      this.searchBaseElement.querySelector(".MuiAutocomplete-noOptions")
        ?.textContent ?? null
    );
  }

  /**
   * Gives the keyboard focus to the field, as a click or the Tab key does. The field resets what was typed when it is not focused, so a user always types in a field that is.
   */
  private focus(): void {
    act(() => this.root.focus());
  }

  /** Opens the list, as pressing the field does: it takes the focus and opens the list. */
  open(): void {
    this.focus();
    fireEvent.mouseDown(this.root);
  }

  /**
   * Types in the field, which filters the list.
   * @param text The new value.
   */
  type(text: string): void {
    this.focus();
    fireEvent.change(this.root, { target: { value: text } });
  }

  /**
   * Presses a key in the field.
   * @param key The `key` of the event, such as `ArrowDown` or `Enter`.
   */
  pressKey(key: string): void {
    fireEvent.keyDown(this.root, { key });
  }

  /**
   * Picks an option of the list.
   * @param path The path of the file.
   */
  choose(path: string): void {
    fireEvent.click(this.searchBase.getByText(path, { selector: "li > span" }));
  }
}

/** Page object of the dialog that adds and edits a dependency. It is rendered in an overlay, outside the element that opened it, so build it without a parent, or with the `portal` option. */
export class DependencyPickerPom extends Pom {
  protected readonly defaultTestId = DEPENDENCY_PICKER_TEST_ID;

  /**
   * The title of the dialog.
   * @returns The heading of the dialog.
   */
  private get titleElement(): HTMLElement {
    return this.scope.getByRole("heading");
  }

  /**
   * What the dialog does.
   * @returns The text of the title.
   */
  get title(): string {
    return this.titleElement.textContent;
  }

  /**
   * Whether assistive technology reads the dialog as a dialog with a given name, which is its title.
   * @param accessibleName The accessible name.
   * @returns True when the element with the role `dialog` that the root holds has that name.
   */
  isDialogNamed(accessibleName: string): boolean {
    return (
      within(this.root).queryAllByRole("dialog", { name: accessibleName })
        .length > 0
    );
  }

  /**
   * The width of the dialog.
   * @returns The computed width of the element with the role `dialog`.
   */
  get width(): string {
    return getComputedStyle(this.scope.getByRole("dialog")).width;
  }

  /**
   * Whether the width of the dialog includes its border.
   * @returns The computed `box-sizing` of the element with the role `dialog`.
   */
  get boxSizing(): string {
    return getComputedStyle(this.scope.getByRole("dialog")).boxSizing;
  }

  /**
   * The file that the dependency belongs to, as the line below the title says it.
   * @returns The text of the line, such as `to src/index.js`.
   */
  get fromText(): string {
    return (this.titleElement.nextElementSibling as HTMLElement).textContent;
  }

  /**
   * The row of the form with a label.
   * @param label The label of the row, such as `Target`.
   * @returns The element of the row.
   */
  private row(label: string): HTMLElement {
    return this.scope.getByText(label).parentElement as HTMLElement;
  }

  /**
   * The rows that the form draws, which depend on the syntax.
   * @returns The label of each row, in order.
   */
  get rowLabels(): string[] {
    return ROW_LABELS.filter((label) => this.scope.queryByText(label) !== null);
  }

  /**
   * The radios of the target: a file of the sketch or an external module.
   * @returns The page object of the group.
   */
  get target(): RadioChoicePom {
    return this.childPom(RadioChoicePom, { name: TARGET_ROW_LABEL });
  }

  /**
   * The radios of the syntax.
   * @returns The page object of the group.
   */
  get syntax(): RadioChoicePom {
    return this.childPom(RadioChoicePom, { name: SYNTAX_ROW_LABEL });
  }

  /**
   * The radios of the kind of statement, which `require()` and `import()` do not have.
   * @returns The page object of the group.
   */
  get kind(): RadioChoicePom {
    return this.childPom(RadioChoicePom, { name: KIND_ROW_LABEL });
  }

  /**
   * The field that picks a file.
   * @returns The page object of the field.
   */
  get file(): FileFieldPom {
    return this.childPom(FileFieldPom, { portal: true });
  }

  /**
   * Whether the field that picks a file is drawn, which it is while the target is a file of the sketch.
   * @returns True when the field is found.
   */
  get hasFileField(): boolean {
    return (
      this.scope.queryByRole("combobox", { name: FILE_FIELD_LABEL }) !== null
    );
  }

  /**
   * The field that names a module.
   * @returns The input element, which is there while the target is an external module.
   */
  private get moduleField(): HTMLInputElement {
    return this.scope.getByRole<HTMLInputElement>("textbox", {
      name: MODULE_FIELD_LABEL,
    });
  }

  /**
   * Whether the field that names a module is drawn, which it is while the target is an external module.
   * @returns True when the field is found.
   */
  get hasModuleField(): boolean {
    return (
      this.scope.queryByRole("textbox", { name: MODULE_FIELD_LABEL }) !== null
    );
  }

  /**
   * What the field of the module holds.
   * @returns The value of the input.
   */
  get moduleValue(): string {
    return this.moduleField.value;
  }

  /**
   * Types the name of a module.
   * @param text The new value.
   */
  typeModule(text: string): void {
    fireEvent.change(this.moduleField, { target: { value: text } });
  }

  /**
   * The names of the statement, which `require()` and `import()` do not have.
   * @returns The page object of the editor of the names.
   */
  get names(): NamesEditorPom {
    return this.childPom(NamesEditorPom);
  }

  /**
   * The statement of the preview.
   * @returns The page object of the statement.
   */
  get preview(): StatementPom {
    return new StatementPom({
      root: this.row(PREVIEW_ROW_LABEL).querySelector("code") as HTMLElement,
    });
  }

  /**
   * The box that the preview is drawn on.
   * @returns The `pre` element of the preview.
   */
  private get previewBox(): HTMLElement {
    return this.row(PREVIEW_ROW_LABEL).querySelector("pre") as HTMLElement;
  }

  /**
   * The background of the preview.
   * @returns The computed background color.
   */
  get previewBackground(): string {
    return getComputedStyle(this.previewBox).backgroundColor;
  }

  /**
   * The color of the text of the preview, which the plain text of its statement inherits.
   * @returns The computed color.
   */
  get previewColor(): string {
    return getComputedStyle(this.previewBox).color;
  }

  /**
   * The element that says why the draft is refused.
   * @returns The element, or null when the draft is not refused.
   */
  private get refusalElement(): HTMLElement | null {
    return this.scope.queryByRole("alert");
  }

  /**
   * Why the draft is refused.
   * @returns The sentence, or null when the dialog says nothing.
   */
  get refusal(): string | null {
    return this.refusalElement?.textContent ?? null;
  }

  /**
   * The color of the sentence that says why the draft is refused.
   * @returns The computed color.
   */
  get refusalColor(): string {
    return getComputedStyle(this.refusalElement as HTMLElement).color;
  }

  /**
   * How the sentence that says why the draft is refused is laid out: on one line, or wrapped.
   * @returns The computed `white-space`.
   */
  get refusalWhiteSpace(): string {
    return getComputedStyle(this.refusalElement as HTMLElement).whiteSpace;
  }

  /**
   * The buttons of the footer.
   * @returns The text of each button, in order.
   */
  get footerButtonTexts(): string[] {
    return this.footerButtons.map((button) => button.textContent);
  }

  /**
   * The buttons of the footer, which are the last two of the dialog.
   * @returns The elements, in order: the one that gives up and the one that confirms.
   */
  private get footerButtons(): HTMLButtonElement[] {
    return this.scope.getAllByRole<HTMLButtonElement>("button").slice(-2);
  }

  /**
   * Whether the button that confirms can be pressed.
   * @returns True when the button is not disabled.
   */
  get isConfirmEnabled(): boolean {
    return !this.footerButtons[1].disabled;
  }

  /** Presses the button that adds or saves the dependency. */
  confirm(): void {
    fireEvent.click(this.footerButtons[1]);
  }

  /** Presses the button that gives up. */
  cancel(): void {
    fireEvent.click(this.footerButtons[0]);
  }

  /** Presses Escape while the dialog has the focus. */
  pressEscape(): void {
    fireEvent.keyDown(this.scope.getByRole("dialog"), { key: "Escape" });
  }

  /** Clicks outside the dialog, on the backdrop around it: the press starts and ends there, as a click that gives up does. */
  clickBackdrop(): void {
    const container = this.root.querySelector(
      ".MuiDialog-container"
    ) as HTMLElement;

    fireEvent.mouseDown(container);
    fireEvent.click(container);
  }
}
