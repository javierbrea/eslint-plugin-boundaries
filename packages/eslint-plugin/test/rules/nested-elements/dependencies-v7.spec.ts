import ruleFactory from "../../../src/Rules/Dependencies";
import { DEPENDENCIES as RULE } from "../../../src/Shared";
import {
  SETTINGS,
  createRuleTester,
  pathResolvers,
} from "../../support/helpers";

const { absoluteFilePath } = pathResolvers("nested-elements");

const rule = ruleFactory();

const settings = SETTINGS.nestedElementsV7;

const options = [
  {
    default: "disallow",
    policies: [
      {
        from: { element: { type: "component" } },
        // only allow importing the main file of child components
        allow: [
          {
            to: {
              element: {
                type: "component",
                fileInternalPath: "{{to.element.captured.name}}.js",
              },
            },
            dependency: { relationship: { to: "child" } },
          },
        ],
      },
    ],
  },
];

const ruleTester = createRuleTester(settings);

ruleTester.run(RULE, rule, {
  valid: [
    // child component whose name is not a prefix of any ancestor folder name
    {
      filename: absoluteFilePath("src/components/Card/Card.js"),
      code: "import { Badge } from './components/Badge/Badge.js'",
      options,
    },
    // child component whose name is a prefix of its parent folder name
    {
      filename: absoluteFilePath("src/components/ButtonGroup/ButtonGroup.js"),
      code: "import { Button } from './components/Button/Button.js'",
      options,
    },
    // child component with the same name as its parent
    {
      filename: absoluteFilePath("src/components/Button/Button.js"),
      code: "import { Button } from './components/Button/Button.js'",
      options,
    },
  ],
  invalid: [
    // other files than the main one can't be imported from child components
    {
      filename: absoluteFilePath("src/components/Card/Card.js"),
      code: "import { helper } from './components/Badge/helpers.js'",
      options,
      errors: [
        {
          message:
            'There is no policy allowing dependencies from elements of type "component" and captured values: name="Card" to elements of type "component" and captured values: name="Badge"',
          type: "Literal",
        },
      ],
    },
    // other files than the main one can't be imported from a child component whose name is a prefix of its parent folder name
    {
      filename: absoluteFilePath("src/components/ButtonGroup/ButtonGroup.js"),
      code: "import { helper } from './components/Button/helpers.js'",
      options,
      errors: [
        {
          message:
            'There is no policy allowing dependencies from elements of type "component" and captured values: name="ButtonGroup" to elements of type "component" and captured values: name="Button"',
          type: "Literal",
        },
      ],
    },
    // other files than the main one can't be imported from a child component with the same name as its parent
    {
      filename: absoluteFilePath("src/components/Button/Button.js"),
      code: "import { helper } from './components/Button/helpers.js'",
      options,
      errors: [
        {
          message:
            'There is no policy allowing dependencies from elements of type "component" and captured values: name="Button" to elements of type "component" and captured values: name="Button"',
          type: "Literal",
        },
      ],
    },
    // the parent component is not a child of its nested component with the same name
    {
      filename: absoluteFilePath(
        "src/components/Button/components/Button/Button.js"
      ),
      code: "import { Button } from '../../Button.js'",
      options,
      errors: [
        {
          message:
            'There is no policy allowing dependencies from elements of type "component" and captured values: name="Button" to elements of type "component" and captured values: name="Button"',
          type: "Literal",
        },
      ],
    },
  ],
});
