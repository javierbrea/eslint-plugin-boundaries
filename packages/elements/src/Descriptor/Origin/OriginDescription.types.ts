/**
 * Origins of an entity, either local, external, or core.
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
 * Kind of entity origin, either local, external, or core.
 */
export type Origin = (typeof ORIGINS_MAP)[keyof typeof ORIGINS_MAP];

/** Description of an origin */
export type OriginDescription = {
  /** Kind of the origin, either local, external, or core */
  kind: Origin;
  /** Base source of the origin for external/core modules, or null for local origins */
  module: string | null;
};
