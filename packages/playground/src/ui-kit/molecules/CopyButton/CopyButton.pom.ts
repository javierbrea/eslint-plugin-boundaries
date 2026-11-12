import { act, fireEvent } from "@testing-library/react";

import { getStyle } from "@/shared/testing/emittedStyle";
import { Pom } from "@/shared/testing/pom";
import { IconPom } from "@/ui-kit/atoms/Icon/Icon.pom";

import { COPY_BUTTON_TEST_ID } from "./CopyButton.constants";
import type { CopyButtonFaceStyle } from "./CopyButton.types";

/** The media query under which the button stops animating its faces. */
const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

/** The `transition` that a part of the button declares always, and the one it declares for a user who asks for less motion. A value is undefined when there is no such declaration. */
type Transitions = {
  readonly always: string | undefined;
  readonly reducedMotion: string | undefined;
};

/** How the faces and the button lay themselves out. */
type CopyButtonLayout = {
  /** The computed `display` of the element that holds both faces. */
  readonly facesDisplay: string;
  /** The computed `grid-area` of the face with the label. */
  readonly labelFaceArea: string;
  /** The computed `grid-area` of the face with the confirmation. */
  readonly copiedFaceArea: string;
};

/** Page object of a face of the button, a part of the button: the page object of the button builds it, so it is exported only as a type. It has no test id: it is the first face (the `index` option at 0, which is the default) or the second one (`index` 1) among the children of the element that holds the faces. */
class CopyButtonFacePom extends Pom {
  protected readonly defaultTestId = "";

  /** @inheritdoc */
  protected findRoot(): HTMLElement {
    const faces = this.searchBaseElement.firstElementChild;

    return this.pickMatch(
      Array.from((faces?.children ?? []) as Iterable<HTMLElement>),
      "a face of the button"
    );
  }

  /**
   * The styles that tell whether the face shows.
   * @returns The computed opacity.
   */
  private get style(): CopyButtonFaceStyle {
    const { opacity } = getComputedStyle(this.root);

    return { opacity };
  }

  /**
   * Whether the face is drawn.
   * @returns True when it is fully opaque.
   */
  get isShown(): boolean {
    return this.style.opacity === "1";
  }

  /**
   * Whether the face is gone from sight.
   * @returns True when it is fully transparent.
   */
  get isConcealed(): boolean {
    return this.style.opacity === "0";
  }

  /**
   * What the face says.
   * @returns The text of the face, which is empty for the icon.
   */
  get text(): string {
    return this.root.textContent;
  }

  /**
   * Where the face waits while it is not shown, which is above or below the button.
   * @returns The computed `transform`, which is `none` while the face is shown.
   */
  get transform(): string {
    return getComputedStyle(this.root).transform;
  }

  /**
   * Whether assistive technology skips the face.
   * @returns True when its `aria-hidden` attribute is `true`.
   */
  get isHiddenFromAssistiveTechnology(): boolean {
    return this.root.getAttribute("aria-hidden") === "true";
  }

  /**
   * The icon of the face, which is the first one of the face.
   * @returns The page object of the icon, which is not rendered when the face has none.
   */
  get icon(): IconPom {
    return this.childPom(IconPom);
  }

  /**
   * How the face animates when it comes in and goes out.
   * @returns What its `transition` is always, and for a user who asks for less motion.
   */
  get transitions(): Transitions {
    return {
      always: getStyle(this.root).transition,
      reducedMotion: getStyle(this.root, undefined, REDUCED_MOTION).transition,
    };
  }

  /**
   * How the element that wraps the icon of the face animates, which is how the check grows into place after the face starts to come in.
   * @returns What its `transition` is always, and for a user who asks for less motion.
   * @throws When the face has no icon.
   */
  get iconWrapperTransitions(): Transitions {
    const wrapper = this.root.querySelector("svg")?.parentElement;

    if (wrapper === null || wrapper === undefined) {
      throw new Error(`${this.constructor.name} found no icon in the face`);
    }

    return {
      always: getStyle(wrapper).transition,
      reducedMotion: getStyle(wrapper, undefined, REDUCED_MOTION).transition,
    };
  }

