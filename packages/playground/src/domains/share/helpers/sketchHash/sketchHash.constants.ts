/** The version of the format of a link, which `v` carries so that a future format can migrate */
export const HASH_FORMAT_VERSION = "1";

/** The length above which a link is long: some apps cut a link that is longer than this when it is pasted */
export const LONG_LINK_LENGTH = 8192;

/** The size above which a sketch in JSON is refused when a link is read. It bounds the memory and the time that a damaged or hostile link can take. The sketch of a link has at most 1,000 files and 3,000 dependencies, and when their paths are 200 characters long and each dependency has three names of 40 characters with an alias, its JSON is 2.7 MiB: this is a margin of half over it. Paths and names that are longer than that reach the limit with fewer files and dependencies, and are refused by it first. The data is unpacked only until the result is past the limit, so the time follows the limit and not the size that the data claims: a deflate bomb of 512 MiB, which is 700,000 characters in a link, is refused in 8 ms on Node.js 24, where unpacking it to the end took 1.1 s */
export const MAX_SKETCH_JSON_BYTES = 4 * 1024 * 1024;

/** How many bytes of packed data are inflated before the size of the result is checked. Deflate makes at most 1,032 bytes out of one, so a step of 1 KiB makes at most about 1 MiB, which is how far past the limit a result can go before the inflating stops */
export const INFLATE_STEP_BYTES = 1024;
