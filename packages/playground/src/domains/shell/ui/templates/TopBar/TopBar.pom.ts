import { within } from "@testing-library/react";

import { Pom } from "@/shared/testing/pom";

import { TOP_BAR_TEST_ID } from "./TopBar.constants";
import type { TopBarCounts } from "./TopBar.types";

/** What the text of the status starts with: the number of files. */
const STATUS_PATTERN = /^\d+ files? ·/;

/** What the text of the status is once the problems are counted, with the number of files, dependencies and problems as its groups. */
const COUNTED_STATUS_PATTERN =
  /^(\d+) files? · (\d+) (?:dependency|dependencies) · (\d+) problems?$/;

/** The attributes that the styled parts of the bar use as props and must not leave in the DOM. */
const PROP_ATTRIBUTES = ["color", "tone"] as const;

/** Page object of the top bar. It finds its root by the test id of the bar, or by the `testId` option when a component that is the bar gives it another. A component that is the bar can also give it its root with the `root` option. */
export class TopBarPom extends Pom {
  protected readonly defaultTestId: string = TOP_BAR_TEST_ID;

  /**
   * The element of the text of the status, which holds the number of files and the count of problems.
   * @returns The element.
   */
  private get label(): HTMLElement {
    return this.scope.getByText(STATUS_PATTERN);
  }

  /**
   * The dot before the text of the status.
   * @returns The element.
   * @throws When the status has no element before its text.
   */
  private get dot(): HTMLElement {
    const { previousElementSibling: dot } = this.label;

    if (dot === null) {
      throw new Error(
        `${this.constructor.name} found no dot before the status`
      );
    }

    return dot as HTMLElement;
  }

  /**
   * The element that says how many problems there are, that the config has errors, or how the evaluation goes: the last element of the text of the status.
   * @returns The element.
   * @throws When the text of the status has no element at its end.
   */
  private get problems(): HTMLElement {
    const { lastElementChild: problems } = this.label;

    if (problems === null) {
      throw new Error(
        `${this.constructor.name} found no problems in the status`
      );
    }

    return problems as HTMLElement;
  }

  /**
   * The element that holds the dot and the text of the status.
   * @returns The element.
   */
  private get status(): HTMLElement {
    return this.label.parentElement as HTMLElement;
  }

  /**
   * The live region of the status, which screen readers announce and the bar does not draw.
   * @returns The element.
   */
  private get announcementRegion(): HTMLElement {
    return within(this.status).getByRole("status");
  }

  /**
   * The text of what the bar places before the status, in order.
   * @returns The text of each element before the status.
   */
  get startTexts(): string[] {
    return Array.from(this.root.children)
      .slice(0, Array.from(this.root.children).indexOf(this.status))
      .map((element) => element.textContent);
  }

  /**
   * The text of what the bar places at its end, in order.
   * @returns The text of each element after the spacer that follows the status.
   */
  get endTexts(): string[] {
    return Array.from(this.root.children)
      .slice(Array.from(this.root.children).indexOf(this.status) + 2)
      .map((element) => element.textContent);
  }

  /**
   * How much of the room that is left the space between the status and the end takes, which is what pushes the end of the bar to the far side.
   * @returns The computed `flex-grow` of the element after the status.
   */
  get spacerGrow(): string {
    return getComputedStyle(this.status.nextElementSibling as HTMLElement)
      .flexGrow;
  }

  /**
   * How much each item of the bar shrinks when there is not room for all of them, which is none: what the bar holds keeps its size.
   * @returns The computed `flex-shrink` of what comes before the status, of the status and of what comes after the spacer, in order. The spacer has no size to give up, so it is left out.
   */
  get itemShrinks(): string[] {
    const items = Array.from(this.root.children);
    const spacer = items.indexOf(this.status) + 1;

    return items
      .filter((_item, index) => index !== spacer)
      .map((item) => getComputedStyle(item).flexShrink);
  }

  /**
   * Everything the status says.
   * @returns The text of the status, such as `6 files · 2 problems`.
   */
  get statusText(): string {
    return this.label.textContent;
  }

  /**
   * The numbers that the status counts once the problems are known.
   * @returns The numbers of files, dependencies and problems.
   * @throws When the status does not count the problems, such as when it says that the config has errors.
   */
  get counts(): TopBarCounts {
    const text = this.statusText;
    const match = COUNTED_STATUS_PATTERN.exec(text);

    if (match === null) {
      throw new Error(
        `${this.constructor.name} found no count of the problems in the status "${text}"`
      );
    }

    return {
      files: Number(match[1]),
      dependencies: Number(match[2]),
      problems: Number(match[3]),
    };
  }

  /**
   * Whether the status says anything after the number of dependencies, which it does not before the problems are known.
   * @returns True when the text of the status has an element at its end.
   */
  get hasProblems(): boolean {
    return this.label.lastElementChild !== null;
  }

  /**
   * What the status says after the number of dependencies, in place of which the caller may say how the evaluation goes.
   * @returns The text of the count of problems, `config has errors`, or what the caller says about the evaluation.
   */
  get problemsText(): string {
    return this.problems.textContent;
  }

  /**
   * Whether what the status says after the number of dependencies is hidden from assistive technology, which hears it from the live region instead.
   * @returns True when its `aria-hidden` attribute is `true`.
   */
  get isProblemsHidden(): boolean {
    return this.problems.getAttribute("aria-hidden") === "true";
  }

  /**
   * What the live region of the status holds, which a screen reader announces when it changes.
   * @returns Its text, empty when it says nothing.
   */
  get announcement(): string {
    return this.announcementRegion.textContent;
  }

  /**
   * Whether the live region of the status is drawn, which it must not be: the text on screen is beside it.
   * @returns True when it is not absolutely positioned or not clipped, as a visually hidden element is.
   */
  get isAnnouncementDrawn(): boolean {
    const { clipPath, position } = getComputedStyle(this.announcementRegion);

    return clipPath !== "inset(50%)" || position !== "absolute";
  }

  /**
   * The color of what the status says after the number of dependencies.
   * @returns The computed value.
   */
  get problemsColor(): string {
    return getComputedStyle(this.problems).color;
  }

  /**
   * The element the dot is drawn in.
   * @returns The tag name of the dot, in upper case.
   */
  get dotTagName(): string {
    return this.dot.tagName;
  }

  /**
   * Whether the dot is hidden from assistive technology, which reads the status text and not the dot.
   * @returns True when the `aria-hidden` attribute of the dot is `true`.
   */
  get isDotHidden(): boolean {
    return this.dot.getAttribute("aria-hidden") === "true";
  }

  /**
   * The color of the dot.
   * @returns The computed background color.
   */
  get dotColor(): string {
    return getComputedStyle(this.dot).backgroundColor;
  }

  /**
   * The props of the styled parts that reached the DOM as attributes, which they must not do.
   * @returns The name of each such attribute found in the bar, in document order; empty when there is none.
   */
  get leakedPropAttributes(): string[] {
    return [this.root, ...Array.from(this.root.querySelectorAll("*"))].flatMap(
      (element) =>
        PROP_ATTRIBUTES.filter((attribute) => element.hasAttribute(attribute))
    );
  }
}
