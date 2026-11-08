/** The version of the format of a link, which `v` carries so that a future format can migrate */
export const HASH_FORMAT_VERSION = "1";

/** The length above which a link is long: some apps cut a link that is longer than this when it is pasted */
export const LONG_LINK_LENGTH = 8192;

/** The size above which a sketch in JSON is refused when a link is read. It is far above what a project of hundreds of files needs, and it bounds the memory that a damaged or hostile link can take when it is unpacked */
export const MAX_SKETCH_JSON_BYTES = 8 * 1024 * 1024;
