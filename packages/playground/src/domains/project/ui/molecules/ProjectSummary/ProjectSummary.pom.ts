import { VerdictCountPom } from "@/domains/evaluation/ui/atoms/VerdictCount/VerdictCount.pom";
import { Pom } from "@/shared/testing/pom";
import { SectionTitlePom } from "@/ui-kit/atoms/SectionTitle/SectionTitle.pom";

import { PROJECT_SUMMARY_TEST_ID } from "./ProjectSummary.constants";

/** Page object of the summary of the sketch. */
export class ProjectSummaryPom extends Pom {
  protected readonly defaultTestId = PROJECT_SUMMARY_TEST_ID;

  /**
   * The title of the summary, which is the first child of the summary.
   * @returns The page object of the title.
   */
  get title(): SectionTitlePom {
    return this.childPom(SectionTitlePom);
  }

  /**
   * The numbers of the grid.
   * @returns The text of each tile, which is its number followed by its label, in the order of the grid.
   */
  get numbers(): string[] {
    return Array.from(this.root.querySelectorAll("b")).map(
      (count) => (count.parentElement as HTMLElement).textContent
    );
  }

  /**
   * One number of the grid.
   * @param label The label of the tile, such as `files`.
   * @returns The text of the number.
   */
  count(label: string): string {
    return (this.scope.getByText(label).previousElementSibling as HTMLElement)
      .textContent;
  }

  /**
   * The color a number of the grid is drawn in, which tells the disallowed dependencies apart from the other numbers.
   * @param label The label of the tile, such as `disallowed`.
   * @returns The computed color of the number.
   */
  countColor(label: string): string {
    return getComputedStyle(
      this.scope.getByText(label).previousElementSibling as HTMLElement
    ).color;
  }

  /**
   * The line under the grid, which is the last element of the summary.
   * @returns The text of the line: what each count says one after the other, or `not evaluated`.
   */
  get verdictsLine(): string {
    return (this.root.lastElementChild as HTMLElement).textContent;
  }

  /**
   * The counts of the line under the grid.
   * @returns The text, the computed color and the outline of the icon of each count, in order; empty while the dependencies are not evaluated.
   */
  get verdictCounts(): { text: string; color: string; iconPath: string }[] {
    const { count } = this.childPom(VerdictCountPom);

    return Array.from({ length: count }, (_, index) => {
      const { text, color, icon } = this.childPom(VerdictCountPom, { index });

      return { text, color, iconPath: icon.pathData };
    });
  }

  /**
   * The color of the line under the grid when it says that the dependencies are not evaluated.
   * @returns The computed color of the line.
   */
  get verdictsLineColor(): string {
    return getComputedStyle(this.root.lastElementChild as HTMLElement).color;
  }
}
