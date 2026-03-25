import { isNull } from "src/Shared";

import { CacheManagerDisabled } from "../../Cache";
import type { DescriptorOptionsNormalized } from "../../Config";
import {
  isIgnoredElementDescription,
  isKnownElementDescription,
} from "../Element";
import type { ElementDescription, KnownElementDescription } from "../Element";
import type { EntitiesDescriptor, EntityDescription } from "../Entity";

import type {
  DependencyDescription,
  DependencyRelationship,
} from "./DependencyDescription.types";
import {
  DEPENDENCY_RELATIONSHIPS_MAP,
  DEPENDENCY_RELATIONSHIPS_INVERTED_MAP,
} from "./DependencyDescription.types";
import type {
  DependencyDescriptorSerializedCache,
  DependencyDescriptorOptions,
} from "./DependencyDescriptor.types";
import { DependenciesDescriptionsCache } from "./DependencyDescriptorCache";

/**
 * Class describing dependencies between elements.
 */
export class DependenciesDescriptor {
  /**
   * Cache to store previously described dependencies.
   */
  private readonly _dependenciesCache:
    | DependenciesDescriptionsCache
    | CacheManagerDisabled<DependencyDescriptorOptions, DependencyDescription>;

  /**
   * Elements descriptor instance.
   */
  private readonly _entitiesDescriptor: EntitiesDescriptor;

  /**
   * Configuration options.
   */
  private readonly _config: DescriptorOptionsNormalized;

  /**
   * Creates a new DependenciesDescriptor instance.
   * @param entitiesDescriptor The entities descriptor instance.
   * @param config The configuration options.
   */
  constructor(
    entitiesDescriptor: EntitiesDescriptor,
    config: DescriptorOptionsNormalized
  ) {
    this._entitiesDescriptor = entitiesDescriptor;
    this._config = config;
    this._dependenciesCache = this._config.cache
      ? new DependenciesDescriptionsCache()
      : new CacheManagerDisabled<
          DependencyDescriptorOptions,
          DependencyDescription
        >();
  }

  /**
   * Serializes the dependencies cache to a plain object.
   * @returns The serialized dependencies cache.
   */
  public serializeCache(): DependencyDescriptorSerializedCache {
    return this._dependenciesCache.serialize();
  }

  /**
   * Sets the dependencies cache from a serialized object.
   * @param serializedCache The serialized dependencies cache.
   */
  public setCacheFromSerialized(
    serializedCache: DependencyDescriptorSerializedCache
  ): void {
    this._dependenciesCache.setFromSerialized(serializedCache);
  }

  /**
   * Clears the dependencies cache.
   */
  public clearCache(): void {
    this._dependenciesCache.clear();
  }

  /**
   * Retrieves the element path of the parent of a given element.
   * @param elementInfo The element whose parent is to be retrieved.
   * @returns The parent element path, or undefined if none exists.
   */
  private _getParent(elementDescription: ElementDescription) {
    if (isNull(elementDescription.parents)) {
      return;
    }
    return elementDescription.parents[0]?.path;
  }

  /**
   * Retrieves the common ancestor of two elements.
   * @param elementInfoA The first element.
   * @param elementInfoB The second element.
   * @returns The common ancestor element path, or undefined if none exists.
   */
  private _getCommonAncestor(
    elementInfoA: KnownElementDescription,
    elementInfoB: KnownElementDescription
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
    elementA: KnownElementDescription,
    elementB: KnownElementDescription
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
    elementA: KnownElementDescription,
    elementB: KnownElementDescription
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
    elementA: KnownElementDescription,
    elementB: KnownElementDescription
  ) {
    return elementA.parents.some((parent) => parent.path === elementB.path);
  }

  /**
   * Checks if one element is a child of another.
   * @param elementA The potential child element.
   * @param elementB The potential parent element.
   * @returns True if elementA is a child of elementB, false otherwise.
   */
  private _isChild(
    elementA: KnownElementDescription,
    elementB: KnownElementDescription
  ) {
    return this._getParent(elementA) === elementB.path;
  }

  /**
   * Checks if two local elements are internally related (same element).
   * @param elementA The first element.
   * @param elementB The second element.
   * @returns True if the elements are internally related, false otherwise.
   */
  private _isInternal(
    elementA: KnownElementDescription,
    elementB: KnownElementDescription
  ) {
    return elementA.path === elementB.path;
  }

  /**
   * Retrieves the relationship between two local known elements in terms of dependency.
   * @param from The element depending on another element.
   * @param to The element being depended on.
   * @returns The relationship between the elements.
   */
  private _dependencyRelationship(
    from: ElementDescription,
    to: ElementDescription
  ) {
    if (
      isIgnoredElementDescription(to) ||
      !isKnownElementDescription(to) ||
      !isKnownElementDescription(from)
    ) {
      return null;
    }
    if (this._isInternal(to, from)) {
      return DEPENDENCY_RELATIONSHIPS_MAP.INTERNAL;
    }
    if (this._isChild(to, from)) {
      return DEPENDENCY_RELATIONSHIPS_MAP.CHILD;
    }
    if (this._isDescendant(to, from)) {
      return DEPENDENCY_RELATIONSHIPS_MAP.DESCENDANT;
    }
    if (this._isSibling(to, from)) {
      return DEPENDENCY_RELATIONSHIPS_MAP.SIBLING;
    }
    if (this._isChild(from, to)) {
      return DEPENDENCY_RELATIONSHIPS_MAP.PARENT;
    }
    if (this._isDescendant(from, to)) {
      return DEPENDENCY_RELATIONSHIPS_MAP.ANCESTOR;
    }
    if (this._isDescendantOfParent(to, from)) {
      return DEPENDENCY_RELATIONSHIPS_MAP.UNCLE;
    }
    if (this._isDescendantOfParent(from, to)) {
      return DEPENDENCY_RELATIONSHIPS_MAP.NEPHEW;
    }
    return null;
  }

  /**
   * Retrieves the relationships between two elements in terms of dependency, from the perspective of both elements.
   * @param from The element depending on another element.
   * @param to The element being depended on.
   * @returns The relationships between the elements from both perspectives.
   */
  private _dependencyRelationships(
    from: EntityDescription,
    to: EntityDescription | null
  ): DependencyRelationship {
    if (!to) {
      return {
        from: null,
        to: null,
      };
    }

    const toRelationship = this._dependencyRelationship(
      from.element,
      to.element
    );
    const fromRelationship = toRelationship
      ? DEPENDENCY_RELATIONSHIPS_INVERTED_MAP[toRelationship]
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
  }: DependencyDescriptorOptions): DependencyDescription {
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

    const fromEntity = this._entitiesDescriptor.describeEntity(from);
    const toEntity = this._entitiesDescriptor.describeEntity(to);
    const relationship = this._dependencyRelationships(fromEntity, toEntity);

    const result = {
      from: fromEntity,
      to: toEntity,
      dependency: {
        source,
        kind,
        nodeKind: nodeKind || null,
        relationship,
        specifiers: specifiers || null,
      },
    };

    this._dependenciesCache.set(cacheKey, result);

    return result;
  }
}
