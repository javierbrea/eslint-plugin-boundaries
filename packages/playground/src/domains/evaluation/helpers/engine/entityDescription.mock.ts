import type { EntityDescription as PluginEntityDescription } from "@boundaries/elements";

import type { EntityDescription } from "./engine.types";

/** What differs from the description of a file that no descriptor matches, in each facet of the description */
type EntityDescriptionOverrides = {
  readonly element?: Partial<EntityDescription["element"]>;
  readonly file?: Partial<EntityDescription["file"]>;
  readonly module?: Partial<EntityDescription["module"]>;
};

/**
 * Builds a description of the engine for the specs of the code that reads one. It is the description of a local file that no element descriptor and no file descriptor matches, with the facets that are given.
 * @param overrides The facets that differ, each with only the properties that differ.
 * @param overrides.element
 * @param overrides.file
 * @param overrides.module
 * @returns The complete description.
 */
export function createEntityDescription({
  element,
  file,
  module: moduleDescription,
}: EntityDescriptionOverrides = {}): EntityDescription {
  return {
    element: {
      types: null,
      path: null,
      fileInternalPath: null,
      captured: null,
      parents: [],
      isIgnored: false,
      isUnknown: true,
      ...element,
    },
    file: {
      categories: null,
      path: null,
      captured: null,
      isIgnored: false,
      isUnknown: true,
      ...file,
    },
    module: {
      origin: "local",
      source: null,
      internalPath: null,
      ...moduleDescription,
    },
  };
}

/**
 * Reads a description of the plugin as the engine keeps it, by leaving out what it does not keep instead of listing what it does, so that a property that the engine forgets makes a spec fail. The engine leaves out the `filePath` of the element, which is the path of the file and no selector matches, and the `category` of the element and of its parents, which are deprecated.
 * @param description The description as `@boundaries/elements` or the plugin gives it.
 * @returns The description without `filePath` and `category`.
 */
export function omitDeprecated(
  description: PluginEntityDescription
): EntityDescription {
  const {
    filePath: _filePath,
    category: _category,
    parents,
    ...element
  } = description.element;

  return {
    element: {
      ...element,
      parents: parents.map(({ category: _parentCategory, ...kept }) => kept),
    },
    file: description.file,
    module: description.module,
  };
}
