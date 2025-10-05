const { ELEMENT_TYPES: RULE } = require("../../../src/constants/rules");
const { createRuleTester, pathResolvers } = require("../../support/helpers");
const {
  customErrorMessage,
  elementTypesNoRuleMessage,
} = require("../../support/messages");

const rule = require(`../../../src/rules/${RULE}`);

const test = (settings, options, { absoluteFilePath }, errorMessages, base) => {
  const ruleTester = createRuleTester(settings);

  ruleTester.run(RULE, rule, {
    valid: [
      // App can import module
      {
        filename: absoluteFilePath("app.module.js"),
        code: "import { CatsModule } from './cats/cats.module'",
        options,
      },
      // module can import module
      {
        filename: absoluteFilePath("core/core.module.js"),
        code: "import { CatsModule } from '../cats/cats.module'",
        options,
      },
      // cats module can import cats controller
      {
        filename: absoluteFilePath("cats/cats.module.js"),
        code: "import { CatsController } from './cats.controller'",
        options,
      },
      // cats module can import cats service
      {
        filename: absoluteFilePath("cats/cats.module.js"),
        code: "import { CatsController } from './cats.service'",
        options,
      },
      // core module can import core interceptor
      {
        filename: absoluteFilePath("core/core.module.js"),
        code: "import { CatsController } from './interceptors/logging.interceptor'",
        options,
      },
      // core module can import core interceptor
      {
        filename: absoluteFilePath("core/core.module.js"),
        code: "import { CatsController } from './interceptors/transform.interceptor'",
        options,
      },
      // cats controller can import common decorator
      {
        filename: absoluteFilePath("cats/cats.controller.js"),
        code: "import { Roles } from '../common/decorators/roles.decorator'",
        options,
      },
      // cats controller can import common decorator
      {
        filename: absoluteFilePath("cats/cats.controller.js"),
        code: "import { RolesGuard } from '../common/guards/roles.guards'",
        options,
      },
      // cats controller can import cats service
      {
        filename: absoluteFilePath("cats/cats.controller.js"),
        code: "import { CatsController } from './cats.service'",
        options,
      },
      // cats controller can import cats interface
      {
        filename: absoluteFilePath("cats/cats.controller.js"),
        code: "import { Cat } from './interfaces/cats.interface'",
        options,
      },
      // cats controller can import cats dto
      {
        filename: absoluteFilePath("cats/cats.controller.js"),
        code: "import { CreateCatDto } from './dto/create-cat.dto'",
        options,
      },
      // cats controller can import persian-cat model
      {
        filename: absoluteFilePath("cats/cats.controller.js"),
        code: "import { PersianCat } from './models/persian-cat.model'",
        options,
      },
      // cats controller can import siamese-cat model
      {
        filename: absoluteFilePath("cats/cats.controller.js"),
        code: "import { SiameseCat } from './models/siamese-cat.dto'",
        options,
      },
      // core controller can import core model
      {
        filename: absoluteFilePath("core/core.controller.js"),
        code: "import { CoreModel } from './core.model'",
        options,
      },
      // cats service can import cats interface
      {
        filename: absoluteFilePath("cats/cats.service.js"),
        code: "import { Cat } from './interfaces/cats.interface'",
        options,
      },
    ],
    invalid: [
      // App can't import interface
      {
        filename: absoluteFilePath("app.module.js"),
        code: "import { CatsInterface } from './cats/interfaces/cats.interface'",
        options,
        errors: [
          {
            message: customErrorMessage(
              errorMessages,
              0,
              elementTypesNoRuleMessage({
                file: "'app'",
                dep: "'interface' with base '', feature 'cats' and fileName 'cats'",
              }),
            ),
            type: "Literal",
          },
        ],
      },
      // app can't import cats controller
      {
        filename: absoluteFilePath("app.module.js"),
        code: "import { CatsController } from './cats/cats.controller'",
        options,
        errors: [
          {
            message: customErrorMessage(
              errorMessages,
              1,
              elementTypesNoRuleMessage({
                file: "'app'",
                dep: "'controller' with base '', feature 'cats' and fileName 'cats'",
              }),
            ),
            type: "Literal",
          },
        ],
      },
      // app can't import cats service
      {
        filename: absoluteFilePath("app.module.js"),
        code: "import { CatsController } from './cats/cats.service'",
        options,
        errors: [
          {
            message: customErrorMessage(
              errorMessages,
              2,
              elementTypesNoRuleMessage({
                file: "'app'",
                dep: "'service' with base '', feature 'cats' and fileName 'cats'",
              }),
            ),
            type: "Literal",
          },
        ],
      },
      // core module can't import cats controller
      {
        filename: absoluteFilePath("core/core.module.js"),
        code: "import { CatsController } from '../cats/cats.controller'",
        options,
        errors: [
          {
            message: customErrorMessage(
              errorMessages,
              3,
              elementTypesNoRuleMessage({
                file: "'module' with base '', feature 'core' and fileName 'core'",
                dep: "'controller' with base '', feature 'cats' and fileName 'cats'",
              }),
            ),
            type: "Literal",
          },
        ],
      },
      // core module can't import cats service
      {
        filename: absoluteFilePath("core/core.module.js"),
        code: "import { CatsController } from '../cats/cats.service'",
        options,
        errors: [
          {
            message: customErrorMessage(
              errorMessages,
              4,
              elementTypesNoRuleMessage({
                file: "'module' with base '', feature 'core' and fileName 'core'",
                dep: "'service' with base '', feature 'cats' and fileName 'cats'",
              }),
            ),
            type: "Literal",
          },
        ],
      },
      // cats module can't import core interceptor
      {
        filename: absoluteFilePath("cats/cats.module.js"),
        code: "import { LoggingInterceptor } from '../core/interceptors/logging.interceptor'",
        options,
        errors: [
          {
            message: customErrorMessage(
              errorMessages,
              5,
              elementTypesNoRuleMessage({
                file: "'module' with base '', feature 'cats' and fileName 'cats'",
                dep: "'interceptor' with base '', feature 'core' and fileName 'logging'",
              }),
            ),
            type: "Literal",
          },
        ],
      },
      // cats module can import core interceptor
      {
        filename: absoluteFilePath("cats/cats.module.js"),
        code: "import { CatsController } from '../core/interceptors/transform.interceptor'",
        options,
        errors: [
          {
            message: customErrorMessage(
              errorMessages,
              6,
              elementTypesNoRuleMessage({
                file: "'module' with base '', feature 'cats' and fileName 'cats'",
                dep: "'interceptor' with base '', feature 'core' and fileName 'transform'",
              }),
            ),
            type: "Literal",
          },
        ],
      },
      // core controller can't import cats service
      {
        filename: absoluteFilePath("core/core.controller.js"),
        code: "import { CatsController } from '../cats/cats.service'",
        options,
        errors: [
          {
            message: customErrorMessage(
              errorMessages,
              7,
              elementTypesNoRuleMessage({
                file: "'controller' with base '', feature 'core' and fileName 'core'",
                dep: "'service' with base '', feature 'cats' and fileName 'cats'",
              }),
            ),
            type: "Literal",
          },
        ],
      },
      // core controller can't import cats dto
      {
        filename: absoluteFilePath("core/core.controller.js"),
        code: "import { CreateCatDto } from '../cats/dto/create-cat.dto'",
        options,
        errors: [
          {
            message: customErrorMessage(
              errorMessages,
              8,
              elementTypesNoRuleMessage({
                file: "'controller' with base '', feature 'core' and fileName 'core'",
                dep: "'dto' with base '', feature 'cats' and fileName 'create-cat'",
              }),
            ),
            type: "Literal",
          },
        ],
      },
      // core controller can't import cats interface
      {
        filename: absoluteFilePath("core/core.controller.js"),
        code: "import { Cat } from '../cats/interfaces/cats.interface'",
        options,
        errors: [
          {
            message: customErrorMessage(
              errorMessages,
              9,
              elementTypesNoRuleMessage({
                file: "'controller' with base '', feature 'core' and fileName 'core'",
                dep: "'interface' with base '', feature 'cats' and fileName 'cats'",
              }),
            ),
            type: "Literal",
          },
        ],
      },
      // core controller can't import cats model
      {
        filename: absoluteFilePath("core/core.controller.js"),
        code: "import { PersianCatModel } from '../cats/models/persian-cat.model'",
        options,
        errors: [
          {
            message: customErrorMessage(
              errorMessages,
              10,
              elementTypesNoRuleMessage({
                file: "'controller' with base '', feature 'core' and fileName 'core'",
                dep: `'model' with base '${base}', feature 'cats' and fileName 'persian-cat'`,
              }),
            ),
            type: "Literal",
          },
        ],
      },
      // core controller can't import cats model
      {
        filename: absoluteFilePath("core/core.controller.js"),
        code: "import { SiameseCatModel } from '../cats/models/siamese-cat.dto'",
        options,
        errors: [
          {
            message: customErrorMessage(
              errorMessages,
              11,
              elementTypesNoRuleMessage({
                file: "'controller' with base '', feature 'core' and fileName 'core'",
                dep: `'model' with base '${base}', feature 'cats' and fileName 'siamese-cat'`,
              }),
            ),
            type: "Literal",
          },
        ],
      },
      // cats controller can't import core model
      {
        filename: absoluteFilePath("cats/cats.controller.js"),
        code: "import { CoreModel } from '../core/core.model'",
        options,
        errors: [
          {
            message: customErrorMessage(
              errorMessages,
              12,
              elementTypesNoRuleMessage({
                file: "'controller' with base '', feature 'cats' and fileName 'cats'",
                dep: `'model' with base '${base}', feature 'core' and fileName 'core'`,
              }),
            ),
            type: "Literal",
          },
        ],
      },
    ],
  });
};

