import type { ConfigOptions, MicromatchPattern } from "./Config.types";

export class Config {
  /** The ignore paths */
  private readonly _ignorePaths?: MicromatchPattern;
  /** The include paths */
  private readonly _includePaths?: MicromatchPattern;

  /**
   * Creates a new Config instance
   * @param options Configuration options
   */
  constructor(options?: ConfigOptions) {
    this._ignorePaths = options?.ignorePaths;
    this._includePaths = options?.includePaths;
  }

  /**
   * The normalized configuration options
   */
  public get options(): ConfigOptions {
    return {
      ignorePaths: this._ignorePaths,
      includePaths: this._includePaths,
    };
  }
}
