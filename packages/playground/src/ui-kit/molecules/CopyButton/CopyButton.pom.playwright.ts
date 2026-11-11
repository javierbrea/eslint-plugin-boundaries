import type { Locator } from "@playwright/test";

import { Pom } from "@/shared/testing/pom/pom.playwright";

import { COPY_BUTTON_TEST_ID } from "./CopyButton.constants";

/** Page object of a face of the button, a part of the button: the page object of the button builds it, so it is exported only as a type. It has no test id: it is the first face (the `index` option at 0, which is the default) or the second one (`index` 1) among the children of the element that holds the faces. */
class CopyButtonFacePom extends Pom {
  protected readonly defaultTestId = "";

  /** @inheritdoc */
  protected findRoot(): Locator {
    return this.findRootBySelector(":scope > :first-child > *");
  }

  /**
   * How opaque the face is, as the browser draws it, which is between 0 and 1 while the face comes in or goes out.
   * @returns A promise of the computed opacity, or an empty string when the face is not in the page.
   */
  private get opacity(): Promise<string> {
    return this.root
      .evaluateAll((faces) =>
        faces.map((face) => getComputedStyle(face).opacity)
      )
      .then(([opacity]) => opacity ?? "");
  }

  /**
   * Whether the face is gone from sight. It reads once and does not wait.
   * @returns A promise of true when it is fully transparent.
   */
  get isConcealed(): Promise<boolean> {
    return this.opacity.then((opacity) => opacity === "0");
  }

  /**
   * What the face says. It reads once and does not wait.
   * @returns A promise of the text of the face, which is empty for the icon.
   */
  get text(): Promise<string> {
    return this.readText();
  }
}

/** Page object of a copy button, in a browser. It finds its root, the button, by the test id of the component (the `testId` option when the caller gave it another). */
export class CopyButtonPom extends Pom {
  protected readonly defaultTestId: string = COPY_BUTTON_TEST_ID;

  /**
   * The face with the label, which is the first one.
   * @returns The page object of the face.
   */
  get labelFace(): CopyButtonFacePom {
    return this.childPom(CopyButtonFacePom, { index: 0 });
  }

  /**
   * The face that confirms the copy, which is the second one.
   * @returns The page object of the face.
   */
  get copiedFace(): CopyButtonFacePom {
    return this.childPom(CopyButtonFacePom, { index: 1 });
  }

  /**
   * What a user reads on the button, which is what the faces that are not gone from sight say. It reads once and does not wait, and it holds both words while the faces swap.
   * @returns A promise of the text of the faces that are drawn, such as `Share` or `Copied`.
   */
  get visibleText(): Promise<string> {
    return Promise.all(
      [this.labelFace, this.copiedFace].map(async (face) =>
        (await face.isConcealed) ? "" : face.text
      )
    ).then((texts) => texts.join(""));
  }

  /** Presses the button. */
  async press(): Promise<void> {
    await this.root.click();
  }
}

export type { CopyButtonFacePom };
