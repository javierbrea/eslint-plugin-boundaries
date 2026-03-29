import type {
  DependencyDescription,
  ElementDescription,
  EntityDescription,
} from "../Descriptor";
import type {
  ParentElementSingleSelector,
  ElementSelector,
  ElementSingleSelector,
  BackwardCompatibleElementSingleSelector,
  EntitySelector,
  EntitySingleSelector,
  DependencyInfoSingleSelector,
  DependencyInfoSelector,
  DependencySingleSelector,
  DependencySelector,
  ParentElementSelector,
  LegacyElementSimpleSelector,
  TemplateData,
} from "../Matcher";
import {
  isEntitySelector,
  isBackwardCompatibleElementSingleSelector,
  isLegacyElementSimpleSelector,
  normalizeElementSelector,
  isSimpleElementSelectorByType,
  isElementSelector,
  isElementSingleSelector,
} from "../Matcher";
import {
  isArray,
  isObjectWithProperty,
  isObjectWithAnyOfProperties,
  isUndefined,
} from "../Shared";

import type {
  LegacyParentElementSingleSelector,
  LegacyParentElementSelector,
  LegacyElementSingleSelector,
  LegacyElementSelector,
  LegacyDependencyInfoSingleSelector,
  LegacyDependencyInfoSelector,
  LegacyDependencySelector,
  LegacyDependencySingleSelector,
  BackwardCompatibleDependencySelector,
  BackwardCompatibleEntitySelector,
  LegacyEntitySelector,
} from "./Selector.types";

/**
 * Determines if the given selector is a legacy parent element single selector.
 * @param selector The selector to check.
 * @returns True if the selector is a legacy parent element single selector, false otherwise.
 */
export function isLegacyParentElementSingleSelector(
  selector: LegacyParentElementSingleSelector | ParentElementSingleSelector
): selector is LegacyParentElementSingleSelector {
  return isObjectWithProperty(selector, "elementPath");
}

/**
 * Determines if the given selector is a legacy parent element selector.
 * @param selector The selector to check.
 * @returns True if the selector is a legacy parent element selector, false otherwise.
 */
export function isLegacyParentElementSelector(
  selector:
    | LegacyParentElementSelector
    | ParentElementSingleSelector
    | ParentElementSingleSelector[]
): selector is LegacyParentElementSelector {
  return isArray(selector)
    ? selector.some(isLegacyParentElementSingleSelector)
    : isLegacyParentElementSingleSelector(selector);
}

/**
 * Determines if the given selector is a legacy element single selector.
 * @param selector The selector to check.
 * @returns True if the selector is a legacy element single selector, false otherwise.
 */
export function isLegacyElementSingleSelector(
  selector:
    | LegacyElementSingleSelector
    | BackwardCompatibleElementSingleSelector
): selector is LegacyElementSingleSelector {
  return (
    isObjectWithAnyOfProperties(selector, [
      "origin",
      "elementPath",
      "internalPath",
    ]) ||
    (isObjectWithProperty(selector, "parent") &&
      isLegacyParentElementSelector(
        selector.parent as LegacyParentElementSelector | ParentElementSelector
      ))
  );
}

/**
 * Determines if the given selector is a legacy element selector.
 * @param selector The selector to check.
 * @returns True if the selector is a legacy element selector, false otherwise.
 */
export function isLegacyElementSelector(
  selector?: LegacyElementSelector | ElementSelector
): selector is LegacyElementSelector {
  if (!selector) {
    return false;
  }
  if (isBackwardCompatibleElementSingleSelector(selector)) {
    return false;
  }
  return isArray(selector)
    ? selector.some(isLegacyElementSingleSelector)
    : isLegacyElementSingleSelector(selector);
}

/**
 * Determines if the given entity selector is a legacy entity selector, in the form of a legacy element selector or an element selector
 * @param selector The selector to check.
 * @returns True if the selector is a legacy entity selector, false otherwise.
 */
