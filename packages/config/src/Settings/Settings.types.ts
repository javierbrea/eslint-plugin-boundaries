/**
 * Options of `normalizeSettings`.
 */
export type NormalizeSettingsOptions = {
  /** The root path of the project, already resolved by the host. Without it, the normalized `rootPath` is the `boundaries/root-path` setting as written */
  rootPath?: string;
};
