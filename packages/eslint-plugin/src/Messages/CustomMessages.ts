import type {
  ElementParent,
  DependencyDescription,
  ElementDescription,
  DependencySingleSelectorMatchResult,
  OriginDescription,
} from "@boundaries/elements";
import Handlebars from "handlebars";

import { isArray, isNull, isUndefined } from "../Shared";

import type { CustomMessageTemplateContext } from "./CustomMessages.types";

/** Regular expression to detect Handlebars expressions in custom message templates */
const HANDLEBARS_TEMPLATE_REGEX = /{{\s*[^{}\s][^{}]*}}/;

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
export function replaceObjectValueInLegacyTemplate(
  template: string,
  key: string,
  value: string,
  namespace?: string | null
) {
  const keyToReplace = namespace ? `${namespace}.${key}` : key;
  const regexp = new RegExp(String.raw`\$\{${keyToReplace}\}`, "g");
  return template.replace(regexp, value);
}

/**
 * Replaces multiple placeholders in a template string using values from an object.
 *
 * @param template - One template string.
 * @param object - Key/value pairs used for placeholder replacement.
 * @param namespace - Optional namespace prepended to every object key.
 * @returns Replaced template string.
 */
function replaceObjectValuesInLegacyTemplate(
  template: string,
  object: Record<string, string>,
  namespace?: string | null
): string {
  const finalResult = template;
  return Object.keys(object).reduce((result, objectKey) => {
    return replaceObjectValueInLegacyTemplate(
      result,
      objectKey,
      object[objectKey],
      namespace
    );
  }, finalResult);
}

/**
 * Creates the replacement context consumed by legacy `${...}` placeholders.
 *
 * The resulting object normalizes available element information and dependency
 * metadata so templates can use keys consistently regardless of source.
 *
 * @param element - Element or parent element that provides captured values.
 * @param importKind - Dependency kind (`value`, `type`, etc.).
 * @param dependencyInfo - Extra dependency metadata for full elements.
 * @returns Normalized key/value map used during placeholder replacement.
 */
export function elementPropertiesToReplaceInLegacyTemplate({
  element,
  origin,
  dependency,
}: {
  element: ElementDescription;
  origin?: OriginDescription;
  dependency?: DependencyDescription["dependency"];
}) {
  return {
    ...element.captured,
    type: element.type || "",
    internalPath: element.fileInternalPath || "",
    source: dependency?.source || "",
    module: origin?.module || "",
    importKind: dependency?.kind || "",
  };
}

