import type { Diagnostic } from "@codemirror/lint";
import type { EditorView } from "@codemirror/view";

import type { ConfigProblem, TextRange } from "../../engine";

/** The severity of CodeMirror that each level of a problem is shown with: a deprecation is a warning that the editor does not tell apart */
const SEVERITIES = {
  error: "error",
  warning: "warning",
  deprecation: "warning",
} as const satisfies Record<ConfigProblem["level"], Diagnostic["severity"]>;

/** The text of the link that replaces a URL of the detail */
const LINK_TEXT = "More info";

/**
 * Matches a URL of the detail with the whitespace before it and the `More info:` label that `@boundaries/config` writes in front of its docs links. The URL is the only group, so that `split` keeps it between the texts around it.
 */
const URL_IN_DETAIL = /\s*(?:More info:\s*)?(https?:\/\/\S+)/;

/**
 * Keeps the offsets of a range inside the document. The problems come from the text that was evaluated, and the document can be shorter by the time they arrive.
 * @param range The range, with offsets from 0.
 * @param documentLength The length of the document.
 * @returns The offsets, none of them past the end of the document.
 */
export function fitToDocument(
  range: Pick<TextRange, "from" | "to">,
  documentLength: number
): Pick<TextRange, "from" | "to"> {
  return {
    from: Math.min(range.from, documentLength),
    to: Math.min(range.to, documentLength),
  };
}

/**
 * Builds the nodes of a detail: its text, with each URL replaced by a link.
 * @param ownerDocument The document that creates the nodes.
 * @param detail The detail of a problem.
 * @returns The nodes, in order.
 */
function renderDetail(ownerDocument: Document, detail: string): Node[] {
  const parts = detail.split(URL_IN_DETAIL);
  return parts.flatMap<Node>((part, index) => {
    // `split` puts the texts at the even positions and the URLs between them
    if (index % 2 === 0) {
      return part === "" ? [] : [ownerDocument.createTextNode(part)];
    }
    const link = ownerDocument.createElement("a");
    link.href = part;
    link.target = "_blank";
    link.rel = "noreferrer";
    link.textContent = LINK_TEXT;
    // The whitespace before the link was matched with it, so a space separates the link from what comes before
    const hasContentBefore = index > 1 || parts[0] !== "";
    return hasContentBefore
      ? [ownerDocument.createTextNode(" "), link]
      : [link];
  });
}

/**
 * Creates the function that draws the message of a problem in the tooltip: the title in bold, and the detail below it.
 * @param problem The problem.
 * @returns The function CodeMirror calls when it shows the tooltip.
 */
function createMessageRenderer(
  problem: ConfigProblem
): (view: EditorView) => Node {
  return (view) => {
    const { ownerDocument } = view.dom;
    const message = ownerDocument.createElement("div");
    const title = ownerDocument.createElement("strong");
    title.textContent = problem.title;
    message.append(title);
    if (problem.detail !== undefined) {
      const detail = ownerDocument.createElement("div");
      detail.append(...renderDetail(ownerDocument, problem.detail));
      message.append(detail);
    }
    return message;
  };
}

/**
 * Maps the problems of the config to the diagnostics that CodeMirror draws.
 * @param problems The problems, placed in the text that was evaluated.
 * @param documentLength The length of the document that shows them.
 * @returns One diagnostic for each problem, in the same order.
 */
export function toDiagnostics(
  problems: readonly ConfigProblem[],
  documentLength: number
): Diagnostic[] {
  return problems.map((problem) => ({
    ...fitToDocument(problem.range, documentLength),
    severity: SEVERITIES[problem.level],
    message:
      problem.detail === undefined
        ? problem.title
        : `${problem.title}\n${problem.detail}`,
    renderMessage: createMessageRenderer(problem),
  }));
}
