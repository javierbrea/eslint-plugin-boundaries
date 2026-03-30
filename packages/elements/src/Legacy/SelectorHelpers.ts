import type {
  DependencyDescription,
  ElementDescription,
  EntityDescription,
} from "../Descriptor";
import type { TemplateData } from "../Matcher";
import { isArray, isUndefined } from "../Shared";
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
