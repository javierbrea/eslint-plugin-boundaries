import type { DescriptorOptionsNormalized } from "../../Config";
import type { Micromatch } from "../../Matcher";

import type { CapturedValues } from "./BaseDescription.types";

/**
 * Shared helper providing path-related utilities used by multiple descriptor classes.
 */
export class PathHelper {
  private readonly _config: DescriptorOptionsNormalized;
  private readonly _micromatch: Micromatch;

  constructor(config: DescriptorOptionsNormalized, micromatch: Micromatch) {
    this._config = config;
    this._micromatch = micromatch;
  }

  /**
   * Determines if a file path is outside the configured root path.
   * Returns false when rootPath is not configured.
   */
  isOutsideRootPath(filePath: string): boolean {
    if (!this._config.rootPath) {
      return false;
    }
    return !filePath.startsWith(this._config.rootPath);
  }

  /**
   * Converts an absolute file path to a relative path when rootPath is configured.
   * Returns the path unchanged when rootPath is absent or the path is outside it.
   */
  toRelativePath(filePath: string): string {
    if (!this._config.rootPath || this.isOutsideRootPath(filePath)) {
      return filePath;
    }
    return filePath.replace(this._config.rootPath, "");
  }

  /**
   * Determines if a given path is included based on includePaths / ignorePaths config.
   * Returns true when neither option is set.
   */
  pathIsIncluded(elementPath: string): boolean {
    let result: boolean;

    if (this._config.includePaths && this._config.ignorePaths) {
      const isIncluded = this._micromatch.isMatch(
        elementPath,
        this._config.includePaths
      );
      const isIgnored = this._micromatch.isMatch(
        elementPath,
        this._config.ignorePaths
      );
      result = isIncluded && !isIgnored;
    } else if (this._config.includePaths) {
      result = this._micromatch.isMatch(elementPath, this._config.includePaths);
    } else if (this._config.ignorePaths) {
      result = !this._micromatch.isMatch(elementPath, this._config.ignorePaths);
    } else {
      result = true;
    }

    return result;
  }

  /**
   * Maps captured glob groups to named keys defined in captureConfig.
   * Returns null when captureConfig is not provided.
   */
  getCapturedValues(
    captured: string[],
    captureConfig?: string[]
  ): CapturedValues | null {
    if (!captureConfig) {
      return null;
    }
    return captured.reduce((capturedValues, captureValue, index) => {
      if (captureConfig[index]) {
        capturedValues[captureConfig[index]] = captureValue;
      }
      return capturedValues;
    }, {} as CapturedValues);
  }
}
