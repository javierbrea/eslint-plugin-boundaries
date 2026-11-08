import { fromText } from "@/domains/project/helpers/sketch";
import { encodeSketch } from "@/domains/share/helpers/sketchHash";

import type { PlaygroundHashInput } from "./playgroundHash.types";

/**
 * Computes the hash of the link that opens an example in the playground. The project is read as text mode reads it, so that an author writes what the playground shows. The reading is synchronous and needs no browser, so the docs call it while they render on the server.
 * @param input The config and the project of the example.
 * @param input.config
 * @param input.project
 * @returns The hash, without the leading `#`, such as `v=1&s=…`.
 * @throws An `Error` that lists each line of the project that text mode cannot read, with its number, so that a docs build fails instead of publishing a link that opens a different project.
 */
export function getPlaygroundHash({
  config,
  project,
}: PlaygroundHashInput): string {
  const { sketch, problems } = fromText(project, {
    config,
    tree: [],
    dependencies: [],
  });

  if (problems.length > 0) {
    const lines = problems.map(
      ({ line, text, reason }) => `  line ${line} (${text.trim()}): ${reason}`
    );

    throw new Error(
      `The project of the playground link cannot be read as text mode reads it:\n${lines.join("\n")}`
    );
  }
  return encodeSketch(sketch);
}
