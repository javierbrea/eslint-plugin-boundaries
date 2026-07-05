/**
 * Origins of a module, either local, external, or core.
 */
export const ORIGINS_MAP = {
  /** Origin of local files */
  LOCAL: "local",
  /** Origin of external files (usually from node_modules, but also files flagged as external due to configuration) */
  EXTERNAL: "external",
  /** Origin of built-in files (Node.js core modules) */
  CORE: "core",
} as const;

/** Set of all possible origins, used for fast validation of origin values. */
export const ORIGINS_SET = new Set(Object.values(ORIGINS_MAP));

/**
 * Kind of module origin, either local, external, or core.
 */
export type Origin = (typeof ORIGINS_MAP)[keyof typeof ORIGINS_MAP];

/** Description of a module */
export type ModuleDescription = {
  /** Origin of the module, either local, external, or core */
  origin: Origin;
  /** Base source of the module for external/core modules, or null for local origins */
  source: string | null;
  /** Internal path of the file relative to the base for external/core modules, or null for local origins */
  internalPath: string | null;
};
