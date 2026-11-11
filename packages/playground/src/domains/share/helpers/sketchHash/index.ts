export {
  LONG_LINK_LENGTH,
  MAX_SKETCH_JSON_BYTES,
} from "./sketchHash.constants";
export type { HashReading, LinkLimit } from "./sketchHash.types";
export { decodeHash, encodeSketch, isLongLink } from "./sketchHash";