  /**
   * Where the face is placed in the grid that holds both faces.
   * @returns The computed `grid-area`.
   */
  get gridArea(): string {
    return getComputedStyle(this.root).gridArea;
  }
}

/** Page object of a copy button. It finds its root, the button, by the test id of the component (the `testId` option when the caller gave it another). */
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
   * Whether the button confirms the copy: the confirmation is drawn and the label is gone.
   * @returns True when the face with the check shows and the face with the label does not.
   */
  get isShowingCopied(): boolean {
    return this.copiedFace.isShown && this.labelFace.isConcealed;
  }

  /**
   * Whether the button says what it does: the label is drawn and the confirmation is gone.
   * @returns True when the face with the label shows and the face with the check does not.
   */
  get isShowingLabel(): boolean {
    return this.labelFace.isShown && this.copiedFace.isConcealed;
  }

  /**
   * What a user reads on the button, which is what the faces that are drawn say.
   * @returns The text of the face that is shown.
   */
  get visibleText(): string {
    return [this.labelFace, this.copiedFace]
      .filter((face) => !face.isConcealed)
      .map((face) => face.text)
      .join("");
  }

  /**
   * Whether assistive technology reads the button as a button with a given name, which is its label whatever face is drawn.
   * @param accessibleName The accessible name.
   * @returns True when the button is among the buttons of that name of the element that holds it.
   */
  isButtonNamed(accessibleName: string): boolean {
    return this.isNamed("button", accessibleName);
  }

  /**
   * How the MUI button is drawn.
   * @returns `contained`, `outlined` or `text`, from the class MUI gives the button, or null when it has none of them.
   */
  get variant(): string | null {
    const variantClass = Array.from(this.root.classList).find((className) =>
      /^MuiButton-(outlined|contained|text)$/.test(className)
    );

    return variantClass?.replace("MuiButton-", "") ?? null;
  }

  /**
   * The icon before the label.
   * @returns The page object of the icon, which is not rendered when the button has none.
   */
  get labelIcon(): IconPom {
    return this.labelFace.icon;
  }

  /**
   * The check of the confirmation.
   * @returns The page object of the icon.
   */
  get checkIcon(): IconPom {
    return this.copiedFace.icon;
  }

  /**
   * How the faces share the button, which keeps its width the same whichever one is drawn.
   * @returns The computed `display` of the element that holds the faces, and the `grid-area` of each face.
   */
  get layout(): CopyButtonLayout {
    return {
      facesDisplay: getComputedStyle(this.root.firstElementChild as HTMLElement)
        .display,
      labelFaceArea: this.labelFace.gridArea,
      copiedFaceArea: this.copiedFace.gridArea,
    };
  }

  /**
   * What the button does with the face that is not drawn, which sits outside the button.
   * @returns The computed `overflow` of the button.
   */
  get overflow(): string {
    return getComputedStyle(this.root).overflow;
  }

  /**
   * Whether the button has the keyboard focus.
   * @returns True when it is the active element of the page.
   */
  get isFocused(): boolean {
    return document.activeElement === this.root;
  }

  /**
   * The props of the styled parts that reached the DOM as attributes, which they must not do.
   * @returns The name of each such attribute found in the button, in document order; empty when there is none.
   */
  get leakedPropAttributes(): string[] {
    return ["isShown", "shift"].flatMap((attribute) =>
      [this.root, ...Array.from(this.root.querySelectorAll("*"))]
        .filter((element) => element.hasAttribute(attribute))
        .map(() => attribute)
    );
  }

  /** Presses the button. */
  press(): void {
    fireEvent.click(this.root);
  }

  /** Gives the button the keyboard focus, as a user does when they tab to it. */
  focus(): void {
    act(() => {
      this.root.focus();
    });
  }
}

export type { CopyButtonFacePom };
