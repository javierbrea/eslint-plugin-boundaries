import { useState } from "react";

import type { DependencyResult } from "@/domains/evaluation/helpers/engine";
import { getDependencyLines } from "@/domains/files/ui/helpers/dependencyLines";
import type { DependencyLine } from "@/domains/files/ui/helpers/dependencyLines";
import { useSessionSelector } from "@/domains/session/data/store";

/** What {@link createLinesSelector} remembers of the last lines it gave. */
type LinesMemory = {
  /** The verdicts the lines were built from. */
  readonly dependencies: readonly DependencyResult[];
  /** The file the lines are of. */
  readonly path: string;
  /** The lines, as JSON: everything they show, so that two evaluations that show the same compare equal. */
  readonly signature: string;
  /** The lines to give. */
  readonly lines: readonly DependencyLine[];
};

/**
 * Creates the selector of the lines of a file. It remembers the last lines for the life of the pane: it gives them back for the same verdicts, and also for new verdicts that read the same, so that an evaluation that changes nothing the file pane shows renders nothing of it.
 * @returns The selector, which builds the lines of a file from the verdicts of the sketch.
 */
function createLinesSelector(): (
  dependencies: readonly DependencyResult[],
  path: string
) => readonly DependencyLine[] {
  let memory: LinesMemory | undefined;

  return (dependencies, path) => {
    if (memory?.dependencies === dependencies && memory.path === path) {
      return memory.lines;
    }

    const lines = getDependencyLines(
      dependencies.filter(({ ref }) => ref.path === path)
    );
    const signature = JSON.stringify(lines);

    memory = {
      dependencies,
      path,
      signature,
      lines: memory?.signature === signature ? memory.lines : lines,
    };
    return memory.lines;
  };
}

/**
 * Reads the lines of the dependency list of a file: each dependency as its statement, with the verdict of the engine.
 * @param path The path of the file.
 * @returns The lines in the order of the file; the same array while the statements and the verdicts do not change.
 */
export function useDependencyLines(path: string): readonly DependencyLine[] {
  const [selectLines] = useState(createLinesSelector);

  return useSessionSelector((state) =>
    selectLines(state.evaluation.dependencies, path)
  );
}
