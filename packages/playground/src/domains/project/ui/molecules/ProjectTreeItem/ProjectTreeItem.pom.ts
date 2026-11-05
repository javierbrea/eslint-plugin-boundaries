import { act, fireEvent } from "@testing-library/react";

import { RENAME_FIELD_LABEL } from "@/domains/project/ui/atoms/RenameField/RenameField.constants";
import { RenameFieldPom } from "@/domains/project/ui/atoms/RenameField/RenameField.pom";
import { OWN_CLASS, getStyle } from "@/shared/testing/emittedStyle";
import { Pom } from "@/shared/testing/pom";
import { CountBadgePom } from "@/ui-kit/atoms/CountBadge/CountBadge.pom";
import { IconPom } from "@/ui-kit/atoms/Icon/Icon.pom";

import { PROJECT_TREE_ITEM_TEST_ID } from "./ProjectTreeItem.constants";
import type {
  ProjectRowGlyphStyle,
  ProjectRowTextStyle,
} from "./ProjectTreeItem.types";

/** Page object of a button of the actions of a row, a part of the row: the page object of the item builds it, so it is exported only as a type. It has no test id: it finds the button by its accessible name, the `name` option, within its parent. */
class RowActionPom extends Pom {
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
   * What the button says to assistive technology.
   * @returns The `aria-label` attribute, or null when the button has none.
   */
  get label(): string | null {
    return this.root.getAttribute("aria-label");
  }

  /**
   * The icon of the button.
   * @returns The page object of the icon.
   */
  get icon(): IconPom {
    return this.childPom(IconPom);
  }

  /** Presses the button. */
  press(): void {
    fireEvent.click(this.root);
  }

  /**
   * Presses a key while the button has the focus, which the item must not take as its own.
   * @param key The `key` of the event, such as `F2`.
   */
  pressKey(key: string): void {
    fireEvent.keyDown(this.root, { key });
  }
}

/** Page object of the row of an item, a part of the item: the page object of the item builds it, so it is exported only as a type. It has no test id: its root is the first element of its parent, which is the item. The row holds the chevron, the name, and at the end the actions and the badge, and not the items inside a folder. */
class ProjectRowPom extends Pom {
  protected readonly defaultTestId = "";

  /** @inheritdoc */
  protected findRoot(): HTMLElement {
    return this.pickMatch(
      [this.searchBaseElement.firstElementChild as HTMLElement],
      "the first element of the item"
    );
  }

  /**
   * The element the row is drawn in.
   * @returns The tag name of the root, in upper case.
   */
  get tagName(): string {
    return this.root.tagName;
  }

  /**
   * Whether the row is drawn in the color of errors.
   * @returns True when the row has a `data-bad` attribute.
   */
  get isBad(): boolean {
    return this.root.hasAttribute("data-bad");
  }

  /**
   * The text styles of the row.
   * @returns The computed font family, size and line height.
   */
  get textStyle(): ProjectRowTextStyle {
    const { fontFamily, fontSize, lineHeight } = getComputedStyle(this.root);

    return { fontFamily, fontSize, lineHeight };
  }

  /**
   * What the row looks like under the pointer, which jsdom cannot compute: it is read from the rule that applies on hover.
   * @returns The declarations of that rule.
   */
  get hoverStyle(): Record<string, string> {
    return getStyle(this.root, `${OWN_CLASS}:hover`);
  }

  /**
   * Whether the row draws the glyph that marks the config.
   * @returns True when the row holds a `{}`.
   */
  get hasGlyph(): boolean {
    return this.scope.queryByText("{}") !== null;
  }

  /**
   * The text styles of the glyph of the config.
   * @returns The computed font size, weight and line height of the `{}` before its name.
   */
  get glyphStyle(): ProjectRowGlyphStyle {
    const { fontSize, fontWeight, lineHeight } = getComputedStyle(
      this.scope.getByText("{}")
    );

    return { fontSize, fontWeight, lineHeight };
  }

  /**
   * The path of the outline of each icon of the row, in order: the chevron of a folder, the actions, and the cross of a failing file.
   * @returns The `d` attribute of each icon's path, to compare with `ICON_PATHS`.
   */
  get iconPaths(): string[] {
    const count = this.root.querySelectorAll("svg").length;

    return Array.from(
      { length: count },
      (_, index) => this.childPom(IconPom, { index }).pathData
    );
  }

  /** Double clicks the name of the node. */
  doubleClickName(): void {
    fireEvent.doubleClick(this.root.querySelector("[title]") as HTMLElement);
  }

  /**
   * The badge of the row.
   * @param label The accessible name of the badge, such as `2 failing dependencies`. The first badge of the row when it is unset.
   * @returns The page object of the badge.
   */
  badge(label?: string): CountBadgePom {
    return this.childPom(
      CountBadgePom,
      label === undefined ? {} : { name: label }
    );
  }

