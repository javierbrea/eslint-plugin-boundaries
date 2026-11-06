import { fireEvent, within } from "@testing-library/react";

import { Pom } from "@/shared/testing/pom";

import {
  ADD_NAME_LABEL,
  ALIAS_FIELD_LABEL,
  CANCEL_NAME_LABEL,
  CONFIRM_NAME_LABEL,
  NAME_FIELD_LABEL,
  NAME_KIND_LABEL,
  NAMES_EDITOR_LABEL,
  REMOVE_NAME_LABEL,
} from "./NamesEditor.constants";

/** Page object of the editor of the names of a statement. It has no test id: it finds the group named after its label within its parent. */
export class NamesEditorPom extends Pom {
  protected readonly defaultTestId = "";

  /** @inheritdoc */
  protected findRoot(): HTMLElement {
    return this.pickMatch(
      this.searchBase.queryAllByRole("group", { name: NAMES_EDITOR_LABEL }),
      `the role "group" named ${NAMES_EDITOR_LABEL}`
    );
  }

  /**
   * The chips of the names, which are the items of the list.
   * @returns The elements, in order.
   */
  private get chips(): HTMLElement[] {
    return this.scope.queryAllByRole("listitem");
  }

  /**
   * The text of each chip, which is the kind of the name and the name.
   * @returns The text of each chip, in order.
   */
  get chipTexts(): string[] {
    return this.chips.map((chip) => chip.textContent);
  }

  /**
   * What the buttons that remove a name say to assistive technology.
   * @returns The accessible name of the button of each chip, in order.
   */
  get removeButtonNames(): string[] {
    return this.chips.flatMap((chip) =>
      this.accessibleNames("button", within(chip))
    );
  }

  /**
   * What every button says to assistive technology.
   * @returns The accessible name of each button of the group, in order: the ones that remove a name, then the chip that adds one or the buttons of its editor.
   */
  get buttonNames(): string[] {
    return this.accessibleNames("button");
  }

  /**
   * The chip that opens the editor of a new name.
   * @returns The element, which is not there while the editor is open.
   */
  private get addChip(): HTMLElement {
    return this.scope.getByRole("button", { name: ADD_NAME_LABEL });
  }

  /**
   * What the chip that adds a name says.
   * @returns The text of the chip.
   */
  get addChipText(): string {
    return this.addChip.textContent;
  }

  /**
   * Whether the chip that adds a name has the keyboard focus.
   * @returns True when the chip is the active element of the page.
   */
  get isAddChipFocused(): boolean {
    return document.activeElement === this.addChip;
  }

  /**
   * Whether the chip that adds a name is there, which is the case while the editor is closed.
   * @returns True when the chip is within the group.
   */
  get hasAddChip(): boolean {
    return this.scope.queryByRole("button", { name: ADD_NAME_LABEL }) !== null;
  }

  /** Presses the chip that adds a name, which opens the editor. */
  openEditor(): void {
    fireEvent.click(this.addChip);
  }

  /**
   * Presses the button that removes a name.
   * @param chipText The text of the chip of the name, such as `default format`.
   */
  remove(chipText: string): void {
    fireEvent.click(
      this.scope.getByRole("button", {
        name: `${REMOVE_NAME_LABEL} ${chipText}`,
      })
    );
  }

  /**
   * The group of buttons that pick the kind of the new name.
   * @returns The element, which is not there while the editor is closed.
   */
  private get kindGroup(): HTMLElement {
    return this.scope.getByRole("group", { name: NAME_KIND_LABEL });
  }

  /**
   * Whether the editor of a new name is open.
   * @returns True when the buttons that pick the kind are there.
   */
  get isEditorOpen(): boolean {
    return this.scope.queryByRole("group", { name: NAME_KIND_LABEL }) !== null;
  }

  /**
   * The kinds the editor offers.
   * @returns The text of each button that picks a kind, in order.
   */
  get kinds(): string[] {
    return within(this.kindGroup)
      .getAllByRole("button")
      .map((button) => button.textContent);
  }

  /**
   * The kind that is picked.
   * @returns The text of the button that is pressed.
   */
  get selectedKind(): string {
    return within(this.kindGroup).getByRole("button", { pressed: true })
      .textContent;
  }

  /**
   * Picks a kind.
   * @param kind The text of its button, such as `named`.
   */
  chooseKind(kind: string): void {
    fireEvent.click(within(this.kindGroup).getByRole("button", { name: kind }));
  }

  /**
   * Presses a key on the button of a kind.
   * @param kind The text of its button, such as `named`.
   * @param key The `key` of the event, such as `Enter` or `Escape`.
   */
  pressKindKey(kind: string, key: string): void {
    fireEvent.keyDown(
      within(this.kindGroup).getByRole("button", { name: kind }),
      { key }
    );
  }

  /**
   * The field of the name.
   * @returns The input element.
   */
  private get nameField(): HTMLInputElement {
    return this.scope.getByRole<HTMLInputElement>("textbox", {
      name: NAME_FIELD_LABEL,
    });
  }

  /**
   * The field of the alias.
   * @returns The input element, which is there only for a named name.
   */
  private get aliasField(): HTMLInputElement {
    return this.scope.getByRole<HTMLInputElement>("textbox", {
      name: ALIAS_FIELD_LABEL,
    });
  }

  /**
   * What the field of the name holds.
   * @returns The value of the input.
   */
  get nameValue(): string {
    return this.nameField.value;
  }

  /**
   * Whether the field of the name has the keyboard focus.
   * @returns True when the input is the active element of the page.
   */
  get isNameFocused(): boolean {
    return document.activeElement === this.nameField;
  }

  /**
   * Whether the editor has a field for the alias, which it has for a named name.
   * @returns True when the field is there.
   */
  get hasAliasField(): boolean {
    return (
      this.scope.queryByRole("textbox", { name: ALIAS_FIELD_LABEL }) !== null
    );
  }

  /**
   * What the field of the alias holds.
   * @returns The value of the input.
   */
  get aliasValue(): string {
    return this.aliasField.value;
  }

  /**
   * Types a name in its field.
   * @param text The new value.
   */
  typeName(text: string): void {
    fireEvent.change(this.nameField, { target: { value: text } });
  }

  /**
   * Types an alias in its field.
   * @param text The new value.
   */
  typeAlias(text: string): void {
    fireEvent.change(this.aliasField, { target: { value: text } });
  }

  /**
   * Presses a key in the field of the name.
   * @param key The `key` of the event, such as `Enter` or `Escape`.
   */
  pressNameKey(key: string): void {
    fireEvent.keyDown(this.nameField, { key });
  }

  /**
   * Presses a key in the field of the alias.
   * @param key The `key` of the event, such as `Enter` or `Escape`.
   */
  pressAliasKey(key: string): void {
    fireEvent.keyDown(this.aliasField, { key });
  }

  /**
   * The button that adds the new name.
   * @returns The element.
   */
  private get confirmButton(): HTMLButtonElement {
    return this.scope.getByRole<HTMLButtonElement>("button", {
      name: CONFIRM_NAME_LABEL,
    });
  }

  /**
   * Whether the button that adds the new name can be pressed.
   * @returns True when the button is not disabled.
   */
  get isConfirmEnabled(): boolean {
    return !this.confirmButton.disabled;
  }

  /** Presses the button that adds the new name. */
  confirm(): void {
    fireEvent.click(this.confirmButton);
  }

  /** Presses the button that closes the editor. */
  cancel(): void {
    fireEvent.click(
      this.scope.getByRole("button", { name: CANCEL_NAME_LABEL })
    );
  }
}
