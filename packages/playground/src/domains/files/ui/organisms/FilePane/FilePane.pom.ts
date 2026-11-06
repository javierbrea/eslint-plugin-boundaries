import { fireEvent } from "@testing-library/react";

import { DependencyLinesPom } from "@/domains/files/ui/molecules/DependencyLines/DependencyLines.pom";
import { Pom } from "@/shared/testing/pom";
import { IconPom } from "@/ui-kit/atoms/Icon/Icon.pom";
import { PaneFramePom } from "@/ui-kit/atoms/PaneFrame/PaneFrame.pom";
import { PaneHeadPom } from "@/ui-kit/atoms/PaneHead/PaneHead.pom";

import { ADD_DEPENDENCY_LABEL, FILE_PANE_TEST_ID } from "./FilePane.constants";

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
   * Whether the button cannot be pressed.
   * @returns True when the button is disabled.
   */
  get isDisabled(): boolean {
    return (this.root as HTMLButtonElement).disabled;
  }

  /**
   * How the border of the button is drawn.
   * @returns The computed border style, which is `dashed`.
   */
  get borderStyle(): string {
    return getComputedStyle(this.root).borderStyle;
  }

  /**
   * The icon of the button.
   * @returns The page object of the plus icon.
   */
  get icon(): IconPom {
    return this.childPom(IconPom);
  }

  /** Presses the button. */
  press(): void {
    fireEvent.click(this.root);
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
   * The head of the pane, with the path of the file, which is the first child of the frame.
   * @returns The page object of the head.
   */
  get head(): PaneHeadPom {
    return this.childPom(PaneHeadPom);
  }

  /**
   * The dependency list.
   * @returns The page object of the list, which is not rendered while the file has no dependencies.
   */
  get lines(): DependencyLinesPom {
    return this.childPom(DependencyLinesPom);
  }

  /**
   * The code area under the head, which is the second child of the frame.
   * @returns The element, or undefined when the pane has none.
   */
  private get codeArea(): Element | undefined {
    return this.root.children[1];
  }

  /**
   * The paragraph under the button that adds a dependency.
   * @returns The element, or null when the pane draws none.
   */
  private get hintElement(): Element | null {
    return this.codeArea?.querySelector("p") ?? null;
  }

  /**
   * What the pane says under the button that adds a dependency.
   * @returns The text of the paragraph, or null when the pane draws none.
   */
  get hint(): string | null {
    return this.hintElement?.textContent ?? null;
  }

  /**
   * The color of the hint, which a code area draws as a comment.
   * @returns The computed color, which is empty when the pane draws no hint.
   */
  get hintColor(): string {
    return this.hintElement === null
      ? ""
      : getComputedStyle(this.hintElement).color;
  }

  /**
   * The button that adds a dependency.
   * @returns The page object of the button, which is not rendered while the dependencies cannot be edited.
   */
  get addButton(): AddDependencyButtonPom {
    return this.childPom(AddDependencyButtonPom);
  }
}

export type { AddDependencyButtonPom };