  /**
   * What the badges of the row say to assistive technology.
   * @returns The `aria-label` of each image of the row, in order; empty when the row has no badge.
   */
  get badgeLabels(): (string | null)[] {
    return this.scope
      .queryAllByRole("img")
      .map((image) => image.getAttribute("aria-label"));
  }

  /**
   * What the buttons of the row say to assistive technology.
   * @returns The `aria-label` of each button of the row, in order; empty when the row has none.
   */
  get buttonLabels(): (string | null)[] {
    return this.scope
      .queryAllByRole("button")
      .map((button) => button.getAttribute("aria-label"));
  }
}

/** Page object of an item of the project tree. It finds the item by the path of its node, the `name` option, which is required: the title of the name of the item, or the path in the label of the field while the item is renamed. The items inside a folder are not part of the item, and neither are their rows. */
export class ProjectTreeItemPom extends Pom {
  protected readonly defaultTestId = PROJECT_TREE_ITEM_TEST_ID;

  /**
   * The path of the node the item shows, which is the `name` option.
   * @returns The path.
   * @throws When the option is unset or is not a text.
   */
  private get path(): string {
    const path = this.requireName();

    if (typeof path !== "string") {
      throw new Error(`${this.constructor.name} needs a path as its "name"`);
    }

    return path;
  }

  /**
   * Gets the path of the node that an item shows, without looking at the items inside it.
   * @param item The element of the item.
   * @returns The title of its name, or the path in the label of its field while it is renamed, or null when it has neither.
   */
  private static getOwnPath(item: HTMLElement): string | null {
    const row = item.firstElementChild;
    const title = row?.querySelector("[title]")?.getAttribute("title");

    if (title !== undefined) {
      return title;
    }

    const label = row
      ?.querySelector("input[aria-label]")
      ?.getAttribute("aria-label");
    const prefix = `${RENAME_FIELD_LABEL} `;

    return label?.startsWith(prefix) === true
      ? label.slice(prefix.length)
      : null;
  }

  /** @inheritdoc */
  protected findRoot(): HTMLElement {
    const { path } = this;
    const testId = this.options.testId ?? this.defaultTestId;

    return this.pickMatch(
      this.searchBase
        .queryAllByTestId(testId)
        .filter((item) => ProjectTreeItemPom.getOwnPath(item) === path),
      `the test id "${testId}" of the node ${path}`
    );
  }

  /**
   * The row of the item, without the items inside it.
   * @returns The page object of the row.
   */
  get row(): ProjectRowPom {
    return this.childPom(ProjectRowPom);
  }

  /**
   * The field that renames the node, which replaces its name.
   * @returns The page object of the field, which is not rendered unless the node is being renamed.
   */
  get field(): RenameFieldPom {
    return this.childPom(RenameFieldPom, {
      name: RenameFieldPom.nameFor(this.path),
    });
  }

  /**
   * The button of the row that starts the rename.
   * @returns The page object of the button, which is not rendered for the config, or while nodes cannot be edited or the node is being renamed.
   */
  get renameAction(): RowActionPom {
    return this.childPom(RowActionPom, { name: `Rename ${this.path}` });
  }

  /**
   * The button of the row that removes the node.
   * @returns The page object of the button, which is not rendered for the config, or while nodes cannot be edited or the node is being renamed.
   */
  get deleteAction(): RowActionPom {
    return this.childPom(RowActionPom, { name: `Delete ${this.path}` });
  }

  /**
   * What kind of node the item shows.
   * @returns The `data-kind` attribute: `config`, `file` or `folder`.
   */
  get kind(): string | null {
    return this.root.getAttribute("data-kind");
  }

  /**
   * What names the item, which is its own row and not everything inside it.
   * @returns The text of the element that the item points to as its label, or an empty string when there is none.
   */
  get label(): string {
    const labelId = this.root.getAttribute("aria-labelledby") ?? "";

    return document.getElementById(labelId)?.textContent ?? "";
  }

  /**
   * The keys the item announces to assistive technology.
   * @returns The `aria-keyshortcuts` attribute, or null when the item announces none.
   */
  get keyShortcuts(): string | null {
    return this.root.getAttribute("aria-keyshortcuts");
  }

  /**
   * Whether the item has the keyboard focus.
   * @returns True when the item is the active element of the page.
   */
  get isFocused(): boolean {
    return document.activeElement === this.root;
  }

  /**
   * The ring that shows the keyboard focus on the row, which jsdom cannot compute: it is read from the rule of the item that applies on keyboard focus to its row.
   * @returns The declarations of that rule.
   */
  get focusRingStyle(): Record<string, string> {
    return getStyle(this.root, `${OWN_CLASS}:focus-visible>div`);
  }

  /** Gives the keyboard focus to the item. */
  focus(): void {
    act(() => this.root.focus());
  }

  /**
   * Presses a key while the item has the focus.
   * @param key The `key` of the event, such as `F2` or `Delete`.
   */
  pressKey(key: string): void {
    fireEvent.keyDown(this.root, { key });
  }
}

export type { ProjectRowPom, RowActionPom };
