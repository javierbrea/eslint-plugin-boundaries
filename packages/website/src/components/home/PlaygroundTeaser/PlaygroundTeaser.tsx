import clsx from "clsx";
import type { ReactNode } from "react";

import { GITHUB_BACKLOG } from "../../../data/site/links";
import Reveal from "../../motion/Reveal";
import Button from "../../ui/Button/Button";
import SectionHead from "../../ui/SectionHead/SectionHead";

import styles from "./PlaygroundTeaser.module.css";

const TREE: { name: string; depth: 0 | 1 | 2 }[] = [
  { name: "src/", depth: 0 },
  { name: "components/", depth: 1 },
  { name: "Button/", depth: 2 },
  { name: "Price/", depth: 2 },
  { name: "helpers/", depth: 1 },
  { name: "format/", depth: 2 },
  { name: "modules/", depth: 1 },
  { name: "checkout/", depth: 2 },
];

const DEPTH_CLASSES = [undefined, styles.depth1, styles.depth2];

const RESULTS = [
  { label: "element", value: 'component · captured { name: "Price" }' },
  { label: "file", value: 'categories: [ "index" ]' },
  { label: "module", value: 'origin: "local"' },
];

/**
 * Teaser of the upcoming playground: a static preview of a folder tree and its classification.
 * @returns The section.
 */
export default function PlaygroundTeaser(): ReactNode {
  return (
    <section className={styles.play}>
      <div className={clsx("jsb-wrap", styles.grid)}>
        <Reveal>
          <SectionHead
            className={styles.head}
            eyebrow="Drafting table · coming next"
            title="Try a config against a sketched project"
            lead="Paste settings, lay out a folder tree, and watch each file get classified and each import get its verdict. In the browser, nothing to install."
          >
            <Button variant="outline" href={GITHUB_BACKLOG} arrow>
              Follow the roadmap
            </Button>
          </SectionHead>
        </Reveal>
        <Reveal
          as="figure"
          delay={0.1}
          className={styles.table}
          aria-label="Playground preview"
        >
          <div className={styles.tree}>
            {TREE.map((entry) => (
              <div
                key={entry.name}
                className={clsx(styles.entry, DEPTH_CLASSES[entry.depth])}
              >
                {entry.name}
              </div>
            ))}
          </div>
          <div className={styles.results}>
            {RESULTS.map((result) => (
              <div key={result.label} className={styles.result}>
                <b>{result.label}</b>
                <span>{result.value}</span>
              </div>
            ))}
            <div className={clsx(styles.result, styles.report)}>
              <b>report</b>
              <span>helpers/format → components/Price · disallowed</span>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
