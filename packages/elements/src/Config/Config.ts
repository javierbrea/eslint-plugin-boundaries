import { isNullish } from "../Support";

import type { ConfigOptions, MicromatchPattern } from "./Config.types";

export class Config {
  /** The root path of the project */
  private _rootPath: string;
  /** The ignore paths */
  private _ignorePaths?: MicromatchPattern;
  /** The include paths */
  private _includePaths?: MicromatchPattern;

  /**
   * Creates a new Config instance
   * @param options Configuration options
   */
  constructor(options?: ConfigOptions) {
    this._rootPath = this._getRootPath(options);
    this._ignorePaths = options?.ignorePaths;
    this._includePaths = options?.includePaths;
  }

  /**
   * Determines the root path based on options
   * @param options The configuration options
   * @returns The root path as a string
   */
  private _getRootPath(options?: ConfigOptions): string {
    if (!isNullish(options?.rootPath)) {
      return options.rootPath;
    }
    if (!isNullish(process) && !isNullish(process.cwd)) {
      return process.cwd();
    }
    // Fallback to browser environment
    return "/";
  }

  /**
   * The root path of the project, from where ElementsDescriptor will resolve paths
   */
  public get rootPath(): string {
    return this._rootPath;
  }

  /**
   * The normalized configuration options
   */
  public get options(): ConfigOptions {
    return {
      rootPath: this._rootPath,
      ignorePaths: this._ignorePaths,
      includePaths: this._includePaths,
    };
  }
}
