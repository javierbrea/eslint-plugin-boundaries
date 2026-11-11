import type { LinkLimit } from "@/domains/share/helpers/sketchHash";

/** How long a link is that some apps may cut when it is pasted */
export type LongLink = {
  /** How many characters the link has */
  readonly length: number;
  /** The length above which a link is long */
  readonly maxLength: number;
};

/** Why a sketch is not shared: nothing was copied, because the link would not open the sketch anywhere */
export type ShareRefusal =
  | {
      /** The sketch passes a limit of what a link can hold */
      readonly kind: "too-large";
      /** The limit that it passes */
      readonly limit: LinkLimit;
      /** The most that a link can hold of that limit: files and folders, dependencies, or bytes of JSON */
      readonly max: number;
    }
  | {
      /** The reader of links would refuse the sketch for another reason */
      readonly kind: "invalid";
      /** Why, as the reader of links says it */
      readonly reason: string;
    };

/** How sharing a sketch ended: the link was copied, it was copied but is long enough that some apps may cut it, it was made but could not be copied, it could not be made, or the sketch is refused */
export type ShareOutcome =
  | {
      /** The link was copied, and nothing more needs saying */
      readonly kind: "copied";
    }
  | ({
      /** The link was copied, but some apps may cut it when it is pasted */
      readonly kind: "long";
    } & LongLink)
  | {
      /** The link was made, but the browser did not let it be copied */
      readonly kind: "not-copied";
      /** The link, for the user to copy by hand or to copy again */
      readonly link: string;
      /** How long the link is, when some apps may cut it once it is copied and pasted, and `undefined` otherwise */
      readonly long: LongLink | undefined;
    }
  | {
      /** The sketch could not be checked, or the store could not make the link: there is no link */
      readonly kind: "not-made";
    }
  | ShareRefusal;

/** An outcome that the user has to read about: every one but a link that was copied with nothing more to say */
export type ShareNotice = Exclude<ShareOutcome, { readonly kind: "copied" }>;
