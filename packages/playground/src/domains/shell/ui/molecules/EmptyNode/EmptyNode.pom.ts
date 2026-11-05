import { fireEvent } from "@testing-library/react";

import { Pom } from "@/shared/testing/pom";
import { IconPom } from "@/ui-kit/atoms/Icon/Icon.pom";
import { MonoPom } from "@/ui-kit/atoms/Mono/Mono.pom";
import { PaneFramePom } from "@/ui-kit/atoms/PaneFrame/PaneFrame.pom";
import { PaneHeadPom } from "@/ui-kit/atoms/PaneHead/PaneHead.pom";

import { EMPTY_NODE_LABEL, EMPTY_NODE_TEST_ID } from "./EmptyNode.constants";

/** The name of the button that opens the config. */
const OPEN_CONFIG_NAME = /^Open /;

/** The name of the button that adds a file. */
const ADD_FILE_NAME = "File";

/** Page object of a button of the pane, a part of the pane: the page object of the pane builds it, so it is exported only as a type. It has no test id: it finds the button named by the `name` option within its parent. */
class EmptyNodeButtonPom extends Pom {
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
   * What the button says.
   * @returns The text of the button.
   */
  get text(): string {
    return this.root.textContent;
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
}

/** Page object of the pane that shows when nothing is open. It finds its root by the test id of the pane, or by the `testId` option when a module that is this pane gives it another. */
export class EmptyNodePom extends Pom {
  protected readonly defaultTestId: string = EMPTY_NODE_TEST_ID;

  /**
   * The landmark the pane is, which has the same root element.
   * @returns The page object of the frame.
   */
  get frame(): PaneFramePom {
    return this.childPom(PaneFramePom, { root: this.root });
  }

  /**
   * The head of the pane.
   * @returns The page object of the head.
   */
  get head(): PaneHeadPom {
    return this.childPom(PaneHeadPom, { name: EMPTY_NODE_LABEL });
  }

  /**
   * The title of the pane, which is its heading.
   * @returns The heading.
   */
  private get heading(): HTMLElement {
    return this.scope.getByRole("heading");
  }

  /**
   * What the pane asks of the user.
   * @returns The text of the heading.
   */
  get title(): string {
    return this.heading.textContent;
  }

  /**
   * The element the title is drawn in.
   * @returns The tag name of the heading, in upper case.
   */
  get titleTag(): string {
    return this.heading.tagName;
  }

  /**
   * The text styles of the title.
   * @returns The computed font family, size, weight and letter spacing.
   */
  get titleStyle(): Pick<
    CSSStyleDeclaration,
    "fontFamily" | "fontSize" | "fontWeight" | "letterSpacing"
  > {
    const { fontFamily, fontSize, fontWeight, letterSpacing } =
      getComputedStyle(this.heading);

    return { fontFamily, fontSize, fontWeight, letterSpacing };
  }

  /**
   * The paragraph that explains what each way to start shows.
   * @returns The paragraph.
   */
  private get paragraph(): HTMLElement {
    return this.scope.getByText(/^Pick a file in the project/);
  }

  /**
   * What the pane explains.
   * @returns The text of the paragraph.
   */
  get message(): string {
    return this.paragraph.textContent;
  }

  /**
   * The name of the config in mono, in the explanation.
   * @returns The page object of the code.
   */
  get code(): MonoPom {
    return this.childPom(MonoPom);
  }

  /**
   * The button that opens the config.
   * @returns The page object of the button.
   */
  get openConfigButton(): EmptyNodeButtonPom {
    return this.childPom(EmptyNodeButtonPom, { name: OPEN_CONFIG_NAME });
  }

  /**
   * The button that adds a file.
   * @returns The page object of the button, which is not rendered while the project cannot have files added.
   */
  get addFileButton(): EmptyNodeButtonPom {
    return this.childPom(EmptyNodeButtonPom, { name: ADD_FILE_NAME });
  }

  /**
   * What each button of the pane says, in order.
   * @returns The text of each button.
   */
  get buttonTexts(): string[] {
    return this.scope
      .queryAllByRole("button")
      .map((button) => button.textContent);
  }
}

export type { EmptyNodeButtonPom };