const ruleOptions = [
  {
    default: "disallow",
    rules: [
      {
        from: "app",
        allow: "module",
      },
      {
        from: "module",
        allow: [
          "module",
          ["controller", { feature: "${feature}" }],
          ["service", { feature: "${feature}" }],
          ["interceptor", { feature: "${feature}" }],
        ],
      },
      {
        from: "controller",
        allow: [
          "common",
          ["service", { feature: "${feature}" }],
          ["interface", { feature: "${feature}" }],
          ["dto", { feature: "${feature}" }],
          ["model", { feature: "${feature}" }],
        ],
      },
      {
        from: "service",
        allow: [["interface", { feature: "${feature}" }]],
      },
    ],
  },
];

test(
  {
    "boundaries/elements": [
      {
        type: "main",
        mode: "file",
        pattern: "*/main.js",
      },
      {
        type: "app",
        mode: "file",
        pattern: "*/app.module.js",
      },
      {
        type: "module",
        pattern: "**/*/*.module.js",
        mode: "file",
        capture: ["base", "feature", "fileName"],
      },
      {
        type: "controller",
        pattern: "**/*/*.controller.js",
        mode: "file",
        capture: ["base", "feature", "fileName"],
      },
      {
        type: "model",
        pattern: ["**/*/models/*.{model,dto}.js", "**/*/*.model.js"],
        mode: "full",
        capture: ["base", "feature", "fileName"],
      },
      {
        type: "service",
        pattern: ["**/*/*.service.js"],
        mode: "file",
        capture: ["base", "feature", "fileName"],
      },
      {
        type: "interceptor",
        pattern: ["**/*/interceptors/*.interceptor.js"],
        mode: "file",
        capture: ["base", "feature", "fileName"],
      },
      {
        type: "interface",
        pattern: "**/*/interfaces/*.interface.js",
        mode: "file",
        capture: ["base", "feature", "fileName"],
      },
      {
        type: "dto",
        pattern: "**/*/dto/*.dto.js",
        mode: "file",
        capture: ["base", "feature", "fileName"],
      },
      {
        type: "common",
        pattern: "**/common/*/*.*.js",
        mode: "file",
        capture: ["base", "category", "fileName"],
      },
    ],
  },
  ruleOptions,
  pathResolvers("nestjs-example"),
  {},
  "test/fixtures/nestjs-example",
);

