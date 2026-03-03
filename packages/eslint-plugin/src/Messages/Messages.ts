import type {
  ElementParent,
  CapturedValues,
  DependencyDescription,
  ElementDescription,
} from "@boundaries/elements";
import { isElementDescription } from "@boundaries/elements";
import Handlebars from "handlebars";

import { isArray } from "../Support";

const HANDLEBARS_TEMPLATE_REGEX = /{{\s*[^}\s]+(?:\s+[^}\s]+)*\s*}}/;

function replaceObjectValueInTemplate(
  template: string,
  key: string,
  value: string,
  namespace?: string | null
) {
  const keyToReplace = namespace ? `${namespace}.${key}` : key;
  const regexp = new RegExp(`\\$\\{${keyToReplace}\\}`, "g");
  return template.replace(regexp, value);
}

function replaceObjectValuesInTemplates(
  strings: string | string[],
  object: Record<string, string>,
  namespace?: string | null
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
          namespace
        );
      });
    }
    return replaceObjectValueInTemplate(
      result,
      objectKey,
      object[objectKey],
      namespace
    );
  }, finalResult);
}

function replaceObjectValuesInTemplate(
  template: string,
  object: Record<string, string>,
  namespace?: string | null
): string {
  // TODO: Remove cast
  return replaceObjectValuesInTemplates(template, object, namespace) as string;
}

function quote(str: string | undefined | null) {
  return `'${str || ""}'`;
}

function propertiesConcatenator(properties: string[], index: number) {
  if (properties.length > 1 && index === properties.length - 1) {
    return " and";
  }
  if (index === 0) {
    return " with";
  }
  return ",";
}

function elementPropertiesToReplaceInTemplate(
  element: ElementDescription | ElementParent,
  importKind: string,
  dependencyMetadata?: DependencyDescription["dependency"]
) {
  if (isElementDescription(element)) {
    const source = dependencyMetadata?.source || "";
    const dependencyModule = dependencyMetadata?.module || "";
    return {
      ...element.captured,
      type: element.type || "",
      internalPath: element.internalPath || "",
      source,
      module: dependencyModule,
      importKind: importKind || "",
    };
  }
  return {
    ...element.captured,
    type: element.type || "",
    internalPath: "",
    source: "",
    module: "",
    importKind: importKind || "",
  };
}

function hasHandlebarsTemplate(template: string) {
  return HANDLEBARS_TEMPLATE_REGEX.test(template);
}

function renderCustomMessageHandlebarsTemplate(
  template: string,
  dependency: DependencyDescription,
  // TODO: Add type to report and remove cast
  report: Record<string, unknown>
) {
  if (!hasHandlebarsTemplate(template)) {
    return template;
  }
  const compiledTemplate = Handlebars.compile(template, { noEscape: true });
  return compiledTemplate({
    from: dependency.from,
    to: dependency.to,
    dependency: dependency.dependency,
    report,
  });
}

export function legacyCustomErrorMessage(
  message: string,
  dependency: DependencyDescription,
  report = {}
) {
  let replacedMessage = replaceObjectValuesInTemplate(
    replaceObjectValuesInTemplate(
      message,
      elementPropertiesToReplaceInTemplate(
        dependency.from,
        dependency.dependency.kind
      ),
      "file"
    ),
    elementPropertiesToReplaceInTemplate(
      dependency.to,
      dependency.dependency.kind,
      dependency.dependency
    ),
    "dependency"
  );
  replacedMessage = replaceObjectValuesInTemplate(
    replaceObjectValuesInTemplate(
      replacedMessage,
      elementPropertiesToReplaceInTemplate(
        dependency.from,
        dependency.dependency.kind
      ),
      "from"
    ),
    elementPropertiesToReplaceInTemplate(
      dependency.to,
      dependency.dependency.kind,
      dependency.dependency
    ),
    "target"
  );
  if (dependency.from.parents?.[0]) {
    replacedMessage = replaceObjectValuesInTemplate(
      replacedMessage,
      elementPropertiesToReplaceInTemplate(
        dependency.from.parents?.[0],
        dependency.dependency.kind
      ),
      "file.parent"
    );
    replacedMessage = replaceObjectValuesInTemplate(
      replacedMessage,
      elementPropertiesToReplaceInTemplate(
        dependency.from.parents?.[0],
        dependency.dependency.kind
      ),
      "from.parent"
    );
  }
  if (dependency.to.parents?.[0]) {
    replacedMessage = replaceObjectValuesInTemplate(
      replacedMessage,
      elementPropertiesToReplaceInTemplate(
        dependency.to.parents?.[0],
        dependency.dependency.kind
      ),
      "dependency.parent"
    );
    replacedMessage = replaceObjectValuesInTemplate(
      replacedMessage,
      elementPropertiesToReplaceInTemplate(
        dependency.to.parents?.[0],
        dependency.dependency.kind
      ),
      "target.parent"
    );
  }
  const replacedLegacyMessage = replaceObjectValuesInTemplate(
    replacedMessage,
    report,
    "report"
  );
  return renderCustomMessageHandlebarsTemplate(
    replacedLegacyMessage,
    dependency,
    // TODO: Add type to report and remove cast
    report as Record<string, unknown>
  );
}

function elementCapturedValuesMessage(capturedValues: CapturedValues | null) {
  if (!capturedValues) {
    return "";
  }
  const capturedValuesKeys = Object.keys(capturedValues);
  return capturedValuesKeys
    .map((key) => {
      return [key, capturedValues[key]];
    })
    .reduce((message, propertyNameAndValue, index) => {
      return `${message}${propertiesConcatenator(capturedValuesKeys, index)} ${
        propertyNameAndValue[0]
      } ${quote(propertyNameAndValue[1])}`;
    }, "");
}

export function legacyElementMessage(
  elementInfo: ElementDescription | ElementParent
) {
  return `of type ${quote(elementInfo.type)}${elementCapturedValuesMessage(
    elementInfo.captured
  )}`;
}
