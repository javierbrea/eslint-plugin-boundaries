import type { Locator } from "@playwright/test";

import { Pom } from "@/shared/testing/pom/pom.playwright";

/** The part of the content element of CodeMirror that `text` reads: the view that CodeMirror keeps on it, from which `EditorView.findFromDOM` finds the view. It is not public API of CodeMirror. */
type ContentWithView = HTMLElement & {
  readonly cmTile?: {
    readonly view?: {
      readonly state: { readonly doc: { toString: () => string } };
    };
  };
};

/**
 * Page object of the config editor, in a browser. It finds the editor by its accessible name, the `name` option, or the first code editor of its parent when there is none; its root is the element that holds the text, which is the `textbox` of CodeMirror.
 */
export class ConfigEditorPom extends Pom {
  protected readonly defaultTestId = "";

  /** @inheritdoc */
  protected findRoot(): Locator {
    const { name: accessibleName } = this.options;

    return this.pickMatch(
      this.searchBase.getByRole(
        "textbox",
        accessibleName === undefined
          ? {}
          : { name: accessibleName, exact: true }
      )
    );
  }

  /**
   * The text of the editor, as the user would copy it: the whole document, which CodeMirror holds in its state. The DOM holds only some of the lines of a document longer than the pane, so it is not whole there: the Overview example draws 36 of its 49 lines when its config opens. It reads the view that CodeMirror keeps on its content element, which is not public API of CodeMirror: if a new version moves it, this getter throws, and it is the only place to update. It reads once and does not wait.
   * @returns A promise of the whole document.
   * @throws When the editor is not in the page, as its jsdom sibling does, so that two reads of no editor never compare equal, or when its content element keeps no view of CodeMirror.
   */
  get text(): Promise<string> {
    return this.root
      .evaluateAll((contents) =>
        contents.map(
          (content) =>
            (content as ContentWithView).cmTile?.view?.state.doc.toString() ??
            null
        )
      )
      .then(([text]) => {
        if (text === undefined) {
          throw new Error(`${this.constructor.name} found no editor`);
        }
        if (text === null) {
          throw new Error(
            `${this.constructor.name} found no CodeMirror view in its content element`
          );
        }

        return text;
      });
  }
}
