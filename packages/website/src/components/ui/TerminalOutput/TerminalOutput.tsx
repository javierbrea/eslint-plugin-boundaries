import clsx from "clsx";
import type { ReactNode } from "react";

import styles from "./TerminalOutput.module.css";

/** Props of {@link TerminalOutput}. */
export type TerminalOutputProps = {
  /** Preformatted output, colored with the `TermPath`, `TermPosition`, `TermError` and `TermQuoted` fragments. */
  children: ReactNode;
  /** Extra class names. */
  className?: string;
};

/** Props of the colored fragments of a {@link TerminalOutput}. */
export type TerminalFragmentProps = {
  /** Text of the fragment. */
  children: ReactNode;
};

/**
 * File path or rule id, in the comment color.
 * @param props Fragment props.
 * @param props.children Text of the fragment.
 * @returns The colored fragment.
 */
export function TermPath({ children }: TerminalFragmentProps): ReactNode {
  return <span className={styles.path}>{children}</span>;
}

/**
 * Line and column, in the number color.
 * @param props Fragment props.
 * @param props.children Text of the fragment.
 * @returns The colored fragment.
 */
export function TermPosition({ children }: TerminalFragmentProps): ReactNode {
  return <span className={styles.position}>{children}</span>;
}

/**
 * Severity and problem count, in the error color.
 * @param props Fragment props.
 * @param props.children Text of the fragment.
 * @returns The colored fragment.
 */
export function TermError({ children }: TerminalFragmentProps): ReactNode {
  return <span className={styles.error}>{children}</span>;
}

/**
 * Quoted value, in the string color.
 * @param props Fragment props.
 * @param props.children Text of the fragment.
 * @returns The colored fragment.
 */
export function TermQuoted({ children }: TerminalFragmentProps): ReactNode {
  return <span className={styles.quoted}>{children}</span>;
}

/**
 * Preformatted terminal output on the always-dark code palette, styled like a code snippet.
 * @param props Terminal output props.
 * @param props.children Preformatted output, colored with the `TermPath`, `TermPosition`, `TermError` and `TermQuoted` fragments.
 * @param props.className Extra class names.
 * @returns The output block.
 */
export default function TerminalOutput({
  children,
  className,
}: TerminalOutputProps): ReactNode {
  return (
    <pre className={clsx(styles.output, className)}>
      <code>{children}</code>
    </pre>
  );
}
