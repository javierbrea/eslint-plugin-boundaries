import rule from "../../../src/Rules/EntryPoint";
import { ENTRY_POINT as RULE } from "../../../src/Settings";
import {
  SETTINGS,
  createRuleTester,
  pathResolvers,
} from "../../support/helpers";
import { errorMessage, entryPointNoRuleMessage } from "../../support/messages";

const { absoluteFilePath } = pathResolvers("docs-examples");

const settings = SETTINGS.docsExamples;

const options = [
  {
    // disallow all entry-points by default
    default: "disallow",
    rules: [
      {
        // when importing helpers
        target: ["helpers"],
        // allow everything (helpers are single files)
        allow: "*",
      },
      {
        // when importing components or modules
        target: ["components", "modules"],
        // only allow index.js
        allow: "index.js",
      },
    ],
  },
];

const errorMessages = {};

const ruleTester = createRuleTester(settings);

ruleTester.run(RULE, rule, {
  valid: [
    // helper file can be imported
    {
      filename: absoluteFilePath("components/atoms/atom-a/AtomA.js"),
      code: "import { someParser } from 'helpers/data/parse'",
      options,
    },
    // index.js from components can be imported
    {
      filename: absoluteFilePath("components/atoms/atom-a/AtomA.js"),
      code: "import ComponentB from 'components/atoms/atom-b'",
      options,
    },
    // index.js from components can be imported
    {
      filename: absoluteFilePath("components/atoms/atom-a/AtomA.js"),
      code: "import ComponentB from 'components/atoms/atom-b/index.js'",
      options,
    },
    // index.js from modules can be imported
    {
      filename: absoluteFilePath("modules/module-a/ModuleA.js"),
      code: "import ModuleB from 'modules/module-b'",
      options,
    },
  ],
  invalid: [
    // Any other file than index.js can't be imported from components
    {
      filename: absoluteFilePath("modules/module-a/ModuleA.js"),
      code: "import AtomA from 'components/atoms/atom-a/AtomA'",
      options,
      errors: [
        {
          message: errorMessage(
            errorMessages,
            0,
            entryPointNoRuleMessage({
              entryPoint: "AtomA.js",
              dep: "'components' with family 'atoms' and elementName 'atom-a'",
            })
          ),
          type: "Literal",
        },
      ],
    },
    // Any other file than index.js can't be imported from modules
    {
      filename: absoluteFilePath("modules/module-a/ModuleA.js"),
      code: "import ModuleB from 'modules/module-b/ModuleB'",
      options,
      errors: [
        {
          message: errorMessage(
            errorMessages,
            1,
            entryPointNoRuleMessage({
              entryPoint: "ModuleB.js",
              dep: "'modules' with elementName 'module-b'",
            })
          ),
          type: "Literal",
        },
      ],
    },
  ],
});
