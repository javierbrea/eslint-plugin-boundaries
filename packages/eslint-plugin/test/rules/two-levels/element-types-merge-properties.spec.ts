import ruleFactory from "../../../src/Rules/Dependencies";
import {
  SETTINGS,
  createRuleTester,
  pathResolvers,
} from "../../support/helpers";
import type { RuleTesterSettings } from "../../support/helpers";

const { ELEMENT_TYPES: RULE } = require("../../../src/Shared");

const rule = ruleFactory();

const { absoluteFilePath } = pathResolvers("two-levels-with-private");

const objectSelectorPropertiesSettings = {
  ...SETTINGS.twoLevelsWithPrivate,
} as RuleTesterSettings;

createRuleTester(objectSelectorPropertiesSettings).run(
  `${RULE} merging nested properties`,
  rule,
  {
    valid: [
      {
        filename: absoluteFilePath(
          "components/molecules/molecule-a/MoleculeA.js"
        ),
        code: 'import moleculeD from "./components/molecules/molecule-c/components/molecules/molecule-d"',
        options: [
          {
            default: "allow",
            rules: [
              {
                dependency: {
                  relationship: {
                    from: "child",
                  },
                },
                disallow: {
                  dependency: {
                    relationship: {
                      to: "descendant",
                    },
                  },
                },
              },
            ],
          },
        ],
      },
      {
        filename: absoluteFilePath(
          "components/molecules/molecule-a/MoleculeA.js"
        ),
        code: 'import moleculeD from "./components/molecules/molecule-c/components/molecules/molecule-d"',
        options: [
          {
            default: "allow",
            rules: [
              {
                to: {
                  parent: {
                    type: "foo",
                  },
                },
                disallow: {
                  to: {
                    parent: {
                      captured: {
                        elementName: "molecule-c",
                      },
                    },
                  },
                },
              },
            ],
          },
        ],
      },
    ],
    invalid: [
      {
        filename: absoluteFilePath(
          "components/molecules/molecule-a/MoleculeA.js"
        ),
        code: 'import moleculeD from "./components/molecules/molecule-c/components/molecules/molecule-d"',
        options: [
          {
            default: "allow",
            rules: [
              {
                dependency: {
                  relationship: {
                    from: "ancestor",
                  },
                },
                disallow: {
                  dependency: {
                    relationship: {
                      to: "descendant",
                    },
                  },
                },
              },
            ],
          },
        ],
        errors: [
          {
            message:
              'Dependencies with relationship from "ancestor" and relationship to "descendant" are not allowed. Denied by rule at index 0',
            type: "Literal",
          },
        ],
      },
      {
        filename: absoluteFilePath(
          "components/molecules/molecule-a/MoleculeA.js"
        ),
        code: 'import moleculeD from "./components/molecules/molecule-c/components/molecules/molecule-d"',
        options: [
          {
            default: "allow",
            rules: [
              {
                to: {
                  parent: {
                    type: "components",
                  },
                },
                disallow: {
                  to: {
                    parent: {
                      captured: {
                        elementName: "molecule-c",
                      },
                    },
                  },
                },
              },
            ],
          },
        ],
        errors: [
          {
            message:
              'Dependencies to elements of parent type "components" and elementName "molecule-c" are not allowed. Denied by rule at index 0',
            type: "Literal",
          },
        ],
      },
    ],
  }
);
