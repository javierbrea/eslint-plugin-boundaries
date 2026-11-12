import { ConfigInspectorPom } from "@/domains/config/ui/molecules/ConfigInspector/ConfigInspector.pom";
import { FileInspectorPom } from "@/domains/files/ui/organisms/FileInspector/FileInspector.pom";
import { ProjectSummaryPom } from "@/domains/project/ui/molecules/ProjectSummary/ProjectSummary.pom";
import { InspectorLayoutPom } from "@/domains/shell/ui/templates/InspectorLayout/InspectorLayout.pom";
import { Pom } from "@/shared/testing/pom";
import { NotePom } from "@/ui-kit/molecules/Note/Note.pom";

import { INSPECTOR_PANE_TEST_ID } from "./InspectorPane.constants";
import type { InspectorPaneShown } from "./InspectorPane.types";

/** The kinds of inspector the pane holds, each one the name of the getter of its page object. */
const INSPECTOR_KINDS: readonly InspectorPaneShown[] = [
  "file",
  "config",
  "project",
];

/** Page object of the inspector pane, which is the layout with the inspector of the node in focus. */
export class InspectorPanePom extends Pom {
  protected readonly defaultTestId = INSPECTOR_PANE_TEST_ID;

  /**
   * The kinds of inspector that the pane holds.
   * @returns The kinds whose inspector is rendered, in the order of the page object.
   */
  private get renderedKinds(): InspectorPaneShown[] {
    return INSPECTOR_KINDS.filter((kind) => this[kind].isRendered);
  }

  /**
   * Whether the pane describes anything, which it does not before the first evaluation arrives.
   * @returns True when the pane holds an inspector.
   */
  get hasInspector(): boolean {
    return this.renderedKinds.length > 0;
  }

  /**
   * What the pane describes.
   * @returns `file` for a file, `config` for the config and `project` when nothing is open.
   * @throws When the pane holds none of the inspectors, or more than one.
   */
  get shown(): InspectorPaneShown {
    const rendered = this.renderedKinds;

    if (rendered.length !== 1) {
      const found = rendered.length === 0 ? "none" : rendered.join(", ");
      throw new Error(
        `${this.constructor.name} expected exactly one inspector in its root, found ${found}`
      );
    }

    return rendered[0];
  }

  /**
   * The layout the pane is, which has the same root element.
   * @returns The page object of the layout.
   */
  get layout(): InspectorLayoutPom {
    return this.childPom(InspectorLayoutPom, { root: this.root });
  }

  /**
   * The note that the pane shows in place of a description, before the first evaluation arrives and once it is late, stopped or failed.
   * @returns The page object of the note, which is not rendered unless the pane describes nothing and has something to say about the evaluation.
   */
  get note(): NotePom {
    return this.childPom(NotePom);
  }

  /**
   * The inspector of a file.
   * @returns The page object of the file inspector, which is not rendered unless a file is in focus.
   */
  get file(): FileInspectorPom {
    return this.childPom(FileInspectorPom);
  }

  /**
   * The inspector of the config.
   * @returns The page object of the config inspector, which is not rendered unless the config is in focus.
   */
  get config(): ConfigInspectorPom {
    return this.childPom(ConfigInspectorPom);
  }

  /**
   * The summary of the sketch.
   * @returns The page object of the summary, which is not rendered unless nothing is in focus.
   */
  get project(): ProjectSummaryPom {
    return this.childPom(ProjectSummaryPom);
  }
}
