function toOneDecimal(value: number): string {
  return value.toFixed(1).replace(/\.0$/, "");
}

/**
 * Formats a number in compact form, such as `7.4M` or `1.3k`.
 * @param value The number to format.
 * @returns The compact representation, with a trailing `.0` removed.
 */
export function formatCompact(value: number): string {
  if (value >= 1e6) {
    return `${toOneDecimal(value / 1e6)}M`;
  }
  if (value >= 1e3) {
    return `${toOneDecimal(value / 1e3)}k`;
  }
  return String(value);
}

/**
 * Formats a number with `en-US` thousands separators, such as `1,001`.
 * @param value The number to format.
 * @returns The grouped representation.
 */
export function formatThousands(value: number): string {
  return value.toLocaleString("en-US");
}
