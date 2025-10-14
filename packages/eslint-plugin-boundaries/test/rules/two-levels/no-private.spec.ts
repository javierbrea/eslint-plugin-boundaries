import {
  SETTINGS,
  createRuleTester,
  pathResolvers,
} from "../../support/helpers";
import type { RuleTesterSettings } from "../../support/helpers";
import { noPrivateMessage } from "../../support/messages";

const { NO_PRIVATE: RULE } = require("../../../src/constants/rules");

const rule = require(`../../../src/rules/${RULE}`).default;

const options = [
  {
    allowUncles: true,
  },
];

const runTest = (
  settings: RuleTesterSettings,
  {
    absoluteFilePath,
  }: {
    absoluteFilePath: ReturnType<typeof pathResolvers>["absoluteFilePath"];
  },
) => {
  const ruleTester = createRuleTester(settings);
  ruleTester.run(RULE, rule, {
    valid: [
      // atom A is public, as it is not child of any other element, so anyone can use it:
      {
        filename: absoluteFilePath("modules/domain-a/module-a/ModuleA.js"),
        code: 'import ComponentA from "components/atoms/atom-a"',
        options,
      },
      // Private elements can use a parent elements: // TODO, add relationship rule to avoid this
      {
        filename: absoluteFilePath(
          "components/molecules/molecule-a/components/molecules/molecule-c/index.js",
        ),
        code: 'import molecule from "../../../"',
        options,
      },
      // Private elements can use public elements:
      {
        filename: absoluteFilePath(
          "components/molecules/molecule-a/components/molecules/molecule-c/index.js",
        ),
        code: 'import ModuleA from "components/atoms/atom-a"',
        options,
      },
      // Elements can use their direct children elements:
      {
        filename: absoluteFilePath("components/molecules/molecule-a/index.js"),
        code: 'import ComponentC from "./components/molecules/molecule-c"',
        options,
      },
      /* Private elements can use other private element when both have the same parent.
    molecule-c can use atom-c, as both are children of molecule-a */
      {
        filename: absoluteFilePath(
          "components/molecules/molecule-a/components/molecules/molecule-c/index.js",
        ),
        code: 'import HelperA from "components/molecules/molecule-a/components/atoms/atom-c"',
        options,
      },
      /* Private elements can use other private element if it is a direct child of a common ancestor,
    and the allowUncles option is enabled.
    molecule-d can use atom-c as it is a direct child of common ancestor molecule-a */
      {
        filename: absoluteFilePath(
          "components/molecules/molecule-a/components/molecules/molecule-c/components/molecules/molecule-d/MoleculeD.js",
        ),
        code: 'import HelperA from "components/molecules/molecule-a/components/atoms/atom-c"',
        options,
      },
      // Private elements can use an ancestor // TODO, add relationships rule to avoid this
      {
        filename: absoluteFilePath(
          "components/molecules/molecule-a/components/molecules/molecule-c/components/molecules/molecule-d/MoleculeD.js",
        ),
        code: 'import HelperA from "../../../../../../"',
        options,
      },
    ],
    invalid: [
      /* Private elements can't be used by anyone except its parent
    (and other descendants of the parent when allowUncles option is enabled) */
      {
        filename: absoluteFilePath(
          "components/molecules/molecule-b/MoleculeB.js",
        ),
        code: "import MoleculeD from 'components/molecules/molecule-a/components/molecules/molecule-c/components/molecules/molecule-d'",
        options,
        errors: [
          {
            message: noPrivateMessage({
              dep: "'components' with category 'molecules' and elementName 'molecule-c'",
            }),
            type: "Literal",
          },
        ],
      },
      {
        filename: absoluteFilePath("modules/domain-a/module-a/ModuleA.js"),
        code: "import ComponentC from 'components/molecules/molecule-a/components/molecules/molecule-c'",
        options,
        errors: [
          {
            message: noPrivateMessage({
              dep: "'components' with category 'molecules' and elementName 'molecule-a'",
            }),
            type: "Literal",
          },
        ],
      },
      // Helper c is private of helper A, so atom c can't use it:
      {
        filename: absoluteFilePath("components/atoms/atom-c/index.js"),
        code: 'import HelperC from "../../../helpers/helper-a/helpers/helper-c"',
        options,
        errors: [
          {
            message: noPrivateMessage({
              dep: "'helpers' with elementName 'helper-a'",
            }),
            type: "Literal",
          },
        ],
      },
      // molecule d is private of molecule c, so molecule A can't use it (even when it is its "grandchild")
      {
        filename: absoluteFilePath(
          "components/molecules/molecule-a/MoleculeA.js",
        ),
        code: 'import moleculeD from "./components/molecules/molecule-c/components/molecules/molecule-d"',
        options,
        errors: [
          {
            message: noPrivateMessage({
              dep: "'components' with category 'molecules' and elementName 'molecule-c'",
            }),
            type: "Literal",
          },
        ],
      },
      /* Private elements can't use other private element if it is a direct child of a common ancestor,
    but the allowUncles option is disabled. Component D can't use helper A as it is a direct child of
    common ancestor component A, but allowUncles option is disabled. */
      {
        filename: absoluteFilePath(
          "components/molecules/molecule-a/components/molecules/molecule-c/components/molecules/molecule-d/MoleculeD.js",
        ),
        code: 'import HelperA from "components/molecules/molecule-a/components/atoms/atom-c"',
        options: [
          {
            allowUncles: false,
          },
        ],
        errors: [
          {
            message: noPrivateMessage({
              dep: "'components' with category 'molecules' and elementName 'molecule-a'",
            }),
            type: "Literal",
          },
        ],
      },
    ],
  });
};

runTest(
  SETTINGS.twoLevelsWithPrivate,
  pathResolvers("two-levels-with-private"),
);
