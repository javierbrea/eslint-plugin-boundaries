import type {
  LongLink,
  ShareNotice,
} from "@/domains/share/helpers/shareOutcome";
import type { LinkLimit } from "@/domains/share/helpers/sketchHash";

import type { ShareNoticeView } from "./shareNotice.types";

/** What the project has more of than a link can hold, for each limit, as the dialog writes it after the number. */
const LIMIT_NOUNS: Readonly<Record<Exclude<LinkLimit, "bytes">, string>> = {
  nodes: "files and folders",
  dependencies: "dependencies",
};

/** What the dialog of a link that could not be copied says, before the warning of a long link. */
const NOT_COPIED_TEXT =
  "The browser did not let the playground use the clipboard. The link is selected below: press Ctrl+C or ⌘C to copy it, or try again.";

/**
 * Writes a number with the separators of English, such as `9,412`.
 * @param value The number.
 */
function formatNumber(value: number): string {
  return value.toLocaleString("en-US");
}

/**
 * Says how long a link is, that some apps cut it when it is pasted, and what to check.
 * @param long The length of the link and the length above which a link is long.
 * @param long.length
 * @param long.maxLength
 */
function getLongLinkText(long: LongLink): string {
  return `The link has ${formatNumber(long.length)} characters, and some apps cut links longer than ${formatNumber(long.maxLength)} when they are pasted. After you paste it, check that it opens the whole project.`;
}

/**
 * Says how a project passes a limit of what a link can hold, and how to share it.
 * @param limit The limit that it passes.
 * @param max The most that a link can hold of that limit.
 */
function getTooLargeText(limit: LinkLimit, max: number): string {
  return limit === "bytes"
    ? `It takes more than ${formatNumber(max / 1024 / 1024)} MiB once written as JSON, the most that a link can hold. Remove some files or dependencies, or shorten the config, and share it again.`
    : `It has more than ${formatNumber(max)} ${LIMIT_NOUNS[limit]}, the most that a link can hold. Remove some of them and share it again.`;
}

/**
 * Chooses what the dialog of a share notice says. A link that was copied but is long is a warning; a link that could not be copied or made, and a project that cannot be shared, are failures. A link that could not be copied is also told as long when it is, since the user copies it by hand or again. The texts speak to the user who shares, not to the one who opens a link.
 * @param notice What the share has to tell the user about.
 * @returns The tone, the title and the text of the dialog, the reason of the reader of links when there is one, and the link to copy by hand when there is one.
 */
export function getShareNotice(notice: ShareNotice): ShareNoticeView {
  switch (notice.kind) {
    case "long":
      return {
        tone: "warn",
        title: "Long link copied",
        text: getLongLinkText(notice),
        reason: undefined,
        link: undefined,
      };
    case "not-copied":
      return {
        tone: "bad",
        title: "The link could not be copied",
        text:
          notice.long === undefined
            ? NOT_COPIED_TEXT
            : `${NOT_COPIED_TEXT} ${getLongLinkText(notice.long)}`,
        reason: undefined,
        link: notice.link,
      };
    case "not-made":
      return {
        tone: "bad",
        title: "The link could not be made",
        text: "The page could not make the link of the project. Your project is still here: try again in a moment.",
        reason: undefined,
        link: undefined,
      };
    case "too-large":
      return {
        tone: "bad",
        title: "The project is too large for a link",
        text: getTooLargeText(notice.limit, notice.max),
        reason: undefined,
        link: undefined,
      };
    case "invalid":
      return {
        tone: "bad",
        title: "The project cannot be shared",
        text: "A link would not open it, because the playground refuses it when it reads a link:",
        reason: notice.reason,
        link: undefined,
      };
  }
}
