import type { Sketch } from "@/contract";

/** What a hash holds: nothing, a sketch, or why the hash cannot be read */
export type HashReading =
  | {
      /** The hash has no sketch: it is empty, or it is the anchor of a page */
      readonly status: "empty";
    }
  | {
      /** The hash has a sketch, in the order that text mode reads back */
      readonly status: "sketch";
      /** The sketch */
      readonly sketch: Sketch;
    }
  | {
      /** The hash has a sketch that cannot be read */
      readonly status: "error";
      /** Why, as a sentence that reads well after `The sketch could not be loaded: ` */
      readonly error: string;
      /** Present, and `true`, only when the sketch is refused for its size: the JSON is larger than the limit, or it has more files, folders or dependencies than a sketch read from outside can have */
      readonly tooLarge?: true;
    };
