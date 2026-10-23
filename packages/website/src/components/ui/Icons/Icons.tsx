import type { ReactNode, SVGProps } from "react";

/** Props of the inline icons: any SVG attribute, such as `className`. */
export type IconProps = SVGProps<SVGSVGElement>;

/**
 * Right arrow, used in buttons that navigate.
 * @param props SVG attributes.
 * @returns The decorative icon.
 */
export function ArrowIcon(props: IconProps): ReactNode {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

/**
 * Two overlapping sheets, used in copy buttons.
 * @param props SVG attributes.
 * @returns The decorative icon.
 */
export function CopyIcon(props: IconProps): ReactNode {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
      {...props}
    >
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15V5a2 2 0 0 1 2-2h10" />
    </svg>
  );
}

/**
 * Filled star, used in the GitHub stars pill.
 * @param props SVG attributes.
 * @returns The decorative icon.
 */
export function StarIcon(props: IconProps): ReactNode {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.3 5.9 20.6l1.4-6.8L2.2 9.1l6.9-.8z" />
    </svg>
  );
}