export function isLegacyEntitySelector(
  selector?: BackwardCompatibleEntitySelector
): selector is LegacyEntitySelector | ElementSelector {
  if (!selector) {
    return false;
  }
  if (isEntitySelector(selector)) {
    return false;
  }
  return isElementSelector(selector) || isLegacyElementSelector(selector);
}

/**
 * Determines if the given selector is a legacy dependency info single selector.
 * @param selector The selector to check.
 * @returns True if the selector is a legacy dependency info single selector, false otherwise.
 */
export function isLegacyDependencyInfoSingleSelector(
  selector: LegacyDependencyInfoSingleSelector | DependencyInfoSingleSelector
): selector is LegacyDependencyInfoSingleSelector {
  return isObjectWithAnyOfProperties(selector, ["module"]);
}

/**
 * Determines if the given selector is a legacy dependency info selector.
 * @param selector The selector to check.
 * @returns True if the selector is a legacy dependency info selector, false otherwise.
 */
export function isLegacyDependencyInfoSelector(
  selector?: LegacyDependencyInfoSelector | DependencyInfoSelector
): selector is LegacyDependencyInfoSelector {
  if (!selector) {
    return false;
  }
  return isArray(selector)
    ? selector.some(isLegacyDependencyInfoSingleSelector)
    : isLegacyDependencyInfoSingleSelector(selector);
}

/**
 * Determines if the given selector is a legacy dependency single selector. A legacy dependency single selector is one that has at least one of its properties (to, from, dependency) as a legacy selector.
 * @param selector The selector to check.
 * @returns True if the selector is a legacy dependency single selector, false otherwise.
 */
export function isLegacyDependencySingleSelector(
  selector: LegacyDependencySingleSelector | DependencySingleSelector
): selector is LegacyDependencySingleSelector {
  const isLegacyTo = isLegacyEntitySelector(selector.to);
  const isLegacyFrom = isLegacyEntitySelector(selector.from);
  const isLegacyDependencyInfo = isLegacyDependencyInfoSelector(
    selector.dependency
  );

  return isLegacyTo || isLegacyFrom || isLegacyDependencyInfo;
}

/**
 * Determines if the given selector is a legacy dependency selector. A legacy dependency selector is one that is either a legacy dependency single selector or an array of legacy dependency single selectors.
 * @param selector The selector to check.
 * @returns True if the selector is a legacy dependency selector, false otherwise.
 */
export function isLegacyDependencySelector(
  selector: LegacyDependencySelector | DependencySelector
): selector is LegacyDependencySelector {
  return isArray(selector)
    ? selector.some(isLegacyDependencySingleSelector)
    : isLegacyDependencySingleSelector(selector);
}

/**
 * Converts a legacy parent element single selector into the equivalent parent element single selector.
 *
 * Legacy properties are mapped to the new model as follows:
 * - `elementPath` -> `path`
 */
function convertLegacyParentElementSingleSelector(
  selector: LegacyParentElementSingleSelector
): ParentElementSingleSelector {
  const { elementPath, ...parentSelector } = selector;
  if (!isUndefined(elementPath)) {
    parentSelector.path = elementPath;
  }
  return parentSelector;
}

/**
 * Converts a legacy parent element selector (single or array) to the parent element selector format.
 */
function convertLegacyParentElementSelector(
  selector: LegacyParentElementSelector
): ParentElementSelector {
  if (isArray(selector)) {
    return selector.map(convertLegacyParentElementSingleSelector);
  }
  return convertLegacyParentElementSingleSelector(selector);
}

/**
 * Converts a legacy element single selector into the equivalent element single selector.
 *
 * Legacy properties are mapped to the new model as follows:
 * - `elementPath` -> `path`
 * - `internalPath` -> `fileInternalPath`
 * - `parent.elementPath` -> `parent.path`
 *
 * @throws Error if the selector contains `origin`, which is an entity-level property
 * and cannot be represented in an element selector.
 */
