import micromatch from "micromatch";

import { CacheManager } from "../Cache";
import type { ConfigOptions } from "../Config";
import { Config } from "../Config";
import { isArray } from "../Support";

import type {
  DependencyElement,
  ElementDescription,
  ElementDescriptor,
  ElementDescriptors,
  ElementsDescriptorSerializedCache,
  LocalElement,
  IgnoredElement,
  BaseElement,
  CapturedValues,
  UnknownElement,
} from "./ElementsDescriptor.types";
import { ELEMENT_DESCRIPTOR_MODES_MAP } from "./ElementsDescriptor.types";
import {
  isElementDescriptorMode,
  isLocalElement,
} from "./ElementsDescriptorHelpers";

/**
 * Class describing elements in a project given their paths and configuration.
 */
export class ElementsDescriptor {
  /**
   * Cache to store previously described elements.
   */
  private _elementsCache: CacheManager<string, ElementDescription> =
    new CacheManager();
  /**
   * Configuration instance for this descriptor.
   */
  private _config: Config;

  /**
   * Element descriptors used by this descriptor.
   */
  private _elementDescriptors: ElementDescriptors;

  /**
   * The configuration options for this descriptor.
   * @param configOptions The configuration options.
   */
  constructor(
    elementDescriptors: ElementDescriptors,
    configOptions?: ConfigOptions,
  ) {
    this._elementDescriptors = elementDescriptors;
    this._config = new Config(configOptions);
  }

  /**
   * Serializes the elements cache to a plain object.
   * @returns The serialized elements cache.
   */
  public serializeCache(): ElementsDescriptorSerializedCache {
    return Array.from(this._elementsCache.getAll().entries()).reduce(
      (acc, [key, value]) => {
        acc[key] = value;
        return acc;
      },
      {} as ElementsDescriptorSerializedCache,
    );
  }

  /**
   * Sets the elements cache from a serialized object.
   * @param serializedCache The serialized elements cache.
   */
  public setCacheFromSerialized(
    serializedCache: ElementsDescriptorSerializedCache,
  ): void {
    for (const key in serializedCache) {
      this._elementsCache.restore(key, serializedCache[key]);
    }
  }

  /**
   * Determines if a given path is included based on the configuration.
   * @param elementPath The element path to check.
   * @returns True if the path is included, false otherwise.
   */
  private _pathIsIncluded(elementPath: string): boolean {
    if (this._config.options.includePaths && this._config.options.ignorePaths) {
      const isIncluded = micromatch.isMatch(
        elementPath,
        this._config.options.includePaths,
      );
      const isIgnored = micromatch.isMatch(
        elementPath,
        this._config.options.ignorePaths,
      );
      return isIncluded && !isIgnored;
    } else if (this._config.options.includePaths) {
      return micromatch.isMatch(elementPath, this._config.options.includePaths);
    } else if (this._config.options.ignorePaths) {
      return !micromatch.isMatch(elementPath, this._config.options.ignorePaths);
    }
    return true;
  }

  /**
   * Extends a partial description with default values for unknown elements.
   * @param partialDescription The partial description to extend.
   * @returns The extended description.
   */
  // TODO: Remove this method and return specific properties in each case
  private _extendBaseDescription(
    // eslint-disable-next-line no-unused-vars
    partialDescription: Pick<IgnoredElement, "path" | "isIgnored">,
  ): IgnoredElement;
  private _extendBaseDescription(
    partialDescription:
      | Pick<IgnoredElement, "path" | "isIgnored">
      | LocalElement
      | DependencyElement,
  ): ElementDescription {
    const defaults: Omit<BaseElement, "path"> = {
      type: null,
      category: null,
      parents: [],
      capturedValues: {},
    };

    return {
      ...defaults,
      ...partialDescription,
    } as ElementDescription;
  }

  /**
   * Gets captured values from the captured array and capture configuration.
   * @param captured The array of captured strings.
   * @param captureConfig The configuration for capturing values.
   * @returns The captured values as an object.
   */
  private _getCapturedValues(
    captured: string[],
    captureConfig?: string[],
  ): CapturedValues {
    if (!captureConfig) {
      return {};
    }
    return captured.reduce((capturedValues, captureValue, index) => {
      if (captureConfig[index]) {
        capturedValues[captureConfig[index]] = captureValue;
      }
      return capturedValues;
    }, {} as CapturedValues);
  }

