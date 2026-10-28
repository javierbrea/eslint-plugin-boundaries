import type { ReactNode } from "react";

import { FIRST_RELEASE_YEAR } from "../../../data/site/product";
import { useCurrentYear } from "../../../data/site/useCurrentYear";

import styles from "./Copyright.module.css";

/** Props of {@link Copyright}. */
export type CopyrightProps = {
  /** Legal notice rendered below the copyright line, as plain text. */
  disclaimer?: string;
};

/**
 * Footer copyright line with the years of the project, followed by the legal notice.
 * @param props Copyright props.
 * @param props.disclaimer Legal notice rendered below the copyright line, as plain text.
 * @returns The copyright block.
 */
export default function Copyright({
  disclaimer,
}: Readonly<CopyrightProps>): ReactNode {
  const currentYear = useCurrentYear();

  return (
    <div className={styles.copyright}>
      <p className={styles.line}>
        Copyright © {FIRST_RELEASE_YEAR}-{currentYear}{" "}
        <a href="https://www.javierbrea.com">Javier Brea</a>. MIT licensed.
      </p>
      {disclaimer && <p className={styles.line}>{disclaimer}</p>}
    </div>
  );
}
