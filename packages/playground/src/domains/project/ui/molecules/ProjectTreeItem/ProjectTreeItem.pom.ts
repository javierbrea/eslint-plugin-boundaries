import { act, fireEvent } from "@testing-library/react";

import { RENAME_FIELD_LABEL } from "@/domains/project/ui/atoms/RenameField/RenameField.constants";
import { RenameFieldPom } from "@/domains/project/ui/atoms/RenameField/RenameField.pom";
import { OWN_CLASS, getStyle } from "@/shared/testing/emittedStyle";
import { Pom } from "@/shared/testing/pom";
import { CountBadgePom } from "@/ui-kit/atoms/CountBadge/CountBadge.pom";
import { IconPom } from "@/ui-kit/atoms/Icon/Icon.pom";

import {
  CONFIG_GLYPH,
  DELETE_ACTION_LABEL,
  PROJECT_TREE_ITEM_TEST_ID,
  RENAME_ACTION_LABEL,
} from "./ProjectTreeItem.constants";
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
    return this.findFirstChild("the first element of the item");
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
   * Whether the row is outlined as the target of the dependency in focus.
   * @returns True when the row has a `data-target` attribute.
   */
  get isTarget(): boolean {
    return this.root.hasAttribute("data-target");
  }

  /**
   * What the row looks like as the target of the dependency in focus, which jsdom cannot tell from the other rows: it is read from the rule that applies to the rows that have the attribute.
   * @returns The declarations of that rule.
   */
  get targetStyle(): Record<string, string> {
    return getStyle(this.root, `${OWN_CLASS}[data-target]`);
  }

  /**
   * The tag that says the item is the target, which the row draws at its end.
   * @returns The text of the tag, or null when the row draws none.
   */
  get targetTag(): string | null {
    return this.root.querySelector("[data-target-tag]")?.textContent ?? null;
  }

  /**
   * The color of the tag of the target.
   * @returns The computed color of the tag, or an empty string when the row draws none.
   */
  get targetTagColor(): string {
    const tag = this.root.querySelector("[data-target-tag]");

    return tag === null ? "" : getComputedStyle(tag).color;
  }

  /**
   * The color of the mark that a file with failing dependencies has at the end of its row: the cross of errors, or the triangle of warnings.
   * @returns The computed color of the mark, or an empty string when the row draws none.
   */
  get failureColor(): string {
    const mark = this.root.querySelector("[data-failure]");

    return mark === null ? "" : getComputedStyle(mark).color;
  }

  /**
   * What the row reads, from the chevron to the badge.
   * @returns The text of the row: the glyph of the config, the name, and the number of the badge.
   */
  get text(): string {
    return this.root.textContent;
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
   * @returns True when the row holds the glyph.
   */
  get hasGlyph(): boolean {
    return this.scope.queryByText(CONFIG_GLYPH) !== null;
  }

  /**
   * The text styles of the glyph of the config.
   * @returns The computed font size, weight and line height of the glyph before its name.
   */
  get glyphStyle(): ProjectRowGlyphStyle {
    const { fontSize, fontWeight, lineHeight } = getComputedStyle(
      this.scope.getByText(CONFIG_GLYPH)
    );

    return { fontSize, fontWeight, lineHeight };
  }

  /**
   * The path of the outline of each icon of the row, in order: the chevron of a folder, the actions, and the cross of a failing file.
   * @returns The `d` attribute of each icon's path, to compare with `ICON_PATHS`.
   */
  get iconPaths(): string[] {
    const { count } = this.childPom(IconPom);

    return Array.from(
      { length: count },
      (_, index) => this.childPom(IconPom, { index }).pathData
    );
  }

  /** Clicks the name of the node, as the user does to open a file, or to close or open a folder. */
  clickName(): void {
    fireEvent.click(this.root.querySelector("[title]") as HTMLElement);
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
   * @returns The accessible name of each image of the row, in order; empty when the row has no badge.
   */
  get badgeNames(): string[] {
    return this.accessibleNames("img");
  }

  /**
   * What the buttons of the row say to assistive technology.
   * @returns The accessible name of each button of the row, in order; empty when the row has none.
   */
  get buttonNames(): string[] {
    return this.accessibleNames("button");
  }

  /**
   * The field that renames the node, which replaces its name in the row.
   * @returns The page object of the field, which is not rendered unless the node is being renamed.
   */
  get field(): RenameFieldPom {
    return this.childPom(RenameFieldPom);
  }
}

/** Page object of an item of the project tree. It finds the item by the path of its node, the `name` option when it is set: the title of the name of the item, or the path in the label of the field while the item is renamed. Without it, the `index` option picks among all the items of its parent, folders before the items inside them, in the order they are drawn. The items inside a folder are not part of the item, and neither are their rows. */
export class ProjectTreeItemPom extends Pom {
  protected readonly defaultTestId = PROJECT_TREE_ITEM_TEST_ID;

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

  /**
   * Tells whether an element is an item of the tree, as the tree view roles it.
   * @param element What a spec got from a spy, such as the element a `focus` call was made on.
   * @returns True when the element has the role `treeitem`.
   */
  static isItem(element: unknown): boolean {
    return (
      element instanceof HTMLElement &&
      element.getAttribute("role") === "treeitem"
    );
  }

  /**
   * Every item within the parent, whatever the options but the test id, in the order they are drawn.
   * @returns The elements of the items.
   */
  private get items(): HTMLElement[] {
    return this.searchBase.queryAllByTestId(
      this.options.testId ?? this.defaultTestId
    );
  }

  /** @inheritdoc */
  protected findRoot(): HTMLElement {
    const { name: path } = this.options;
    const testId = this.options.testId ?? this.defaultTestId;

    if (path === undefined) {
      return this.pickMatch(this.items, `the test id "${testId}"`);
    }
    if (typeof path !== "string") {
      throw new Error(`${this.constructor.name} needs a path as its "name"`);
    }

    return this.pickMatch(
      this.items.filter((item) => ProjectTreeItemPom.getOwnPath(item) === path),
      `the test id "${testId}" of the node ${path}`
    );
  }

  /**
   * How many items its parent holds, whatever the `name`, `index` and `containing` options. A page object that lists them builds one `ProjectTreeItemPom` per index below this number.
   * @returns The number of items within the parent, with those inside the folders.
   */
  get count(): number {
    return this.items.length;
  }

  /**
   * The path of the node the item shows, read from its own row and not from the items inside it.
   * @returns The title of its name, or the path in the label of its field while the node is renamed.
   * @throws When the row shows neither.
   */
  get path(): string {
    const path = ProjectTreeItemPom.getOwnPath(this.root);

    if (path === null) {
      throw new Error(`${this.constructor.name} found no path in its row`);
    }

    return path;
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
    return this.row.field;
  }

  /**
   * The button of the row that starts the rename.
   * @returns The page object of the button, which is not rendered for the config, or while nodes cannot be edited or the node is being renamed.
   */
  get renameAction(): RowActionPom {
    return this.childPom(RowActionPom, {
      name: `${RENAME_ACTION_LABEL} ${this.path}`,
    });
  }

  /**
   * The button of the row that removes the node.
   * @returns The page object of the button, which is not rendered for the config, or while nodes cannot be edited or the node is being renamed.
   */
  get deleteAction(): RowActionPom {
    return this.childPom(RowActionPom, {
      name: `${DELETE_ACTION_LABEL} ${this.path}`,
    });
  }

  /**
   * What kind of node the item shows.
   * @returns The `data-kind` attribute: `config`, `file` or `folder`.
   */
  get kind(): string | null {
    return this.root.getAttribute("data-kind");
  }

  /**
   * Whether the tree view selects the item.
   * @returns The `aria-selected` attribute: `true` for the selected item and `false` for the others, or null when the item cannot be selected.
   */
  get ariaSelected(): string | null {
    return this.root.getAttribute("aria-selected");
  }

  /**
   * Whether the folder shows the items inside it.
   * @returns The `aria-expanded` attribute: `true` for an open folder and `false` for a closed one, or null when the item holds no other items.
   */
  get ariaExpanded(): string | null {
    return this.root.getAttribute("aria-expanded");
  }

  /**
   * Whether assistive technology reads the item as a tree item with a given name, which is its own row and not everything inside it.
   * @param accessibleName The accessible name.
   * @returns True when the item is among the tree items of that name of the element that holds it.
   */
  isTreeItemNamed(accessibleName: string): boolean {
    return this.isNamed("treeitem", accessibleName);
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
