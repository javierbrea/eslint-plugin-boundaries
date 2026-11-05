/** Props of {@link ProjectTextArea}. */
export type ProjectTextAreaProps = {
  /** The text it shows */
  readonly value: string;
  /** The text can be selected and copied, and not edited */
  readonly readOnly: boolean;
  /** The test id of the root element. The textarea renders none when it is unset: the component that is the textarea sets its own */
  readonly testId?: string;
  /** Called with the whole text after each edit of the user */
  readonly onChange: (value: string) => void;
  /** Called when the textarea loses the focus */
  readonly onBlur: () => void;
};
