import Heading from "@theme/Heading";
import clsx from "clsx";
import type { ReactNode } from "react";

import Reveal from "../../motion/Reveal";
import Eyebrow from "../../ui/Eyebrow/Eyebrow";

import styles from "./Problem.module.css";

type Point = {
  title: string;
  text: string;
};

const POINTS: Point[] = [
  {
    title: "The lines are in your config",
    text: "Element and file descriptors map folders and files to the names you already use in design discussions.",
  },
  {
    title: "The rules read both sides",
    text: "Each policy sees the element, file category and module origin of the importer and the imported, plus the import kind.",
  },
  {
    title: "Feedback is immediate",
    text: "The editor underlines the import. CI fails the build. The message explains the architectural reason, not just the rule id.",
  },
  {
    title: "Adoption is progressive",
    text: "Start with one layer and one policy on an existing project with the recommended config. Tighten with strict when ready.",
  },
];

/**
 * Why the plugin exists: the problem statement and four numbered answers.
 * @returns The section.
 */
export default function Problem(): ReactNode {
  return (
    <section className={styles.problem}>
      <div className={clsx("jsb-wrap", styles.grid)}>
        <Reveal>
          <Eyebrow>Why</Eyebrow>
          <Heading as="h2" className={styles.title}>
            Architecture decays one import at a time.
          </Heading>
          <p className={styles.lead}>
            The diagram on the wiki says helpers never know about components.
            Then someone needs a quick fix, the import is three keystrokes away,
            and the review is busy. JS Boundaries makes the diagram executable.
          </p>
        </Reveal>
        <Reveal as="ol" delay={0.1} className={styles.list}>
          {POINTS.map((point) => (
            <li key={point.title} className={styles.point}>
              <div>
                <strong>{point.title}</strong>
                {point.text}
              </div>
            </li>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
