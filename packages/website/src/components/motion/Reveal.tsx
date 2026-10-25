import clsx from "clsx";
import { useRef } from "react";
import type { CSSProperties, ElementType, ReactNode } from "react";

import styles from "./Reveal.module.css";
import { useReveal } from "./useReveal";

/** Props of {@link Reveal}. */
export type RevealProps = {
  /** Element to render. */
  as?: ElementType;
  /** Delay of the reveal transition, in seconds, to stagger siblings. */
  delay?: number;
  /** Extra class names. */
  className?: string;
  /** Extra attributes of the rendered element, such as `aria-label`. */
  [attribute: `aria-${string}` | `data-${string}`]: string | undefined;
  /** Content. */
  children?: ReactNode;
};

/**
 * Fades and lifts its content in once it scrolls into view. Without JS, or with reduced motion, the content is always visible. Once revealed, the element carries `data-revealed`, so descendants can start their own transitions from CSS.
 * @param props Reveal props.
 * @returns The wrapped content.
 */
export default function Reveal({
  as: Tag = "div",
  delay,
  className,
  children,
  ...attributes
}: RevealProps): ReactNode {
  const ref = useRef<HTMLElement>(null);
  const isIn = useReveal(ref, { once: true });
  const style =
    delay === undefined ? undefined : ({ "--d": `${delay}s` } as CSSProperties);

  return (
    <Tag
      ref={ref}
      className={clsx(styles.reveal, className)}
      style={style}
      data-revealed={isIn ? "" : undefined}
      {...attributes}
    >
      {children}
    </Tag>
  );
}
