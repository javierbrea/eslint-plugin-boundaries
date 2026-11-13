import { fireEvent, waitFor } from "@testing-library/react";

import { Pom } from "@/shared/testing/pom";

import { NODE_MENU_LABEL } from "./ProjectTreeMenu.constants";

/** The start of the accessible name of every menu of the tree, the one of a node and the one of the root alike */
const MENU_NAME = new RegExp(`^${NODE_MENU_LABEL} `);

/** Page object of the context menu of the project tree. It is rendered in an overlay inside the root element of the playground, outside the tree, so a parent searches it with the `portal` option. It has no test id: it finds the element with the role `menu` and the accessible name of the `name` option, or of any menu of the tree without it. It finds it while it closes too, when MUI hides it from assistive technology until it is gone. */
export class ProjectTreeMenuPom extends Pom {
  protected readonly defaultTestId = "";

  /** @inheritdoc */
  protected findRoot(): HTMLElement {
    const accessibleName = this.options.name ?? MENU_NAME;

    return this.pickMatch(
      this.searchBase.queryAllByRole("menu", {
        name: accessibleName,
        hidden: true,
      }),
      `the role "menu" named ${String(accessibleName)}`
    );
  }

  /**
   * The items of the menu.
   * @returns Their elements, in order.
   */
  private get items(): HTMLElement[] {
    return this.scope.getAllByRole("menuitem", { hidden: true });
  }

  /**
   * The item that says a label.
   * @param label The accessible name of the item, such as `Rename`.
   * @returns Its element.
   */
  private item(label: string): HTMLElement {
    return this.scope.getByRole("menuitem", { name: label });
  }

  /**
   * The element that the menu is an overlay of, which holds its backdrop.
   * @returns The root element of the overlay.
   */
  private get backdrop(): HTMLElement {
    return this.root
      .closest(".MuiPopover-root")
      ?.querySelector(".MuiBackdrop-root") as HTMLElement;
  }

  /**
   * Whether assistive technology reads the menu as a menu with a given name.
   * @param accessibleName The accessible name.
   * @returns True when the root is among the menus of that name.
   */
  isMenuNamed(accessibleName: string): boolean {
    return this.isNamed("menu", accessibleName);
  }

  /**
   * The items of the menu as assistive technology reads them, in the groups that the menu separates.
   * @returns The accessible name of each item, one array per group.
   */
  get groups(): string[][] {
    const names = this.accessibleNames("menuitem");
    const groups: string[][] = [[]];

    Array.from(this.root.children).forEach((child) => {
      if (child.tagName === "HR") {
        groups.push([]);
      } else {
        groups[groups.length - 1].push(names.shift() as string);
      }
    });
    return groups;
  }

  /**
   * The keys that the items announce to assistive technology.
   * @returns The `aria-keyshortcuts` attribute of each item, in order, or null for an item that announces none.
   */
  get itemShortcuts(): (string | null)[] {
    return this.items.map((menuItem) =>
      menuItem.getAttribute("aria-keyshortcuts")
    );
  }

  /**
   * The keys that the items write at their end, which assistive technology does not read.
   * @returns The text of each key, in order, and whether it is hidden from assistive technology.
   */
  get shortcutTexts(): { text: string; isHidden: boolean }[] {
    return this.items.flatMap((menuItem) => {
      const key = menuItem.querySelector("span[aria-hidden]");

      return key === null
        ? []
        : [
            {
              text: key.textContent,
              isHidden: key.getAttribute("aria-hidden") === "true",
            },
          ];
    });
  }

  /**
   * The styles of the key at the end of an item.
   * @param label The accessible name of the item.
   * @returns The computed color, font family and font size of the key.
   */
  shortcutStyle(label: string): {
    color: string;
    fontFamily: string;
    fontSize: string;
  } {
    const { color, fontFamily, fontSize } = getComputedStyle(
      this.item(label).querySelector("span[aria-hidden]") as HTMLElement
    );

    return { color, fontFamily, fontSize };
  }

  /**
   * Where the menu is drawn.
   * @returns The `top` and `left` of the card of the menu, in its style.
   */
  get position(): { top: string; left: string } {
    const { style } = this.root.parentElement as HTMLElement;

    return { top: style.top, left: style.left };
  }

  /**
   * The item that has the keyboard focus.
   * @returns Its accessible name, or null when the focus is not on an item.
   */
  get focusedItem(): string | null {
    const index = this.items.findIndex(
      (menuItem) => menuItem === document.activeElement
    );

    return index === -1 ? null : this.accessibleNames("menuitem")[index];
  }

  /**
   * Picks an item.
   * @param label The accessible name of the item, such as `Rename`.
   */
  pick(label: string): void {
    fireEvent.click(this.item(label));
  }

  /**
   * Presses a key on the item that has the keyboard focus, or on the menu when none has it.
   * @param key The `key` of the event, such as `Escape`.
   * @returns True when the menu kept the browser from doing what the key does by default.
   */
  pressKey(key: string): boolean {
    const focused = this.items.find(
      (menuItem) => menuItem === document.activeElement
    );

    return !fireEvent.keyDown(focused ?? this.root, { key });
  }

  /**
   * Right clicks an item of the menu.
   * @returns True when the menu kept the menu of the browser from opening.
   */
  rightClick(): boolean {
    return !fireEvent.contextMenu(this.items[0]);
  }

  /** Clicks outside the menu, on the backdrop that covers the page while it is open. */
  clickOutside(): void {
    fireEvent.click(this.backdrop);
  }

  /**
   * Right clicks outside the menu, on the backdrop that covers the page while it is open.
   * @returns True when the menu kept the menu of the browser from opening.
   */
  rightClickOutside(): boolean {
    return !fireEvent.contextMenu(this.backdrop);
  }

  /**
   * Waits for the menu to be gone from the page, which MUI does when its transition ends after it closed.
   * @returns A promise that settles when the menu is gone.
   */
  async waitUntilGone(): Promise<void> {
    await waitFor(() => {
      if (this.isRendered) {
        throw new Error("The menu is still in the page");
      }
    });
  }
}