  /**
   * Gets the element path based on the path pattern, path segments to the element, and all path segments from the file path.
   * @param pathPattern The element path pattern.
   * @param pathSegments The path segments leading to the element.
   * @param allPathSegments The full path segments from the file path.
   * @returns The element path.
   */
  private _getElementPath(
    pathPattern: string,
    pathSegments: string[],
    allPathSegments: string[],
  ): string {
    const elementPathRegexp = micromatch.makeRe(pathPattern);
    const testedSegments: string[] = [];
    let result: string | undefined;
    pathSegments.forEach((pathSegment) => {
      if (!result) {
        testedSegments.push(pathSegment);
        const joinedSegments = testedSegments.join("/");
        if (elementPathRegexp.test(joinedSegments)) {
          result = joinedSegments;
        }
      }
    });
    if (!result) {
      return [...allPathSegments].reverse().join("/");
    }
    return `${[...allPathSegments].reverse().join("/").split(result)[0]}${result}`;
  }
  /**
   * Retrieves the description of an element given its path.
   * @param elementPath The path of the element to describe.
   * @returns The description of the element.
   */
  private _getFileDescription(
    filePath: string,
  ): LocalElement | IgnoredElement | UnknownElement {
    if (!this._pathIsIncluded(filePath)) {
      return this._extendBaseDescription({
        path: filePath,
        isIgnored: true,
      });
    }
    const parents: LocalElement["parents"] = [];
    const elementResult: Partial<LocalElement> = {
      path: filePath,
    };

    interface State {
      pathSegmentsAccumulator: string[];
      lastPathSegmentMatching: number;
    }

    const state: State = {
      pathSegmentsAccumulator: [],
      lastPathSegmentMatching: 0,
    };

    const pathSegments = filePath.split("/").reverse();

    // TODO: Move to a separate method or helper
    const matchElementPattern = (
      element: ElementDescriptor,
      currentPathSegments: string[],
      fullPath: string,
      lastPathSegmentMatching: number,
    ): {
      matched: boolean;
      capture?: string[];
      baseCapture?: string[] | null;
      useFullPathMatch?: boolean;
      patternUsed?: string;
    } => {
      const mode = isElementDescriptorMode(element.mode)
        ? element.mode
        : ELEMENT_DESCRIPTOR_MODES_MAP.FOLDER;
      const patterns = isArray(element.pattern)
        ? element.pattern
        : [element.pattern];

      for (const pattern of patterns) {
        const useFullPathMatch =
          mode === ELEMENT_DESCRIPTOR_MODES_MAP.FULL && !elementResult.type;
        const effectivePattern =
          mode === ELEMENT_DESCRIPTOR_MODES_MAP.FOLDER && !elementResult.type
            ? `${pattern}/**/*`
            : pattern;

        let baseCapture: string[] | null = null;
        let hasCapture = true;

        if (element.basePattern) {
          const baseTarget = filePath
            .split("/")
            .slice(0, filePath.split("/").length - lastPathSegmentMatching)
            .join("/");
          baseCapture = micromatch.capture(
            [element.basePattern, "**", effectivePattern].join("/"),
            baseTarget,
          );
          hasCapture = baseCapture !== null;
        }

        const capture = micromatch.capture(
          effectivePattern,
          useFullPathMatch ? fullPath : currentPathSegments.join("/"),
        );

        if (capture && hasCapture) {
          return {
            matched: true,
            capture,
            baseCapture,
            useFullPathMatch,
            patternUsed: pattern,
          };
        }
      }

      return { matched: false };
    };

    const processElementMatch = (
      element: ElementDescriptor,
      matchInfo: NonNullable<ReturnType<typeof matchElementPattern>>,
      currentPathSegments: string[],
      elementPaths: string[],
    ) => {
      const { capture, baseCapture, useFullPathMatch, patternUsed } = matchInfo;
      if (!capture || !patternUsed) return;

      let capturedValues = this._getCapturedValues(capture, element.capture);

      if (element.basePattern && baseCapture) {
        capturedValues = {
          ...this._getCapturedValues(baseCapture, element.baseCapture),
          ...capturedValues,
        };
      }

      const elementPath = useFullPathMatch
        ? filePath
        : this._getElementPath(patternUsed, currentPathSegments, elementPaths);

      if (!elementResult.type && !elementResult.category) {
        // It is the main element
        elementResult.type = element.type || null;
        elementResult.category = element.category || null;
        elementResult.elementPath = elementPath;
        elementResult.capturedValues = capturedValues;
        elementResult.internalPath =
          element.mode === ELEMENT_DESCRIPTOR_MODES_MAP.FOLDER
            ? filePath.replace(`${elementPath}/`, "")
            : elementPath.split("/").pop();
      } else {
        // It is a parent element, because we have already matched the main one
        parents.push({
          type: element.type || null,
          category: element.category || null,
          elementPath,
          capturedValues,
        });
      }
    };

    for (let i = 0; i < pathSegments.length; i++) {
      const segment = pathSegments[i];
      state.pathSegmentsAccumulator.unshift(segment);

      for (const element of this._elementDescriptors) {
        const match = matchElementPattern(
          element,
          state.pathSegmentsAccumulator,
          filePath,
          state.lastPathSegmentMatching,
        );

        if (match.matched) {
          processElementMatch(
            element,
            match,
            state.pathSegmentsAccumulator,
            pathSegments,
          );
          state.pathSegmentsAccumulator = [];
          state.lastPathSegmentMatching = i + 1;
          break;
        }
      }
    }

    const result = { ...elementResult, parents };

    if (!isLocalElement(result)) {
      // Not matched as any element, return unknown element
      return {
        ...result,
        path: filePath,
        type: null,
        category: null,
        parents: [],
        capturedValues: {},
      };
    }

    return result;
  }

  /**
   * Describes a file given its path.
   * @param filePath The path of the file to describe.
   * @returns The description of the element.
   */
  public describeFile(filePath: string): ElementDescription {
    if (this._elementsCache.has(filePath)) {
      return this._elementsCache.get(filePath)!;
    }
    const description = this._getFileDescription(filePath);
    this._elementsCache.set(filePath, description);
    return description;
  }
}
