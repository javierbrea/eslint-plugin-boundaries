import ruleFactory from "../../../src/Rules/Dependencies";
import { ELEMENT_TYPES as RULE } from "../../../src/Shared";
import {
  SETTINGS,
  createRuleTester,
  pathResolvers,
} from "../../support/helpers";
import type { RuleTesterSettings } from "../../support/helpers";

const rule = ruleFactory();

const { absoluteFilePath } = pathResolvers("one-level");

const REST_OF_PATH = "test/fixtures/one-level";

// This suite mixes `element` and `file` selectors in the same rule entries, in both the
// FROM and TO positions, and exercises additional file-selector properties (categories,
// captured.elementName, captured.fileName, captured.restOfPath, path, isIgnored, isUnknown).
// It also exercises templates in TWO places:
//   1. Inside selector values (file.captured, element.captured and file.path), cross-referencing
//      element and file captured values of the FROM entity.
//   2. Inside custom error messages, combining element and file metadata.
//
// Both `boundaries/elements` and `boundaries/files` match every fixture file, so every file
// descriptor also belongs to an element. As a result, no-rule messages render in the combined
// form: `file of category "X" ... belonging to elements of type "Y" ...`.
//
// Fixture resolution under these settings:
// 'helpers/helper-a'            → helpers/helper-a/index.js   (elementName="helper-a", fileName="index")
// 'helpers/helper-b/HelperB.js' → helpers/helper-b/HelperB.js (elementName="helper-b", fileName="HelperB")
// 'helpers/module-a'            → helpers/module-a/index.js   (elementName="module-a", fileName="index")
// 'components/component-a'      → components/component-a/index.js (elementName="component-a", fileName="index")
// 'modules/module-a'            → modules/module-a/index.js   (elementName="module-a", fileName="index")
//
// Note: a helper element named "module-a" (helpers/module-a) shares its captured elementName with
// the "module-a" module, which is what makes the template cross-reference tests below meaningful.

// Elements and files both capture, so templates may reference element and file captured values.
const mixedSettings: RuleTesterSettings = {
  ...SETTINGS.oneLevel,
  "boundaries/elements": [
    { type: "helpers", pattern: "helpers/*", capture: ["elementName"] },
    { type: "components", pattern: ["components/*"], capture: ["elementName"] },
    { type: "modules", pattern: "modules/*", capture: ["elementName"] },
  ],
  "boundaries/files": [
    {
      category: "helpers",
      pattern: "helpers/*/*.js",
      basePattern: "**",
      capture: ["elementName", "fileName"],
    },
    {
      category: "components",
      pattern: "components/*/*.js",
      basePattern: "**",
      capture: ["elementName", "fileName"],
    },
    {
      category: "modules",
      pattern: "modules/*/*.js",
      basePattern: "**",
      capture: ["elementName", "fileName"],
    },
  ],
} as RuleTesterSettings;

// Describes an entity in the combined "file ... belonging to element ..." no-rule form.
function fileBelongingToElement(
  category: string,
  elementName: string,
  fileName: string
) {
  return (
    `file of category "${category}" and captured values: ` +
    `restOfPath="${REST_OF_PATH}", elementName="${elementName}", fileName="${fileName}" ` +
    `belonging to elements of type "${category}" and captured values: ` +
    `elementName="${elementName}"`
  );
}

function noRuleMessage({ from, to }: { from: string; to: string }) {
  return `There is no rule allowing dependencies from ${from} to ${to}`;
}

const ruleTester = createRuleTester(mixedSettings);

