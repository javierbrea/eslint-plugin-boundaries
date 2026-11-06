/** A chip split in the two parts that the picker draws apart. */
export type ChipParts = {
  /** The kind of the name, such as `named`. */
  readonly kind: string;
  /** The name, followed by `as` and its alias when it has one. */
  readonly name: string;
};

/** An option of a group of radios: the value it stands for and the label the user reads. */
export type LabeledOption<Value extends string> = {
  /** What the option stands for. */
  readonly value: Value;
  /** What the user reads. */
  readonly label: string;
};
