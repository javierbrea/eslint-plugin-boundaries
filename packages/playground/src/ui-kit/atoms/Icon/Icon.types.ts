/** Name of an icon of the playground. */
export type IconName =
  | "check"
  | "cross"
  | "warn"
  | "skip"
  | "chevron-right"
  | "chevron-down"
  | "plus"
  | "edit"
  | "trash"
  | "arrow"
  | "share"
  | "reset"
  | "collapse"
  | "info"
  | "help";

/** Props of the `Icon` component. */
export type IconProps = {
  /** Which icon to draw. */
  readonly name: IconName;
  /** Side of the icon in pixels. It is 14 by default, 16 in icon-only buttons and 12 in the lint gutter. */
  readonly size?: number;
  /** What the icon says, when it stands alone and carries meaning. Without it, the icon is hidden from assistive technology. */
  readonly label?: string;
};
