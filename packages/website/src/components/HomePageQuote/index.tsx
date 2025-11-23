import Link from "@docusaurus/Link";
import React from "react";
import type { ReactNode } from "react";

import styles from "./styles.module.css";

export default function HomepageFeatures(): ReactNode {
  return (
    <section className={styles.quoteSection}>
      <div className="container">
        <div className="row">
          <div className="col col--2"></div>
          <div className="col col--8">
            <blockquote className={styles.quote}>
              <p
                className={`text--center text--bold text--italic ${styles.quoteText}`}
              >
                &ldquo;Software architecture is the art of drawing lines that I
                call boundaries. Those boundaries separate software elements
                from one another, and restrict those on one side from knowing
                about those on the other.&rdquo;
              </p>
              <footer className={`text--center ${styles.quoteFooter}`}>
                <cite>
                  Robert C. Martin,{" "}
                  <Link href="https://www.oreilly.com/library/view/clean-architecture-a/9780134494272/">
                    Clean Architecture: A Craftsman&rsquo;s Guide to Software
                    Structure and Design
                  </Link>
                </cite>
              </footer>
            </blockquote>
          </div>
          <div className="col col--2"></div>
        </div>
      </div>
    </section>
  );
}
