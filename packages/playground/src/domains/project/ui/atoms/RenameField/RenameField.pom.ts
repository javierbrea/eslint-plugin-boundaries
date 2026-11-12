import { fireEvent } from "@testing-library/react";

import { Pom } from "@/shared/testing/pom";

import type { RenameFieldSelection } from "./RenameField.types";

/** Page object of the tooltip that says why a name is refused, a part of the field: the page object of the field builds it, so it is exported only as a type. MUI renders it in a portal, outside the field, so it is built with the `portal` option. */
class RefusalPom extends Pom {
  protected readonly defaultTestId = "";

  /** @inheritdoc */
  protected findRoot(): HTMLElement {
    return this.pickMatch(
      this.searchBase.queryAllByRole("tooltip"),
      'the role "tooltip"'
    );
  }

  /**
   * Why the name is refused.
   * @returns The text of the tooltip.
   */
  get text(): string {
    return this.root.textContent;
  }

  /**
   * The id that the field points to as its description.
   * @returns The `id` attribute of the tooltip.
   */
  get id(): string {
    return this.root.id;
  }
}

/** Page object of the field that renames a node. It has no test id: it finds the text box named after the node, so the `name` option is `New name of` followed by the path, or the first text box within its parent when there is none. */
export class RenameFieldPom extends Pom {
  protected readonly defaultTestId = "";

  /** @inheritdoc */
  protected findRoot(): HTMLElement {
    const { name: accessibleName } = this.options;

    return this.pickMatch(
      this.searchBase.queryAllByRole(
        "textbox",
        accessibleName === undefined ? {} : { name: accessibleName }
      ),
      accessibleName === undefined
        ? 'the role "textbox"'
        : `the role "textbox" named ${accessibleName}`
    );
  }

  /**
   * How many fields its parent holds, whatever the `name`, `index` and `containing` options. A page object that counts the fields of a part of the page reads this number.
   * @returns The number of text boxes within the parent.
   */
  get count(): number {
    return this.searchBase.queryAllByRole("textbox").length;
  }

  /**
   * The input element.
   * @returns The element the user types in.
   */
  private get input(): HTMLInputElement {
    return this.root as HTMLInputElement;
  }

  /**
   * Whether assistive technology reads the field as a text box with a given name, which is the path of the node it renames.
   * @param accessibleName The accessible name.
   * @returns True when the field is among the text boxes of that name of the element that holds it.
   */
  isTextboxNamed(accessibleName: string): boolean {
    return this.isNamed("textbox", accessibleName);
  }

  /**
   * What the field holds.
   * @returns The value of the input.
   */
  get value(): string {
    return this.input.value;
  }

  /**
   * What of the value is selected.
   * @returns The offsets of the two ends of the selection.
   */
  get selection(): RenameFieldSelection {
    return {
      start: this.input.selectionStart,
      end: this.input.selectionEnd,
    };
  }

  /**
   * Whether the field has the keyboard focus.
   * @returns True when the input is the active element of the page.
   */
  get isFocused(): boolean {
    return document.activeElement === this.root;
  }

  /**
   * What the field says about its value to assistive technology.
   * @returns The `aria-invalid` attribute, which is `true` while a refusal is shown, or null when the field has none.
   */
  get ariaInvalid(): string | null {
    return this.root.getAttribute("aria-invalid");
  }

  /**
   * The element that describes the field.
   * @returns The `aria-describedby` attribute, which points to the refusal while it is shown, or null when the field has none.
   */
  get describedBy(): string | null {
    return this.root.getAttribute("aria-describedby");
  }

  /**
   * The native tooltip of the field, which would keep showing a reason after it was fixed.
   * @returns The `title` attribute of the element that wraps the input, or null when it has none.
   */
  get nativeTitle(): string | null {
    return (
      this.root.closest(".MuiInputBase-root")?.getAttribute("title") ?? null
    );
  }

  /**
   * The tooltip that says why the name is refused.
   * @returns The page object of the tooltip, which is not rendered until a name is refused.
   */
  get refusal(): RefusalPom {
    return this.childPom(RefusalPom, { portal: true });
  }

  /**
   * Types a name in the field.
   * @param text The new value.
   */
  type(text: string): void {
    fireEvent.change(this.root, { target: { value: text } });
  }

  /**
   * Presses a key in the field.
   * @param key The `key` of the event, such as `Enter` or `Escape`.
   */
  pressKey(key: string): void {
    fireEvent.keyDown(this.root, { key });
  }

  /** Takes the focus away from the field, without moving it anywhere. */
  blur(): void {
    fireEvent.blur(this.root);
  }

  /** Clicks the field. */
  click(): void {
    fireEvent.click(this.root);
  }
}

export type { RefusalPom };
