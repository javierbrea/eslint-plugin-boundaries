import type { Tone } from "@/ui-kit/helpers/tone";

/** What the dialog of a share notice says and how it looks. */
export type ShareNoticeView = {
  /** The tone of the icon before the title: `warn` for a link that was copied with a caveat, `bad` for one that was not. */
  readonly tone: Tone;
  /** The title, which is also the accessible name of the dialog. */
  readonly title: string;
  /** What happened and what the user can do. */
  readonly text: string;
  /** The reason that the reader of links gives, shown apart from the text, if the notice has one. */
  readonly reason: string | undefined;
  /** The link to copy by hand, if the notice has one: the dialog shows it and offers to copy it again. */
  readonly link: string | undefined;
};