test(
  {
    "boundaries/elements": [
      {
        type: "main",
        mode: "file",
        pattern: "*/main.js",
      },
      {
        type: "app",
        mode: "file",
        pattern: "*/app.module.js",
      },
      {
        type: "module",
        pattern: "**/*/*.module.js",
        mode: "file",
        capture: ["base", "feature", "fileName"],
      },
      {
        type: "controller",
        pattern: "**/*/*.controller.js",
        mode: "file",
        capture: ["base", "feature", "fileName"],
      },
      {
        type: "model",
        pattern: "**/*/models/*.{model,dto}.js",
        mode: "file",
        capture: ["base", "feature", "fileName"],
      },
      {
        type: "model",
        pattern: "*/*/*.model.js",
        mode: "file",
        capture: ["base", "feature", "fileName"],
      },
      {
        type: "service",
        pattern: ["**/*/*.service.js"],
        mode: "file",
        capture: ["base", "feature", "fileName"],
      },
      {
        type: "interceptor",
        pattern: ["**/*/interceptors/*.interceptor.js"],
        mode: "file",
        capture: ["base", "feature", "fileName"],
      },
      {
        type: "interface",
        pattern: "**/*/interfaces/*.interface.js",
        mode: "file",
        capture: ["base", "feature", "fileName"],
      },
      {
        type: "dto",
        pattern: "**/*/dto/*.dto.js",
        mode: "file",
        capture: ["base", "feature", "fileName"],
      },
      {
        type: "common",
        pattern: "**/common/*/*.*.js",
        mode: "file",
        capture: ["base", "category", "fileName"],
      },
    ],
  },
  ruleOptions,
  pathResolvers("nestjs-example"),
  {
    12: elementTypesNoRuleMessage({
      file: "'controller' with base '', feature 'cats' and fileName 'cats'",
      dep: `'model' with base 'nestjs-example', feature 'core' and fileName 'core'`,
    }),
  },
  "",
);

