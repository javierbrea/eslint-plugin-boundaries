import type {
  DependencyDescription as PluginDependencyDescription,
  EntityDescription as PluginEntityDescription,
} from "@boundaries/elements";

import type { DependencyDescription, EntityDescription } from "./engine.types";

/**
 * Keeps what the playground shows of the description that `@boundaries/elements` gives an entity: every property that an element, a file or a module selector matches. It leaves out the `filePath` of the element, which is the path of the file and no selector matches, and the deprecated `category`, of the element and of its parents.
 * @param description The description of the entity.
 * @param description.element The element of the entity.
 * @param description.file The file itself.
 * @param description.module The module of the entity.
 * @returns The description of the entity, with the names and the values of the plugin.
 */
export function toEntityDescription({
  element,
  file,
  module: moduleDescription,
}: PluginEntityDescription): EntityDescription {
  return {
    element: {
      types: element.types,
      path: element.path,
      fileInternalPath: element.fileInternalPath,
      captured: element.captured,
      parents: element.parents.map(({ types, path, captured }) => ({
        types,
        path,
        captured,
      })),
      isIgnored: element.isIgnored,
      isUnknown: element.isUnknown,
    },
    file: {
      categories: file.categories,
      path: file.path,
      captured: file.captured,
      isIgnored: file.isIgnored,
      isUnknown: file.isUnknown,
    },
    module: {
      origin: moduleDescription.origin,
      source: moduleDescription.source,
      internalPath: moduleDescription.internalPath,
    },
  };
}

/**
 * Keeps what the playground shows of the description that `@boundaries/elements` gives a dependency. What the dependency comes from is the description of its file, so it is left out.
 * @param description The description of the dependency.
 * @param description.to What the dependency points to.
 * @param description.dependency The dependency itself.
 * @returns The description of the dependency, with the names and the values of the plugin.
 */
export function toDependencyDescription({
  to,
  dependency,
}: PluginDependencyDescription): DependencyDescription {
  return {
    to: toEntityDescription(to),
    dependency: {
      kind: dependency.kind,
      nodeKind: dependency.nodeKind,
      source: dependency.source,
      specifiers: dependency.specifiers,
      relationship: {
        from: dependency.relationship.from,
        to: dependency.relationship.to,
      },
    },
  };
}