ruleTester.run(RULE, rule, {
  valid: [
    // =========================================================================
    // Mixed FROM and TO selectors (element + file in the same entry)
    // =========================================================================

    // FROM combines element.type and file.categories; TO combines element.type and file.categories.
    {
      filename: absoluteFilePath("components/component-a/ComponentA.js"),
      code: "import HelperA from 'helpers/helper-a'",
      options: [
        {
          default: "disallow",
          rules: [
            {
              from: {
                element: { type: "components" },
                file: { categories: "components" },
              },
              allow: {
                to: [
                  {
                    element: { type: "helpers" },
                    file: { categories: "helpers" },
                  },
                ],
              },
            },
          ],
        },
      ],
    },
    // FROM uses only file.categories; TO mixes element.type with file.captured.elementName.
    {
      filename: absoluteFilePath("components/component-a/ComponentA.js"),
      code: "import HelperA from 'helpers/helper-a'",
      options: [
        {
          default: "disallow",
          rules: [
            {
              from: { file: { categories: "components" } },
              allow: {
                to: [
                  {
                    element: { type: "helpers" },
                    file: { captured: { elementName: "helper-a" } },
                  },
                ],
              },
            },
          ],
        },
      ],
    },
    // FROM mixes element.captured with file.captured.fileName; TO mixes element.type and file.path.
    {
      filename: absoluteFilePath("components/component-a/ComponentA.js"),
      code: "import HelperA from 'helpers/helper-a'",
      options: [
        {
          default: "disallow",
          rules: [
            {
              from: {
                element: { captured: { elementName: "component-a" } },
                file: { captured: { fileName: "ComponentA" } },
              },
              allow: {
                to: [
                  {
                    element: { type: "helpers" },
                    file: { path: "**/helpers/helper-a/**" },
                  },
                ],
              },
            },
          ],
        },
      ],
    },
    // file.isIgnored:false combined with element.type allows a normal (non-ignored) helper import.
    {
      filename: absoluteFilePath("components/component-a/ComponentA.js"),
      code: "import HelperA from 'helpers/helper-a'",
      options: [
        {
          default: "disallow",
          rules: [
            {
              from: { element: { type: "components" } },
              allow: {
                to: [
                  {
                    element: { type: "helpers" },
                    file: { isIgnored: false },
                  },
                ],
              },
            },
          ],
        },
      ],
    },
    // file.isUnknown:false combined with element.type allows a known helper import.
    {
      filename: absoluteFilePath("components/component-a/ComponentA.js"),
      code: "import HelperA from 'helpers/helper-a'",
      options: [
        {
          default: "disallow",
          rules: [
            {
              from: { file: { categories: "components" } },
              allow: {
                to: [
                  {
                    element: { type: "helpers" },
                    file: { isUnknown: false },
                  },
                ],
              },
            },
          ],
        },
      ],
    },
    // A disallow mixing element + file does NOT match when the file.captured value differs,
    // so the broad allow keeps the import valid. component-a imports helper-a (fileName "index");
    // the disallow targets fileName "HelperB", which is not the imported file.
    {
      filename: absoluteFilePath("components/component-a/ComponentA.js"),
      code: "import HelperA from 'helpers/helper-a'",
      options: [
        {
          default: "disallow",
          rules: [
            {
              from: { element: { type: "components" } },
              allow: { to: [{ element: { type: "helpers" } }] },
              disallow: {
                to: [
                  {
                    element: { type: "helpers" },
                    file: { captured: { fileName: "HelperB" } },
                  },
                ],
              },
            },
          ],
        },
      ],
    },

    // =========================================================================
    // Templates INSIDE selector values
    // =========================================================================

    // Template in file.captured.elementName references the FROM element captured value.
    // module-a (element captured elementName "module-a") may import the helper file whose
    // captured elementName equals "module-a" → helpers/module-a is allowed.
    {
      filename: absoluteFilePath("modules/module-a/ModuleA.js"),
      code: "import ModuleAHelper from 'helpers/module-a'",
      options: [
        {
          default: "disallow",
          rules: [
            {
              from: { element: { type: "modules" } },
              allow: {
                to: [
                  {
                    file: {
                      categories: "helpers",
                      captured: {
                        elementName: "{{ from.element.captured.elementName }}",
                      },
                    },
                  },
                ],
              },
            },
          ],
        },
      ],
    },
    // Template in element.captured.elementName references the FROM file captured value.
    // module-a (file captured elementName "module-a") may import the helper element whose
    // captured elementName equals "module-a" → helpers/module-a is allowed.
    {
      filename: absoluteFilePath("modules/module-a/ModuleA.js"),
      code: "import ModuleAHelper from 'helpers/module-a'",
      options: [
        {
          default: "disallow",
          rules: [
            {
              from: { file: { categories: "modules" } },
              allow: {
                to: [
                  {
                    element: {
                      type: "helpers",
                      captured: {
                        elementName: "{{ from.file.captured.elementName }}",
                      },
                    },
                  },
                ],
              },
            },
          ],
        },
      ],
    },
    // Template in file.path references the FROM element captured value.
    // module-a may import any file under helpers/<its-own-name>/ → helpers/module-a is allowed.
    {
      filename: absoluteFilePath("modules/module-a/ModuleA.js"),
      code: "import ModuleAHelper from 'helpers/module-a'",
      options: [
        {
          default: "disallow",
          rules: [
            {
              from: {
                element: { type: "modules", captured: { elementName: "*" } },
              },
              allow: {
                to: [
                  {
                    file: {
                      path: "**/helpers/{{ from.element.captured.elementName }}/**",
                    },
                  },
                ],
              },
            },
          ],
        },
      ],
    },
  ],
  invalid: [
    // =========================================================================
    // Mixed selectors that deny, with auto-generated no-rule messages
    // =========================================================================

    // FROM mixes element.type and file.categories; the only allow targets helper-a, so importing
    // helper-b is denied. The message renders both file and element metadata for FROM and TO.
    {
      filename: absoluteFilePath("components/component-a/ComponentA.js"),
      code: "import HelperB from 'helpers/helper-b'",
      options: [
        {
          default: "disallow",
          rules: [
            {
              from: {
                element: { type: "components" },
                file: { categories: "components" },
              },
              allow: {
                to: [
                  {
                    element: { type: "helpers" },
                    file: { captured: { elementName: "helper-a" } },
                  },
                ],
              },
            },
          ],
        },
      ],
      errors: [
        {
          message: noRuleMessage({
            from: fileBelongingToElement(
              "components",
              "component-a",
              "ComponentA"
            ),
            to: fileBelongingToElement("helpers", "helper-b", "index"),
          }),
          type: "Literal",
        },
      ],
    },

    // =========================================================================
    // Templates INSIDE selector values that lead to a denial
    // =========================================================================

    // Template in file.captured.elementName: module-a may only import the helper whose captured
    // elementName equals "module-a". Importing helper-b does not match the template, so the broad
    // disallow keeps it denied (no-rule message).
    {
      filename: absoluteFilePath("modules/module-a/ModuleA.js"),
      code: "import HelperB from 'helpers/helper-b'",
      options: [
        {
          default: "disallow",
          rules: [
            {
              from: { element: { type: "modules" } },
              allow: {
                to: [
                  {
                    file: {
                      categories: "helpers",
                      captured: {
                        elementName: "{{ from.element.captured.elementName }}",
                      },
                    },
                  },
                ],
              },
            },
          ],
        },
      ],
      errors: [
        {
          message: noRuleMessage({
            from: fileBelongingToElement("modules", "module-a", "ModuleA"),
            to: fileBelongingToElement("helpers", "helper-b", "index"),
          }),
          type: "Literal",
        },
      ],
    },
    // Template in file.path: module-a may only import files under helpers/<its-own-name>/.
    // helpers/helper-b does not match "**/helpers/module-a/**", so it is denied.
    {
      filename: absoluteFilePath("modules/module-a/ModuleA.js"),
      code: "import HelperB from 'helpers/helper-b'",
      options: [
        {
          default: "disallow",
          rules: [
            {
              from: {
                element: { type: "modules", captured: { elementName: "*" } },
              },
              allow: {
                to: [
                  {
                    file: {
                      path: "**/helpers/{{ from.element.captured.elementName }}/**",
                    },
                  },
                ],
              },
            },
          ],
        },
      ],
      errors: [
        {
          message: noRuleMessage({
            from: fileBelongingToElement("modules", "module-a", "ModuleA"),
            to: fileBelongingToElement("helpers", "helper-b", "index"),
          }),
          type: "Literal",
        },
      ],
    },
    // Template in a disallow file.captured selector value: module-a must NOT import the helper
    // whose captured elementName equals its own captured elementName ("module-a"). Importing
    // helpers/module-a is therefore denied, with a custom message that also uses templates.
    {
      filename: absoluteFilePath("modules/module-a/ModuleA.js"),
      code: "import ModuleAHelper from 'helpers/module-a'",
      options: [
        {
          default: "allow",
          rules: [
            {
              from: { element: { type: "modules" } },
              disallow: {
                to: [
                  {
                    file: {
                      categories: "helpers",
                      captured: {
                        elementName: "{{ from.element.captured.elementName }}",
                      },
                    },
                  },
                ],
              },
              message:
                "module {{from.element.captured.elementName}} must not import its sibling helper file {{to.file.captured.fileName}} ({{to.element.captured.elementName}})",
            },
          ],
        },
      ],
      errors: [
        {
          message:
            "module module-a must not import its sibling helper file index (module-a)",
          type: "Literal",
        },
      ],
    },

    // =========================================================================
    // Templates INSIDE custom messages, combining element and file metadata
    // =========================================================================

    // Custom message references both element and file metadata of FROM and TO.
    {
      filename: absoluteFilePath("components/component-a/ComponentA.js"),
      code: "import ModuleA from 'modules/module-a'",
      options: [
        {
          default: "allow",
          rules: [
            {
              from: {
                element: { type: "components" },
                file: { categories: "components" },
              },
              disallow: {
                to: [
                  {
                    element: { type: "modules" },
                    file: { categories: "modules" },
                  },
                ],
              },
              message:
                "{{from.element.type}} {{from.element.captured.elementName}} (file {{from.file.captured.fileName}}) must not import {{to.file.categories.[0]}} {{to.element.captured.elementName}}",
            },
          ],
        },
      ],
      errors: [
        {
          message:
            "components component-a (file ComponentA) must not import modules module-a",
          type: "Literal",
        },
      ],
    },
    // file.path in TO combined with element.type in FROM, denied with a custom message.
    {
      filename: absoluteFilePath("components/component-a/ComponentA.js"),
      code: "import HelperB from 'helpers/helper-b'",
      options: [
        {
          default: "allow",
          rules: [
            {
              from: { element: { type: "components" } },
              disallow: {
                to: [
                  {
                    element: { type: "helpers" },
                    file: { path: "**/helpers/helper-b/**" },
                  },
                ],
              },
              message:
                "{{from.element.type}} cannot import file at path matching helper-b ({{to.file.captured.elementName}})",
            },
          ],
        },
      ],
      errors: [
        {
          message:
            "components cannot import file at path matching helper-b (helper-b)",
          type: "Literal",
        },
      ],
    },
    // file.captured.fileName combined with element.captured.elementName in TO, denied.
    {
      filename: absoluteFilePath("components/component-a/ComponentA.js"),
      code: "import HelperB from 'helpers/helper-b/HelperB.js'",
      options: [
        {
          default: "allow",
          rules: [
            {
              from: {
                element: { captured: { elementName: "component-a" } },
                file: { categories: "components" },
              },
              disallow: {
                to: [
                  {
                    element: { captured: { elementName: "helper-b" } },
                    file: { captured: { fileName: "HelperB" } },
                  },
                ],
              },
              message:
                "{{from.element.captured.elementName}} cannot import {{to.element.captured.elementName}} file {{to.file.captured.fileName}}",
            },
          ],
        },
      ],
      errors: [
        {
          message: "component-a cannot import helper-b file HelperB",
          type: "Literal",
        },
      ],
    },
    // file.captured.restOfPath combined with element.type in TO, denied with a custom message.
    {
      filename: absoluteFilePath("components/component-a/ComponentA.js"),
      code: "import ModuleA from 'modules/module-a'",
      options: [
        {
          default: "allow",
          rules: [
            {
              from: { file: { categories: "components" } },
              disallow: {
                to: [
                  {
                    element: { type: "modules" },
                    file: { captured: { restOfPath: REST_OF_PATH } },
                  },
                ],
              },
              message:
                "no imports of {{to.element.type}} located at {{to.file.captured.restOfPath}}",
            },
          ],
        },
      ],
      errors: [
        {
          message: "no imports of modules located at test/fixtures/one-level",
          type: "Literal",
        },
      ],
    },
  ],
});
