/** How many bytes become characters at a time, so that a long array never overflows the arguments of a call */
const CHUNK_SIZE = 0x8000;

/** The characters of the URL-safe alphabet of base64 (RFC 4648, section 5), which a hash can hold unescaped */
const BASE64_URL = /^[\w-]*$/;

/**
 * Writes bytes as base64url, with no padding. It uses `btoa`, which browsers and Node.js both have, and no Node.js global.
 * @param bytes The bytes to write.
 * @returns The text, which only has letters, digits, `-` and `_`.
 */
export function toBase64Url(bytes: Uint8Array): string {
  let binary = "";

  for (let start = 0; start < bytes.length; start += CHUNK_SIZE) {
    binary += String.fromCharCode(...bytes.subarray(start, start + CHUNK_SIZE));
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/**
 * Reads base64url, with no padding, as bytes.
 * @param text The text to read.
 * @returns The bytes, or `undefined` when the text is not base64url: a character outside the alphabet, or a length that no bytes can have.
 */
export function fromBase64Url(text: string): Uint8Array | undefined {
  // A length of 4n + 1 leaves a single character that cannot hold a byte
  if (!BASE64_URL.test(text) || text.length % 4 === 1) {
    return undefined;
  }

  const standard = text.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(standard.padEnd(Math.ceil(standard.length / 4) * 4, "="));
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}
