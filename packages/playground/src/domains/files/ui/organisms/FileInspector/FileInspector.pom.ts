import { InspectorRowsPom } from "@/domains/files/ui/atoms/InspectorRows/InspectorRows.pom";
import { PropertyListPom } from "@/domains/files/ui/atoms/PropertyList/PropertyList.pom";
import { DEPENDENCY_SUMMARY_TEST_ID } from "@/domains/files/ui/molecules/DependencySummary/DependencySummary.constants";
import { DependencySummaryPom } from "@/domains/files/ui/molecules/DependencySummary/DependencySummary.pom";
import { ENTITY_BOXES_TEST_ID } from "@/domains/files/ui/molecules/EntityBoxes/EntityBoxes.constants";
import { EntityBoxesPom } from "@/domains/files/ui/molecules/EntityBoxes/EntityBoxes.pom";
import { Pom } from "@/shared/testing/pom";
import { DISCLOSURE_TEST_ID } from "@/ui-kit/molecules/Disclosure/Disclosure.constants";
import { DisclosurePom } from "@/ui-kit/molecules/Disclosure/Disclosure.pom";
import { NotePom } from "@/ui-kit/molecules/Note/Note.pom";

import { FILE_INSPECTOR_TEST_ID } from "./FileInspector.constants";
import type { FileInspectorPartSpacing } from "./FileInspector.types";

/** What a part of the body of the section `from` is, as its page object tells it. */
type SectionPart = "summary" | "boxes";

/** The part of the body of a section that each test id belongs to. */
const SECTION_PARTS: Readonly<Record<string, SectionPart>> = {
  [DEPENDENCY_SUMMARY_TEST_ID]: "summary",
  [ENTITY_BOXES_TEST_ID]: "boxes",
};

/** Page object of a section of the file inspector, a part of it: the page object of the inspector builds it, so it is exported only as a type. It is the disclosure that has the name of the section as its label, with what the section holds. */
class InspectorSectionPom extends DisclosurePom {
  /**
   * The boxes of the description of an entity, which `from` and `to` hold.
   * @returns The page object of the boxes.
   */
  get boxes(): EntityBoxesPom {
    return this.childPom(EntityBoxesPom);
  }

  /**
   * The line that says how many dependencies the file has, which `from` holds.
   * @returns The page object of the summary.
   */
  get dependencies(): DependencySummaryPom {
    return this.childPom(DependencySummaryPom);
  }

  /**
   * The box with the properties of the dependency, which `dependency` holds.
   * @returns The page object of the list of properties.
   */
  get properties(): PropertyListPom {
    return this.childPom(PropertyListPom);
  }

  /**
   * What the body of the section holds, in order.
   * @returns `summary` for the line of the dependencies of the file and `boxes` for the boxes of an entity.
   */
  get parts(): SectionPart[] {
    return Array.from(this.root.querySelectorAll("[data-testid]")).flatMap(
      (element) => {
        const part = SECTION_PARTS[element.getAttribute("data-testid") ?? ""];

        return part === undefined ? [] : [part];
      }
    );
  }
}

/** Page object of the file inspector. */
export class FileInspectorPom extends Pom {
  protected readonly defaultTestId = FILE_INSPECTOR_TEST_ID;

  /**
   * The direct children of the inspector, which are its sections and its rows with nothing to fold.
   * @returns The elements in order.
   */
  private get parts(): HTMLElement[] {
    return Array.from(this.root.children) as HTMLElement[];
  }

  /**
   * Gets a section of the inspector.
   * @param sectionName The name of the section: `from`, `to` or `dependency`.
   * @returns The page object of the section, which is not rendered while the inspector has none of that name.
   */
  section(sectionName: string): InspectorSectionPom {
    return this.childPom(InspectorSectionPom, { name: sectionName });
  }

  /**
   * The names of the sections that fold.
   * @returns The label of each section, in order.
   */
  get sectionNames(): string[] {
    return this.parts
      .filter((part) => part.dataset.testid === DISCLOSURE_TEST_ID)
      .map((root) => this.childPom(DisclosurePom, { root }).label);
  }

  /**
   * The rows that stand for the sections that have nothing to fold.
   * @returns The page object of the rows, which is not rendered while every section folds.
   */
  get rows(): InspectorRowsPom {
    return this.childPom(InspectorRowsPom);
  }

  /**
   * What the dashed hint says, which is drawn while no dependency is in focus.
   * @returns The text of the hint, or null when the inspector has none.
   */
  get hint(): string | null {
    return this.hintElement?.textContent ?? null;
  }

  /**
   * How the hint is drawn: a dashed box in the muted color, placed under the rows.
   * @returns The computed border style and radius, the color and the margin.
   * @throws When the inspector has no hint.
   */
  get hintStyle(): Record<
    "borderStyle" | "borderRadius" | "color" | "margin" | "padding",
    string
  > {
    if (this.hintElement === null) {
      throw new Error(`${this.constructor.name} found no hint`);
    }

    const { borderTopStyle, borderRadius, color, margin, padding } =
      getComputedStyle(this.hintElement);

    return {
      borderStyle: borderTopStyle,
      borderRadius,
      color,
      margin,
      padding,
    };
  }

  /**
   * The note that says why the plugin does not read a dependency.
   * @returns The page object of the note, which is not rendered unless the dependency in focus is one that the plugin does not read.
   */
  get note(): NotePom {
    return this.childPom(NotePom);
  }

  /**
   * How each direct child of the inspector is padded and separated from the one before.
   * @returns The computed top and bottom padding and the border style on top of each child, in order.
   */
  get partSpacing(): FileInspectorPartSpacing[] {
    return this.parts.map((part) => {
      const { paddingTop, paddingBottom, borderTopStyle } =
        getComputedStyle(part);

      return { paddingTop, paddingBottom, borderTopStyle };
    });
  }

  /**
   * The hint, which is the paragraph of the inspector.
   * @returns The element, or null.
   */
  private get hintElement(): HTMLElement | null {
    return this.root.querySelector("p");
  }
}

export type { InspectorSectionPom };