export function convertLegacyElementSingleSelector(
  selector: LegacyElementSingleSelector
): ElementSingleSelector {
  const { origin, elementPath, internalPath, parent, ...rest } = selector;

  if (!isUndefined(origin)) {
    throw new Error(
      `Cannot convert legacy element selector to element selector: the "origin" property is an entity-level property and cannot be represented in an element selector. Use convertLegacyElementSingleSelectorToEntitySelector instead.`
    );
  }

  const elementSelector: ElementSingleSelector = { ...rest };

  if (!isUndefined(elementPath)) {
    elementSelector.path = elementPath;
  }

  if (!isUndefined(internalPath)) {
    elementSelector.fileInternalPath = internalPath;
  }

  if (!isUndefined(parent)) {
    elementSelector.parent = isLegacyParentElementSelector(parent)
      ? convertLegacyParentElementSelector(parent)
      : parent;
  }

  return elementSelector;
}

/**
 * Converts a legacy element selector (single or array) to the element selector format.
 *
 * @throws Error if any single selector contains `origin`, which is an entity-level property
 * and cannot be represented in an element selector.
 */
export function convertLegacyElementSelector(
  selector: LegacyElementSelector
): ElementSelector {
  if (isArray(selector)) {
    return selector.map(convertLegacyElementSingleSelector);
  }
  return convertLegacyElementSingleSelector(selector);
}

/**
 * Converts a legacy element single selector into the equivalent entity single selector.
 *
 * Legacy properties are mapped to the new model as follows:
 * - `origin` -> `origin.kind`
 * - `elementPath` -> `element.path`
 * - `internalPath` -> `element.fileInternalPath`
 * - `parent.elementPath` -> `element.parent.path`
 */
function convertLegacyElementSingleSelectorToEntitySelector(
  selector:
    | LegacyElementSingleSelector
    | LegacyElementSimpleSelector
    | ElementSingleSelector
): EntitySelector {
  const toEntitySelectors = (
    sourceElementSelector: ElementSingleSelector,
    sourceOrigin?: LegacyElementSingleSelector["origin"]
  ): EntitySingleSelector[] => {
    const selectors: EntitySingleSelector[] = [];

    const baseOrigin = isUndefined(sourceOrigin)
      ? undefined
      : { kind: sourceOrigin };

    const elementEntitySelector: EntitySingleSelector = {};
    if (Object.keys(sourceElementSelector).length > 0) {
      elementEntitySelector.element = sourceElementSelector;
      if (!isUndefined(sourceElementSelector.path)) {
        elementEntitySelector.element.filePath = sourceElementSelector.path;
      }
    }
    if (!isUndefined(baseOrigin)) {
      elementEntitySelector.origin = baseOrigin;
    }
    if (Object.keys(elementEntitySelector).length > 0) {
      selectors.push(elementEntitySelector);
    }

    return selectors;
  };

  if (isLegacyElementSimpleSelector(selector)) {
    const simpleElementSelector = isSimpleElementSelectorByType(selector)
      ? { type: selector }
      : {
          type: selector[0],
          captured: selector[1] ? { ...selector[1] } : undefined,
        };
    return toEntitySelectors(simpleElementSelector);
  }

  if (
    !isLegacyElementSingleSelector(selector) &&
    isElementSingleSelector(selector)
  ) {
    return toEntitySelectors(selector);
  }

  const { origin, path, elementPath, internalPath, parent, ...rest } = selector;
  const elementSelector: ElementSingleSelector = { ...rest };

  if (!isUndefined(path)) {
    elementSelector.filePath = path;
  }

  if (!isUndefined(elementPath)) {
    elementSelector.path = elementPath;
  }

  if (!isUndefined(internalPath)) {
    elementSelector.fileInternalPath = internalPath;
  }

  if (!isUndefined(parent)) {
    elementSelector.parent = isLegacyParentElementSelector(parent)
      ? convertLegacyParentElementSelector(parent)
      : parent;
  }

  return toEntitySelectors(elementSelector, origin);
}

