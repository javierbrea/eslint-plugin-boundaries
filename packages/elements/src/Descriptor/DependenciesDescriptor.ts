import { CacheManager } from "../Cache";

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
  LocalElementKnown,
} from "./ElementsDescriptor.types";
import {
  isIgnoredElement,
  isKnownLocalElement,
} from "./ElementsDescriptorHelpers";

/**
 * Class describing dependencies between elements.
 */
export class DependenciesDescriptor {
  /**
   * Cache to store previously described dependencies.
   */
  private _dependenciesCache: CacheManager<
    {
      from: string;
      to: string;
      source: string;
      kind: string;
      nodeKind?: string;
      specifiers?: string[];
    },
    DependencyDescription
  > = new CacheManager();

  /**
   * Elements descriptor instance.
   */
  private _elementsDescriptor: ElementsDescriptor;

  /**
   * Creates a new DependenciesDescriptor instance.
   * @param elementsDescriptor The elements descriptor instance.
   */
  constructor(elementsDescriptor: ElementsDescriptor) {
    this._elementsDescriptor = elementsDescriptor;
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
    serializedCache: DependenciesDescriptorSerializedCache,
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
  private _getParent(elementInfo: LocalElementKnown) {
    return elementInfo.parents[0]?.elementPath;
  }

  /**
   * Retrieves the common ancestor of two elements.
   * @param elementInfoA The first element.
   * @param elementInfoB The second element.
   * @returns The common ancestor element path, or undefined if none exists.
   */
  private _getCommonAncestor(
    elementInfoA: LocalElementKnown,
    elementInfoB: LocalElementKnown,
  ) {
    const commonAncestor = elementInfoA.parents.find((elementParentA) => {
      return !!elementInfoB.parents.find((elementParentB) => {
        return elementParentA.elementPath === elementParentB.elementPath;
      });
    });
    return commonAncestor?.elementPath;
  }

  /**
   * Checks if the parent of element A is an ancestor of element B.
   * @param elementA The element A.
   * @param elementB The element B.
   * @returns True if the parent of element A is an ancestor of element B, false otherwise.
   */
  private _isDescendantOfParent(
    elementA: LocalElementKnown,
    elementB: LocalElementKnown,
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
  private _isSibling(elementA: LocalElementKnown, elementB: LocalElementKnown) {
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
    elementA: LocalElementKnown,
    elementB: LocalElementKnown,
  ) {
    return elementA.parents.some(
      (parent) => parent.elementPath === elementB.elementPath,
    );
  }

  /**
   * Checks if one element is a child of another.
   * @param elementA The potential child element.
   * @param elementB The potential parent element.
   * @returns True if elementA is a child of elementB, false otherwise.
   */
  private _isChild(elementA: LocalElementKnown, elementB: LocalElementKnown) {
    return this._getParent(elementA) === elementB.elementPath;
  }

  /**
   * Checks if two local elements are internally related (same element).
   * @param elementA The first element.
   * @param elementB The second element.
   * @returns True if the elements are internally related, false otherwise.
   */
  private _isInternal(
    elementA: LocalElementKnown,
    elementB: LocalElementKnown,
  ) {
    return elementA.elementPath === elementB.elementPath;
  }

  /**
   * Retrieves the relationship between two local known elements in terms of dependency.
   * @param element The element depending on another element.
   * @param dependency The element being depended on.
   * @returns The relationship between the elements.
   */
  private _dependencyRelationship(
    element: ElementDescription,
    dependency: ElementDescription,
  ) {
    if (
      isIgnoredElement(dependency) ||
      !isKnownLocalElement(dependency) ||
      !isKnownLocalElement(element)
    ) {
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
    if (this._isDescendantOfParent(dependency, element)) {
      return DEPENDENCY_RELATIONSHIPS_MAP.UNCLE;
    }
    // TODO: Should this be prior to uncle check? Otherwise, grandparents would be considered uncles. So, ancestor is never reached.
    if (this._isDescendant(element, dependency)) {
      return DEPENDENCY_RELATIONSHIPS_MAP.ANCESTOR;
    }
    return null;
  }

  private _dependencyRelationships(
    element: ElementDescription,
    dependency: ElementDescription,
  ) {
    const fromRelationship = this._dependencyRelationship(element, dependency);
    const toRelationship = fromRelationship
      ? DEPENDENCY_RELATIONSHIPS_INVERTED_MAP[fromRelationship]
      : null;
    return {
      from: fromRelationship,
      to: toRelationship,
    };
  }

  /**
   * Describes elements in a dependency relationship, and provides additional information about the dependency itself.
   * @param options The options for describing the elements and the dependency details.
   * @returns The description of the dependency between the elements.
   */
  public describeDependency({
    from,
    to,
    source,
    kind,
    nodeKind,
    specifiers,
  }: DescribeDependencyOptions): DependencyDescription {
    if (
      this._dependenciesCache.has({
        from,
        to,
        source,
        kind,
        nodeKind,
        specifiers,
      })
    ) {
      return this._dependenciesCache.get({
        from,
        to,
        source,
        kind,
        nodeKind,
        specifiers,
      })!;
    }

    const fromElement = this._elementsDescriptor.describeElement(from);
    const toElement = this._elementsDescriptor.describeElement(to, source);

    const result = {
      from: fromElement,
      to: toElement,
      dependency: {
        kind,
        nodeKind: nodeKind || null,
        relationship: this._dependencyRelationships(fromElement, toElement),
        specifiers: specifiers || null,
      },
    };

    this._dependenciesCache.set(
      {
        from,
        to,
        source,
        kind,
        nodeKind,
        specifiers,
      },
      result,
    );

    return result;
  }
}
