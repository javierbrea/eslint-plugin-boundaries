import type {
  DependencyElement,
  ElementsDescriptor,
} from "@boundaries/elements";
import { Elements } from "@boundaries/elements";
import type { Rule } from "eslint";
import resolve from "eslint-module-utils/resolve";

import type { FileInfo, ImportInfo } from "../constants/ElementsInfo.types";
import { SETTINGS } from "../constants/settings";
import { debugFileInfo } from "../helpers/debug";
import { getElements, getRootPath } from "../helpers/settings";

const elements = new Elements();

function getElementsDescriptor(context: Rule.RuleContext): ElementsDescriptor {
  const elementsDescriptor = elements.getDescriptor(
    getElements(context.settings),
    {
      ignorePaths: context.settings[SETTINGS.IGNORE] as string[],
      includePaths: context.settings[SETTINGS.INCLUDE] as string[],
      rootPath: getRootPath(context.settings),
    },
  );
  return elementsDescriptor;
}

function replacePathSlashes(absolutePath: string) {
  return absolutePath.replace(/\\/g, "/");
}

function projectPath(
  absolutePath: string | undefined | null,
  rootPath: string,
) {
  if (absolutePath) {
    return replacePathSlashes(absolutePath).replace(
      `${replacePathSlashes(rootPath)}/`,
      "",
    );
  }
  return "";
}

export function importInfo(
  source: string,
  context: Rule.RuleContext,
): ImportInfo {
  const path = projectPath(
    resolve(source, context),
    getRootPath(context.settings),
  );
  const elementsDescriptor = getElementsDescriptor(context);
  const elementResult = elementsDescriptor.describeElement(
    path,
    source,
  ) as DependencyElement;

  // @ts-expect-error Types are not aligned yet
  const result: ImportInfo = {
    ...elementResult,
    source: elementResult.source,
    isLocal: elementResult.origin === "local",
    isBuiltIn: elementResult.origin === "core",
    isExternal: elementResult.origin === "external",
    baseModule: elementResult.baseSource,
  };

  if (result.isLocal) {
    debugFileInfo(result);
  }
  return result;
}

export function fileInfo(context: Rule.RuleContext): FileInfo {
  const elementsDescriptor = getElementsDescriptor(context);
  const path = projectPath(context.filename, getRootPath(context.settings));
  const result = elementsDescriptor.describeElement(path);
  // @ts-expect-error Types are not aligned yet
  debugFileInfo(result);
  // @ts-expect-error Types are not aligned yet
  return result;
}