/**
 * Converts a legacy element selector (single or array) to entity selector format.
 */
export function convertLegacyElementSelectorToEntitySelector(
  selector: LegacyElementSelector | LegacyElementSimpleSelector
): EntitySelector {
  if (!isLegacyElementSimpleSelector(selector) && isArray(selector)) {
    return selector.flatMap(convertLegacyElementSingleSelectorToEntitySelector);
  }
  return convertLegacyElementSingleSelectorToEntitySelector(selector);
}

/**
 * Converts a legacy entity selector, which can be either a legacy element selector or a legacy element simple selector, into the equivalent entity selector.
 *
 * Legacy properties are mapped to the new model as follows:
 * - For legacy element selectors, the mapping is done according to convertLegacyElementSelectorToEntitySelector.
 * - For legacy element simple selectors, which can be a simple string or an object with type and/or category, they are converted to an entity selector with an element selector with only the type and/or category defined.
 * @param selector The legacy entity selector to convert.
 * @returns The equivalent entity selector in the new format.
 */
export function convertLegacyEntitySelector(
  selector: LegacyEntitySelector | ElementSelector
): EntitySelector {
  if (isLegacyElementSelector(selector)) {
    return convertLegacyElementSelectorToEntitySelector(selector);
  }
  return normalizeElementSelector(selector).flatMap(
    convertLegacyElementSingleSelectorToEntitySelector
  );
}

/**
 * Returns legacy aliases for an element description to keep old templates working.
 *
 * Mappings are the inverse of legacy selector conversions:
 * - `path` -> `elementPath`
 * - `fileInternalPath` -> `internalPath`
 * - `parents[].path` -> `parents[].elementPath`
 * - `origin.kind` -> `origin` (only when provided)
 */
function getLegacyElementTemplateData(
  element: ElementDescription,
  originKind?: EntityDescription["origin"]["kind"]
): TemplateData {
  const parents = isArray(element.parents)
    ? element.parents.map((parent) => ({
        ...parent,
        elementPath: parent.path,
      }))
    : element.parents;

  return {
    ...element,
    // TODO: How to make "path" backward compatible, because before it was the file path, and now it is the element path?
    elementPath: element.path,
    internalPath: element.fileInternalPath,
    parents,
    ...(isUndefined(originKind) ? {} : { origin: originKind }),
  };
}

/**
 * Builds extra template data with legacy aliases for entity selector matching.
 */
export function getLegacyEntitySelectorExtraTemplateData(
  entity: EntityDescription
): TemplateData {
  return {
    element: getLegacyElementTemplateData(entity.element, entity.origin.kind),
    file: entity.file,
    origin: entity.origin,
  };
}

/**
 * Builds extra template data with legacy aliases for element selector matching.
 */
export function getLegacyElementSelectorExtraTemplateData(
  element: ElementDescription
): TemplateData {
  return {
    element: getLegacyElementTemplateData(element),
  };
}

/**
 * Builds extra template data with legacy aliases for dependency selector matching.
 */
export function getLegacyDependencySelectorExtraTemplateData(
  dependency: DependencyDescription
): TemplateData {
  const fromFile = dependency.from.file;
  const fromElement = getLegacyElementTemplateData(
    dependency.from.element,
    dependency.from.origin.kind
  );
  const toFile = dependency.to.file;
  const toElement = getLegacyElementTemplateData(
    dependency.to.element,
    dependency.to.origin.kind
  );

  return {
    from: {
      ...fromElement,
      ...dependency.from,
      element: fromElement,
      file: fromFile,
    },
    to: {
      ...toElement,
      ...dependency.to,
      element: toElement,
      file: toFile,
    },
    dependency: {
      ...dependency.dependency,
      module: dependency.to.origin.module,
    },
  };
}

