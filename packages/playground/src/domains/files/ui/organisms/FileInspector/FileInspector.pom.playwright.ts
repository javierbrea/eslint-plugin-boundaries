import { Pom } from "@/shared/testing/pom/pom.playwright";
import { DisclosurePom } from "@/ui-kit/molecules/Disclosure/Disclosure.pom.playwright";

import { FILE_INSPECTOR_TEST_ID } from "./FileInspector.constants";

/** Page object of a section of the file inspector, a part of it: the page object of the inspector builds it, so it is exported only as a type. It is the disclosure that has the name of the section as its label. The summary of the section `from` is the path of the open file. */
class InspectorSectionPom extends DisclosurePom {}

/** Page object of the file inspector, in a browser. */
export class FileInspectorPom extends Pom {
  protected readonly defaultTestId = FILE_INSPECTOR_TEST_ID;

  /**
   * Gets a section of the inspector.
   * @param sectionName The name of the section: `from`, `to` or `dependency`.
   * @returns The page object of the section, which is not rendered while the inspector has none of that name.
   */
  section(sectionName: string): InspectorSectionPom {
    return this.childPom(InspectorSectionPom, { name: sectionName });
  }
}

export type { InspectorSectionPom };
