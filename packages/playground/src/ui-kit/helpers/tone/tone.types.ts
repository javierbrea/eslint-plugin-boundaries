/** How something is colored: allowed, failing, worth a look, or not checked. Text outside a code area, icons, count badges and dots take the tone through `STATE_TEXT` and `TONE_COLORS`. In a code area the components map the tones to the `--jsb-code-*` tokens: `ok` to `--jsb-code-string`, `bad` to `--jsb-code-error`, `warn` to `--jsb-code-number` and `faint` to `--jsb-code-comment`. */
export type StateTone = "ok" | "bad" | "warn" | "faint";

/** What a count, an icon or a status is about when it is not fine: something that fails, or something worth a look. It is the part of {@link StateTone} that a count takes, so the two cannot drift. A text with no tone is muted. */
export type Tone = Extract<StateTone, "bad" | "warn">;