/**
 * Adds `origin.module` to each entity single selector in `toSelector`.
 * When `toSelector` is undefined, produces `{ origin: { module } }`.
 *
 * The `dependency` array in the legacy model uses OR semantics between items, and each item
 * may pair a `source` with a `module`. Collecting all modules into a single array would break
 * that pairing, so `module` must stay bound to its own entity selector per dependency item.
 */
function addModuleToEntitySelector(
  toSelector: EntitySelector | undefined,
  modulePattern: LegacyDependencyInfoSingleSelector["module"]
): EntitySelector {
  if (isArray(toSelector)) {
    return toSelector.map((single) => ({
      ...single,
      origin: { ...single.origin, module: modulePattern },
    }));
  }

  const base: EntitySingleSelector = toSelector ?? {};
  return { ...base, origin: { ...base.origin, module: modulePattern } };
}

/**
 * Converts a legacy dependency single selector into one or more modern dependency selectors.
 *
 * When `dependency` is an array, each item produces a separate output selector to preserve
 * OR semantics and the pairing between `source` and `module` within each item. For example,
 * `[{ source: "foo", module: "x" }, { source: "bar", module: "y" }]` must not be collapsed
 * into `{ dependency: { source: ["foo","bar"] }, to: { origin: { module: ["x","y"] } } }`
 * because that would allow the combination (source "foo", module "y") which was not intended.
 */
function convertLegacyDependencySingleSelector(
  selector: LegacyDependencySingleSelector
): DependencySingleSelector[] {
  const from = isUndefined(selector.from)
    ? undefined
    : convertLegacyElementSelectorToEntitySelector(selector.from);

  const to = isUndefined(selector.to)
    ? undefined
    : convertLegacyElementSelectorToEntitySelector(selector.to);

  const dependencyItems = isUndefined(selector.dependency)
    ? []
    : isArray(selector.dependency)
      ? selector.dependency
      : [selector.dependency];

  if (dependencyItems.length === 0) {
    const converted: DependencySingleSelector = {};
    if (!isUndefined(from)) {
      converted.from = from;
    }
    if (!isUndefined(to)) {
      converted.to = to;
    }
    return [converted];
  }

  return dependencyItems.map((dependencyItem) => {
    const { module: modulePattern, ...dependencyInfo } = dependencyItem;
    const converted: DependencySingleSelector = {};
    if (!isUndefined(from)) {
      converted.from = from;
    }
    if (!isUndefined(modulePattern)) {
      converted.to = addModuleToEntitySelector(to, modulePattern);
    } else if (!isUndefined(to)) {
      converted.to = to;
    }
    if (Object.keys(dependencyInfo).length > 0) {
      converted.dependency = dependencyInfo;
    }
    return converted;
  });
}

/**
 * Asserts that a dependency selector does not mix legacy and new-format single selectors.
 * In practice all items in a selector should be either entirely legacy or entirely new-format.
 * @throws Error if legacy and new-format items are mixed in the same array.
 */
export function ensureNoMixedDependencySelector(
  selector: LegacyDependencySingleSelector[] | DependencySingleSelector[]
): LegacyDependencySingleSelector[] | never {
  const hasNew = selector.some(
    (item) => !isLegacyDependencySingleSelector(item)
  );
  if (hasNew) {
    throw new Error(
      "Dependency selectors cannot mix legacy-format elements and new-format items"
    );
  }
  return selector as LegacyDependencySingleSelector[];
}

/**
 * Converts a dependency selector from legacy format to the new entity selector format.
 * Returns the selector unchanged if it is already in the new format.
 * @throws Error if legacy and new-format items are mixed in the same array.
 */
export function convertLegacyDependencySelector(
  selector: BackwardCompatibleDependencySelector
): DependencySelector {
  if (!isLegacyDependencySelector(selector)) {
    return selector;
  }

  const selectors = isArray(selector) ? selector : [selector];
  const legacySelectors = ensureNoMixedDependencySelector(selectors);

  return legacySelectors.flatMap(convertLegacyDependencySingleSelector);
}
