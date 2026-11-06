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
}
