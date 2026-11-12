import { VerdictCountPom } from "@/domains/evaluation/ui/atoms/VerdictCount/VerdictCount.pom";
import { Pom } from "@/shared/testing/pom";

import { DEPENDENCY_SUMMARY_TEST_ID } from "./DependencySummary.constants";

/** Page object of the summary of the dependencies of a file. */
export class DependencySummaryPom extends Pom {
  protected readonly defaultTestId = DEPENDENCY_SUMMARY_TEST_ID;

  /**
   * The text of the first element, which is the number of dependencies.
   * @returns The text, such as `4 dependencies`, or `4 dependencies · not evaluated`.
   */
  get total(): string {
    return (this.root.firstElementChild as HTMLElement).textContent;
  }

  /**
   * The color of the number of dependencies.
   * @returns The computed color.
   */
  get totalColor(): string {
    return getComputedStyle(this.root.firstElementChild as HTMLElement).color;
  }

  /**
   * The counts after the number of dependencies: how many were allowed, disallowed and not checked.
   * @returns One page object for each count that the summary draws, in order.
   */
  get counts(): VerdictCountPom[] {
    const { count } = this.childPom(VerdictCountPom);

    return Array.from({ length: count }, (_, index) =>
      this.childPom(VerdictCountPom, { index })
    );
  }

  /**
   * What each count says, with its color.
   * @returns The text and the computed color of each count, in order.
   */
  get countTexts(): { text: string; color: string }[] {
    return this.counts.map(({ text, color }) => ({ text, color }));
  }

  /**
   * What assistive technology reads for each count: the name of its icon, when the icon is an image, and then its words.
   * @returns The accessible name of the icon, which is undefined when the icon is hidden, and the text of each count, in order.
   */
  get countReadings(): { iconName: string | undefined; text: string }[] {
    return this.counts.map(({ iconName, text }) => ({ iconName, text }));
  }

  /**
   * The color of the words of each count, which is not the one of its icon.
   * @returns The computed color of the text of each count, in order.
   */
  get countTextColors(): string[] {
    return this.counts.map(({ textColor }) => textColor);
  }

  /**
   * The classes of the root element, which include the one a caller passes to place the summary.
   * @returns The class names.
   */
  get classNames(): string[] {
    return Array.from(this.root.classList);
  }

  /**
   * How far the summary is from the left of what holds it, which a caller sets to place it.
   * @returns The computed padding on the left.
   */
  get paddingLeft(): string {
    return getComputedStyle(this.root).paddingLeft;
  }
}
