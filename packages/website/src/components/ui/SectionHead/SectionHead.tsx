import Heading from "@theme/Heading";
import clsx from "clsx";
import type { ReactNode } from "react";

import Eyebrow from "../Eyebrow/Eyebrow";

import styles from "./SectionHead.module.css";

/** Props of {@link SectionHead}. */
export type SectionHeadProps = {
  /** Label above the heading. */
  eyebrow: ReactNode;
  /** Section heading, rendered as an `h2`. */
  title: ReactNode;
  /** Optional lead paragraph below the heading. */
  lead?: ReactNode;
  /** Extra class names. */
  className?: string;
  /** Extra content after the lead, such as a call to action. */
  children?: ReactNode;
};

/**
 * Heading block of a home section: eyebrow, `h2` and optional lead.
 * @param props Section head props.
 * @param props.eyebrow Label above the heading.
 * @param props.title Section heading, rendered as an `h2`.
 * @param props.lead Optional lead paragraph below the heading.
 * @param props.className Extra class names.
 * @param props.children Extra content after the lead, such as a call to action.
 * @returns The heading block.
 */
export default function SectionHead({
  eyebrow,
  title,
  lead,
  className,
  children,
}: Readonly<SectionHeadProps>): ReactNode {
  return (
    <div className={clsx(styles.head, className)}>
      <Eyebrow>{eyebrow}</Eyebrow>
      <Heading as="h2" className={styles.title}>
        {title}
      </Heading>
      {lead && <p className={styles.lead}>{lead}</p>}
      {children}
    </div>
  );
}
