import { fileURLToPath } from "node:url";

export const STATIC_DIR = fileURLToPath(new URL("./static", import.meta.url));
