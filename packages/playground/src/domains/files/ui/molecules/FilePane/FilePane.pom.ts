import { act, fireEvent, waitFor } from "@testing-library/react";

import { DependencyLinesPom } from "@/domains/files/ui/atoms/DependencyLines/DependencyLines.pom";
import { Pom } from "@/shared/testing/pom";
import { IconPom } from "@/ui-kit/atoms/Icon/Icon.pom";
import { PaneFramePom } from "@/ui-kit/atoms/PaneFrame/PaneFrame.pom";
import { PaneHeadPom } from "@/ui-kit/atoms/PaneHead/PaneHead.pom";

import {
  ADD_DEPENDENCY_LABEL,
  FILE_PANE_LABEL,
  FILE_PANE_TEST_ID,
} from "./FilePane.constants";

/** Page object of the button that adds a dependency, a part of the pane: the page object of the pane builds it, so it is exported only as a type. It has no test id: it finds the button by its label within its parent. */
class AddDependencyButtonPom extends Pom {
  protected readonly defaultTestId = "";

  /** @inheritdoc */
  protected findRoot(): HTMLElement {
    return this.pickMatch(
      this.searchBase.queryAllByRole("button", { name: ADD_DEPENDENCY_LABEL }),
      `the role "button" named ${ADD_DEPENDENCY_LABEL}`
    );
  }

  /**
   * The element that wraps the button, which gets the pointer events and the keyboard focus that a disabled button does not.
   * @returns The parent of the button.
   */
  private get slot(): HTMLElement {
    return this.root.parentElement as HTMLElement;
  }

  /**
   * Whether the button cannot be pressed.
   * @returns True when the button is disabled.
   */
  get isDisabled(): boolean {
    return (this.root as HTMLButtonElement).disabled;
  }

  /**
   * The icon of the button.
   * @returns The page object of the plus icon.
   */
  get icon(): IconPom {
    return this.childPom(IconPom);
  }

  /**
   * The position of the wrapper of the button in the order of the keyboard.
   * @returns The `tabIndex` of the wrapper, which is 0 when the keyboard reaches it.
   */
  get slotTabIndex(): number {
    return this.slot.tabIndex;
  }

  /** Puts the pointer over the button. */
  hover(): void {
    fireEvent.mouseOver(this.slot);
  }

  /** Gives the keyboard focus to the wrapper of the button. */
  focusSlot(): void {
    act(() => {
      this.slot.focus();
    });
  }
}

/** Page object of a tooltip. MUI renders it in a portal, outside the pane, so it finds the tooltip within the whole document: build it with the `portal` option. */
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

/** Page object of the file pane. */
export class FilePanePom extends Pom {
  protected readonly defaultTestId = FILE_PANE_TEST_ID;

  /**
   * The landmark the pane is, which has the same root element.
   * @returns The page object of the frame.
   */
  get frame(): PaneFramePom {
    return this.childPom(PaneFramePom, { root: this.root });
  }

  /**
   * The head of the pane, with the path of the file.
   * @returns The page object of the head.
   */
  get head(): PaneHeadPom {
    return this.childPom(PaneHeadPom, { name: FILE_PANE_LABEL });
  }

  /**
   * The dependency list.
   * @returns The page object of the list, which is not rendered while the file has no dependencies.
   */
  get lines(): DependencyLinesPom {
    return this.childPom(DependencyLinesPom);
  }

  /**
   * The paragraph that says the file has no dependencies.
   * @returns The paragraph, or null when the pane has none.
   */
  private get messageElement(): HTMLParagraphElement | null {
    return this.root.querySelector("p");
  }

  /**
   * What the pane says while the file has no dependencies.
   * @returns The text of the paragraph of the pane, or null when it has none.
   */
  get message(): string | null {
    return this.messageElement?.textContent ?? null;
  }

  /**
   * The element the message is drawn in.
   * @returns The tag name of the paragraph, in upper case, or null when the pane has none.
   */
  get messageTag(): string | null {
    return this.messageElement?.tagName ?? null;
  }

  /**
   * The button that adds a dependency.
   * @returns The page object of the button.
   */
  get addButton(): AddDependencyButtonPom {
    return this.childPom(AddDependencyButtonPom);
  }

  /**
   * The tooltip that says why the button is disabled.
   * @returns The page object of the tooltip, which is not rendered until the pointer or the keyboard reaches the button.
   */
  get tooltip(): TooltipPom {
    return this.childPom(TooltipPom, { portal: true });
  }
}

export type { AddDependencyButtonPom, TooltipPom };
