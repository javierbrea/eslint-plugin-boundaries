import { Elements, isElementDescriptor } from "@boundaries/elements";
import type { Descriptors } from "@boundaries/elements";
import type { Rule } from "eslint";

import { SETTINGS } from "../constants/settings";
import { warnOnce } from "../helpers/debug";
import { getElements } from "../helpers/settings";

export const elements = new Elements();

export function getElementsDescriptor(context: Rule.RuleContext): Descriptors {
  // NOTE: Filter valid descriptors only to avoid a breaking change for the moment

  const validDescriptors = getElements(context.settings).filter(
    isElementDescriptor
  );
  const invalidDescriptors = getElements(context.settings).filter(
    (desc) => !isElementDescriptor(desc)
  );
  if (invalidDescriptors.length > 0) {
    // TODO: Report invalid descriptors in ESLint context as a warning in a separate rule
    /* context.report({
      message: `Some element descriptors are invalid and will be ignored: ${JSON.stringify(
        invalidDescriptors,
      )}`,
      loc: { line: 1, column: 0 },
    });*/
    warnOnce(
      `Some element descriptors are invalid and will be ignored: ${JSON.stringify(
        invalidDescriptors
      )}`
    );
  }

  const elementsDescriptors = elements.getDescriptors(validDescriptors, {
    ignorePaths: context.settings[SETTINGS.IGNORE] as string[],
    includePaths: context.settings[SETTINGS.INCLUDE] as string[],
  });
  return elementsDescriptors;
}
