import Heading from "@theme/Heading";
import type { ReactNode } from "react";

import { DOCS_QUICK_START, GITHUB_SPONSORS } from "../../../data/site/links";
import Reveal from "../../motion/Reveal";
import Button from "../../ui/Button/Button";

import styles from "./FinalCta.module.css";

/**
 * Closing call to action: start with the quick start or sponsor the project.
 * @returns The section.
 */
export default function FinalCta(): ReactNode {
  return (
    <section className={styles.final}>
      <div className="jsb-wrap">
        <Reveal className={styles.box}>
          <Heading as="h2" className={styles.title}>
            Draw one boundary today
          </Heading>
          <p className={styles.lead}>
            Install the plugin, name one folder, write one policy. Add the rest
            when the team is ready.
          </p>
          <div className={styles.actions}>
            <Button to={DOCS_QUICK_START}>Quick start</Button>
            <Button variant="outline" href={GITHUB_SPONSORS}>
              Sponsor the project
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
