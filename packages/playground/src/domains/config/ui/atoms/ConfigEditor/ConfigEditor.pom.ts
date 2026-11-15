/* global jest -- the page object is for specs, which run in Jest, and its recordings spy on CodeMirror */
import { insertNewlineAndIndent, undo as undoEdit } from "@codemirror/commands";
import { forEachDiagnostic } from "@codemirror/lint";
import { EditorSelection } from "@codemirror/state";
import { EditorView, runScopeHandlers } from "@codemirror/view";
import { tags } from "@lezer/highlight";
import type { Tag } from "@lezer/highlight";
import { act } from "@testing-library/react";

import type { ConfigEditorSnapshot } from "@/domains/config/ui/contexts/ConfigEditorSnapshotContext";
import { highlightField } from "@/domains/config/ui/helpers/editorHighlight";
import { HIGHLIGHT_CLASS } from "@/domains/config/ui/helpers/editorHighlight/editorHighlight.constants";
import { highlightStyle } from "@/domains/config/ui/helpers/editorTheme";
import { Pom } from "@/shared/testing/pom";

import type {
  ConfigEditorDestroyRecording,
  ConfigEditorDiagnostic,
  ConfigEditorDispatchRecording,
  ConfigEditorRevealRecording,
  ConfigEditorScrollRecording,
  ConfigEditorSelection,
  ConfigEditorSeverity,
} from "./ConfigEditor.types";

/** The element CodeMirror draws the editor in, whose parent is the element the component renders. */
const EDITOR_SELECTOR = ".cm-editor";

/** The identifiers handed out so far, by the object they stand for. */
const identifiers = new WeakMap<object, number>();

/** The identifier that the next object gets. */
let nextIdentifier = 1;

/**
 * Gives an object a number that stays the same for as long as the object does, so that a spec can tell whether two reads found the same object without holding a CodeMirror one.
 * @param target The object.
 * @returns Its number, which is not shared with any other object.
 */
function identify(target: object): number {
  let identifier = identifiers.get(target);

  if (identifier === undefined) {
    identifier = nextIdentifier++;
    identifiers.set(target, identifier);
  }

  return identifier;
}

/**
 * Page object of the config editor. It finds the editor by its accessible name, the `name` option, or the first code editor of its parent when there is none; its root is the element the component renders. It owns every CodeMirror call of the specs: they read the editor through its members and never import `@codemirror/*`. An action that changes the editor runs inside `act`, so that the components around it settle.
 */
export class ConfigEditorPom extends Pom {
  protected readonly defaultTestId = "";

  /** @inheritdoc */
  protected findRoot(): HTMLElement {
    const { name: accessibleName } = this.options;
    const hosts = this.searchBase
      .queryAllByRole(
        "textbox",
        accessibleName === undefined ? {} : { name: accessibleName }
      )
      .flatMap((textbox) => textbox.closest(EDITOR_SELECTOR) ?? [])
      .map((editor) => editor.parentElement as HTMLElement);

    return this.pickMatch(
      hosts,
      `the role "textbox" of a code editor${
        accessibleName === undefined ? "" : ` named ${accessibleName}`
      }`
    );
  }

  /**
   * The CodeMirror view of the editor.
   * @returns The view.
   * @throws When the root holds no editor element, or CodeMirror holds no view for it.
   */
  private get view(): EditorView {
    const editor = this.root.querySelector<HTMLElement>(EDITOR_SELECTOR);

    if (editor === null) {
      throw new Error(
        `${this.constructor.name} found no element by the selector "${EDITOR_SELECTOR}" in its root`
      );
    }

    const view = EditorView.findFromDOM(editor);

    if (view === null) {
      throw new Error(`${this.constructor.name} found no CodeMirror view`);
    }

    return view;
  }

  /**
   * Finds the texts that the editor draws with a syntax tag.
   * @param tag The tag.
   * @returns The text of each element that has the class of the tag, in order.
   */
  private tokenTexts(tag: Tag): string[] {
    const className = highlightStyle.style([tag]) as string;

    return Array.from(this.root.querySelectorAll(`.${className}`)).map(
      (token) => token.textContent
    );
  }

