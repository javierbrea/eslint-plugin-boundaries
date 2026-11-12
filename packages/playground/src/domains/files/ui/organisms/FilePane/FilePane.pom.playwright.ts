import { Pom } from "@/shared/testing/pom/pom.playwright";
import { PaneHeadPom } from "@/ui-kit/atoms/PaneHead/PaneHead.pom.playwright";

import { FILE_PANE_TEST_ID } from "./FilePane.constants";

/** Page object of the button that adds a dependency, a part of the pane, exported only as a type. No browser spec reaches it: it exists because the jsdom page object exports a class of this name, which `check:pom-parity` requires of this file too. */
class AddDependencyButtonPom extends Pom {
  protected readonly defaultTestId = "";
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
}

export type { AddDependencyButtonPom };
