import type { Sketch } from "@/contract";
import type { SketchLimit } from "@/domains/project/helpers/sketch";

/** A limit of the size of a sketch that a link holds: one of a sketch read from outside, or the size of its JSON (`bytes`) */
export type LinkLimit = SketchLimit | "bytes";

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
      /** Why, as a sentence that reads well after `The project could not be loaded: ` */
      readonly error: string;
      /** Present only when the sketch is refused for its size: the limit that it passes, the size of its JSON (`bytes`), or more files and folders (`nodes`) or dependencies (`dependencies`) than a sketch read from outside can have */
      readonly tooLarge?: LinkLimit;
    };
