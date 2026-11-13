import { render } from "@testing-library/react";

import { renderInRoot } from "@/shared/testing/renderInRoot";

import { ProjectTreeMenu } from "./ProjectTreeMenu";
import { ProjectTreeMenuPom } from "./ProjectTreeMenu.pom";
import type { ProjectTreeMenuProps } from "./ProjectTreeMenu.types";

/** What a spec gets from the menu it renders. */
type Page = {
  /** The page object of the menu. */
  menu: ProjectTreeMenuPom;
  /** The props of the menu, with the spies of its handlers. */
  props: ProjectTreeMenuProps;
  /** Renders the menu again with other props. */
  update: (changes: Partial<ProjectTreeMenuProps>) => void;
};

/**
 * Builds the props of the menu.
 * @param changes What differs from an open menu of the file `src/index.js`, at 120 px from the top and 80 px from the left.
 * @returns The props, with the spies of the handlers.
 */
function createProps(
  changes: Partial<ProjectTreeMenuProps> = {}
): ProjectTreeMenuProps {
  return {
    isOpen: true,
    target: { kind: "file", path: "src/index.js" },
    position: { top: 120, left: 80 },
    onAction: jest.fn(),
    onClose: jest.fn(),
    onExited: jest.fn(),
    ...changes,
  };
}

/**
 * Renders the menu.
 * @param changes What differs from an open menu of the file `src/index.js`.
 * @returns The page object of the menu, its props and the function that updates it.
 */
function renderMenu(changes: Partial<ProjectTreeMenuProps> = {}): Page {
  const props = createProps(changes);
  const { rerender } = render(<ProjectTreeMenu {...props} />);

  return {
    menu: new ProjectTreeMenuPom(),
    props,
    update: (next) => rerender(<ProjectTreeMenu {...props} {...next} />),
  };
}

