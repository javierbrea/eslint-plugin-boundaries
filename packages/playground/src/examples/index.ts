import type { Example } from "./Example.types";
import { QUICK_START_EXAMPLE } from "./QuickStart";

export type { Example } from "./Example.types";
export { QUICK_START_EXAMPLE } from "./QuickStart";

/** Every example the playground ships with, in the order a picker shows them */
export const EXAMPLES: readonly Example[] = [QUICK_START_EXAMPLE];
