import ruleFactory from "../../../src/Rules/Dependencies";
import { DEPENDENCIES as RULE } from "../../../src/Shared";
import {
  SETTINGS,
  createRuleTester,
  pathResolvers,
} from "../../support/helpers";

const rule = ruleFactory();

const { absoluteFilePath } = pathResolvers("one-level");

const COMPONENT_A = absoluteFilePath("components/component-a/ComponentA.js");
// A file of the same element as COMPONENT_A
const INTERNAL_IMPORT = "import ComponentAIndex from './index'";
// A local file that belongs to no element
const UNKNOWN_LOCAL_IMPORT = "import Foo from '../../foo'";

// checkInternals: the dependencies between files of the same element are checked only when it is true

const checkInternalsRuleTester = createRuleTester(SETTINGS.oneLevel);
checkInternalsRuleTester.run(RULE, rule, {
  valid: [
    // Internal dependencies are not checked by default
    {
      filename: COMPONENT_A,
      code: INTERNAL_IMPORT,
      options: [{ default: "disallow" }],
    },
    {
      filename: COMPONENT_A,
      code: INTERNAL_IMPORT,
      options: [{ default: "disallow", checkInternals: false }],
    },
    // A checked internal dependency is evaluated against the policies
    {
      filename: COMPONENT_A,
      code: INTERNAL_IMPORT,
      options: [
        {
          default: "disallow",
          checkInternals: true,
          policies: [
            { allow: { dependency: { relationship: { to: "internal" } } } },
          ],
        },
      ],
    },
  ],
  invalid: [
    {
      filename: COMPONENT_A,
      code: INTERNAL_IMPORT,
      options: [{ default: "disallow", checkInternals: true }],
      errors: [
        {
          message:
            'There is no policy allowing dependencies from elements of type "components" and captured values: elementName="component-a" to elements of type "components" and captured values: elementName="component-a"',
          type: "Literal",
        },
      ],
    },
    {
      filename: COMPONENT_A,
      code: INTERNAL_IMPORT,
      options: [
        {
          default: "allow",
          checkInternals: true,
          policies: [
            { disallow: { dependency: { relationship: { to: "internal" } } } },
          ],
        },
      ],
      errors: [
        {
          message:
            'Dependencies with relationship to "internal" are not allowed. Denied by policy at index 0',
          type: "Literal",
        },
      ],
    },
  ],
});

// checkUnknownLocals: the dependencies to local files that belong to no element are checked only when it is true

const checkUnknownLocalsRuleTester = createRuleTester(SETTINGS.oneLevel);
checkUnknownLocalsRuleTester.run(RULE, rule, {
  valid: [
    // Unknown local dependencies are not checked by default
    {
      filename: COMPONENT_A,
      code: UNKNOWN_LOCAL_IMPORT,
      options: [{ default: "disallow" }],
    },
    {
      filename: COMPONENT_A,
      code: UNKNOWN_LOCAL_IMPORT,
      options: [{ default: "disallow", checkUnknownLocals: false }],
    },
    // A checked unknown local dependency is evaluated against the policies
    {
      filename: COMPONENT_A,
      code: UNKNOWN_LOCAL_IMPORT,
      options: [
        {
          default: "disallow",
          checkUnknownLocals: true,
          policies: [{ allow: { to: { element: { isUnknown: true } } } }],
        },
      ],
    },
    // The option applies to the target only: dependencies of unknown files are never checked
    {
      filename: absoluteFilePath("foo/index.js"),
      code: "import HelperA from '../helpers/helper-a'",
      options: [{ default: "disallow", checkUnknownLocals: true }],
    },
  ],
  invalid: [
    {
      filename: COMPONENT_A,
      code: UNKNOWN_LOCAL_IMPORT,
      options: [{ default: "disallow", checkUnknownLocals: true }],
      errors: [
        {
          message:
            'There is no policy allowing dependencies from elements of type "components" and captured values: elementName="component-a" to entities of module with origin "local"',
          type: "Literal",
        },
      ],
    },
    {
      filename: COMPONENT_A,
      code: UNKNOWN_LOCAL_IMPORT,
      options: [
        {
          default: "allow",
          checkUnknownLocals: true,
          policies: [{ disallow: { to: { element: { isUnknown: true } } } }],
        },
      ],
      errors: [
        {
          message:
            'Dependencies to elements of isUnknown "true" are not allowed. Denied by policy at index 0',
          type: "Literal",
        },
      ],
    },
  ],
});
