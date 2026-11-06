/** How a verdict is colored: the components map the tones to the `--jsb-*` tokens of the theme, `ok` to `--jsb-ok` and `--jsb-code-string` in code, `bad` to `--jsb-bad` and `--jsb-code-error`, `warn` to `--jsb-warn` and `--jsb-code-number`, and `faint` to `--jsb-faint` and `--jsb-code-comment`. */
export type VerdictTone = "ok" | "bad" | "warn" | "faint";

/** The icon of a verdict, by the name of an icon of `src/ui-kit/atoms/Icon`. The names are written here because an `ui-helper` does not import `ui-kit` atoms, and the `IconName` of the icon atom accepts them */
export type VerdictIcon = "check" | "cross" | "warn" | "skip";
