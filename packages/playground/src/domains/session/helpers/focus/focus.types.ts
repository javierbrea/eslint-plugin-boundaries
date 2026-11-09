import type { TextRange } from "@/domains/evaluation/helpers/engine";
import type { DependencyRef } from "@/domains/project/helpers/sketch";

/** What is in focus: nothing, the config node, a file, or a dependency of the open file. */
export type Focus =
  | { readonly kind: "none" }
  | { readonly kind: "config" }
  | { readonly kind: "file"; readonly path: string }
  /** A dependency of a file: the file is open, and the line of the dependency is `index + 1`. */
  | {
      readonly kind: "dependency";
      readonly path: string;
      readonly index: number;
    };

/** What a row, a button or a node opens: everything that opens something produces one, and the session opens it in one transition. */
export type Target =
  /** The config node, scrolled to a range of its text when there is one. A range with the policy it holds and the dependency it came from highlights that policy. */
  | {
      readonly kind: "config";
      readonly range?: TextRange;
      /** The index of the policy that the range holds in the options of the rule, or `null` for the default. The note names it, and the store finds it again after each evaluation of the config, from where the range of the highlight starts. */
      readonly policy?: number | null;
      /** The dependency that `Open in config` came from. */
      readonly dependency?: DependencyRef;
    }
  /** A file of the sketch. */
  | { readonly kind: "file"; readonly path: string }
  /** A dependency of a file: the file opens with the dependency in focus. */
  | {
      readonly kind: "dependency";
      readonly path: string;
      readonly index: number;
    };

/** How the project pane shows the sketch: as a tree, or as one path per line. */
export type ProjectView = "tree" | "text";

/** A tab of the problems panel: the sketch as a whole, the node in focus, or the dependency in focus. */
export type ProblemsTabId = "sketch" | "node" | "dependency";

/** A request to show a range of the config: the editor scrolls to it and puts the cursor at its start each time the key changes. */
export type ConfigReveal = {
  /** The range to show. */
  readonly range: TextRange;
  /** Changes for each request, so that the same range can be shown again after the user scrolled away. */
  readonly key: number;
};

/** The policy of the config that the user opened from a dependency: its range stays marked in the editor while the config is in focus, and the note of the problems panel says where it came from. */
export type PolicyHighlight = {
  /** Where the policy is written in the config text now. The editor moves it with each edit of the user and reports it with the text, so that it keeps pointing at the same text. */
  readonly range: TextRange;
  /** The index of the policy in the options of the rule, or `null` for the default. It is `undefined` when it is not known: no policy of the evaluation starts where the range starts, such as when the user edited the policy until it is not one, and the note leaves the number out. While the evaluation is behind the text, it is the one the last evaluation found. */
  readonly policy: number | null | undefined;
  /** The dependency that `Open in config` came from. */
  readonly dependency: DependencyRef;
};
