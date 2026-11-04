import {
  defaultKeymap,
  history as undoHistory,
  historyKeymap,
} from "@codemirror/commands";
import { bracketMatching, syntaxHighlighting } from "@codemirror/language";
import { lintGutter, setDiagnostics } from "@codemirror/lint";
import {
  Annotation,
  Compartment,
  EditorSelection,
  EditorState,
  Transaction,
} from "@codemirror/state";
import type { Extension } from "@codemirror/state";
import {
  EditorView,
  drawSelection,
  highlightActiveLine,
  highlightActiveLineGutter,
  keymap,
  lineNumbers,
} from "@codemirror/view";
import { json5 } from "codemirror-json5";
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

import type { ConfigEditorProps } from "./ConfigEditor.types";
import { fitToDocument, toDiagnostics } from "./Diagnostics";
import { editorTheme, highlightStyle } from "./EditorTheme";
import { highlightExtension, setHighlight } from "./Highlight";

/** Marks the transactions that put the `value` prop in the document, so that they are not reported as edits of the user */
const FROM_PROPS = Annotation.define<boolean>();

/** Holds the extensions that depend on the props `label` and `readOnly`, which change while the view lives */
const propsCompartment = new Compartment();

/** The lines above a revealed range that stay visible, so that the range is not stuck to the top edge, as the mockup scrolls the policy */
const REVEAL_MARGIN = 120;

/**
 * Everything the editor has that does not depend on its props. Tab is not bound, so that it leaves the editor. The problems are not read by a linter: the engine is their source, and they are pushed as diagnostics.
 */
const EXTENSIONS: Extension[] = [
  lintGutter(),
  lineNumbers(),
  highlightActiveLineGutter(),
  highlightActiveLine(),
  drawSelection(),
  undoHistory(),
  keymap.of([...defaultKeymap, ...historyKeymap]),
  bracketMatching(),
  json5(),
  syntaxHighlighting(highlightStyle),
  highlightExtension,
  editorTheme,
  propsCompartment.of([]),
];

/**
 * The editor of the config node: JSON5 in a code area, with the problems of the config underlined at their ranges, marked in the gutter and explained on hover.
 * @param props Editor props.
 * @param props.value The config text.
 * @param props.onChange Called with the text after each edit of the user.
 * @param props.problems The problems to show.
 * @param props.label The accessible name of the editor.
 * @param props.readOnly Whether the text cannot be edited.
 * @param props.highlight The lines to mark.
 * @param props.reveal The range to scroll to.
 * @returns The editor, as tall as its container.
 */
export function ConfigEditor({
  value,
  onChange,
  problems,
  label,
  readOnly = false,
  highlight,
  reveal,
}: Readonly<ConfigEditorProps>): ReactNode {
  const hostRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  const revealedKeyRef = useRef<number | undefined>(undefined);
  // The view starts with the first text; the effect that follows `value` applies the later ones
  const [initialValue] = useState(value);

  // The listener of the view is created once, and calls the latest callback
  useEffect(() => {
    onChangeRef.current = onChange;
  });

  useEffect(() => {
    const view = new EditorView({
      // The element is there when effects run
      parent: hostRef.current as HTMLDivElement,
      state: EditorState.create({
        doc: initialValue,
        extensions: [
          ...EXTENSIONS,
          EditorView.updateListener.of((update) => {
            const fromProps = update.transactions.some((transaction) =>
              transaction.annotation(FROM_PROPS)
            );
            if (update.docChanged && !fromProps) {
              onChangeRef.current(update.state.doc.toString());
            }
          }),
        ],
      }),
    });
    viewRef.current = view;
    return () => {
      view.destroy();
      viewRef.current = null;
      // A view created again, such as the one of a development double mount, shows the range again
      revealedKeyRef.current = undefined;
    };
  }, [initialValue]);

  useEffect(() => {
    const view = viewRef.current;
    if (view && view.state.doc.toString() !== value) {
      // Replacing the text does not scroll, and is not an edit to undo
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: value },
        annotations: [FROM_PROPS.of(true), Transaction.addToHistory.of(false)],
      });
    }
  }, [value]);

  useEffect(() => {
    viewRef.current?.dispatch({
      effects: propsCompartment.reconfigure([
        EditorState.readOnly.of(readOnly),
        EditorView.contentAttributes.of({ "aria-label": label }),
      ]),
    });
  }, [label, readOnly]);

  useEffect(() => {
    const view = viewRef.current;
    view?.dispatch(
      setDiagnostics(view.state, toDiagnostics(problems, view.state.doc.length))
    );
  }, [problems]);

  // Only the offsets count: a parent that builds the range again for each render does not undo the lines that follow the edits of the user
  const highlightFrom = highlight?.from;
  const highlightTo = highlight?.to;
  useEffect(() => {
    viewRef.current?.dispatch({
      effects: setHighlight.of(
        highlightFrom === undefined || highlightTo === undefined
          ? undefined
          : { from: highlightFrom, to: highlightTo }
      ),
    });
  }, [highlightFrom, highlightTo]);

  // It runs after each render and acts on a new key only: the range of a request can change while the user edits, and the editor must not scroll then
  useEffect(() => {
    const view = viewRef.current;
    if (
      reveal === undefined ||
      view === null ||
      reveal.key === revealedKeyRef.current
    ) {
      return;
    }
    revealedKeyRef.current = reveal.key;
    const { from, to } = fitToDocument(reveal.range, view.state.doc.length);
    view.dispatch({
      selection: { anchor: from },
      effects: EditorView.scrollIntoView(EditorSelection.range(from, to), {
        y: "start",
        yMargin: REVEAL_MARGIN,
      }),
    });
  });

  return <div ref={hostRef} style={{ height: "100%" }} />;
}
