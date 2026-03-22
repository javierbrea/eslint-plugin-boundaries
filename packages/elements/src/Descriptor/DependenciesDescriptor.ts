import { CacheManagerDisabled } from "../Cache";
import type { DescriptorOptionsNormalized } from "../Config";

import { DependenciesDescriptionsCache } from "./DependenciesDescriptionsCache";
import {
  DEPENDENCY_RELATIONSHIPS_MAP,
  DEPENDENCY_RELATIONSHIPS_INVERTED_MAP,
} from "./DependenciesDescriptor.types";
import type {
  DependenciesDescriptorSerializedCache,
  DependencyDescription,
  DescribeDependencyOptions,
} from "./DependenciesDescriptor.types";
import type { ElementsDescriptor } from "./ElementsDescriptor";
import type {
  ElementDescription,
  FileDescription,
} from "./ElementsDescriptor.types";
import { FILE_ORIGINS_MAP } from "./ElementsDescriptor.types";
import { isKnownLocalElement } from "./ElementsDescriptorHelpers";
import type { FilesDescriptor } from "./FilesDescriptor";

/**
 * Class describing dependencies between files.
 */
export class DependenciesDescriptor {
  /**
   * Cache to store previously described dependencies.
   */
  private readonly _dependenciesCache:
    | DependenciesDescriptionsCache
    | CacheManagerDisabled<DescribeDependencyOptions, DependencyDescription>;

  /**
   * Elements descriptor instance.
   */
  private readonly _elementsDescriptor: ElementsDescriptor;

  /**
   * Files descriptor instance.
   */
  private readonly _filesDescriptor: FilesDescriptor | null;

  /**
   * Configuration options.
   */
  private readonly _config: DescriptorOptionsNormalized;

  /**
   * Creates a new DependenciesDescriptor instance.
   * @param elementsDescriptor The elements descriptor instance.
   * @param filesDescriptor The files descriptor instance.
   * @param config The configuration options.
   */
  constructor(
    elementsDescriptor: ElementsDescriptor,
    filesDescriptor: FilesDescriptor | null,
    config: DescriptorOptionsNormalized
  ) {
    this._elementsDescriptor = elementsDescriptor;
    this._filesDescriptor = filesDescriptor;
    this._config = config;
    this._dependenciesCache = this._config.cache
      ? new DependenciesDescriptionsCache()
      : new CacheManagerDisabled<
          DescribeDependencyOptions,
          DependencyDescription
        >();
  }

  /**
   * Serializes the elements cache to a plain object.
   * @returns The serialized elements cache.
   */
  public serializeCache(): DependenciesDescriptorSerializedCache {
    return this._dependenciesCache.serialize();
  }

  /**
   * Sets the elements cache from a serialized object.
   * @param serializedCache The serialized elements cache.
   */
  public setCacheFromSerialized(
    serializedCache: DependenciesDescriptorSerializedCache
  ): void {
    this._dependenciesCache.setFromSerialized(serializedCache);
  }

  /**
   * Clears the elements cache.
   */
  public clearCache(): void {
    this._dependenciesCache.clear();
  }

  /**
   * Retrieves the element path of the parent of a given element.
   * @param elementInfo The element whose parent is to be retrieved.
   * @returns The parent element path, or undefined if none exists.
   */
  private _getParent(elementInfo: ElementDescription) {
    return elementInfo.parents[0]?.path;
  }

  /**
   * Retrieves the common ancestor of two elements.
   * @param elementInfoA The first element.
   * @param elementInfoB The second element.
   * @returns The common ancestor element path, or undefined if none exists.
   */
  private _getCommonAncestor(
    elementInfoA: ElementDescription,
    elementInfoB: ElementDescription
  ) {
    const commonAncestor = elementInfoA.parents.find((elementParentA) => {
      return elementInfoB.parents.some((elementParentB) => {
        return elementParentA.path === elementParentB.path;
      });
    });
    return commonAncestor?.path;
  }

  /**
   * Checks if the parent of element A is an ancestor of element B.
   * @param elementA The element A.
   * @param elementB The element B.
   * @returns True if the parent of element A is an ancestor of element B, false otherwise.
   */
  private _isDescendantOfParent(
    elementA: ElementDescription,
    elementB: ElementDescription
  ) {
    const commonAncestor = this._getCommonAncestor(elementA, elementB);
    return commonAncestor && commonAncestor === this._getParent(elementA);
  }

  /**
   * Checks if two elements are siblings (same parent).
   * @param elementA The first element.
   * @param elementB The second element.
   * @returns True if the elements are siblings, false otherwise.
   */
  private _isSibling(
    elementA: ElementDescription,
    elementB: ElementDescription
  ) {
    const parentA = this._getParent(elementA);
    const parentB = this._getParent(elementB);
    return parentA && parentB && parentA === parentB;
  }

  /**
   * Checks if one element is a descendant of another.
   * @param elementA The potential descendant element.
   * @param elementB The potential ancestor element.
   * @returns True if elementA is a descendant of elementB, false otherwise.
   */
  private _isDescendant(
    elementA: ElementDescription,
    elementB: ElementDescription
  ) {
    return elementA.parents.some((parent) => parent.path === elementB.path);
  }

  /**
   * Checks if one element is a child of another.
   * @param elementA The potential child element.
   * @param elementB The potential parent element.
   * @returns True if elementA is a child of elementB, false otherwise.
   */
  private _isChild(elementA: ElementDescription, elementB: ElementDescription) {
    return this._getParent(elementA) === elementB.path;
  }

