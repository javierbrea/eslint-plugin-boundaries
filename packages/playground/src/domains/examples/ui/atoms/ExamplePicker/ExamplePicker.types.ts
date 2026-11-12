/** What the picker needs to know about an example to name it. */
export type ExampleOption = {
  /** Stable id of the example, which the picker gives back when it is picked. */
  readonly id: string;
  /** The name that the user reads. */
  readonly title: string;
};

/** Props of {@link ExamplePicker}. The picker gives back the example that the user picks as it was given, so a caller that lists whole examples gets a whole example. */
export type ExamplePickerProps<Option extends ExampleOption = ExampleOption> = {
  /** The examples to list, in the order they are listed. */
  readonly examples: readonly Option[];
  /** The id of the example that the sketch on screen is, which the button names and the list marks. It is unset when the sketch is none of them. */
  readonly currentId: string | undefined;
  /** Called with the example that the user picks, once the list has closed. */
  readonly onSelect: (example: Option) => void;
  /** Whether the button takes the keyboard focus when it is first rendered, such as the one of a new shell that replaced the one in which the user picked an example. It defaults to `false`. */
  readonly autoFocus?: boolean;
};
