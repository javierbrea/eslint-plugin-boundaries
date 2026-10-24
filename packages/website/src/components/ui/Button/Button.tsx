import Link from "@docusaurus/Link";
import clsx from "clsx";
import type { ReactNode } from "react";

import { ArrowIcon } from "../Icons/Icons";

import styles from "./Button.module.css";

/** Props of {@link Button}. */
export type ButtonProps = {
  /** Filled accent button, or bordered button for secondary actions. */
  variant?: "primary" | "outline";
  /** Internal path to link to. */
  to?: string;
  /** External URL to link to. */
  href?: string;
  /** Show a trailing arrow that slides on hover. */
  arrow?: boolean;
  /** Extra class names. */
  className?: string;
  /** Label. */
  children: ReactNode;
};

/**
 * Call-to-action link styled as a button.
 * @param props Button props.
 * @returns The link.
 */
export default function Button({
  variant = "primary",
  to,
  href,
  arrow = false,
  className,
  children,
}: ButtonProps): ReactNode {
  return (
    <Link
      to={to}
      href={href}
      className={clsx(styles.button, styles[variant], className)}
    >
      <span className={styles.label}>{children}</span>
      {arrow && <ArrowIcon className={styles.icon} />}
    </Link>
  );
}