  /**
   * Counts the elements of the editor that match a selector.
   * @param selector The selector.
   * @returns How many elements of the editor match.
   */
  private count(selector: string): number {
    return this.root.querySelectorAll(selector).length;
  }

  /**
   * The text of the editor, as the user would copy it.
   * @returns The whole document.
   */
  get text(): string {
    return this.view.state.doc.toString();
  }

  /**
   * The text the editor draws.
   * @returns The text of each line of the DOM, joined by line breaks.
   */
  get renderedText(): string {
    return Array.from(this.root.querySelectorAll(".cm-line"))
      .map((line) => line.textContent)
      .join("\n");
  }

  /**
   * The numbers in the gutter of the lines.
   * @returns The text of each line number, in order.
   */
  get lineNumbers(): string[] {
    return Array.from(
      this.root.querySelectorAll(".cm-lineNumbers .cm-gutterElement")
    ).map((element) => element.textContent);
  }

  /**
   * The height of the element the component renders.
   * @returns The `height` of its inline style.
   */
  get height(): string {
    return this.root.style.height;
  }

  /**
   * How many editors the parent of this page object holds, however many are named like this one.
   * @returns The number of code editors in the search base, which is the document without a parent.
   */
  get editorCount(): number {
    return this.searchBaseElement.querySelectorAll(EDITOR_SELECTOR).length;
  }

  /**
   * The strings of the text, which the editor draws with the class of the string tag.
   * @returns The text of each one, in order.
   */
  get stringTokens(): string[] {
    return this.tokenTexts(tags.string);
  }

  /**
   * The keys of the text, which the editor draws with the class of the property name tag and not the one of the strings.
   * @returns The text of each one, in order.
   */
  get keyTokens(): string[] {
    return this.tokenTexts(tags.propertyName);
  }

  /**
   * Where the text is in the order of the Tab key.
   * @returns The `tabIndex` of the element that holds the text: 0 when Tab reaches it in the order of the page, -1 when Tab skips it.
   */
  get tabIndex(): number {
    return this.scope.getByRole("textbox").tabIndex;
  }

  /**
   * Whether the text cannot be edited.
   * @returns True when the editor is read only.
   */
  get isReadOnly(): boolean {
    return this.view.state.readOnly;
  }

  /**
   * Where the cursor is.
   * @returns The offset of the head of the main selection.
   */
  get cursor(): number {
    return this.view.state.selection.main.head;
  }

  /**
   * What is selected.
   * @returns The anchor and the head of the main selection.
   */
  get selection(): ConfigEditorSelection {
    const { anchor, head } = this.view.state.selection.main;

    return { anchor, head };
  }

  /**
   * The problems the editor holds.
   * @returns Where each one is, how it is drawn and the message of its tooltip, in order.
   */
  get diagnostics(): ConfigEditorDiagnostic[] {
    const diagnostics: ConfigEditorDiagnostic[] = [];

    forEachDiagnostic(this.view.state, ({ severity, message }, from, to) => {
      diagnostics.push({ from, to, severity, message });
    });

    return diagnostics;
  }

  /**
   * Whether the editor underlines any text, whatever the severity.
   * @returns True when it has an underline.
   */
  get hasUnderline(): boolean {
    return this.count(".cm-lintRange") > 0;
  }

  /**
   * The text that a problem is underlined at.
   * @param severity The severity of the underline.
   * @returns The text of the first underline of that severity, or null when there is none.
   */
  underlinedText(severity: ConfigEditorSeverity): string | null {
    return (
      this.root.querySelector(`.cm-lintRange-${severity}`)?.textContent ?? null
    );
  }

  /**
   * Whether a problem without width, such as a parse error, is drawn as a point.
   * @param severity The severity of the point.
   * @returns True when the editor has a point of that severity.
   */
  hasPoint(severity: ConfigEditorSeverity): boolean {
    return this.count(`.cm-lintPoint-${severity}`) > 0;
  }

  /**
   * How many lines the lint gutter marks with a severity.
   * @param severity The severity of the marker.
   * @returns The number of markers.
   */
  gutterMarkerCount(severity: ConfigEditorSeverity): number {
    return this.count(`.cm-gutter-lint .cm-lint-marker-${severity}`);
  }

