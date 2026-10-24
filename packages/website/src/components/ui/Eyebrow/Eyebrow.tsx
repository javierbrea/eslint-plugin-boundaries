import clsx from "clsx";
import type { ReactNode } from "react";

import styles from "./Eyebrow.module.css";

/** Props of {@link Eyebrow}. */
export type EyebrowProps = {
  /** Extra class names. */
  className?: string;
  /** Label. */
  children: ReactNode;
};

/**
 * Small uppercase mono label above a heading, preceded by a short rule.
 * @param props Eyebrow props.
 * @returns The label.
 */
export default function Eyebrow({
  className,
  children,
}: EyebrowProps): ReactNode {
  return <span className={clsx(styles.eyebrow, className)}>{children}</span>;
}
