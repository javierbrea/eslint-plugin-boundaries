import { deflateSync, Inflate } from "fflate";

import type { Sketch } from "@/contract";
import { readSketch } from "@/domains/project/helpers/sketch";

import { fromBase64Url, toBase64Url } from "./base64Url";
import {
  HASH_FORMAT_VERSION,
  INFLATE_STEP_BYTES,
  LONG_LINK_LENGTH,
  MAX_SKETCH_JSON_BYTES,
} from "./sketchHash.constants";
import type { HashReading } from "./sketchHash.types";

const NO_VERSION = 'The link has no format version, "v".';

const NO_DATA =
  'The link is damaged: the data after "s=" is not valid base64url text.';

const NOT_PACKED =
  "The link is damaged: its data cannot be unpacked. It may be cut short.";

const NOT_JSON =
  "The link is damaged: its data is not a project written as JSON.";

const UNREADABLE = "The link is damaged: it could not be read.";

const TOO_LARGE = `The project in the link is larger than ${MAX_SKETCH_JSON_BYTES / 1024 / 1024} MiB, which the playground does not load.`;

/** What unpacking the data of a link gives: the value it holds, or why the link is damaged */
type Unpacked =
  | { readonly value: unknown }
  | { readonly error: string; readonly tooLarge?: true };

/**
 * Copies a sketch keeping only the keys that a sketch has, in a fixed order, so that the same sketch always makes the same link and nothing else is written.
 * @param sketch The sketch to copy.
 */
function toPlainSketch(sketch: Sketch): unknown {
  return {
    config: sketch.config,
    tree: sketch.tree.map(({ path, kind }) => ({ path, kind })),
    dependencies: sketch.dependencies.map(
      ({ from, target, syntax, importKind, specifiers }) => ({
        from,
        target:
          target.kind === "node"
            ? { kind: target.kind, path: target.path }
            : { kind: target.kind, name: target.name },
        syntax,
        importKind,
        specifiers: specifiers.map((specifier) => ({
          kind: specifier.kind,
          name: specifier.name,
          // An alias that is `undefined` is left out of the JSON
          alias: specifier.alias,
        })),
      })
    ),
  };
}

/**
 * Writes a sketch as the hash of a link: `v=1&s=<data>`, where the data is the JSON of the sketch, compressed with raw deflate and written as base64url. It is synchronous, so that the docs can compute a link while they render on the server.
 * @param sketch The sketch to write.
 * @returns The hash, without the leading `#`.
 */
export function encodeSketch(sketch: Sketch): string {
  const packed = deflateSync(
    new TextEncoder().encode(JSON.stringify(toPlainSketch(sketch))),
    {
      level: 9,
    }
  );

  return `v=${HASH_FORMAT_VERSION}&s=${toBase64Url(packed)}`;
}

/**
 * Inflates raw deflate data, stopping as soon as the result is larger than the limit. A few bytes of deflate can make gigabytes, and inflating them to the end, even into a buffer that cuts the result, costs the time of all of them: so the data is inflated a step at a time, and the result is measured after each.
 * @param packed The raw deflate data.
 * @returns The inflated bytes, or `undefined` when they are more than {@link MAX_SKETCH_JSON_BYTES}. It throws when the data is not raw deflate or is cut short.
 */
function inflateWithinLimit(packed: Uint8Array): Uint8Array | undefined {
  const chunks: Uint8Array[] = [];
  let size = 0;
  const inflater = new Inflate((chunk) => {
    chunks.push(chunk);
    size += chunk.length;
  });

  for (
    let start = 0;
    start < packed.length && size <= MAX_SKETCH_JSON_BYTES;
    start += INFLATE_STEP_BYTES
  ) {
    const end = start + INFLATE_STEP_BYTES;

    inflater.push(packed.subarray(start, end), end >= packed.length);
  }
  if (size > MAX_SKETCH_JSON_BYTES) {
    return undefined;
  }

  const inflated = new Uint8Array(size);
  let offset = 0;

  for (const chunk of chunks) {
    inflated.set(chunk, offset);
    offset += chunk.length;
  }
  return inflated;
}

/**
 * Unpacks the data of a link: base64url, then raw deflate, then JSON.
 * @param data The value of the `s` parameter.
 * @returns The value that the JSON holds, or why the data is damaged.
 */
function unpack(data: string): Unpacked {
  const bytes = fromBase64Url(data);

  if (bytes === undefined || bytes.length === 0) {
    return { error: NO_DATA };
  }

  let json: Uint8Array | undefined;

  try {
    json = inflateWithinLimit(bytes);
  } catch {
    return { error: NOT_PACKED };
  }
  if (json === undefined) {
    return { error: TOO_LARGE, tooLarge: true };
  }
  try {
    // A byte that is not UTF-8 is damage, not a character to replace
    const text = new TextDecoder("utf-8", { fatal: true }).decode(json);

    return { value: JSON.parse(text) as unknown };
  } catch {
    return { error: NOT_JSON };
  }
}

/**
 * Reads the hash of a link, as {@link decodeHash} does, but lets whatever goes wrong inside it throw.
 * @param hash The hash of a URL, with or without the leading `#`.
 */
function readHash(hash: string): HashReading {
  const params = new URLSearchParams(
    hash.startsWith("#") ? hash.slice(1) : hash
  );
  const data = params.get("s");

  if (data === null) {
    return { status: "empty" };
  }

  const version = params.get("v");

  if (version === null) {
    return { status: "error", error: NO_VERSION };
  }
  if (version !== HASH_FORMAT_VERSION) {
    return {
      status: "error",
      error: `The link has the format version "${version}", which this playground does not know.`,
    };
  }

  const unpacked = unpack(data);

  if ("error" in unpacked) {
    return { status: "error", ...unpacked };
  }

  const read = readSketch(unpacked.value);

  return "error" in read
    ? { status: "error", ...read }
    : { status: "sketch", sketch: read.sketch };
}

/**
 * Reads the hash of a link. Only a hash with an `s` parameter holds a sketch: any other, such as the anchor of a heading of a docs page, holds none. Everything it holds is untrusted: the sketch goes through `readSketch`, so that it is one that the edits could have made. It never throws: whatever goes wrong while it reads, such as a stack that overflows, is a link that cannot be read.
 * @param hash The hash of a URL, with or without the leading `#`.
 * @returns Nothing when the hash has no sketch, the sketch, or why the hash cannot be read: an unknown version, damaged data, or a sketch that `readSketch` refuses. A sketch that is refused for its size says so with `tooLarge`.
 */
export function decodeHash(hash: string): HashReading {
  try {
    return readHash(hash);
  } catch {
    return { status: "error", error: UNREADABLE };
  }
}

/**
 * Tells whether a link is long: some apps cut it when it is pasted.
 * @param link The link, or its hash.
 * @returns `true` when it has more characters than {@link LONG_LINK_LENGTH}.
 */
export function isLongLink(link: string): boolean {
  return link.length > LONG_LINK_LENGTH;
}
