import { useState } from "react";

import type { Sketch } from "@/contract";
import { getPendingResults } from "@/domains/evaluation/helpers/alignEvaluation";
import type { DependencyResult } from "@/domains/evaluation/helpers/engine";
import type { EvaluationStatus } from "@/domains/evaluation/helpers/evaluator";
import { getDependencyLines } from "@/domains/files/ui/helpers/dependencyLines";
import type { DependencyLine } from "@/domains/files/ui/helpers/dependencyLines";
import { useSessionSelector } from "@/domains/session/data/store";
import type { SessionState } from "@/domains/session/data/store";

/** What {@link createLinesSelector} remembers of the last lines it gave. */
type LinesMemory = {
  /** The verdicts the lines were built from. */
  readonly dependencies: readonly DependencyResult[];
  /** How the evaluation of the verdicts stood to the sketch. */
  readonly status: EvaluationStatus;
  /** The file the lines are of. */
  readonly path: string;
  /** The lines, as JSON: everything they show, so that two evaluations that show the same compare equal. */
  readonly signature: string;
  /** The lines to give. */
  readonly lines: readonly DependencyLine[];
};

/** The pending verdicts of a sketch that has no evaluation yet, kept while its dependencies do not change. */
type PendingMemory = {
  /** The dependencies of the sketch they are of. */
  readonly dependencies: Sketch["dependencies"];
  /** A pending verdict for each of them. */
  readonly results: readonly DependencyResult[];
};

/**
 * Creates the selector of the lines of a file. It remembers the last lines for the life of the pane: it gives them back for the same verdicts, and also for new verdicts that read the same, so that an evaluation that changes nothing the file pane shows renders nothing of it. Before the first evaluation, the lines are the dependencies of the sketch with pending verdicts.
 * @returns The selector, which builds the lines of a file from the state of the store.
 */
function createLinesSelector(): (
  state: SessionState,
  path: string
) => readonly DependencyLine[] {
  let memory: LinesMemory | undefined;
  let pending: PendingMemory | undefined;

  /**
   * Gives the verdicts of the dependencies of the sketch.
   * @param state The state of the store.
   * @returns The ones of the evaluation on screen, or pending ones while there is none, the same array while the dependencies of the sketch do not change.
   */
  function getResults(state: SessionState): readonly DependencyResult[] {
    if (state.evaluation !== undefined) {
      return state.evaluation.dependencies;
    }
    if (pending?.dependencies !== state.sketch.dependencies) {
      pending = {
        dependencies: state.sketch.dependencies,
        results: getPendingResults(state.sketch),
      };
    }
    return pending.results;
  }

  return (state, path) => {
    const dependencies = getResults(state);
    const { evaluationStatus } = state;

    if (
      memory?.dependencies === dependencies &&
      memory.status === evaluationStatus &&
      memory.path === path
    ) {
      return memory.lines;
    }

    const lines = getDependencyLines(
      dependencies.filter(({ ref }) => ref.path === path),
      evaluationStatus
    );
    const signature = JSON.stringify(lines);

    memory = {
      dependencies,
      status: evaluationStatus,
      path,
      signature,
      lines: memory?.signature === signature ? memory.lines : lines,
    };
    return memory.lines;
  };
}

/**
 * Reads the lines of the dependency list of a file: each dependency as its statement, with the verdict of the evaluation on screen.
 * @param path The path of the file.
 * @returns The lines in the order of the file; the same array while the statements and the verdicts do not change.
 */
export function useDependencyLines(path: string): readonly DependencyLine[] {
  const [selectLines] = useState(createLinesSelector);

  return useSessionSelector((state) => selectLines(state, path));
}
