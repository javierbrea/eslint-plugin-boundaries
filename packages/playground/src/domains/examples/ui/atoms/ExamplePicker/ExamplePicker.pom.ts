import { fireEvent, waitFor } from "@testing-library/react";

import { Pom } from "@/shared/testing/pom";
import { IconPom } from "@/ui-kit/atoms/Icon/Icon.pom";

import { EXAMPLE_LIST_LABEL } from "./ExamplePicker.constants";

/** Page object of the list of examples, a part of the picker: the page object of the picker builds it, so it is exported only as a type. It is rendered in an overlay inside the root element of the playground, outside the picker, so it searches the whole document. It has no test id: it finds the element with the role `menu` that has the accessible name of the list. */
class ExampleListPom extends Pom {
  protected readonly defaultTestId = "";

  /** @inheritdoc */
  protected findRoot(): HTMLElement {
    return this.pickMatch(
      this.searchBase.queryAllByRole("menu", { name: EXAMPLE_LIST_LABEL }),
      `the role "menu" named ${EXAMPLE_LIST_LABEL}`
    );
  }

  /**
   * The names of the examples, in the order they are listed.
   * @returns The text of each item.
   */
  get titles(): string[] {
    return this.scope
      .getAllByRole("menuitemradio")
      .map((item) => item.textContent);
  }

  /**
   * The example that the list marks as the current one, for assistive technology.
   * @returns The text of the items that are checked, which is a single one when the sketch is an example and none when it is not.
   */
  get checkedTitles(): string[] {
    return this.scope
      .queryAllByRole("menuitemradio", { checked: true })
      .map((item) => item.textContent);
  }

  /**
   * The example that the list highlights as the current one, for the eyes.
   * @returns The text of the items that MUI marks as selected.
   */
  get selectedTitles(): string[] {
    return this.scope
      .getAllByRole("menuitemradio")
      .filter((item) => item.classList.contains("Mui-selected"))
      .map((item) => item.textContent);
  }

  /**
   * Picks an example.
   * @param title The name of the example, such as `Quick start`.
   */
  pick(title: string): void {
    fireEvent.click(this.scope.getByRole("menuitemradio", { name: title }));
  }

  /** Presses Escape while the list has the focus. */
  pressEscape(): void {
    fireEvent.keyDown(this.root, { key: "Escape" });
  }
}

/** The selector of the button: the only one of the picker that opens a menu. */
const BUTTON_SELECTOR = "button[aria-haspopup='menu']";

/** Page object of the picker of examples, which is its button. It has no test id: it finds the button that opens a menu within its parent. It cannot find it by its name, because MUI hides the button from assistive technology while the list is open, and the name of a hidden element is empty. */
export class ExamplePickerPom extends Pom {
  protected readonly defaultTestId = "";

  /** @inheritdoc */
  protected findRoot(): HTMLElement {
    return this.findRootBySelector(BUTTON_SELECTOR);
  }

  /**
   * The list of examples, which is not rendered until the button opens it.
   * @returns The page object of the list.
   */
  private get list(): ExampleListPom {
    return this.childPom(ExampleListPom, { portal: true });
  }

  /**
   * The icon at the end of the button.
   * @returns The page object of the icon.
   */
  get icon(): IconPom {
    return this.childPom(IconPom);
  }

  /**
   * Everything the button says.
   * @returns The label and the name of the current example, as assistive technology reads them.
   */
  get text(): string {
    return this.root.textContent.trim();
  }

  /**
   * The label that comes first.
   * @returns The text of the first element of the button.
   */
  get label(): string {
    return (this.root.firstElementChild as HTMLElement).textContent;
  }

  /**
   * The color of the label.
   * @returns The computed value.
   */
  get labelColor(): string {
    return getComputedStyle(this.root.firstElementChild as HTMLElement).color;
  }

  /**
   * The color of the name of the current example, which is the one of the text of the button.
   * @returns The computed value.
   */
  get titleColor(): string {
    return getComputedStyle(this.root).color;
  }

  /**
   * Whether the list is open, as the button says.
   * @returns True when the button announces that it has opened its list.
   */
  get isExpanded(): boolean {
    return this.root.getAttribute("aria-expanded") === "true";
  }

  /**
   * Whether the list is on screen.
   * @returns True when the list is in the page.
   */
  get isListOpen(): boolean {
    return this.list.isRendered;
  }

  /**
   * The kind of popup the button announces.
   * @returns The `aria-haspopup` attribute, or null when it has none.
   */
  get popup(): string | null {
    return this.root.getAttribute("aria-haspopup");
  }

  /**
   * The names of the examples in the list, in the order they are listed.
   * @returns The text of each item.
   */
  get titles(): string[] {
    return this.list.titles;
  }

  /**
   * The examples that the list marks as the current one for assistive technology.
   * @returns The text of the items that are checked.
   */
  get checkedTitles(): string[] {
    return this.list.checkedTitles;
  }

  /**
   * The examples that the list highlights as the current one.
   * @returns The text of the items that are selected.
   */
  get selectedTitles(): string[] {
    return this.list.selectedTitles;
  }

  /** Presses the button, which opens the list. */
  open(): void {
    fireEvent.click(this.root);
  }

  /**
   * Picks an example from the open list.
   * @param title The name of the example, such as `Quick start`.
   */
  pick(title: string): void {
    this.list.pick(title);
  }

  /** Presses Escape in the open list. */
  pressEscape(): void {
    this.list.pressEscape();
  }

  /**
   * Waits for the list to be gone from the page, which MUI does when its transition ends after it closed.
   * @returns A promise that settles when the list is gone.
   */
  async waitUntilClosed(): Promise<void> {
    await waitFor(() => {
      if (this.isListOpen) {
        throw new Error("The list of examples is still in the page");
      }
    });
  }
}
