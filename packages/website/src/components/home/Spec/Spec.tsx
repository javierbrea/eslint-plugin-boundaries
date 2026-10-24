import type { ReactNode } from "react";

import Reveal from "../../motion/Reveal";
import SectionHead from "../../ui/SectionHead/SectionHead";

import styles from "./Spec.module.css";

type Feature = {
  term: string;
  title: string;
  text: ReactNode;
};

const FEATURES: Feature[] = [
  {
    term: "classification",
    title: "Three independent layers",
    text: "Element (the architectural unit), file (its own category) and module (where the import resolves). All three are computed for both sides of every dependency.",
  },
  {
    term: "selectors",
    title: "Match on anything described",
    text: (
      <>
        Types, categories, origins, captured path fragments and array queries.
        Reference the <code>from</code> side&apos;s captures in the{" "}
        <code>to</code> side.
      </>
    ),
  },
  {
    term: "policies",
    title: "Allow and disallow, with a default",
    text: "Policies are evaluated in order. Messages are templates with access to the full description of the dependency.",
  },
  {
    term: "rules",
    title: "Four rules, one setting",
    text: (
      <>
        <code>dependencies</code>, <code>no-unknown-files</code>,{" "}
        <code>no-unknown-dependencies</code>,{" "}
        <code>no-ignored-dependencies</code>. Deprecated rules keep working.
      </>
    ),
  },
  {
    term: "performance",
    title: "2.5× faster since 7.3",
    text: "Selectors are normalized once and message templates are cached, cutting lint time by 60% on real projects.",
  },
  {
    term: "compatibility",
    title: "ESLint 9, Oxlint, TypeScript, monorepos",
    text: (
      <>
        Typed config helpers (<code>satisfies Config</code>), custom resolvers
        and path aliases, per-package element roots.
      </>
    ),
  },
];

const STAGGER = 0.05;

/**
 * Specification: what the plugin understands, as a definition list.
 * @returns The section.
 */
export default function Spec(): ReactNode {
  return (
    <section className={styles.spec}>
      <div className="jsb-wrap">
        <Reveal>
          <SectionHead
            eyebrow="Specification"
            title="What the plugin understands"
          />
        </Reveal>
        <dl className={styles.list}>
          {FEATURES.map((feature, index) => (
            <Reveal
              key={feature.term}
              className={styles.row}
              delay={index * STAGGER}
            >
              <dt className={styles.term}>{feature.term}</dt>
              <dd className={styles.definition}>
                <strong>{feature.title}</strong>
                {feature.text}
              </dd>
            </Reveal>
          ))}
        </dl>
      </div>
    </section>
  );
}