  /**
   * The lines the highlight marks.
   * @returns The number of each line, from 1, in order.
   */
  get highlightedLines(): number[] {
    const { state } = this.view;
    const lines: number[] = [];

    state.field(highlightField).between(0, state.doc.length, (from) => {
      lines.push(state.doc.lineAt(from).number);
    });

    return lines;
  }

  /**
   * The text of the lines the highlight marks in the DOM.
   * @returns The text of each one, in order.
   */
  get highlightedLineTexts(): string[] {
    return Array.from(
      this.root.querySelectorAll(`.cm-line.${HIGHLIGHT_CLASS}`)
    ).map((line) => line.textContent);
  }

  /**
   * How many elements of the editor carry the class of the highlight, in the text and in the gutters.
   * @returns The number of elements.
   */
  get highlightMarkCount(): number {
    return this.count(`.${HIGHLIGHT_CLASS}`);
  }

  /**
   * How many elements of the lint gutter carry the class of the highlight.
   * @returns The number of elements.
   */
  get highlightedProblemGutterCount(): number {
    return this.count(`.cm-gutter-lint .cm-gutterElement.${HIGHLIGHT_CLASS}`);
  }

  /**
   * How many line numbers carry the class of the highlight.
   * @returns The number of elements.
   */
  get highlightedLineNumberCount(): number {
    return this.count(`.cm-lineNumbers .cm-gutterElement.${HIGHLIGHT_CLASS}`);
  }

  /**
   * Whether the editor still has to apply a scroll, which jsdom, with no layout, keeps as the only trace of a scroll that was restored.
   * @returns True when a scroll waits for the next measure of the view.
   */
  get hasPendingScroll(): boolean {
    const { scrollTarget } = (
      this.view as unknown as { viewState: { scrollTarget: unknown } }
    ).viewState;

    return scrollTarget !== null;
  }

  /**
   * An identifier of the view, which stays the same for as long as the editor keeps its view.
   * @returns The identifier.
   */
  get viewId(): number {
    return identify(this.view);
  }

  /**
   * An identifier of the document of the view, which changes whenever a change replaces the document, even with the same text.
   * @returns The identifier.
   */
  get documentId(): number {
    return identify(this.view.state.doc);
  }

  /**
   * Whether the view shows the very document that a snapshot holds, and not one built from an equal text.
   * @param snapshot What the editor left when it unmounted.
   * @returns True when both are the same document.
   */
  showsDocumentOf(snapshot: ConfigEditorSnapshot | undefined): boolean {
    return snapshot !== undefined && this.view.state.doc === snapshot.state.doc;
  }

  /**
   * The text that a snapshot holds.
   * @param snapshot What the editor left when it unmounted.
   * @returns The document of the snapshot, or undefined when there is none.
   */
  static textOfSnapshot(
    snapshot: ConfigEditorSnapshot | undefined
  ): string | undefined {
    return snapshot?.state.doc.toString();
  }

  /**
   * Types text as the user does, so that the editor reports it and puts it in the history.
   * @param position The offset the text goes at.
   * @param text The text to insert.
   */
  typeAt(position: number, text: string): void {
    act(() => {
      this.view.dispatch({
        changes: { from: position, insert: text },
        userEvent: "input.type",
      });
    });
  }

  /**
   * Replaces a range of the text, which is an edit that is not a keystroke.
   * @param from The offset the range starts at.
   * @param to The offset the range ends at.
   * @param text The text that takes its place.
   */
  replaceText(from: number, to: number, text: string): void {
    act(() => {
      this.view.dispatch({ changes: { from, to, insert: text } });
    });
  }

  /**
   * Puts the cursor at an offset.
   * @param position The offset.
   */
  moveCursor(position: number): void {
    act(() => {
      this.view.dispatch({ selection: { anchor: position } });
    });
  }

  /**
   * Selects a range of the text.
   * @param anchor The end that stays put.
   * @param head The end that moves.
   */
  select(anchor: number, head: number): void {
    act(() => {
      this.view.dispatch({ selection: EditorSelection.range(anchor, head) });
    });
  }

