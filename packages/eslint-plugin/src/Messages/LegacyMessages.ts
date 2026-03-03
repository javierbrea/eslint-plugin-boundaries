import type {
  ElementParent,
  CapturedValues,
  DependencyDescription,
  ElementDescription,
} from "@boundaries/elements";
import { isElementDescription } from "@boundaries/elements";
import Handlebars from "handlebars";

import { isArray } from "../Support";

/** Regular expression to detect Handlebars expressions in custom message templates */
const HANDLEBARS_TEMPLATE_REGEX = /{{\s*[^}\s]+(?:\s+[^}\s]+)*\s*}}/;

/**
 * Replaces all occurrences of a placeholder key in a template string.
 *
 * Placeholders use the `${key}` syntax and optionally support namespacing
 * (for example `${from.type}` or `${dependency.parent.category}`).
 *
 * @param template - Message template where placeholders are replaced.
 * @param key - Placeholder key to replace (without `${}` delimiters).
 * @param value - Value injected in place of the placeholder.
 * @param namespace - Optional namespace prepended to the key before replacing.
 * @returns Template string with the requested placeholder replaced.
 */
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

/**
 * Replaces placeholders for all keys from an object in one template or many.
 *
 * @param strings - Template string or collection of template strings.
 * @param object - Key/value pairs used for placeholder replacement.
 * @param namespace - Optional namespace prepended to every object key.
 * @returns A transformed string or array preserving the input shape.
 */
function replaceObjectValuesInTemplates(
  strings: string,
  object: Record<string, string>,
  namespace?: string | null
): string;
/**
 * Overload for replacing placeholders in multiple templates.
 *
 * @param strings - Template collection.
 * @param object - Key/value pairs used for placeholder replacement.
 * @param namespace - Optional namespace prepended to every object key.
 * @returns Array with placeholders replaced in every entry.
 */
function replaceObjectValuesInTemplates(
  strings: string[],
  object: Record<string, string>,
  namespace?: string | null
): string[];
/**
 * Implementation signature for string and string-array overloads.
 *
 * @param strings - One template or an array of templates.
 * @param object - Key/value pairs used for placeholder replacement.
 * @param namespace - Optional namespace prepended to every object key.
 * @returns Replaced template preserving the input shape.
 */
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

/**
 * Convenience wrapper to replace placeholders in a single template string.
 *
 * @param template - Message template containing `${...}` placeholders.
 * @param object - Key/value pairs used for placeholder replacement.
 * @param namespace - Optional namespace prepended to every object key.
 * @returns Template with all matching placeholders replaced.
 */
function replaceObjectValuesInTemplate(
  template: string,
  object: Record<string, string>,
  namespace?: string | null
): string {
  return replaceObjectValuesInTemplates(template, object, namespace);
}

/**
 * Wraps a string in single quotes and gracefully handles empty values.
 *
 * @param str - String value to quote.
 * @returns Quoted value, or empty quoted string when input is nullish.
 */
function quote(str: string | undefined | null) {
  return `'${str || ""}'`;
}

/**
 * Returns the connector used when concatenating captured property fragments.
 *
 * @param properties - Full list of captured property names.
 * @param index - Index of the current property.
 * @returns Join word/symbol used before the current property fragment.
 */
function propertiesConcatenator(properties: string[], index: number) {
  if (properties.length > 1 && index === properties.length - 1) {
    return " and";
  }
  if (index === 0) {
    return " with";
  }
  return ",";
}

/**
 * Creates the replacement context consumed by legacy `${...}` placeholders.
 *
 * The resulting object normalizes available element information and dependency
 * metadata so templates can use keys consistently regardless of source.
 *
 * @param element - Element or parent element that provides captured values.
 * @param importKind - Dependency kind (`value`, `type`, etc.).
 * @param dependencyMetadata - Extra dependency metadata for full elements.
 * @returns Normalized key/value map used during placeholder replacement.
 */
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

/**
 * Checks whether a template uses Handlebars syntax.
 *
 * @param template - Custom message template.
 * @returns `true` when the template contains at least one Handlebars token.
 */
function hasHandlebarsTemplate(template: string) {
  return HANDLEBARS_TEMPLATE_REGEX.test(template);
}

/**
 * Renders Handlebars expressions in a custom message template.
 *
 * If the template does not contain Handlebars expressions, it is returned as-is.
 *
 * @param template - Message template that may include Handlebars expressions.
 * @param dependency - Dependency context exposed to the template.
 * @returns Final message after optional Handlebars rendering.
 */
function renderCustomMessageHandlebarsTemplate(
  template: string,
  dependency: DependencyDescription
) {
  if (!hasHandlebarsTemplate(template)) {
    return template;
  }
  const compiledTemplate = Handlebars.compile(template, { noEscape: true });
  return compiledTemplate({
    from: dependency.from,
    to: dependency.to,
    dependency: dependency.dependency,
  });
}

/**
 * Builds the final custom error message for a dependency violation.
 *
 * This function first resolves legacy `${...}` placeholders (`file`, `from`,
 * `dependency`, `target`, and parent variants) and then evaluates optional
 * Handlebars expressions with the same dependency context.
 *
 * @param message - User-defined message template from rule configuration.
 * @param dependency - Runtime dependency information used by placeholders.
 * @returns Rendered, user-facing error message.
 */
export function legacyCustomErrorMessage(
  message: string,
  dependency: DependencyDescription
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
  return renderCustomMessageHandlebarsTemplate(replacedMessage, dependency);
}

/**
 * Generates the legacy human-readable fragment for captured element values.
 *
 * @param capturedValues - Captured values from an element selector.
 * @returns Message fragment describing captured properties, or empty string.
 */
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

/**
 * Builds the legacy textual description of an element.
 *
 * @param elementInfo - Element information included in error messages.
 * @returns Message fragment describing element type and captured values.
 */
export function legacyElementMessage(
  elementInfo: ElementDescription | ElementParent
) {
  return `of type ${quote(elementInfo.type)}${elementCapturedValuesMessage(
    elementInfo.captured
  )}`;
}
