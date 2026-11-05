import { fireEvent } from "@testing-library/react";

import { Pom } from "@/shared/testing/pom";

/** Page object of the textarea of the project as text. It has no test id: it finds the text box named by the `name` option, or the first text box within its parent when there is none. A component that is the textarea gives it its root with the `root` option. */
export class ProjectTextAreaPom extends Pom {
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
   * The textarea element.
   * @returns The element the user types in.
   */
  private get area(): HTMLTextAreaElement {
    return this.root as HTMLTextAreaElement;
  }

  /**
   * The element the textarea is drawn in.
   * @returns The tag name of the root, in upper case.
   */
  get tagName(): string {
    return this.root.tagName;
  }

  /**
   * The text the textarea holds.
   * @returns The value of the element.
   */
  get value(): string {
    return this.area.value;
  }

  /**
   * Whether the text cannot be edited.
   * @returns True when the element is read only.
   */
  get isReadOnly(): boolean {
    return this.area.readOnly;
  }

  /**
   * Whether assistive technology reads the textarea as a text box with a given name.
   * @param accessibleName The accessible name.
   * @returns True when the textarea is among the text boxes of that name of the element that holds it, whatever the parent of the page object, which a module that is the textarea makes its own root.
   */
  isTextboxNamed(accessibleName: string): boolean {
    return this.isNamed("textbox", accessibleName);
  }

  /**
   * Whether the browser checks the spelling of the text.
   * @returns The `spellcheck` attribute, or null when the textarea has none.
   */
  get spellcheck(): string | null {
    return this.root.getAttribute("spellcheck");
  }

  /**
   * Whether the browser capitalizes what the user types.
   * @returns The `autocapitalize` attribute, or null when the textarea has none.
   */
  get autocapitalize(): string | null {
    return this.root.getAttribute("autocapitalize");
  }

  /**
   * Whether the browser completes what the user types.
   * @returns The `autocomplete` attribute, or null when the textarea has none.
   */
  get autocomplete(): string | null {
    return this.root.getAttribute("autocomplete");
  }

  /**
   * Whether the browser corrects what the user types.
   * @returns The `autocorrect` attribute, or null when the textarea has none.
   */
  get autocorrect(): string | null {
    return this.root.getAttribute("autocorrect");
  }

  /**
   * How the browser wraps the lines of the text.
   * @returns The `wrap` attribute, or null when the textarea has none.
   */
  get wrap(): string | null {
    return this.root.getAttribute("wrap");
  }

  /**
   * The test id the textarea renders, which a component that is the textarea gives it.
   * @returns The `data-testid` attribute, or null when the textarea has none.
   */
  get renderedTestId(): string | null {
    return this.root.getAttribute("data-testid");
  }

  /**
   * Types in the textarea, as the user does.
   * @param value The whole text after the keystroke.
   */
  type(value: string): void {
    fireEvent.change(this.root, { target: { value } });
  }

  /** Takes the focus away from the textarea, without moving it anywhere. */
  blur(): void {
    fireEvent.blur(this.root);
  }
}
