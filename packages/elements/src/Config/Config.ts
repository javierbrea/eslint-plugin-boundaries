import type {
  ConfigOptions,
  MicromatchPattern,
  ConfigOptionsNormalized,
  DescriptorOptionsNormalized,
  MatchersOptionsNormalized,
} from "./Config.types";

export class Config {
  /** The ignore paths */
  private readonly _ignorePaths?: MicromatchPattern;
  /** The include paths */
  private readonly _includePaths?: MicromatchPattern;
  /** Whether legacy template support is enabled */
  private readonly _legacyTemplates: boolean;

  /**
   * Creates a new Config instance
   * @param options Configuration options
   */
  constructor(options?: ConfigOptions) {
    this._ignorePaths = options?.ignorePaths;
    this._includePaths = options?.includePaths;
    this._legacyTemplates = options?.legacyTemplates ?? true;
  }

  /**
   * The normalized configuration options
   */
  public get options(): ConfigOptionsNormalized {
    return {
      ignorePaths: this._ignorePaths,
      includePaths: this._includePaths,
      legacyTemplates: this._legacyTemplates,
    };
  }

  /**
   * Normalized options for descriptors
   */
  public get descriptorOptions(): DescriptorOptionsNormalized {
    return {
      ignorePaths: this._ignorePaths,
      includePaths: this._includePaths,
    };
  }

  /**
   * Normalized options for element matchers
   */
  public get matchersOptions(): MatchersOptionsNormalized {
    return {
      legacyTemplates: this._legacyTemplates,
    };
  }
}
