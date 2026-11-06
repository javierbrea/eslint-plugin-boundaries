import { ConfigEditorPom } from "@/domains/config/ui/atoms/ConfigEditor/ConfigEditor.pom";
import { Pom } from "@/shared/testing/pom";
import { MonoPom } from "@/ui-kit/atoms/Mono/Mono.pom";
import { PaneFramePom } from "@/ui-kit/atoms/PaneFrame/PaneFrame.pom";
import { PaneHeadPom } from "@/ui-kit/atoms/PaneHead/PaneHead.pom";

import { CONFIG_PANE_TEST_ID } from "./ConfigPane.constants";

/** Page object of the config pane. It finds its root by the test id of the pane, or by the `testId` option when a module that is this pane gives it another. */
export class ConfigPanePom extends Pom {
  protected readonly defaultTestId: string = CONFIG_PANE_TEST_ID;

  /**
   * The landmark the pane is, which has the same root element.
   * @returns The page object of the frame.
   */
  get frame(): PaneFramePom {
    return this.childPom(PaneFramePom, { root: this.root });
  }

  /**
   * The head of the pane, with the name of the file and the hint, which is the first child of the frame.
   * @returns The page object of the head.
   */
  get head(): PaneHeadPom {
    return this.childPom(PaneHeadPom);
  }

  /**
   * Gets a name or a path in mono of the head.
   * @param text The text of the code.
   * @returns The page object of the code.
   */
  code(text: string): MonoPom {
    return this.childPom(MonoPom, { containing: text });
  }

  /**
   * The first code editor of the pane.
   * @returns The page object of the editor.
   */
  get editor(): ConfigEditorPom {
    return this.childPom(ConfigEditorPom);
  }

  /**
   * Gets the code editor that has an accessible name.
   * @param accessibleName The name of the editor.
   * @returns The page object of the editor.
   */
  editorNamed(accessibleName: string): ConfigEditorPom {
    return this.childPom(ConfigEditorPom, { name: accessibleName });
  }

  /**
   * The element that holds the editor under the head, which is the second child of the frame.
   * @returns The element.
   */
  private get editorSlot(): HTMLElement {
    return this.root.children[1] as HTMLElement;
  }

  /**
   * How much of the free height the editor slot takes.
   * @returns The computed `flex-grow` of the slot.
   */
  get editorSlotFlexGrow(): string {
    return getComputedStyle(this.editorSlot).flexGrow;
  }

  /**
   * The shortest the editor slot may get, so that the editor scrolls inside it.
   * @returns The computed `min-height` of the slot.
   */
  get editorSlotMinHeight(): string {
    return getComputedStyle(this.editorSlot).minHeight;
  }
}