  /**
   * Scrolls an offset to the top of the view.
   * @param position The offset.
   */
  scrollTo(position: number): void {
    act(() => {
      this.view.dispatch({
        effects: EditorView.scrollIntoView(position, { y: "start" }),
      });
    });
  }

  /**
   * Undoes the last edit of the user.
   * @returns True when there was an edit to undo.
   */
  undo(): boolean {
    let undone = false;

    act(() => {
      undone = undoEdit(this.view);
    });

    return undone;
  }

  /**
   * Presses Enter, which breaks the line at the cursor and indents the new one.
   * @returns True when the editor took the key, which a read only editor does not.
   */
  pressEnter(): boolean {
    let inserted = false;

    act(() => {
      inserted = insertNewlineAndIndent(this.view);
    });

    return inserted;
  }

  /**
   * Presses Tab, which the editor does not bind so that the focus can leave it.
   * @returns True when the editor took the key.
   */
  pressTab(): boolean {
    return runScopeHandlers(
      this.view,
      new KeyboardEvent("keydown", { key: "Tab" }),
      "editor"
    );
  }

  /**
   * Starts recording the transactions that the current view dispatches. Restore the spies, as `jest.restoreAllMocks()` does, between tests.
   * @returns What was dispatched since the recording started, read when you ask for it.
   */
  recordDispatches(): ConfigEditorDispatchRecording {
    const dispatch = jest.spyOn(this.view, "dispatch");
    const start = dispatch.mock.calls.length;
    const calls = (): Parameters<EditorView["dispatch"]>[] =>
      dispatch.mock.calls.slice(start);
    const specs = (): object[] => calls().flat();

    return {
      get count() {
        return calls().length;
      },
      get scrolled() {
        return specs().some((spec) => "scrollIntoView" in spec);
      },
      get hasEffects() {
        return specs().some((spec) => "effects" in spec);
      },
    };
  }

  /**
   * Starts recording the requests to scroll a range into view, whatever the view. It is static because it ignores the instance, and a spec starts it before it renders. Restore the spies, as `jest.restoreAllMocks()` does, between tests.
   * @returns The requests made since the recording started, read when you ask for them.
   */
  static recordReveals(): ConfigEditorRevealRecording {
    const scrollIntoView = jest.spyOn(EditorView, "scrollIntoView");
    const start = scrollIntoView.mock.calls.length;

    return {
      get requests() {
        return scrollIntoView.mock.calls
          .slice(start)
          .map(([target, options]) => ({
            from: typeof target === "number" ? target : target.from,
            to: typeof target === "number" ? target : target.to,
            anchor: typeof target === "number" ? target : target.anchor,
            head: typeof target === "number" ? target : target.head,
            ...options,
          }));
      },
    };
  }

  /**
   * Starts recording the views that are destroyed, whatever the view. It is static because it ignores the instance, and a spec starts it before it renders. Restore the spies, as `jest.restoreAllMocks()` does, between tests.
   * @returns How many were destroyed since the recording started, read when you ask for it.
   */
  static recordDestroys(): ConfigEditorDestroyRecording {
    const destroy = jest.spyOn(EditorView.prototype, "destroy");
    const start = destroy.mock.calls.length;

    return {
      get count() {
        return destroy.mock.calls.slice(start).length;
      },
    };
  }

  /**
   * Starts recording the requests for the scroll position of a view, which the editor makes when it unmounts, whatever the view. It is static because it ignores the instance, and a spec starts it before it renders. Restore the spies, as `jest.restoreAllMocks()` does, between tests.
   * @returns The requests made since the recording started and what they returned, read when you ask for them.
   */
  static recordScrollSnapshots(): ConfigEditorScrollRecording {
    const scrollSnapshot = jest.spyOn(EditorView.prototype, "scrollSnapshot");
    const start = scrollSnapshot.mock.calls.length;

    return {
      get count() {
        return scrollSnapshot.mock.calls.slice(start).length;
      },
      get values() {
        return scrollSnapshot.mock.results
          .slice(start)
          .map((result) => result.value);
      },
    };
  }
}