  /**
   * Checks if two local elements are internally related (same element).
   * @param elementA The first element.
   * @param elementB The second element.
   * @returns True if the elements are internally related, false otherwise.
   */
  private _isInternal(
    elementA: ElementDescription,
    elementB: ElementDescription
  ) {
    return elementA.path === elementB.path;
  }

  /**
   * Retrieves the relationship between two local known elements in terms of dependency.
   * @param element The element depending on another element.
   * @param dependency The element being depended on.
   * @returns The relationship between the elements.
   */
  private _dependencyRelationship(
    element: ElementDescription | null,
    dependency: ElementDescription | null
  ) {
    if (!isKnownLocalElement(dependency) || !isKnownLocalElement(element)) {
      return null;
    }
    if (this._isInternal(dependency, element)) {
      return DEPENDENCY_RELATIONSHIPS_MAP.INTERNAL;
    }
    if (this._isChild(dependency, element)) {
      return DEPENDENCY_RELATIONSHIPS_MAP.CHILD;
    }
    if (this._isDescendant(dependency, element)) {
      return DEPENDENCY_RELATIONSHIPS_MAP.DESCENDANT;
    }
    if (this._isSibling(dependency, element)) {
      return DEPENDENCY_RELATIONSHIPS_MAP.SIBLING;
    }
    if (this._isChild(element, dependency)) {
      return DEPENDENCY_RELATIONSHIPS_MAP.PARENT;
    }
    if (this._isDescendant(element, dependency)) {
      return DEPENDENCY_RELATIONSHIPS_MAP.ANCESTOR;
    }
    if (this._isDescendantOfParent(dependency, element)) {
      return DEPENDENCY_RELATIONSHIPS_MAP.UNCLE;
    }
    if (this._isDescendantOfParent(element, dependency)) {
      return DEPENDENCY_RELATIONSHIPS_MAP.NEPHEW;
    }
    return null;
  }

  private _dependencyRelationships(
    element: ElementDescription | null,
    dependency: ElementDescription | null
  ) {
    const toRelationship = this._dependencyRelationship(element, dependency);
    const fromRelationship = toRelationship
      ? DEPENDENCY_RELATIONSHIPS_INVERTED_MAP[toRelationship]
      : null;
    return {
      from: fromRelationship,
      to: toRelationship,
    };
  }

  /**
   * Describes files in a dependency relationship, and provides additional information about the dependency itself.
   * @param options The options for describing the files and the dependency details.
   * @returns The description of the dependency between the files.
   */
  public describeDependency({
    from,
    to,
    source,
    kind,
    nodeKind,
    specifiers,
  }: DescribeDependencyOptions): DependencyDescription {
    const cacheKey = this._dependenciesCache.getKey({
      from,
      to,
      source,
      kind,
      nodeKind,
      specifiers,
    });
    if (this._dependenciesCache.has(cacheKey)) {
      return this._dependenciesCache.get(cacheKey)!;
    }

    // Get file descriptions - FilesDescriptor is optional but recommended
    // It provides the file classification information (origin, categories, etc.)
    let fromFile = this._filesDescriptor?.describeFile(from);
    let toFile = this._filesDescriptor?.describeFile(to, source);

    // Fallback: create FileDescription from ElementDescription if FilesDescriptor is not available
    if (!fromFile) {
      const fromElement = this._elementsDescriptor.describeElement(from);
      fromFile = this._createFileDescriptionFromElement(from, fromElement);
    }
    if (!toFile) {
      const toElement = this._elementsDescriptor.describeElement(to);
      toFile = this._createFileDescriptionFromElement(to, toElement);
    }

    const result = {
      from: fromFile,
      to: toFile,
      dependency: {
        source,
        module: this._extractModule(source),
        kind,
        nodeKind: nodeKind || null,
        relationship: this._dependencyRelationships(
          fromFile.element || this._elementsDescriptor.describeElement(from),
          toFile.element || this._elementsDescriptor.describeElement(to)
        ),
        specifiers: specifiers || null,
      },
    };

    this._dependenciesCache.set(cacheKey, result);

    return result;
  }

  /**
   * Creates a FileDescription from an ElementDescription as a fallback.
   * This is used when FilesDescriptor is not available (e.g., in tests).
   * @param filePath The file path.
   * @param elementDescription The element description.
   * @returns A FileDescription based on the element description.
   */
  private _createFileDescriptionFromElement(
    filePath: string | undefined,
    elementDescription: ElementDescription | null
  ): FileDescription {
    return {
      path: filePath || null,
      internalPath: null,
      category: null,
      captured: elementDescription?.captured || null,
      element: elementDescription,
      origin: FILE_ORIGINS_MAP.LOCAL,
      isIgnored: false,
      isUnknown: elementDescription === null,
    } as FileDescription;
  }

  /**
   * Extracts the base module name from a dependency source.
   * @param source The source of the dependency (import/export path).
   * @returns The base module name or null.
   */
  private _extractModule(source: string | null): string | null {
    if (!source) return null;
    // For paths like '@scope/package', '@scope/package/subpath', return '@scope/package'
    // For paths like 'package', 'package/subpath', return 'package'
    const parts = source.split("/");
    if (source.startsWith("@")) {
      return `${parts[0]}/${parts[1]}`;
    }
    return parts[0];
  }
}
