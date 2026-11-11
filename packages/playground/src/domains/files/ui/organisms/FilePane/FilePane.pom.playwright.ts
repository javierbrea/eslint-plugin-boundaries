import type { Locator } from "@playwright/test";

import { Pom } from "@/shared/testing/pom/pom.playwright";
import { PaneHeadPom } from "@/ui-kit/atoms/PaneHead/PaneHead.pom.playwright";

import { ADD_DEPENDENCY_LABEL, FILE_PANE_TEST_ID } from "./FilePane.constants";

/** Page object of the button that adds a dependency, a part of the pane: the page object of the pane builds it, so it is exported only as a type. It has no test id: it finds the button by its label within its parent. */
class AddDependencyButtonPom extends Pom {
  protected readonly defaultTestId = "";

  /** @inheritdoc */
  protected findRoot(): Locator {
    return this.pickMatch(
      this.searchBase.getByRole("button", {
        name: ADD_DEPENDENCY_LABEL,
        exact: true,
      })
    );
  }

  /** Presses the button. */
  async press(): Promise<void> {
    await this.root.click();
  }
}

/** Page object of the file pane, in a browser. It finds its root by the test id of the pane, or by the `testId` option when a module that is this pane gives it another. */
export class FilePanePom extends Pom {
  protected readonly defaultTestId: string = FILE_PANE_TEST_ID;

  /**
   * The head of the pane, with the path of the file, which is the first child of the frame.
   * @returns The page object of the head.
   */
  get head(): PaneHeadPom {
    return this.childPom(PaneHeadPom);
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