export function parentPropertiesToReplaceInLegacyTemplate({
  parent,
  dependency,
}: {
  parent: ElementParent;
  dependency?: DependencyDescription["dependency"];
}) {
  return {
    ...parent.captured,
    type: parent.type || "",
    internalPath: "",
    source: "",
    module: "",
    importKind: dependency?.kind || "",
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
 * @param ruleIndex - Index of the rule that triggered the error, if applicable.
 * @param matchResult - Full result of the dependency matching process, if applicable.
 * @returns Final message after optional Handlebars rendering.
 */
function renderCustomMessageHandlebarsTemplate(
  template: string,
  dependency: DependencyDescription,
  ruleIndex: number | null,
  matchResult: DependencySingleSelectorMatchResult | null
) {
  if (!hasHandlebarsTemplate(template)) {
    return template;
  }
  const fromParents = isArray(dependency.from.element.parents)
    ? dependency.from.element.parents.map((parent) => ({
        ...parent,
        elementPath: parent.path,
      }))
    : dependency.from.element.parents;
  const toParents = isArray(dependency.to.element.parents)
    ? dependency.to.element.parents.map((parent) => ({
        ...parent,
        elementPath: parent.path,
      }))
    : dependency.to.element.parents;
  const context: CustomMessageTemplateContext = {
    from: {
      ...dependency.from.element, //V6 backwards compatibility: expose element properties at the root of the "from" context
      elementPath: dependency.from.element.path,
      internalPath: dependency.from.element.fileInternalPath,
      parents: fromParents,
      ...(isUndefined(dependency.from.origin.kind)
        ? {}
        : { origin: dependency.from.origin.kind }),
      ...dependency.from,
    },
    to: {
      ...dependency.to.element, //V6 backwards compatibility: expose element properties at the root of the "to" context
      elementPath: dependency.to.element.path,
      internalPath: dependency.to.element.fileInternalPath,
      parents: toParents,
      ...(isUndefined(dependency.to.origin.kind)
        ? {}
        : { origin: dependency.to.origin.kind }),
      ...dependency.to,
    },
    dependency: dependency.dependency,
    rule:
      !isNull(ruleIndex) && matchResult
        ? {
            index: ruleIndex,
            selector: matchResult,
          }
        : null,
  };

  const compiledTemplate = Handlebars.compile(template, { noEscape: true });
  return compiledTemplate(context);
}

/**
 * Returns message fragments replacing legacy `${...}` placeholders with dependency information.
 * @param template Template string containing `${...}` placeholders.
 * @param dependency The dependency information used to replace placeholders in the template.
 * @returns Template string with `${...}` placeholders replaced by corresponding values from the dependency information.
 */
function replaceLegacyTemplateVariables(
  template: string,
  dependency: DependencyDescription
) {
  const fromProperties = elementPropertiesToReplaceInLegacyTemplate({
    element: dependency.from.element,
    origin: dependency.from.origin,
  });
  const toProperties = elementPropertiesToReplaceInLegacyTemplate({
    element: dependency.to.element,
    origin: dependency.to.origin,
    dependency: dependency.dependency,
  });
  let replacedMessage = replaceObjectValuesInLegacyTemplate(
    replaceObjectValuesInLegacyTemplate(template, fromProperties, "file"),
    toProperties,
    "dependency"
  );
  replacedMessage = replaceObjectValuesInLegacyTemplate(
    replaceObjectValuesInLegacyTemplate(
      replacedMessage,
      fromProperties,
      "from"
    ),
    toProperties,
    "target"
  );
  if (dependency.from.element.parents?.[0]) {
    const fromParentProperties = parentPropertiesToReplaceInLegacyTemplate({
      parent: dependency.from.element.parents[0],
      dependency: dependency.dependency,
    });
    replacedMessage = replaceObjectValuesInLegacyTemplate(
      replacedMessage,
      fromParentProperties,
      "file.parent"
    );
    replacedMessage = replaceObjectValuesInLegacyTemplate(
      replacedMessage,
      fromParentProperties,
      "from.parent"
    );
  }
  if (dependency.to.element.parents?.[0]) {
    const toParentProperties = parentPropertiesToReplaceInLegacyTemplate({
      parent: dependency.to.element.parents?.[0],
      dependency: dependency.dependency,
    });
    replacedMessage = replaceObjectValuesInLegacyTemplate(
      replacedMessage,
      toParentProperties,
      "dependency.parent"
    );
    replacedMessage = replaceObjectValuesInLegacyTemplate(
      replacedMessage,
      toParentProperties,
      "target.parent"
    );
  }
  return replaceObjectValuesInLegacyTemplate(
    replacedMessage,
    {
      path: dependency.to.element.fileInternalPath || "",
      specifiers: dependency.dependency.specifiers?.join(", ") || "",
    },
    "report"
  );
}

/**
 * Builds the final custom error message for a dependency violation.
 *
 * This function first resolves legacy `${...}` placeholders (`file`, `from`,
 * `dependency`, `target`, and parent variants) and then evaluates optional
 * Handlebars expressions with the same dependency context.
 *
 * @param template - User-defined message template from rule configuration.
 * @param dependency - Runtime dependency information used by placeholders.
 * @returns Rendered, user-facing error message.
 */
export function customErrorMessage(
  template: string,
  dependency: DependencyDescription,
  ruleIndex: number | null = null,
  matchResult: DependencySingleSelectorMatchResult | null = null
) {
  const replacedMessage = replaceLegacyTemplateVariables(template, dependency);
  return renderCustomMessageHandlebarsTemplate(
    replacedMessage,
    dependency,
    ruleIndex,
    matchResult
  );
}
