import { Elements } from "@boundaries/elements";
import type { Descriptors } from "@boundaries/elements";
import type { Rule } from "eslint";

import { SETTINGS } from "../constants/settings";
import { getElements, getRootPath } from "../helpers/settings";

export const elements = new Elements();

export function getElementsDescriptor(context: Rule.RuleContext): Descriptors {
  const elementsDescriptors = elements.getDescriptors(
    getElements(context.settings),
    {
      ignorePaths: context.settings[SETTINGS.IGNORE] as string[],
      includePaths: context.settings[SETTINGS.INCLUDE] as string[],
      rootPath: getRootPath(context.settings),
    },
  );
  return elementsDescriptors;
}