test(
  {
    "boundaries/elements": [
      {
        type: "main",
        mode: "file",
        pattern: "*/main.js",
      },
      {
        type: "app",
        mode: "file",
        pattern: "*/app.module.js",
      },
      {
        type: "module",
        pattern: "**/*/*.module.js",
        mode: "file",
        capture: ["base", "feature", "fileName"],
      },
      {
        type: "controller",
        pattern: "**/*/*.controller.js",
        mode: "file",
        capture: ["base", "feature", "fileName"],
      },
      {
        type: "model",
        pattern: "**/*/models/*.{model,dto}.js",
        mode: "full",
        capture: ["base", "feature", "fileName"],
      },
      {
        type: "model",
        pattern: "**/*/*.model.js",
        mode: "file",
        capture: ["base", "feature", "fileName"],
      },
      {
        type: "service",
        pattern: ["**/*/*.service.js"],
        mode: "file",
        capture: ["base", "feature", "fileName"],
      },
      {
        type: "interceptor",
        pattern: ["**/*/interceptors/*.interceptor.js"],
        mode: "file",
        capture: ["base", "feature", "fileName"],
      },
      {
        type: "interface",
        pattern: "**/*/interfaces/*.interface.js",
        mode: "file",
        capture: ["base", "feature", "fileName"],
      },
      {
        type: "dto",
        pattern: "**/*/dto/*.dto.js",
        mode: "file",
        capture: ["base", "feature", "fileName"],
      },
      {
        type: "common",
        pattern: "**/common/*/*.*.js",
        mode: "file",
        capture: ["base", "category", "fileName"],
      },
    ],
  },
  ruleOptions,
  pathResolvers("nestjs-example"),
  {
    12: elementTypesNoRuleMessage({
      file: "'controller' with base '', feature 'cats' and fileName 'cats'",
      dep: `'model' with base '', feature 'core' and fileName 'core'`,
    }),
  },
  "test/fixtures/nestjs-example",
);
