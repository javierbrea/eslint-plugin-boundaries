import Link from "@docusaurus/Link";
import type { ReactNode } from "react";

import Reveal from "../../motion/Reveal";

import styles from "./Quote.module.css";

const BOOK_URL =
  "https://www.oreilly.com/library/view/clean-architecture-a/9780134494272/";

/**
 * Robert C. Martin's definition of software architecture as drawing boundaries.
 * @returns The section.
 */
export default function Quote(): ReactNode {
  return (
    <section className={styles.quote}>
      <Reveal className="jsb-wrap">
        <blockquote className={styles.text}>
          &ldquo;Software architecture is the art of{" "}
          <mark className={styles.mark}>
            drawing lines that I call boundaries
          </mark>
          . Those boundaries separate software elements from one another, and
          restrict those on one side from knowing about those on the
          other.&rdquo;
        </blockquote>
        <cite className={styles.cite}>
          Robert C. Martin · <Link href={BOOK_URL}>Clean Architecture</Link>
        </cite>
      </Reveal>
    </section>
  );
}
