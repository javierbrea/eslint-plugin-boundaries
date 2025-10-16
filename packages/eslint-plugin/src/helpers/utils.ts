import type { DependencyInfo } from "../constants/DependencyInfo.types";
import type { FileInfo, ElementInfo } from "../constants/ElementsInfo.types";

export { isString } from "../constants/settings";

export function isArray(object: unknown): object is unknown[] {
  return Array.isArray(object);
}

export function isObject(object: unknown): object is Record<string, unknown> {
  return typeof object === "object" && object !== null && !isArray(object);
}

export function getArrayOrNull<T>(value: unknown): T[] | null {
  return isArray(value) ? (value as T[]) : null;
}

function replaceObjectValueInTemplate(
  template: string,
  key: string,
  value: string,
  namespace?: string | null,
) {
  const keyToReplace = namespace ? `${namespace}.${key}` : key;
  const regexp = new RegExp(`\\$\\{${keyToReplace}\\}`, "g");
  return template.replace(regexp, value);
}

export function replaceObjectValuesInTemplates(
  strings: string | string[],
  object: Record<string, string>,
  namespace?: string | null,
): string | string[] {
  const finalResult = isArray(strings) ? [...strings] : strings;
  return Object.keys(object).reduce((result, objectKey) => {
    // If template is an array, replace key by value in all patterns
    if (isArray(result)) {
      return result.map((resultEntry) => {
        return replaceObjectValueInTemplate(
          resultEntry,
          objectKey,
          object[objectKey],
          namespace,
        );
      });
    }
    return replaceObjectValueInTemplate(
      result,
      objectKey,
      object[objectKey],
      namespace,
    );
  }, finalResult);
}

export function replaceObjectValuesInTemplate(
  template: string,
  object: Record<string, string>,
  namespace?: string | null,
): string {
  return replaceObjectValuesInTemplates(template, object, namespace) as string;
}

export function isNotParentInfo(
  elementInfo:
    | ElementInfo
    | FileInfo
    | DependencyInfo
    | ElementInfo["parents"][0],
): elementInfo is ElementInfo | FileInfo | DependencyInfo {
  return (
    (elementInfo as ElementInfo | FileInfo | DependencyInfo).internalPath !==
    undefined
  );
}

export function isDependencyInfo(
  elementInfo:
    | ElementInfo
    | FileInfo
    | DependencyInfo
    | ElementInfo["parents"][0],
): elementInfo is DependencyInfo {
  return (
    (elementInfo as DependencyInfo).importKind !== undefined ||
    (elementInfo as DependencyInfo).source !== undefined
  );
}
