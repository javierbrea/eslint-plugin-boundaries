const { ELEMENT_TYPES: RULE } = require("../../../src/constants/rules");
const { createRuleTester, pathResolvers } = require("../../support/helpers");

const rule = require(`../../../src/rules/${RULE}`);

const errorMessage = (fileType, dependencyType) =>
  `Usage of '${dependencyType}' is not allowed in '${fileType}'`;

const test = (settings, options, { absoluteFilePath }) => {
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
            message: errorMessage("app", "interface"),
            type: "ImportDeclaration",
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
            message: errorMessage("app", "controller"),
            type: "ImportDeclaration",
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
            message: errorMessage("app", "service"),
            type: "ImportDeclaration",
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
            message: errorMessage("module", "controller"),
            type: "ImportDeclaration",
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
            message: errorMessage("module", "service"),
            type: "ImportDeclaration",
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
            message: errorMessage("module", "interceptor"),
            type: "ImportDeclaration",
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
            message: errorMessage("module", "interceptor"),
            type: "ImportDeclaration",
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
            message: errorMessage("controller", "service"),
            type: "ImportDeclaration",
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
            message: errorMessage("controller", "dto"),
            type: "ImportDeclaration",
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
            message: errorMessage("controller", "interface"),
            type: "ImportDeclaration",
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
            message: errorMessage("controller", "model"),
            type: "ImportDeclaration",
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
            message: errorMessage("controller", "model"),
            type: "ImportDeclaration",
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
            message: errorMessage("controller", "model"),
            type: "ImportDeclaration",
          },
        ],
      },
    ],
  });
};

const options = [
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
  options,
  pathResolvers("nestjs-example")
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
  options,
  pathResolvers("nestjs-example")
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
  options,
  pathResolvers("nestjs-example")
);