describe("ProjectTreeMenu", () => {
  describe("items", () => {
    it.each([
      ["file", "src/index.js"],
      ["folder", "src"],
    ] as const)(
      "should offer to add a file or a folder, then, apart, to rename and to remove a %s",
      (kind, path) => {
        // Arrange
        const { menu } = renderMenu({ target: { kind, path } });

        // Act
        const { groups } = menu;

        // Assert
        expect(groups).toEqual([
          ["New file", "New folder"],
          ["Rename", "Delete"],
        ]);
      }
    );

    it("should only offer to add a file or a folder on the root", () => {
      // Arrange
      const { menu } = renderMenu({ target: { kind: "folder", path: "" } });

      // Act
      const { groups } = menu;

      // Assert
      expect(groups).toEqual([["New file", "New folder"]]);
    });

    it("should be named by the path of its node", () => {
      // Arrange
      const { menu } = renderMenu({ target: { kind: "folder", path: "src" } });

      // Act
      const isNamed = menu.isMenuNamed("Actions for src");

      // Assert
      expect(isNamed).toBe(true);
    });

    it("should be named as the menu of the project on the root", () => {
      // Arrange
      const { menu } = renderMenu({ target: { kind: "folder", path: "" } });

      // Act
      const isNamed = menu.isMenuNamed("Actions for the project");

      // Assert
      expect(isNamed).toBe(true);
    });
  });

  describe("shortcuts", () => {
    it("should announce the keys that rename and remove from the row", () => {
      // Arrange
      const { menu } = renderMenu();

      // Act
      const { itemShortcuts } = menu;

      // Assert
      expect(itemShortcuts).toEqual([null, null, "F2", "Delete"]);
    });

    it("should write the keys at the end of their items, hidden from assistive technology", () => {
      // Arrange
      const { menu } = renderMenu();

      // Act
      const { shortcutTexts } = menu;

      // Assert
      expect(shortcutTexts).toEqual([
        { text: "F2", isHidden: true },
        { text: "Delete", isHidden: true },
      ]);
    });

    it("should write the keys muted, in the mono caption of the type scale", () => {
      // Arrange
      renderInRoot(<ProjectTreeMenu {...createProps()} />);
      const menu = new ProjectTreeMenuPom();

      // Act
      const style = menu.shortcutStyle("Rename");

      // Assert
      expect(style.color).toBe("var(--jsb-muted)");
      expect(style.fontFamily).toBe("var(--jsb-font-mono)");
      expect(style.fontSize).toBe("11.5px");
    });
  });

  describe("opening", () => {
    it("should open where it is asked", () => {
      // Arrange
      const { menu } = renderMenu({ position: { top: 140, left: 60 } });

      // Act
      const { position } = menu;

      // Assert
      expect(position).toEqual({ top: "140px", left: "60px" });
    });

    it("should give the keyboard focus to its first item", () => {
      // Arrange
      const { menu } = renderMenu();

      // Act
      const { focusedItem } = menu;

      // Assert
      expect(focusedItem).toBe("New file");
    });

    it("should render nothing while it is closed", () => {
      // Arrange
      const { menu } = renderMenu({ isOpen: false });

      // Act
      const { isRendered } = menu;

      // Assert
      expect(isRendered).toBe(false);
    });
  });

  describe("picking", () => {
    it.each([
      ["New file", "add-file"],
      ["New folder", "add-folder"],
      ["Rename", "rename"],
      ["Delete", "delete"],
    ])("should report %s as %s", (label, action) => {
      // Arrange
      const { menu, props } = renderMenu();

      // Act
      menu.pick(label);

      // Assert
      expect(props.onAction).toHaveBeenCalledTimes(1);
      expect(props.onAction).toHaveBeenCalledWith(action);
      expect(props.onClose).not.toHaveBeenCalled();
    });

    it.each([
      ["F2", "rename"],
      ["Delete", "delete"],
    ])(
      "should report the key %s as %s from the item in focus, and keep the browser from acting on it",
      (key, action) => {
        // Arrange
        const { menu, props } = renderMenu();
        const focusedItem = menu.focusedItem;

        // Act
        const isPrevented = menu.pressKey(key);

        // Assert
        expect(focusedItem).toBe("New file");
        expect(isPrevented).toBe(true);
        expect(props.onAction).toHaveBeenCalledTimes(1);
        expect(props.onAction).toHaveBeenCalledWith(action);
      }
    );

    it.each(["F2", "Delete"])(
      "should report nothing on the key %s in the menu of the root, which can be neither renamed nor removed",
      (key) => {
        // Arrange
        const { menu, props } = renderMenu({
          target: { kind: "folder", path: "" },
        });

        // Act
        const isPrevented = menu.pressKey(key);

        // Assert
        expect(isPrevented).toBe(false);
        expect(props.onAction).not.toHaveBeenCalled();
      }
    );

    it("should stay open after a pick until it is closed", () => {
      // Arrange
      const { menu } = renderMenu();

      // Act
      menu.pick("Rename");

      // Assert
      expect(menu.isRendered).toBe(true);
    });
  });

  describe("closing", () => {
    it("should ask to close on Escape", () => {
      // Arrange
      const { menu, props } = renderMenu();

      // Act
      menu.pressKey("Escape");

      // Assert
      expect(props.onClose).toHaveBeenCalledTimes(1);
      expect(props.onAction).not.toHaveBeenCalled();
    });

    it("should ask to close on a click outside it", () => {
      // Arrange
      const { menu, props } = renderMenu();

      // Act
      menu.clickOutside();

      // Assert
      expect(props.onClose).toHaveBeenCalledTimes(1);
    });

    it("should ask to close on a right click outside it, and keep the menu of the browser closed", () => {
      // Arrange
      const { menu, props } = renderMenu();

      // Act
      const isPrevented = menu.rightClickOutside();

      // Assert
      expect(isPrevented).toBe(true);
      expect(props.onClose).toHaveBeenCalledTimes(1);
    });

    it("should stay open on a right click inside it, and keep the menu of the browser closed", () => {
      // Arrange
      const { menu, props } = renderMenu();

      // Act
      const isPrevented = menu.rightClick();

      // Assert
      expect(isPrevented).toBe(true);
      expect(props.onClose).not.toHaveBeenCalled();
    });

    it("should say when it is gone from the page after it closed", async () => {
      // Arrange
      const { menu, props, update } = renderMenu();

      // Act
      update({ isOpen: false });
      await menu.waitUntilGone();

      // Assert
      expect(props.onExited).toHaveBeenCalledTimes(1);
    });

    it("should keep its items while it closes", () => {
      // Arrange
      const { menu, update } = renderMenu();

      // Act
      update({ isOpen: false });

      // Assert
      expect(menu.groups).toEqual([
        ["New file", "New folder"],
        ["Rename", "Delete"],
      ]);
    });
  });
});
