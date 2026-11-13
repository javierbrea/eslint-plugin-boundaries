import { fireEvent } from "@testing-library/react";

import { DependencyLinesPom } from "@/domains/files/ui/molecules/DependencyLines/DependencyLines.pom";
import { Pom } from "@/shared/testing/pom";
import { IconPom } from "@/ui-kit/atoms/Icon/Icon.pom";
import { PaneFramePom } from "@/ui-kit/atoms/PaneFrame/PaneFrame.pom";
import { PaneHeadPom } from "@/ui-kit/atoms/PaneHead/PaneHead.pom";
import { CloseButtonPom } from "@/ui-kit/molecules/CloseButton/CloseButton.pom";

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
   * The size and the place of the button.
   * @returns The computed height, the margin above it and how it is aligned in its line.
   */
  get box(): Pick<
    CSSStyleDeclaration,
    "height" | "marginTop" | "verticalAlign"
  > {
    const { height, marginTop, verticalAlign } = getComputedStyle(this.root);

    return { height, marginTop, verticalAlign };
  }

  /**
   * The text of the button.
   * @returns The computed font family, size and weight of the label.
   */
  get textStyle(): Pick<
    CSSStyleDeclaration,
    "fontFamily" | "fontSize" | "fontWeight"
  > {
    const { fontFamily, fontSize, fontWeight } = getComputedStyle(this.root);

    return { fontFamily, fontSize, fontWeight };
  }

  /**
   * The icon of the button.
   * @returns The page object of the plus icon.
   */
  get icon(): IconPom {
    return this.childPom(IconPom);
  }

  /**
   * Whether the button has the keyboard focus.
   * @returns True when the button is the active element of the page.
   */
  get isFocused(): boolean {
    return document.activeElement === this.root;
  }

  /** Presses the button. */
  press(): void {
    fireEvent.click(this.root);
  }
}

/** Page object of the file pane. It finds its root by the test id of the pane, or by the `testId` option when a module that is this pane gives it another. */
export class FilePanePom extends Pom {
  protected readonly defaultTestId: string = FILE_PANE_TEST_ID;

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
   * The button of the head that closes the pane.
   * @returns The page object of the button.
   */
  get closeButton(): CloseButtonPom {
    return this.childPom(CloseButtonPom);
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
   * The size and the place of the hint.
   * @returns The computed line height and the margin above the hint, which are empty when the pane draws no hint.
   */
  get hintBox(): Pick<CSSStyleDeclaration, "lineHeight" | "marginTop"> {
    const { lineHeight, marginTop } =
      this.hintElement === null
        ? { lineHeight: "", marginTop: "" }
        : getComputedStyle(this.hintElement);

    return { lineHeight, marginTop };
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
