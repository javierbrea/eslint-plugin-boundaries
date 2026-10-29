import type { ReactNode } from "react";

import Reveal from "../../motion/Reveal";
import CodeSnippet from "../../ui/CodeSnippet/CodeSnippet";
import SectionHead from "../../ui/SectionHead/SectionHead";
import TerminalOutput, {
  TermError,
  TermPath,
  TermPosition,
  TermQuoted,
} from "../../ui/TerminalOutput/TerminalOutput";

import styles from "./Steps.module.css";

type Step = {
  title: string;
  text: ReactNode;
  example: ReactNode;
};

const ELEMENTS_CODE = `settings: {
  "boundaries/elements": [
    { type: "helper",    pattern: "helpers/*" },
    { type: "component", pattern: "components/*/*" },
    { type: "module",    pattern: "modules/*" },
  ],
  "boundaries/files": [
    { pattern: "**/*.spec.js", category: "test" },
  ],
}`;

const POLICIES_CODE = `"boundaries/dependencies": [2, {
  default: "disallow",
  policies: [
    { from: { element: { type: "component" } },
      allow: { to: { element: { type: "helper" } } } },
    { from: { element: { type: "module" } },
      allow: { to: { element: { types: ["component", "helper"] } } } },
    { disallow: { to: { file: { categories: "test" } } },
      message: "Never import test files from {{ from.element.types.[0] }}s" },
  ],
}]`;

const STEPS: Step[] = [
  {
    title: "Classify files and elements",
    text: (
      <>
        Element descriptors match folders. File descriptors match files on their
        own, so a file can be a <code>component</code> and a <code>test</code>{" "}
        at the same time. You only need one of the two to start.
      </>
    ),
    example: <CodeSnippet code={ELEMENTS_CODE} language="js" />,
  },
  {
    title: "Write the policies",
    text: "Pick a default, then allow or disallow by any combination of element type, file category, module origin and dependency kind. Captured path fragments let one policy cover a whole family of elements.",
    example: <CodeSnippet code={POLICIES_CODE} language="js" />,
  },
  {
    title: "Read the error where you wrote the import",
    text: "Violations are ordinary ESLint errors: editor squiggles, CI failures, templated messages with the element types on both sides. Three more rules catch files outside your architecture, unknown dependencies and ignored ones.",
    example: (
      <TerminalOutput>
        <TermPath>src/helpers/format/index.js</TermPath>
        {"\n  "}
        <TermPosition>1:22</TermPosition>
        {"  "}
        <TermError>error</TermError>
        {
          "  There is no policy allowing dependencies from\n         elements of type "
        }
        <TermQuoted>&quot;helper&quot;</TermQuoted>
        {" to elements of type "}
        <TermQuoted>&quot;component&quot;</TermQuoted>
        {"\n         "}
        <TermPath>boundaries/dependencies</TermPath>
        {"\n\n"}
        <TermError>✖ 1 problem</TermError>
        {" (1 error, 0 warnings)"}
      </TerminalOutput>
    ),
  },
];

/**
 * How it works: the three edits from a folder tree to an enforced architecture, each with its code.
 * @returns The section.
 */
export default function Steps(): ReactNode {
  return (
    <section className={styles.steps}>
      <div className="jsb-wrap">
        <Reveal>
          <SectionHead
            eyebrow="How it works"
            title="From folder tree to enforced architecture in three edits"
          />
        </Reveal>
        {STEPS.map((step, index) => (
          <Reveal key={step.title} className={styles.step}>
            <div className={styles.text}>
              <span className={styles.number} aria-hidden="true">
                {index + 1}
              </span>
              <h3 className={styles.title}>{step.title}</h3>
              <p className={styles.description}>{step.text}</p>
            </div>
            <div className={styles.example}>{step.example}</div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
