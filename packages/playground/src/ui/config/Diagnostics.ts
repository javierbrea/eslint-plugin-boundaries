import type { Diagnostic } from "@codemirror/lint";
import type { EditorView } from "@codemirror/view";

import type { ConfigProblem, ProblemLevel, TextRange } from "../../engine";

/** The severity of CodeMirror that each level of a problem is shown with: a deprecation is a warning that the editor does not tell apart */
const SEVERITIES = {
  error: "error",
  warning: "warning",
  deprecation: "warning",
} as const satisfies Record<ProblemLevel, Diagnostic["severity"]>;

/** The text of the link to a URL of the problem */
const LINK_TEXT = "More info";

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
 * Builds the link to a URL of a problem.
 * @param ownerDocument The document that creates the link.
 * @param url The URL.
 * @returns A link that opens the URL in a new tab, without giving the page to the site it opens.
 */
function createLink(ownerDocument: Document, url: string): HTMLAnchorElement {
  const link = ownerDocument.createElement("a");
  link.href = url;
  link.target = "_blank";
  link.rel = "noreferrer";
  link.textContent = LINK_TEXT;
  return link;
}

/**
 * Builds the nodes of the detail of a problem: its text, followed by a link for each of its URLs.
 * @param ownerDocument The document that creates the nodes.
 * @param problem The problem.
 * @param problem.detail
 * @param problem.links
 * @returns The nodes, in order; a space separates each link from what comes before it. None when the problem has no detail and no link.
 */
function renderDetail(
  ownerDocument: Document,
  { detail, links }: ConfigProblem
): Node[] {
  const nodes: Node[] =
    detail === undefined ? [] : [ownerDocument.createTextNode(detail)];

  for (const url of links) {
    if (nodes.length > 0) {
      nodes.push(ownerDocument.createTextNode(" "));
    }
    nodes.push(createLink(ownerDocument, url));
  }
  return nodes;
}

/**
 * Creates the function that draws the message of a problem in the tooltip: the title in bold, and the detail with its links below it.
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
    const nodes = renderDetail(ownerDocument, problem);
    if (nodes.length > 0) {
      const detail = ownerDocument.createElement("div");
      detail.append(...nodes);
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
    message: [problem.title, problem.detail, ...problem.links]
      .filter((line) => line !== undefined)
      .join("\n"),
    renderMessage: createMessageRenderer(problem),
  }));
}
