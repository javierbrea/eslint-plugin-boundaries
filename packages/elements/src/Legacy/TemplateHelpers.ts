import type {
  DependencyDescription,
  ElementDescription,
  EntityDescription,
  ModuleDescription,
} from "../Descriptor";
import type { TemplateData } from "../Matcher";
import { isArray, isUndefined, isObject } from "../Shared";
/**
 * Returns legacy aliases for an element description to keep old templates working.
 *
 * Mappings are the inverse of legacy selector conversions:
 * - `path` -> `elementPath`
 * - `fileInternalPath` -> `internalPath`
 * - `parents[].path` -> `parents[].elementPath`
 * - `module.origin` -> `origin` (only when provided)
 */
function getLegacyElementSelectorTemplateData(
  element: ElementDescription,
  moduleDescription?: ModuleDescription
): TemplateData {
  const parents = isArray(element.parents)
    ? element.parents.map((parent) => ({
        ...parent,
        type: parent.types?.[0] ?? null,
        elementPath: parent.path,
      }))
    : element.parents;

  return {
    ...element,
    type: element.types?.[0] ?? null,
    elementPath: element.path,
    internalPath: moduleDescription?.internalPath || element.fileInternalPath,
    parents,
    ...(isUndefined(moduleDescription?.origin)
      ? {}
      : { origin: moduleDescription?.origin }),
  };
}

/**
 * Builds extra template data with legacy aliases for entity selector matching.
 */
export function getLegacyEntitySelectorExtraTemplateData(
  entity: EntityDescription
): TemplateData {
  return {
    element: getLegacyElementSelectorTemplateData(
      entity.element,
      entity.module
    ),
    file: entity.file,
    origin: entity.module,
  };
}

/**
 * Builds extra template data with legacy aliases for element selector matching.
 */
export function getLegacyElementSelectorExtraTemplateData(
  element: ElementDescription,
  moduleDescription?: ModuleDescription
): TemplateData {
  return {
    element: getLegacyElementSelectorTemplateData(element, moduleDescription),
  };
}

/**
 * Builds extra template data with legacy aliases for dependency selector matching.
 */
export function getLegacyDependencySelectorExtraTemplateData(
  dependency: DependencyDescription,
  extraTemplateData?: TemplateData
): TemplateData {
  const optionsFromExtraTemplateData = isObject(extraTemplateData?.from)
    ? extraTemplateData?.from
    : {};
  const optionsToExtraTemplateData = isObject(extraTemplateData?.to)
    ? extraTemplateData?.to
    : {};
  const dependencyExtraTemplateData = isObject(extraTemplateData?.dependency)
    ? extraTemplateData?.dependency
    : {};

  const fromFile = dependency.from.file;
  const fromElement = getLegacyElementSelectorTemplateData(
    dependency.from.element,
    dependency.from.module
  );
  const toFile = dependency.to.file;
  const toElement = getLegacyElementSelectorTemplateData(
    dependency.to.element,
    dependency.to.module
  );

  return {
    ...extraTemplateData,
    from: {
      ...fromElement,
      ...dependency.from,
      element: fromElement,
      file: fromFile,
      ...optionsFromExtraTemplateData,
    },
    to: {
      ...toElement,
      ...dependency.to,
      element: toElement,
      file: toFile,
      ...optionsToExtraTemplateData,
    },
    dependency: {
      ...dependency.dependency,
      origin: dependency.to.module.origin,
      ...dependencyExtraTemplateData,
    },
  };
}
